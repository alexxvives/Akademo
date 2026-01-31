import { Hono } from 'hono';
import { Bindings } from '../types';
import { successResponse, errorResponse } from '../lib/utils';

const webhooks = new Hono<{ Bindings: Bindings }>();

// Helper function to calculate billing cycles based on class start date
function calculateBillingCycle(classStartDate: string, enrollmentDate: string, isMonthly: boolean) {
  const classStart = new Date(classStartDate);
  const enrollment = new Date(enrollmentDate);
  const today = new Date();
  
  // For one-time payments, no next payment
  if (!isMonthly) {
    return {
      billingCycleStart: null,
      billingCycleEnd: null,
      nextPaymentDue: null
    };
  }
  
  // If class hasn't started yet (early joiner)
  if (today < classStart) {
    // First payment covers first cycle: classStart to classStart+30 days
    const cycleEnd = new Date(classStart);
    cycleEnd.setDate(cycleEnd.getDate() + 30);
    
    return {
      billingCycleStart: classStart.toISOString(),
      billingCycleEnd: cycleEnd.toISOString(),
      nextPaymentDue: cycleEnd.toISOString() // Charged at end of cycle for next cycle
    };
  }
  
  // Class has already started (late joiner)
  // Find which cycle we're currently in
  const daysSinceStart = Math.floor((today.getTime() - classStart.getTime()) / (1000 * 60 * 60 * 24));
  const currentCycleNumber = Math.floor(daysSinceStart / 30);
  
  // Current cycle start = classStart + (cycleNumber * 30 days)
  const currentCycleStart = new Date(classStart);
  currentCycleStart.setDate(currentCycleStart.getDate() + (currentCycleNumber * 30));
  
  const currentCycleEnd = new Date(currentCycleStart);
  currentCycleEnd.setDate(currentCycleEnd.getDate() + 30);
  
  // First payment covers NEXT cycle (they get remainder of current cycle free)
  const nextCycleStart = currentCycleEnd;
  const nextCycleEnd = new Date(nextCycleStart);
  nextCycleEnd.setDate(nextCycleEnd.getDate() + 30);
  
  return {
    billingCycleStart: nextCycleStart.toISOString(),
    billingCycleEnd: nextCycleEnd.toISOString(),
    nextPaymentDue: nextCycleEnd.toISOString() // Charged at end of next cycle
  };
}

// POST /webhooks/zoom - Zoom webhook handler
webhooks.post('/zoom', async (c) => {
  try {
    const payload = await c.req.json();

    console.log('[Zoom Webhook] Received:', payload.event);

    // Handle Zoom URL validation (required for webhook setup)
    if (payload.event === 'endpoint.url_validation') {
      const plainToken = payload.payload.plainToken;
      const secretToken = c.env.ZOOM_WEBHOOK_SECRET || '';
      
      // Use Web Crypto API (available in Cloudflare Workers)
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secretToken),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(plainToken));
      const hashForValidate = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      console.log('[Zoom Webhook] URL validation response');
      return c.json({
        plainToken: plainToken,
        encryptedToken: hashForValidate
      });
    }

    const { event, payload: data } = payload;

    // Handle different Zoom events
    if (event === 'meeting.started') {
      const meetingId = data.object.id;

      // Update livestream status to active
      await c.env.DB
        .prepare('UPDATE LiveStream SET status = ?, startedAt = ? WHERE zoomMeetingId = ?')
        .bind('active', new Date().toISOString(), meetingId.toString())
        .run();

      console.log('[Zoom Webhook] Meeting started:', meetingId);
    } else if (event === 'meeting.ended') {
      const meetingId = data.object.id;

      // Update livestream status to ended
      await c.env.DB
        .prepare('UPDATE LiveStream SET status = ?, endedAt = ? WHERE zoomMeetingId = ?')
        .bind('ended', new Date().toISOString(), meetingId.toString())
        .run();

      console.log('[Zoom Webhook] Meeting ended:', meetingId);
    } else if (event === 'recording.completed') {
      // Use numeric meeting ID (preferred) from webhook payload
      const meetingId = data.object.id;
      console.log('[Zoom Webhook] Recording completed for meeting:', meetingId);
      console.log('[Zoom Webhook] Full recording payload:', JSON.stringify(data, null, 2));
      console.log('[Zoom Webhook] Using OAuth flow (no server-to-server)');
      
      // Find the livestream
      const stream = await c.env.DB
        .prepare('SELECT * FROM LiveStream WHERE zoomMeetingId = ?')
        .bind(meetingId.toString())
        .first() as any;

      if (stream) {
        console.log('[Zoom Webhook] Found stream:', stream.id, 'Title:', stream.title);
        
        try {
          // Get Zoom account for this stream's class
          const streamWithClass = await c.env.DB
            .prepare('SELECT ls.id, ls.classId, ls.teacherId, ls.status, ls.title, ls.startedAt, ls.endedAt, ls.recordingId, ls.createdAt, ls.zoomLink, ls.zoomMeetingId, ls.zoomStartUrl, ls.participantCount, ls.participantsFetchedAt, ls.participantsData, c.zoomAccountId FROM LiveStream ls JOIN Class c ON ls.classId = c.id WHERE ls.id = ?')
            .bind(stream.id)
            .first() as any;

          if (!streamWithClass?.zoomAccountId) {
            console.error('[Zoom Webhook] No Zoom account assigned to class for stream:', stream.id);
            return c.json(successResponse({ received: true, error: 'No Zoom account' }));
          }

          // Get Zoom account details
          const zoomAccount = await c.env.DB
            .prepare('SELECT * FROM ZoomAccount WHERE id = ?')
            .bind(streamWithClass.zoomAccountId)
            .first() as any;

          if (!zoomAccount) {
            console.error('[Zoom Webhook] Zoom account not found:', streamWithClass.zoomAccountId);
            return c.json(successResponse({ received: true, error: 'Zoom account not found' }));
          }

          console.log('[Zoom Webhook] Using OAuth token from account:', zoomAccount.accountName);
          const accessToken = zoomAccount.accessToken;

          // Fetch recording details from Zoom API
          // Use numeric meeting ID (preferred for recordings endpoint)
          console.log('[Zoom Webhook] Fetching recordings from Zoom API with meeting ID:', meetingId);
          const recordingsResponse = await fetch(
            `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );

          if (!recordingsResponse.ok) {
            const errorText = await recordingsResponse.text();
            console.error('[Zoom Webhook] Failed to fetch recordings:', recordingsResponse.status, errorText);
            // Return success to prevent Zoom retries
            return c.json(successResponse({ received: true, error: 'Failed to fetch recordings' }));
          }

          const recordingsData = await recordingsResponse.json() as any;
          console.log('[Zoom Webhook] ✅ Recording files count:', recordingsData.recording_files?.length || 0);
          console.log('[Zoom Webhook] 📋 All recording types:', JSON.stringify(
            recordingsData.recording_files?.map((f: any) => ({ type: f.file_type, recording_type: f.recording_type })) || []
          ));

          // Find the MP4 recording
          const mp4Recording = recordingsData.recording_files?.find(
            (file: any) => file.file_type === 'MP4' && file.recording_type === 'shared_screen_with_speaker_view'
          );

          if (!mp4Recording) {
            console.log('[Zoom Webhook] ❌ No MP4 recording found with type "shared_screen_with_speaker_view"');
            console.log('[Zoom Webhook] Available recordings:', JSON.stringify(recordingsData.recording_files || []));
            return c.json(successResponse({ received: true, error: 'No MP4 recording found' }));
          }

          const downloadUrl = mp4Recording.download_url;
          console.log('[Zoom Webhook] 📥 Download URL found:', downloadUrl.substring(0, 100) + '...');

          // Upload to Bunny Stream using /fetch endpoint
          const bunnyFetchUrl = `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/fetch`;
          const bunnyRequestBody = {
            url: `${downloadUrl}?access_token=${accessToken}`,
            title: stream.title || `Recording ${new Date().toLocaleDateString()}`,
          };
          
          console.log('[Zoom Webhook] 🐰 Sending to Bunny Stream...');
          console.log('[Zoom Webhook] 🐰 Bunny API URL:', bunnyFetchUrl);
          console.log('[Zoom Webhook] 🐰 Video title:', bunnyRequestBody.title);
          console.log('[Zoom Webhook] 🐰 Download URL length:', bunnyRequestBody.url.length);
          
          const bunnyFetchResponse = await fetch(bunnyFetchUrl, {
            method: 'POST',
            headers: {
              'AccessKey': c.env.BUNNY_STREAM_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bunnyRequestBody),
          });

          console.log('[Zoom Webhook] 🐰 Bunny response status:', bunnyFetchResponse.status);
          
          if (!bunnyFetchResponse.ok) {
            const errorText = await bunnyFetchResponse.text();
            console.error('[Zoom Webhook] ❌ Bunny fetch failed:', bunnyFetchResponse.status, errorText);
            return c.json(successResponse({ received: true, error: 'Bunny upload failed' }));
          }

          const bunnyData = await bunnyFetchResponse.json() as any;
          console.log('[Zoom Webhook] 🐰 Bunny response data:', JSON.stringify(bunnyData));
          
          // Bunny /fetch endpoint returns success=true and guid in response
          const videoGuid = bunnyData.guid || bunnyData.videoGuid || bunnyData.id;
          
          if (!videoGuid) {
            console.error('[Zoom Webhook] ❌ No GUID in Bunny response:', JSON.stringify(bunnyData));
            return c.json(successResponse({ received: true, error: 'Bunny returned no GUID' }));
          }
          
          console.log('[Zoom Webhook] ✅ Bunny video created! GUID:', videoGuid);

          // Update stream with recordingId
          const updateResult = await c.env.DB
            .prepare('UPDATE LiveStream SET recordingId = ? WHERE id = ?')
            .bind(videoGuid, stream.id)
            .run();

          console.log('[Zoom Webhook] ✅ Database updated! Stream:', stream.id, 'RecordingId:', videoGuid, 'Rows affected:', updateResult.meta?.changes);
        } catch (error: any) {
          console.error('[Zoom Webhook] Error processing recording:', error.message);
        }
      } else {
        console.log('[Zoom Webhook] No stream found for meetingId:', meetingId);
        // Log all streams for debugging
        const allStreams = await c.env.DB
          .prepare('SELECT id, zoomMeetingId, title FROM LiveStream ORDER BY createdAt DESC LIMIT 5')
          .all();
        console.log('[Zoom Webhook] Recent streams:', allStreams.results);
      }
    } else if (event === 'meeting.participant_joined' || event === 'meeting.participant_left' || event === 'participant.joined' || event === 'participant.left') {
      const meetingId = data.object.id;
      const participant = data.payload?.object?.participant || data.object?.participant;
      const participantUserId = participant?.user_id || participant?.id || 'unknown';
      
      // Don't trust participant_count from webhooks - maintain our own counter
      console.log('[Zoom Webhook] Participant event:', event, 'Meeting:', meetingId, 'Participant:', participantUserId);
      console.log('[Zoom Webhook] Meeting ID type:', typeof meetingId, 'Value:', meetingId);

      // Get current stream
      const stream = await c.env.DB
        .prepare('SELECT * FROM LiveStream WHERE zoomMeetingId = ?')
        .bind(meetingId.toString())
        .first() as any;

      if (stream) {
        console.log('[Zoom Webhook] ✅ Stream found:', stream.id, 'Title:', stream.title, 'Current count:', stream.participantCount || 0);
        
        const isJoin = event.includes('joined');
        const currentCount = stream.participantCount || 0;
        const newCount = isJoin ? currentCount + 1 : Math.max(0, currentCount - 1);
        
        console.log('[Zoom Webhook] Updating count:', currentCount, '→', newCount, '(', isJoin ? 'joined' : 'left', ')');

        // Update participant count
        const result = await c.env.DB
          .prepare('UPDATE LiveStream SET participantCount = ?, participantsFetchedAt = ? WHERE id = ?')
          .bind(newCount, new Date().toISOString(), stream.id)
          .run();

        console.log('[Zoom Webhook] Participant update result:', result.meta?.changes, 'rows affected');
      } else {
        console.log('[Zoom Webhook] ❌ No stream found for participant event');
        console.log('[Zoom Webhook] Looking for zoomMeetingId:', meetingId.toString());
        
        // Debug: Show all active streams
        const activeStreams = await c.env.DB
          .prepare('SELECT id, zoomMeetingId, title, status FROM LiveStream WHERE status IN ("scheduled", "active") ORDER BY createdAt DESC LIMIT 5')
          .all();
        console.log('[Zoom Webhook] Active streams in DB:', JSON.stringify(activeStreams.results));
      }
    }

    return c.json(successResponse({ received: true }));
  } catch (error: any) {
    console.error('[Zoom Webhook] Error:', error);
    // Return 200 even on error to avoid Zoom retries
    return c.json(successResponse({ received: true, error: error.message }));
  }
});

// POST /webhooks/bunny - Bunny Stream webhook handler for video uploads
webhooks.post('/bunny', async (c) => {
  try {
    const payload = await c.req.json();
    
    console.log('[Bunny Webhook] Received:', JSON.stringify(payload));
    
    // Bunny sends VideoId (GUID), Status, and other metadata
    const { VideoId, Status, VideoLibraryId, Title } = payload;
    
    if (VideoId && Status !== undefined) {
      // Update existing Upload records with status
      const result = await c.env.DB.prepare(
        'UPDATE Upload SET bunnyStatus = ? WHERE bunnyGuid = ?'
      ).bind(Status, VideoId).run();
      
      console.log('[Bunny Webhook] Updated Upload status for', VideoId, 'to', Status, 'rows affected:', result.meta?.changes);

      // Try to match this video to a LiveStream without recordingId
      if (Title) {
        const titleLower = Title.toLowerCase().trim();
        
        console.log('[Bunny Webhook] Searching for stream with title:', titleLower);
        
        // Find streams without recordingId that match this title
        let matchingStream = await c.env.DB.prepare(`
          SELECT * FROM LiveStream 
          WHERE recordingId IS NULL 
          AND status = 'ended'
          AND LOWER(TRIM(title)) = ?
          ORDER BY createdAt DESC
          LIMIT 1
        `).bind(titleLower).first() as any;
        
        // If exact match fails, try fuzzy matching
        if (!matchingStream) {
          console.log('[Bunny Webhook] Exact match failed, trying fuzzy match');
          const allEndedStreams = await c.env.DB.prepare(`
            SELECT * FROM LiveStream 
            WHERE recordingId IS NULL 
            AND status = 'ended'
            ORDER BY createdAt DESC
            LIMIT 20
          `).all();
          
          // Find stream where title contains or is contained by the Bunny video title
          matchingStream = (allEndedStreams.results || []).find((s: any) => {
            const streamTitle = (s.title || '').toLowerCase().trim();
            return streamTitle.includes(titleLower) || titleLower.includes(streamTitle);
          }) as any;
        }

        if (matchingStream) {
          console.log('[Bunny Webhook] Matched stream:', matchingStream.id, 'with video:', VideoId);
          
          await c.env.DB
            .prepare('UPDATE LiveStream SET recordingId = ? WHERE id = ?')
            .bind(VideoId, matchingStream.id)
            .run();
            
          console.log('[Bunny Webhook] Updated stream', matchingStream.id, 'with recordingId:', VideoId);
        } else {
          console.log('[Bunny Webhook] No matching stream found for title:', Title);
          const recentStreams = await c.env.DB.prepare(`
            SELECT title FROM LiveStream WHERE status = 'ended' AND recordingId IS NULL ORDER BY createdAt DESC LIMIT 5
          `).all();
          console.log('[Bunny Webhook] Recent ended streams without recordings:', 
            (recentStreams.results || []).map((s: any) => s.title));
        }
      }
    }
    
    return c.json(successResponse({ received: true }));
  } catch (error: any) {
    console.error('[Bunny Webhook] Error:', error);
    return c.json(successResponse({ received: true, error: error.message }));
  }
});

// POST /webhooks/stripe - Stripe webhook handler for payment confirmations
webhooks.post('/stripe', async (c) => {
  try {
    const signature = c.req.header('stripe-signature');
    if (!signature) {
      return c.json(errorResponse('Missing Stripe signature'), 400);
    }

    // TODO: Verify webhook signature with Stripe
    // const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
    // const event = stripe.webhooks.constructEvent(
    //   await c.req.text(),
    //   signature,
    //   c.env.STRIPE_WEBHOOK_SECRET
    // );

    const payload = await c.req.json();
    const event = payload.type;
    const data = payload.data.object;

    console.log('[Stripe Webhook] Received:', event);
    console.log('[Stripe Webhook] Payment data:', data);
    console.log('[Stripe Webhook] Metadata:', data.metadata);

    // Handle all 5 Stripe webhook events
    if (event === 'checkout.session.completed') {
      const { id: sessionId, metadata, payment_status, customer_details, subscription, amount_total } = data;

      console.log('[Stripe Webhook] Session ID:', sessionId);
      console.log('[Stripe Webhook] Payment status:', payment_status);
      console.log('[Stripe Webhook] Subscription ID:', subscription);
      console.log('[Stripe Webhook] Metadata received:', JSON.stringify(metadata));

      if (payment_status === 'paid') {
        // Check if this is an academy activation payment or enrollment payment
        if (metadata?.type === 'academy_activation' && metadata?.academyId) {
          // Has explicit academyId in metadata
          const { academyId } = metadata;

          await c.env.DB
            .prepare(`
              UPDATE Academy 
              SET paymentStatus = 'PAID'
              WHERE id = ?
            `)
            .bind(academyId)
            .run();

          console.log('[Stripe Webhook] Academy activated via metadata:', academyId);
        } else if (metadata?.enrollmentId) {
          // Enrollment payment
          const { enrollmentId } = metadata;

          console.log('[Stripe Webhook] Processing enrollment payment for:', enrollmentId);

          // Get enrollment details for payment record
          const enrollment = await c.env.DB
            .prepare(`
              SELECT e.*, c.name as className, c.academyId, c.startDate, c.monthlyPrice, c.oneTimePrice,
                     u.firstName, u.lastName, u.email
              FROM ClassEnrollment e
              JOIN Class c ON e.classId = c.id
              JOIN User u ON e.userId = u.id
              WHERE e.id = ?
            `)
            .bind(enrollmentId)
            .first() as any;

          if (enrollment) {
            // Determine if this is monthly or one-time payment
            const paymentFrequency = metadata?.paymentFrequency || 'one-time';
            const isMonthly = paymentFrequency === 'monthly';
            
            // Calculate billing cycle
            const billingCycle = calculateBillingCycle(
              enrollment.startDate || new Date().toISOString(),
              new Date().toISOString(),
              isMonthly
            );
            
            // Create/update payment record (no longer update ClassEnrollment)
            // Check if payment already exists
            await c.env.DB
              .prepare(`
                INSERT INTO Payment (
                  id, type, payerId, payerType, payerName, payerEmail,
                  receiverId, amount, currency, status, stripePaymentId,
                  stripeCheckoutSessionId, paymentMethod, classId,
                  description, metadata, nextPaymentDue, billingCycleStart, billingCycleEnd,
                  createdAt, completedAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
              `)
              .bind(
                crypto.randomUUID(),
                'STUDENT_TO_ACADEMY',
                enrollment.userId,
                'STUDENT',
                `${enrollment.firstName} ${enrollment.lastName}`,
                enrollment.email,
                enrollment.academyId,
                amount_total ? amount_total / 100 : 0, // Stripe uses cents
                'EUR',
                'COMPLETED',
                sessionId,
                sessionId,
                'stripe',
                enrollment.classId,
                `Pago de matrícula - ${enrollment.className}`,
                JSON.stringify({ subscriptionId: subscription, source: 'stripe_checkout', paymentFrequency }),
                billingCycle.nextPaymentDue,
                billingCycle.billingCycleStart,
                billingCycle.billingCycleEnd
              )
              .run();

            console.log('[Stripe Webhook] Payment confirmed and recorded for enrollment:', enrollmentId);

            // IMPORTANT: Update ClassEnrollment status to APPROVED for immediate access
            await c.env.DB
              .prepare('UPDATE ClassEnrollment SET status = ? WHERE id = ?')
              .bind('APPROVED', enrollmentId)
              .run();

            console.log('[Stripe Webhook] ClassEnrollment status updated to APPROVED for:', enrollmentId);
          }
        } else {
          // No metadata - assume academy activation, look up by customer email
          const customerEmail = customer_details?.email;
          
          if (customerEmail) {
            console.log('[Stripe Webhook] Looking up academy by owner email:', customerEmail);
            
            const academy: any = await c.env.DB
              .prepare(`
                SELECT a.id, a.name 
                FROM Academy a
                JOIN User u ON a.ownerId = u.id
                WHERE u.email = ? AND a.paymentStatus = 'NOT PAID'
                LIMIT 1
              `)
              .bind(customerEmail)
              .first();

            if (academy) {
              await c.env.DB
                .prepare(`
                  UPDATE Academy 
                  SET paymentStatus = 'PAID'
                  WHERE id = ?
                `)
                .bind(academy.id)
                .run();

              console.log('[Stripe Webhook] Academy activated via email lookup:', academy.id, academy.name);
            } else {
              console.log('[Stripe Webhook] No unpaid academy found for email:', customerEmail);
            }
          }
        }
      }
    } else if (event === 'invoice.payment_succeeded') {
      // Recurring payment succeeded - add to payment history
      const { subscription, customer_email, amount_paid, lines } = data;
      console.log('[Stripe Webhook] Recurring payment succeeded for subscription:', subscription);

      // Find enrollment by subscription ID
      const enrollment = await c.env.DB
        .prepare(`
          SELECT e.*, c.name as className, c.academyId, u.firstName, u.lastName, u.email
          FROM ClassEnrollment e
          JOIN Class c ON e.classId = c.id
          JOIN User u ON e.userId = u.id
          WHERE e.stripeSubscriptionId = ?
        `)
        .bind(subscription)
        .first() as any;

      if (enrollment) {
        // Add to payment history
        await c.env.DB
          .prepare(`
            INSERT INTO Payment (
              id, type, payerId, receiverId, amount, currency, status, stripePaymentId,
              paymentMethod, classId, metadata, createdAt, completedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `)
          .bind(
            crypto.randomUUID(),
            'STUDENT_TO_ACADEMY',
            enrollment.userId,
            enrollment.academyId,
            amount_paid ? amount_paid / 100 : 0,
            'EUR',
            'COMPLETED',
            data.id,
            'stripe',
            enrollment.classId,
            JSON.stringify({ 
              subscriptionId: subscription, 
              source: 'stripe_recurring',
              payerName: `${enrollment.firstName} ${enrollment.lastName}`,
              payerEmail: enrollment.email,
              className: enrollment.className
            })
          )
          .run();

        console.log('[Stripe Webhook] Recurring payment recorded for enrollment:', enrollment.id);
      }
    } else if (event === 'invoice.payment_failed') {
      // Recurring payment failed - create pending payment
      const { subscription, customer_email, amount_due } = data;
      console.log('[Stripe Webhook] Recurring payment failed for subscription:', subscription);

      const enrollment = await c.env.DB
        .prepare(`
          SELECT e.*, c.name as className, c.monthlyPrice, c.academyId, u.firstName, u.lastName, u.email
          FROM ClassEnrollment e
          JOIN Class c ON e.classId = c.id
          JOIN User u ON e.userId = u.id
          WHERE e.stripeSubscriptionId = ?
        `)
        .bind(subscription)
        .first() as any;

      if (enrollment) {
        // Create pending payment
        await c.env.DB
          .prepare(`
            INSERT INTO Payment (
              id, type, payerId, receiverId, amount, currency, status, paymentMethod,
              classId, metadata, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `)
          .bind(
            crypto.randomUUID(),
            'STUDENT_TO_ACADEMY',
            enrollment.userId,
            enrollment.academyId,
            amount_due ? amount_due / 100 : enrollment.monthlyPrice,
            'EUR',
            'PENDING',
            'stripe',
            enrollment.classId,
            JSON.stringify({ 
              subscriptionId: subscription, 
              reason: 'payment_failed',
              payerName: `${enrollment.firstName} ${enrollment.lastName}`,
              payerEmail: enrollment.email,
              className: enrollment.className
            })
          )
          .run();

        console.log('[Stripe Webhook] Pending payment created for failed recurring payment');
      }
    // END DISABLED SUBSCRIPTION HANDLERS */
    } else if (event === 'payment_intent.succeeded') {
      // One-time payment succeeded (for non-recurring enrollments)
      const { id: paymentIntentId, amount, metadata } = data;
      console.log('[Stripe Webhook] Payment intent succeeded:', paymentIntentId);

      if (metadata?.enrollmentId) {
        const enrollment = await c.env.DB
          .prepare(`
            SELECT e.*, c.name as className, c.academyId, u.firstName, u.lastName, u.email
            FROM ClassEnrollment e
            JOIN Class c ON e.classId = c.id
            JOIN User u ON e.userId = u.id
            WHERE e.id = ?
          `)
          .bind(metadata.enrollmentId)
          .first() as any;

        if (enrollment) {
          // Add to payment history
          await c.env.DB
            .prepare(`
              INSERT INTO Payment (
                id, type, payerId, payerType, payerName, payerEmail,
                receiverId, amount, currency, status, stripePaymentId,
                paymentMethod, classId, description, metadata,
                createdAt, completedAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
            `)
            .bind(
              crypto.randomUUID(),
              'STUDENT_TO_ACADEMY',
              enrollment.userId,
              'STUDENT',
              `${enrollment.firstName} ${enrollment.lastName}`,
              enrollment.email,
              enrollment.academyId,
              amount ? amount / 100 : 0,
              'EUR',
              'COMPLETED',
              paymentIntentId,
              'stripe',
              enrollment.classId,
              `Pago único - ${enrollment.className}`,
              JSON.stringify({ paymentIntentId, source: 'stripe_payment_intent' })
            )
            .run();

          console.log('[Stripe Webhook] One-time payment recorded for enrollment:', enrollment.id);
        }
      }
    }

    return c.json(successResponse({ received: true }));
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return c.json(successResponse({ received: true, error: error.message }));
  }
});

export default webhooks;
