import { Hono } from 'hono';
import { Bindings } from '../types';
import { successResponse, errorResponse } from '../lib/utils';
import { refreshZoomToken } from './zoom-accounts';
import { addMonths } from '../lib/payment-utils';

const webhooks = new Hono<{ Bindings: Bindings }>();

// Helper function to calculate billing cycles based on class start date (webhook variant — dates only)
function calculateBillingCycle(classStartDate: string, _enrollmentDate: string, isMonthly: boolean) {
  const classStart = new Date(classStartDate);
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
    const cycleEnd = addMonths(classStart, 1);
    return {
      billingCycleStart: classStart.toISOString(),
      billingCycleEnd: cycleEnd.toISOString(),
      nextPaymentDue: cycleEnd.toISOString()
    };
  }

  // Class has already started — use calendar months
  let months = (today.getFullYear() - classStart.getFullYear()) * 12
             + (today.getMonth() - classStart.getMonth());
  if (today.getDate() < classStart.getDate()) {
    months = Math.max(0, months - 1);
  }
  const elapsedCycles = months + 1;

  const currentCycleEnd = addMonths(classStart, elapsedCycles);
  const nextCycleEnd    = addMonths(classStart, elapsedCycles + 1);

  return {
    billingCycleStart: addMonths(classStart, elapsedCycles - 1).toISOString(),
    billingCycleEnd: currentCycleEnd.toISOString(),
    nextPaymentDue: nextCycleEnd.toISOString()
  };
}

// POST /webhooks/zoom - Zoom webhook handler
webhooks.post('/zoom', async (c) => {
  try {
    // Read raw body for signature verification
    const rawBody = await c.req.text();
    const payload = JSON.parse(rawBody);

    // Log every incoming POST immediately (before any validation) for debugging
    console.log(`[Zoom Webhook] Incoming event: "${payload.event}"`);

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

    // ── Verify Zoom webhook signature on ALL events ──
    const zoomSignature = c.req.header('x-zm-signature');
    const zoomTimestamp = c.req.header('x-zm-request-timestamp');
    const webhookSecret = c.env.ZOOM_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Zoom Webhook] ZOOM_WEBHOOK_SECRET not configured — rejecting event');
      return c.json(errorResponse('Webhook secret not configured'), 500);
    }

    if (!zoomSignature || !zoomTimestamp) {
      console.error('[Zoom Webhook] Missing signature or timestamp headers');
      return c.json(errorResponse('Missing signature'), 401);
    }

    // Reject if timestamp is older than 5 minutes (replay protection)
    const timestampAge = Math.floor(Date.now() / 1000) - parseInt(zoomTimestamp, 10);
    if (isNaN(timestampAge) || timestampAge > 300) {
      console.error('[Zoom Webhook] Timestamp too old:', timestampAge, 'seconds');
      return c.json(errorResponse('Webhook timestamp too old'), 401);
    }

    // Compute expected signature: HMAC-SHA256("v0:{timestamp}:{rawBody}")
    const encoder = new TextEncoder();
    const message = `v0:${zoomTimestamp}:${rawBody}`;
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    const computedSig = 'v0=' + Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedSig !== zoomSignature) {
      console.error('[Zoom Webhook] Signature verification failed');
      return c.json(errorResponse('Invalid signature'), 401);
    }

    const { event, payload: data } = payload;

    // Log every incoming event for debugging
    console.log(`[Zoom Webhook] Event received: "${event}"`);

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

    } else if (event === 'meeting.deleted') {
      const meetingId = data.object.id;

      // If the meeting was still scheduled (not yet started), remove it from the platform
      const stream = await c.env.DB
        .prepare(`SELECT id, status, calendarEventId FROM LiveStream WHERE zoomMeetingId = ? AND status = 'scheduled'`)
        .bind(meetingId.toString())
        .first() as { id: string; status: string; calendarEventId: string | null } | null;

      if (stream) {
        // Delete the stream row (cascades to linked CalendarScheduledEvent)
        await c.env.DB.prepare('DELETE FROM LiveStream WHERE id = ?').bind(stream.id).run();
        if (stream.calendarEventId) {
          await c.env.DB
            .prepare('DELETE FROM CalendarScheduledEvent WHERE id = ?')
            .bind(stream.calendarEventId)
            .run();
        }
      }

    } else if (event === 'recording.completed') {
      // Use numeric meeting ID (preferred) from webhook payload
      const meetingId = data.object.id;
      
      // Find the livestream
      const stream = await c.env.DB
        .prepare('SELECT * FROM LiveStream WHERE zoomMeetingId = ?')
        .bind(meetingId.toString())
        .first() as any;

      if (stream) {
        // Idempotency: if recording was already processed (e.g. Zoom retry), skip re-upload
        if (stream.recordingId) {
          console.log(`[Zoom Webhook] recording.completed skipped — stream ${stream.id} already has recordingId: ${stream.recordingId}`);
          return c.json(successResponse({ received: true, skipped: 'already_processed' }));
        }

        try {
          // Get Zoom account for this stream's class
          const streamWithClass = await c.env.DB
            .prepare('SELECT ls.id, ls.classId, ls.teacherId, ls.status, ls.title, ls.startedAt, ls.endedAt, ls.recordingId, ls.createdAt, ls.zoomLink, ls.zoomMeetingId, ls.zoomStartUrl, ls.participantCount, ls.currentCount, ls.participantsFetchedAt, c.zoomAccountId FROM LiveStream ls JOIN Class c ON ls.classId = c.id WHERE ls.id = ?')
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

          // Refresh the Zoom access token before use (tokens expire after 1 hour).
          // Without this, recording downloads fail silently if the token has expired.
          let accessToken = zoomAccount.accessToken;
          try {
            const freshToken = await refreshZoomToken(c, streamWithClass.zoomAccountId);
            if (freshToken) {
              accessToken = freshToken;
            } else {
              console.warn('[Zoom Webhook] Token refresh returned null, using stored token as fallback');
            }
          } catch (refreshErr: any) {
            console.warn('[Zoom Webhook] Token refresh failed, using stored token:', refreshErr.message);
          }

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

          // Find ALL MP4 recording segments (handles pause/resume creating multiple files)
          // Accept all common recording types in priority order
          const acceptedRecordingTypes = [
            'shared_screen_with_speaker_view',
            'shared_screen_with_gallery_view',
            'active_speaker',
            'gallery_view',
            'shared_screen',
            'speaker_view',
          ];
          const allMp4 = (recordingsData.recording_files || []).filter(
            (file: any) => file.file_type === 'MP4' && acceptedRecordingTypes.includes(file.recording_type)
          );
          // Prefer shared_screen_with_speaker_view if available, otherwise use first available type
          const preferredType = acceptedRecordingTypes.find(t => allMp4.some((f: any) => f.recording_type === t));
          const mp4Recordings = preferredType
            ? allMp4.filter((f: any) => f.recording_type === preferredType)
            : (recordingsData.recording_files || []).filter((file: any) => file.file_type === 'MP4');

          if (mp4Recordings.length === 0) {
            return c.json(successResponse({ received: true, error: 'No MP4 recording found' }));
          }

          // Sort segments chronologically
          mp4Recordings.sort((a: any, b: any) =>
            new Date(a.recording_start || 0).getTime() - new Date(b.recording_start || 0).getTime()
          );

          // Get academy name for Bunny collection assignment
          let bunnyCollectionId: string | undefined;
          try {
            const academyRow = await c.env.DB
              .prepare('SELECT a.name FROM Academy a JOIN Class c ON c.academyId = a.id WHERE c.id = ?')
              .bind(streamWithClass.classId)
              .first() as any;

            if (academyRow?.name) {
              const collectionsRes = await fetch(
                `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/collections?itemsPerPage=100`,
                { headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY } }
              );
              if (collectionsRes.ok) {
                const collectionsData = await collectionsRes.json() as any;
                const existing = (collectionsData.items || []).find((col: any) => col.name === academyRow.name);
                if (existing) {
                  bunnyCollectionId = existing.guid;
                } else {
                  const createRes = await fetch(
                    `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/collections`,
                    {
                      method: 'POST',
                      headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: academyRow.name }),
                    }
                  );
                  if (createRes.ok) {
                    const createData = await createRes.json() as any;
                    bunnyCollectionId = createData.guid;
                  }
                }
              }
            }
          } catch (collectionError: any) {
            console.error('[Zoom Webhook] Failed to get/create Bunny collection:', collectionError.message);
            // Continue without collection
          }

          // Upload each segment to Bunny
          const bunnyGuids: string[] = [];
          for (let i = 0; i < mp4Recordings.length; i++) {
            const mp4File = mp4Recordings[i];
            const partSuffix = mp4Recordings.length > 1 ? ` - Parte ${i + 1}` : '';
            const videoTitle = `${stream.title || `Recording ${new Date().toLocaleDateString()}`}${partSuffix}`;

            const bunnyFetchResponse = await fetch(
              `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/fetch`,
              {
                method: 'POST',
                headers: {
                  'AccessKey': c.env.BUNNY_STREAM_API_KEY,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url: `${mp4File.download_url}?access_token=${accessToken}`,
                  title: videoTitle,
                }),
              }
            );

            if (!bunnyFetchResponse.ok) {
              const errorText = await bunnyFetchResponse.text();
              console.error(`[Zoom Webhook] ❌ Bunny fetch failed for segment ${i + 1}:`, bunnyFetchResponse.status, errorText);
              continue;
            }

            const bunnyData = await bunnyFetchResponse.json() as any;
            const videoGuid = bunnyData.guid || bunnyData.videoGuid || bunnyData.id;

            if (!videoGuid) {
              console.error(`[Zoom Webhook] ❌ No GUID in Bunny response for segment ${i + 1}:`, JSON.stringify(bunnyData));
              continue;
            }

            bunnyGuids.push(videoGuid);

            // Apply academy collection if available
            if (bunnyCollectionId) {
              try {
                await fetch(
                  `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/${videoGuid}`,
                  {
                    method: 'POST',
                    headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ collectionId: bunnyCollectionId }),
                  }
                );
              } catch (patchErr: any) {
                console.error('[Zoom Webhook] Failed to set Bunny collection on video:', patchErr.message);
              }
            }
          }

          if (bunnyGuids.length === 0) {
            console.error('[Zoom Webhook] ❌ Failed to upload any recording segments');
            return c.json(successResponse({ received: true, error: 'All Bunny uploads failed' }));
          }

          // Store single guid as string, multiple as JSON array
          const recordingIds = bunnyGuids.length === 1 ? bunnyGuids[0] : JSON.stringify(bunnyGuids);

          // Update stream with recordingId
          await c.env.DB
            .prepare('UPDATE LiveStream SET recordingId = ? WHERE id = ?')
            .bind(recordingIds, stream.id)
            .run();

        } catch (error: any) {
          if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
          console.error('[Zoom Webhook] Error processing recording:', error.message);
        }
      } else {
        // Log all streams for debugging
        const allStreams = await c.env.DB
          .prepare('SELECT id, zoomMeetingId, title FROM LiveStream ORDER BY createdAt DESC LIMIT 5')
          .all();
      }
    } else if (event === 'meeting.participant_joined_waiting_room') {
      // Teacher manages the waiting room manually from their Zoom app.
      // No automated admit/block logic — just acknowledge the event.
      console.log(`[Zoom Webhook] Participant entered waiting room — teacher will admit manually`);
    } else if (event === 'meeting.participant_joined' || event === 'meeting.participant_left' || event === 'participant.joined' || event === 'participant.left') {
      const meetingId = data.object.id;
      const participant = data.payload?.object?.participant || data.object?.participant;
      // participant.id = per-session unique ID (present for ALL participants, registered or not)
      // participant.user_id = Zoom account ID (only for registered Zoom users, blank otherwise)
      // Using participant.id as fallback ensures each participant gets a unique key
      const participantUserId = participant?.user_id || participant?.id || `anon-${Date.now()}`;
      const participantEmail = (participant?.email || '').toLowerCase().trim();
      // participant_uuid = UUID for this in-meeting session, required by Zoom's participant status API
      // participant.id = per-session numeric ID (always present)
      const participantId = participant?.participant_user_id || participant?.id || participantUserId;
      const participantUUID = participant?.participant_uuid || participant?.id || participantId;
      // isHost / isCoHost — never remove the host
      const isHost = !!participant?.is_host;
      const isCoHost = !!participant?.is_cohost;
      
      // Get current stream with class and zoom account info
      const stream = await c.env.DB
        .prepare(`
          SELECT ls.*, c.zoomAccountId, c.teacherId, a.ownerId, a.restrictStreamAccess
          FROM LiveStream ls
          JOIN Class c ON ls.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          WHERE ls.zoomMeetingId = ?
        `)
        .bind(meetingId.toString())
        .first() as any;

      if (stream) {
        const isJoin = event.includes('joined');
        // Use atomic SQL increments to avoid race conditions from concurrent participant events.
        // currentCount = live running count of people in the meeting right now
        // participantCount = peak concurrent ever (never decreases)

        if (isJoin) {
          await c.env.DB
            .prepare(`
              UPDATE LiveStream 
              SET currentCount = currentCount + 1,
                  participantCount = MAX(participantCount, currentCount + 1),
                  participantsFetchedAt = ?
              WHERE id = ?
            `)
            .bind(new Date().toISOString(), stream.id)
            .run();
        } else {
          await c.env.DB
            .prepare(`
              UPDATE LiveStream 
              SET currentCount = MAX(0, currentCount - 1),
                  participantsFetchedAt = ?
              WHERE id = ?
            `)
            .bind(new Date().toISOString(), stream.id)
            .run();
        }
      }
    }

    return c.json(successResponse({ received: true }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Zoom Webhook] Error:', error);
    // Return 200 even on error to avoid Zoom retries
    return c.json(successResponse({ received: true }));
  }
});

// POST /webhooks/bunny - Bunny Stream webhook handler for video uploads
webhooks.post('/bunny', async (c) => {
  try {
    // Verify shared secret via timing-safe comparison to prevent timing attacks.
    // Accepts secret from either query param (?secret=) or X-Bunny-Webhook-Secret header.
    const expectedSecret = (c.env as unknown as Record<string, unknown>).BUNNY_WEBHOOK_SECRET as string;
    if (!expectedSecret) {
      console.error('[Bunny Webhook] BUNNY_WEBHOOK_SECRET not configured — rejecting');
      return c.json(errorResponse('Webhook secret not configured'), 500);
    }
    const providedSecret = c.req.header('X-Bunny-Webhook-Secret')
      || new URL(c.req.url).searchParams.get('secret')
      || '';
    // Timing-safe comparison using Web Crypto
    const encoder = new TextEncoder();
    const expectedBuf = encoder.encode(expectedSecret);
    const providedBuf = encoder.encode(providedSecret.padEnd(expectedSecret.length));
    const expectedKey = await crypto.subtle.importKey('raw', expectedBuf, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const expectedSig = await crypto.subtle.sign('HMAC', expectedKey, expectedBuf);
    const providedKey = await crypto.subtle.importKey('raw', providedBuf, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const providedSig = await crypto.subtle.sign('HMAC', providedKey, providedBuf);
    const isMatch = providedSecret.length === expectedSecret.length
      && new Uint8Array(expectedSig).every((b, i) => b === new Uint8Array(providedSig)[i]);
    if (!isMatch) {
      console.error('[Bunny Webhook] Invalid or missing secret');
      return c.json(errorResponse('Unauthorized'), 401);
    }

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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Bunny Webhook] Error:', error);
    return c.json(successResponse({ received: true }));
  }
});

// POST /webhooks/stripe - Stripe webhook handler for payment confirmations
webhooks.post('/stripe', async (c) => {
  try {
    const signature = c.req.header('stripe-signature');
    if (!signature) {
      return c.json(errorResponse('Missing Stripe signature'), 400);
    }

    // Verify webhook signature with HMAC-SHA256 (Stripe v1 scheme)
    // Prefer production key; fall back to sandbox
    const rawBody = await c.req.text();
    const webhookSecret = (c.env.STRIPE_WEBHOOK_SECRET || (c.env as unknown as Record<string, unknown>).STRIPE_WEBHOOK_SECRET_SANDBOX) as string;
    
    if (webhookSecret) {
      const parts = signature.split(',').reduce((acc: Record<string, string>, part: string) => {
        const [key, val] = part.split('=');
        acc[key.trim()] = val;
        return acc;
      }, {} as Record<string, string>);
      
      const timestamp = parts['t'];
      const expectedSig = parts['v1'];
      
      if (!timestamp || !expectedSig) {
        return c.json(errorResponse('Invalid signature format'), 400);
      }
      
      // Reject if timestamp is more than 5 minutes old (replay protection)
      const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
      if (age > 300) {
        return c.json(errorResponse('Webhook timestamp too old'), 400);
      }
      
      // Compute expected signature: HMAC-SHA256(timestamp + "." + rawBody)
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signedPayload = encoder.encode(`${timestamp}.${rawBody}`);
      const sigBuffer = await crypto.subtle.sign('HMAC', key, signedPayload);
      const computedSig = Array.from(new Uint8Array(sigBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      if (computedSig !== expectedSig) {
        console.error('[Stripe Webhook] Signature verification failed');
        return c.json(errorResponse('Invalid signature'), 400);
      }
    } else {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET_SANDBOX not configured — rejecting webhook');
      return c.json(errorResponse('Webhook secret not configured'), 500);
    }

    const payload = JSON.parse(rawBody);
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
            
            // Atomic batch: insert payment + approve enrollment + cleanup PENDING
            const subscriptionId = subscription || null;
            const checkoutBatch: any[] = [];

            if (!existingPayment) {
              checkoutBatch.push(
                c.env.DB.prepare(`
                  INSERT INTO Payment (
                  id, type, payerId, receiverId, amount, currency, status,
                  stripePaymentId, stripeCheckoutSessionId, paymentMethod, classId,
                  metadata, completedAt, nextPaymentDue, billingCycleEnd, createdAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, datetime('now'))
                `).bind(
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
                  billingCycle.billingCycleEnd
                )
              );
            }

            checkoutBatch.push(
              c.env.DB.prepare(`
                UPDATE ClassEnrollment
                SET status = ?,
                    paymentFrequency = ?,
                    paymentMethod = ?,
                    stripeSubscriptionId = ?,
                    nextPaymentDue = ?
                WHERE id = ?
              `)
                .bind(
                  'APPROVED',
                  isMonthly ? 'MONTHLY' : 'ONE_TIME',
                  'stripe',
                  subscriptionId,
                  billingCycle.nextPaymentDue,
                  enrollmentId
                ),
              // Clean up any manually-created or auto-created PENDING rows
              c.env.DB.prepare("DELETE FROM Payment WHERE payerId = ? AND classId = ? AND status = 'PENDING'")
                .bind(enrollment.userId, enrollment.classId)
            );

            await c.env.DB.batch(checkoutBatch);

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

      // Skip the very first invoice of a new subscription.
      // Stripe fires checkout.session.completed first (which already creates the COMPLETED
      // Payment record). If we don't skip here, invoice.payment_succeeded creates a second
      // COMPLETED record for the same payment because its stripePaymentId (invoice.id = in_xxx)
      // doesn't match the one saved by checkout.session.completed (cs_xxx).
      if (data.billing_reason === 'subscription_create') {
        console.log('[Stripe Webhook] invoice.payment_succeeded skipped — first invoice handled by checkout.session.completed');
        return c.json(successResponse({ received: true }));
      }

      // Find enrollment by subscription ID
      const enrollment = await c.env.DB
        .prepare(`
          SELECT e.*, c.name as className, c.academyId, c.startDate, u.firstName, u.lastName, u.email
          FROM ClassEnrollment e
          JOIN Class c ON e.classId = c.id
          JOIN User u ON e.userId = u.id
          WHERE e.stripeSubscriptionId = ?
        `)
        .bind(subscription)
        .first() as any;

      if (enrollment) {
        // Idempotency: skip if we already recorded this invoice payment
        const existingInvoicePayment: any = await c.env.DB
          .prepare('SELECT id FROM Payment WHERE stripePaymentId = ?')
          .bind(data.id)
          .first();

        if (!existingInvoicePayment) {
          await c.env.DB
            .prepare(`
              INSERT INTO Payment (
                id, type, payerId, receiverId, amount, currency, status, stripePaymentId,
                paymentMethod, classId, metadata, completedAt, createdAt
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
        }

        const billingCycle = calculateBillingCycle(
          enrollment.startDate || new Date().toISOString(),
          new Date().toISOString(),
          true
        );

        await c.env.DB
          .prepare('UPDATE ClassEnrollment SET nextPaymentDue = ? WHERE id = ?')
          .bind(billingCycle.nextPaymentDue, enrollment.id)
          .run();

        // INV-4.9: Auto-cancel subscription when totalPaid >= oneTimePrice
        const classInfo: any = await c.env.DB
          .prepare('SELECT oneTimePrice, monthlyPrice FROM Class WHERE id = ?')
          .bind(enrollment.classId)
          .first();

        if (classInfo && Number(classInfo.oneTimePrice) > 0) {
          const totalPaidResult: any = await c.env.DB
            .prepare(`SELECT COALESCE(SUM(amount), 0) as totalPaid FROM Payment WHERE classId = ? AND payerId = ? AND status = 'COMPLETED'`)
            .bind(enrollment.classId, enrollment.userId)
            .first();

          const totalPaid = Number(totalPaidResult?.totalPaid) || 0;
          const oneTimePrice = Number(classInfo.oneTimePrice);

          if (totalPaid >= oneTimePrice) {
            console.log(`[Stripe Webhook] Subscription fully paid (${totalPaid}€ >= ${oneTimePrice}€). Cancelling subscription ${subscription}`);
            try {
              const stripeModule = (await import('stripe')).default;
              const stripeClient = new stripeModule(
                ((c.env as unknown as Record<string, unknown>).STRIPE_SECRET_KEY_SANDBOX as string),
                { apiVersion: '2025-12-15.clover' as any }
              );
              await stripeClient.subscriptions.cancel(subscription);

              await c.env.DB
                .prepare('UPDATE ClassEnrollment SET stripeSubscriptionId = NULL, nextPaymentDue = NULL WHERE id = ?')
                .bind(enrollment.id)
                .run();

              console.log(`[Stripe Webhook] Subscription ${subscription} cancelled — student has lifetime access`);
            } catch (cancelErr: any) {
              console.error(`[Stripe Webhook] Failed to cancel subscription ${subscription}:`, cancelErr);
            }
          }
        }
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
        const failedAmount = amount_due ? amount_due / 100 : enrollment.monthlyPrice;

        // Dedup: only create one PENDING row per enrollment. If a PENDING row already
        // exists (e.g. from a previous retry or autoCreatePendingPayments), update its amount.
        const existingPending: any = await c.env.DB
          .prepare("SELECT id FROM Payment WHERE payerId = ? AND classId = ? AND status = 'PENDING' LIMIT 1")
          .bind(enrollment.userId, enrollment.classId)
          .first();

        if (!existingPending) {
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
              failedAmount,
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
        } else {
          // Update amount in case the overdue amount changed
          await c.env.DB
            .prepare("UPDATE Payment SET amount = ? WHERE id = ?")
            .bind(failedAmount, existingPending.id)
            .run();
        }
      }
    } else if (event === 'customer.subscription.deleted') {
      // Subscription cancelled or expired — revoke access and create a PENDING payment
      const subscriptionId = data.id; // sub_xxx

      const enrollment = await c.env.DB
        .prepare(`
             SELECT e.id, e.userId, e.classId, e.status, e.stripeSubscriptionId, c.name as className, c.monthlyPrice, c.academyId,
                 u.firstName, u.lastName, u.email
          FROM ClassEnrollment e
          JOIN Class c ON e.classId = c.id
          JOIN User u ON e.userId = u.id
          WHERE e.stripeSubscriptionId = ?
        `)
        .bind(subscriptionId)
        .first() as any;

      if (enrollment) {
        // Idempotency: skip if we already cleared this subscription
        if (enrollment.stripeSubscriptionId) {
          // Check for existing PENDING before batching writes
          const existingPending: any = await c.env.DB
            .prepare("SELECT id FROM Payment WHERE payerId = ? AND classId = ? AND status = 'PENDING' LIMIT 1")
            .bind(enrollment.userId, enrollment.classId)
            .first();

          // Atomic batch: clear subscription + create PENDING payment
          const subDeletedBatch: any[] = [
            c.env.DB.prepare('UPDATE ClassEnrollment SET stripeSubscriptionId = NULL WHERE id = ?')
              .bind(enrollment.id)
          ];

          const shouldCreatePending = !['WITHDRAWN', 'BANNED', 'REJECTED'].includes(enrollment.status);

          if (!existingPending && shouldCreatePending) {
            subDeletedBatch.push(
              c.env.DB.prepare(`
                INSERT INTO Payment (
                  id, type, payerId, receiverId, amount, currency, status, paymentMethod,
                  classId, metadata, nextPaymentDue, createdAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
              `).bind(
                crypto.randomUUID(),
                'STUDENT_TO_ACADEMY',
                enrollment.userId,
                enrollment.academyId,
                enrollment.monthlyPrice || 0,
                'EUR',
                'PENDING',
                'stripe',
                enrollment.classId,
                JSON.stringify({
                  subscriptionId,
                  reason: 'subscription_deleted',
                  payerName: `${enrollment.firstName} ${enrollment.lastName}`,
                  payerEmail: enrollment.email,
                  className: enrollment.className
                })
              )
            );
          }

          await c.env.DB.batch(subDeletedBatch);

          console.log(`[Stripe Webhook] subscription.deleted: cleared sub ${subscriptionId} for enrollment ${enrollment.id}${shouldCreatePending ? ', created PENDING payment' : ', skipped pending payment due to inactive enrollment status'}`);
          }
      } else {
        console.log(`[Stripe Webhook] subscription.deleted: no enrollment found for sub ${subscriptionId}`);
      }
    }

    return c.json(successResponse({ received: true }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Stripe Webhook] Error:', error);
    return c.json(successResponse({ received: true }));
  }
});

// POST /webhooks/daily - Daily.co recording.ready-to-download → upload to Bunny
webhooks.post('/daily', async (c) => {
  try {
    const rawBody = await c.req.text();

    // Daily sends {"test":"test"} (no signature) when verifying the endpoint during webhook creation.
    // Must return 200 immediately or Daily rejects the registration with a 400.
    if (rawBody === '{"test":"test"}' || rawBody.trim() === '{"test": "test"}') {
      return c.json({ received: true });
    }

    // Verify HMAC-SHA256 signature
    const webhookSecret = c.env.DAILY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const sigHeader = c.req.header('x-webhook-signature') || '';
      const tsHeader  = c.req.header('x-webhook-timestamp') || '';
      // Daily signs: timestamp + '.' + raw JSON body
      // The HMAC secret from Daily is BASE-64 encoded — must decode before use as key
      const message = `${tsHeader}.${rawBody}`;
      const keyBytes = Uint8Array.from(atob(webhookSecret), ch => ch.charCodeAt(0));
      const key = await crypto.subtle.importKey(
        'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
      const computed = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
      if (computed !== sigHeader) {
        console.error('[Daily Webhook] Signature mismatch. Rejecting request.');
        return c.json({ error: 'Invalid signature' }, 401);
      }
    }

    const event = JSON.parse(rawBody) as any;
    // Respond 200 immediately so Daily doesn't retry
    // (we do the heavy work below but Cloudflare Workers respond once we return)

    const eventType: string = event.type || '';
    console.log(`[Daily Webhook] type: "${eventType}"`);

    // participant.joined / participant.left → track current live headcount (same logic as Zoom)
    if (eventType === 'participant.joined') {
      const roomName: string = event.payload?.room_name || event.payload?.room || '';
      if (roomName) {
        // Use peak-count logic matching Zoom: participantCount = MAX(participantCount, currentCount+1)
        await c.env.DB.prepare(
          `UPDATE LiveStream
           SET currentCount = COALESCE(currentCount, 0) + 1,
               participantCount = MAX(COALESCE(participantCount, 0), COALESCE(currentCount, 0) + 1),
               participantsFetchedAt = ?
           WHERE dailyRoomName = ? AND status = 'active'`
        ).bind(new Date().toISOString(), roomName).run();

        // Auto-start cloud recording server-side as soon as the first participant joins.
        // This is more reliable than the iframe postMessage approach on the frontend.
        // Daily.co returns an error if recording is already running — we safely ignore it.
        const dailyKey = c.env.DAILY_API_KEY;
        if (dailyKey) {
          c.executionCtx.waitUntil((async () => {
            try {
              const recRes = await fetch('https://api.daily.co/v1/recordings/start', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${dailyKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_name: roomName }),
              });
              if (!recRes.ok) {
                const errText = await recRes.text();
                // Ignore "already recording" — any other error is worth logging
                if (!errText.toLowerCase().includes('already')) {
                  console.warn(`[Daily Webhook] Recording start for room ${roomName}:`, errText);
                } else {
                  console.log(`[Daily Webhook] Recording already running for room: ${roomName}`);
                }
              } else {
                console.log(`[Daily Webhook] Recording started for room: ${roomName}`);
              }
            } catch (e: any) {
              console.error('[Daily Webhook] Recording start error:', e.message);
            }
          })());
        }
      }
    }

    if (eventType === 'participant.left') {
      const roomName: string = event.payload?.room_name || event.payload?.room || '';
      if (roomName) {
        await c.env.DB.prepare(
          `UPDATE LiveStream
           SET currentCount = MAX(0, COALESCE(currentCount, 0) - 1),
               participantsFetchedAt = ?
           WHERE dailyRoomName = ? AND status = 'active'`
        ).bind(new Date().toISOString(), roomName).run();
      }
    }

    // meeting.ended → mark stream as ended (covers page-close without clicking Finalizar)
    if (eventType === 'meeting.ended' || eventType === 'meeting-ended') {
      const roomName: string = event.payload?.room || event.payload?.room_name || '';
      if (roomName) {
        await c.env.DB.prepare(
          "UPDATE LiveStream SET status = 'ended', endedAt = ? WHERE dailyRoomName = ? AND status = 'active'"
        ).bind(new Date().toISOString(), roomName).run();
        console.log(`[Daily Webhook] meeting.ended → stream ended for room: ${roomName}`);
      }
    }

    if (eventType === 'recording.ready-to-download') {
      const recording_id: string = event.payload?.recording_id;
      const room_name: string    = event.payload?.room_name;

      if (!recording_id || !room_name) {
        console.error('[Daily Webhook] Missing recording_id or room_name', event.payload);
        return c.json({ received: true });
      }

      // Look up in both DailyTestRoom and LiveStream
      const testRoom = await c.env.DB.prepare(
        "SELECT id FROM DailyTestRoom WHERE roomName = ?"
      ).bind(room_name).first<{ id: string }>();

      const liveStream = await c.env.DB.prepare(
        "SELECT id, status FROM LiveStream WHERE dailyRoomName = ?"
      ).bind(room_name).first<{ id: string; status: string }>();

      if (!testRoom && !liveStream) {
        console.log(`[Daily Webhook] No room/stream found for roomName: ${room_name}`);
        return c.json({ received: true });
      }

      const apiKey = c.env.DAILY_API_KEY;
      if (!apiKey) return c.json({ received: true });

      // Use waitUntil so the upload runs after we return 200 to Daily
      c.executionCtx.waitUntil((async () => {
        try {
          // Get a temporary download link
          const linkRes = await fetch(
            `https://api.daily.co/v1/recordings/${recording_id}/access-link`,
            { headers: { 'Authorization': `Bearer ${apiKey}` } }
          );
          if (!linkRes.ok) {
            console.error('[Daily Webhook] access-link failed:', await linkRes.text());
            if (testRoom) {
              await c.env.DB.prepare(
                "UPDATE DailyTestRoom SET recordingStatus = 'error' WHERE id = ?"
              ).bind(testRoom.id).run();
            }
            if (liveStream) {
              await c.env.DB.prepare(
                "UPDATE LiveStream SET status = 'recording_failed', endedAt = ? WHERE id = ?"
              ).bind(new Date().toISOString(), liveStream.id).run();
            }
            return;
          }

          const { download_link } = await linkRes.json() as { download_link: string };

          // Pull recording into Bunny
          const streamTitle = liveStream
            ? (await c.env.DB.prepare('SELECT title FROM LiveStream WHERE id = ?').bind(liveStream.id).first<{ title: string }>())?.title || room_name
            : room_name;

          // Get or create the academy's Bunny collection
          let bunnyCollectionId: string | undefined;
          if (liveStream) {
            try {
              const academyRow = await c.env.DB
                .prepare('SELECT a.name FROM Academy a JOIN Class c ON c.academyId = a.id JOIN LiveStream ls ON ls.classId = c.id WHERE ls.dailyRoomName = ?')
                .bind(room_name)
                .first() as any;
              if (academyRow?.name) {
                const colsRes = await fetch(
                  `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/collections?itemsPerPage=100`,
                  { headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY } }
                );
                if (colsRes.ok) {
                  const colsData = await colsRes.json() as any;
                  const existingCol = (colsData.items || []).find((col: any) => col.name === academyRow.name);
                  if (existingCol) {
                    bunnyCollectionId = existingCol.guid;
                  } else {
                    const createColRes = await fetch(
                      `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/collections`,
                      {
                        method: 'POST',
                        headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: academyRow.name }),
                      }
                    );
                    if (createColRes.ok) {
                      const createColData = await createColRes.json() as any;
                      bunnyCollectionId = createColData.guid;
                    }
                  }
                }
              }
            } catch (colErr: any) {
              console.error('[Daily Webhook] Failed to get/create Bunny collection:', colErr.message);
            }
          }

          const bunnyRes = await fetch(
            `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/fetch`,
            {
              method: 'POST',
              headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: download_link,
                title: streamTitle,
              }),
            }
          );
          if (!bunnyRes.ok) {
            console.error('[Daily Webhook] Bunny fetch failed:', await bunnyRes.text());
            if (testRoom) {
              await c.env.DB.prepare(
                "UPDATE DailyTestRoom SET recordingStatus = 'error' WHERE id = ?"
              ).bind(testRoom.id).run();
            }
            if (liveStream) {
              await c.env.DB.prepare(
                "UPDATE LiveStream SET status = 'recording_failed', endedAt = ? WHERE id = ?"
              ).bind(new Date().toISOString(), liveStream.id).run();
            }
            return;
          }

          const bunnyData = await bunnyRes.json() as any;
          const videoGuid: string = bunnyData.guid || bunnyData.videoGuid || bunnyData.id;
          if (videoGuid) {
            // Assign academy collection via POST (videos/fetch doesn't support collectionId)
            if (bunnyCollectionId) {
              try {
                await fetch(
                  `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/${videoGuid}`,
                  {
                    method: 'POST',
                    headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ collectionId: bunnyCollectionId }),
                  }
                );
              } catch (patchErr: any) {
                console.error('[Daily Webhook] Failed to set Bunny collection on video:', patchErr.message);
              }
            }
            if (testRoom) {
              await c.env.DB.prepare(
                "UPDATE DailyTestRoom SET recordingId = ?, recordingStatus = 'ready' WHERE id = ?"
              ).bind(videoGuid, testRoom.id).run();
            }
            if (liveStream) {
              await c.env.DB.prepare(
                "UPDATE LiveStream SET recordingId = ?, status = 'ended', endedAt = ? WHERE id = ?"
              ).bind(videoGuid, new Date().toISOString(), liveStream.id).run();
            }
            console.log(`[Daily Webhook] Ready: Bunny GUID ${videoGuid}, room ${room_name}`);
          } else {
            console.error('[Daily Webhook] No GUID in Bunny response:', JSON.stringify(bunnyData));
            if (testRoom) {
              await c.env.DB.prepare(
                "UPDATE DailyTestRoom SET recordingStatus = 'error' WHERE id = ?"
              ).bind(testRoom.id).run();
            }
          }
        } catch (err: any) {
          console.error('[Daily Webhook] Upload error:', err.message);
          if (testRoom) {
            await c.env.DB.prepare(
              "UPDATE DailyTestRoom SET recordingStatus = 'error' WHERE id = ?"
            ).bind(testRoom.id).run();
          }
        }
      })());
    }

    return c.json({ received: true });
  } catch (error: any) {
    console.error('[Daily Webhook] Error:', error);
    return c.json({ received: true });
  }
});

export default webhooks;
