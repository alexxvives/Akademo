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

    } else if (event === 'meeting.ended') {
      const meetingId = data.object.id;

      // Update livestream status to ended
      await c.env.DB
        .prepare('UPDATE LiveStream SET status = ?, endedAt = ? WHERE zoomMeetingId = ?')
        .bind('ended', new Date().toISOString(), meetingId.toString())
        .run();

    } else if (event === 'recording.completed') {
      // Use numeric meeting ID (preferred) from webhook payload
      const meetingId = data.object.id;
      
      // Find the livestream
      const stream = await c.env.DB
        .prepare('SELECT * FROM LiveStream WHERE zoomMeetingId = ?')
        .bind(meetingId.toString())
        .first() as any;

      if (stream) {
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

          const accessToken = zoomAccount.accessToken;

          // Fetch recording details from Zoom API
          // Use numeric meeting ID (preferred for recordings endpoint)
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

          // Find the MP4 recording
          const mp4Recording = recordingsData.recording_files?.find(
            (file: any) => file.file_type === 'MP4' && file.recording_type === 'shared_screen_with_speaker_view'
          );

          if (!mp4Recording) {
            return c.json(successResponse({ received: true, error: 'No MP4 recording found' }));
          }

          const downloadUrl = mp4Recording.download_url;

          // Upload to Bunny Stream using /fetch endpoint
          const bunnyFetchUrl = `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/fetch`;
          const bunnyRequestBody = {
            url: `${downloadUrl}?access_token=${accessToken}`,
            title: stream.title || `Recording ${new Date().toLocaleDateString()}`,
          };
          
          const bunnyFetchResponse = await fetch(bunnyFetchUrl, {
            method: 'POST',
            headers: {
              'AccessKey': c.env.BUNNY_STREAM_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bunnyRequestBody),
          });

          if (!bunnyFetchResponse.ok) {
            const errorText = await bunnyFetchResponse.text();
            console.error('[Zoom Webhook] ❌ Bunny fetch failed:', bunnyFetchResponse.status, errorText);
            return c.json(successResponse({ received: true, error: 'Bunny upload failed' }));
          }

          const bunnyData = await bunnyFetchResponse.json() as any;
          
          // Bunny /fetch endpoint returns success=true and guid in response
          const videoGuid = bunnyData.guid || bunnyData.videoGuid || bunnyData.id;
          
          if (!videoGuid) {
            console.error('[Zoom Webhook] ❌ No GUID in Bunny response:', JSON.stringify(bunnyData));
            return c.json(successResponse({ received: true, error: 'Bunny returned no GUID' }));
          }
          
          // Update stream with recordingId
          const updateResult = await c.env.DB
            .prepare('UPDATE LiveStream SET recordingId = ? WHERE id = ?')
            .bind(videoGuid, stream.id)
            .run();

        } catch (error: any) {
          console.error('[Zoom Webhook] Error processing recording:', error.message);
        }
      } else {
        // Log all streams for debugging
        const allStreams = await c.env.DB
          .prepare('SELECT id, zoomMeetingId, title FROM LiveStream ORDER BY createdAt DESC LIMIT 5')
          .all();
      }
    } else if (event === 'meeting.participant_joined' || event === 'meeting.participant_left' || event === 'participant.joined' || event === 'participant.left') {
      const meetingId = data.object.id;
      const participant = data.payload?.object?.participant || data.object?.participant;
      const participantUserId = participant?.user_id || participant?.id || 'unknown';
      
      // Get current stream
      const stream = await c.env.DB
        .prepare('SELECT * FROM LiveStream WHERE zoomMeetingId = ?')
        .bind(meetingId.toString())
        .first() as any;

      if (stream) {
        const isJoin = event.includes('joined');
        const currentCount = stream.participantCount || 0;
        const newCount = isJoin ? currentCount + 1 : Math.max(0, currentCount - 1);
        
        // Update participant count
        const result = await c.env.DB
          .prepare('UPDATE LiveStream SET participantCount = ?, participantsFetchedAt = ? WHERE id = ?')
          .bind(newCount, new Date().toISOString(), stream.id)
          .run();

      } else {
        // Debug: Show all active streams
        const activeStreams = await c.env.DB
          .prepare('SELECT id, zoomMeetingId, title, status FROM LiveStream WHERE status IN ("scheduled", "active") ORDER BY createdAt DESC LIMIT 5')
          .all();
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
    
    // Bunny sends VideoId (GUID), Status, and other metadata
    const { VideoId, Status, VideoLibraryId, Title } = payload;
    
    if (VideoId && Status !== undefined) {
      // Update existing Upload records with status
      const result = await c.env.DB.prepare(
        'UPDATE Upload SET bunnyStatus = ? WHERE bunnyGuid = ?'
      ).bind(Status, VideoId).run();
      
      // Try to match this video to a LiveStream without recordingId
      if (Title) {
        const titleLower = Title.toLowerCase().trim();
        
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
          await c.env.DB
            .prepare('UPDATE LiveStream SET recordingId = ? WHERE id = ?')
            .bind(VideoId, matchingStream.id)
            .run();
            
        } else {
          const recentStreams = await c.env.DB.prepare(`
            SELECT title FROM LiveStream WHERE status = 'ended' AND recordingId IS NULL ORDER BY createdAt DESC LIMIT 5
          `).all();
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

    // Handle all 5 Stripe webhook events
    if (event === 'checkout.session.completed') {
      const { id: sessionId, metadata, payment_status, customer_details, subscription, amount_total } = data;

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

        } else if (metadata?.enrollmentId) {
          // Enrollment payment
          const { enrollmentId } = metadata;

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
            
            // Check if payment already exists to avoid duplicates
            const existingPayment: any = await c.env.DB
              .prepare('SELECT id FROM Payment WHERE stripeCheckoutSessionId = ?')
              .bind(sessionId)
              .first();
            
            if (!existingPayment) {
              // Create payment record
              await c.env.DB
                .prepare(`
                  INSERT INTO Payment (
                  id, type, payerId, receiverId, amount, currency, status,
                  stripePaymentId, stripeCheckoutSessionId, paymentMethod, classId,
                  metadata, completedAt, nextPaymentDue, billingCycleStart, billingCycleEnd, createdAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, datetime('now'))
              `)
              .bind(
                crypto.randomUUID(),
                'STUDENT_TO_ACADEMY',
                enrollment.userId,
                enrollment.academyId,
                amount_total ? amount_total / 100 : 0, // Stripe uses cents
                'EUR',
                'COMPLETED',
                sessionId,
                sessionId,
                'stripe',
                enrollment.classId,
                JSON.stringify({ 
                  subscriptionId: subscription, 
                  source: 'stripe_checkout', 
                  paymentFrequency,
                  payerName: `${enrollment.firstName} ${enrollment.lastName}`,
                  payerEmail: enrollment.email
                }),
                billingCycle.nextPaymentDue,
                billingCycle.billingCycleStart,
                billingCycle.billingCycleEnd
              )
              .run();

            } else {
            }

            // IMPORTANT: Update ClassEnrollment status to APPROVED for immediate access
            await c.env.DB
              .prepare('UPDATE ClassEnrollment SET status = ? WHERE id = ?')
              .bind('APPROVED', enrollmentId)
              .run();

          }
        } else {
          // No metadata - assume academy activation, look up by customer email
          const customerEmail = customer_details?.email;
          
          if (customerEmail) {
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

            } else {
            }
          }
        }
      }
    } else if (event === 'invoice.payment_succeeded') {
      // Recurring payment succeeded - add to payment history
      const { subscription, customer_email, amount_paid, lines } = data;

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
        // Calculate next billing cycle
        const billingCycle = calculateBillingCycle('monthly');
        
        // Add to payment history
        await c.env.DB
          .prepare(`
            INSERT INTO Payment (
              id, type, payerId, receiverId, amount, currency, status, stripePaymentId,
              paymentMethod, classId, metadata, completedAt, nextPaymentDue, billingCycleStart, billingCycleEnd, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, datetime('now'))
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
            }),
            billingCycle.nextPaymentDue,
            billingCycle.billingCycleStart,
            billingCycle.billingCycleEnd
          )
          .run();

      }
    } else if (event === 'invoice.payment_failed') {
      // Recurring payment failed - create pending payment
      const { subscription, customer_email, amount_due } = data;

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

      }
    // END DISABLED SUBSCRIPTION HANDLERS */
    } else if (event === 'payment_intent.succeeded') {
      // One-time payment succeeded (for non-recurring enrollments)
      const { id: paymentIntentId, amount, metadata } = data;

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
