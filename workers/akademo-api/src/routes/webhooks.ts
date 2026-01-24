import { Hono } from 'hono';
import { Bindings } from '../types';
import { successResponse, errorResponse } from '../lib/utils';

const webhooks = new Hono<{ Bindings: Bindings }>();

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
      // Zoom provides meeting UUID (encrypted meeting ID) for recordings
      const meetingUuid = data.object.uuid;
      const meetingId = data.object.id;
      console.log('[Zoom Webhook] Recording completed for meeting:', meetingId);
      console.log('[Zoom Webhook] Meeting UUID:', meetingUuid);
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
            .prepare('SELECT ls.*, c.zoomAccountId FROM LiveStream ls JOIN Class c ON ls.classId = c.id WHERE ls.id = ?')
            .bind(stream.id)
            .first() as any;

          if (!streamWithClass?.zoomAccountId) {
            console.error('[Zoom Webhook] No Zoom account assigned to class for stream:', stream.id);
            return;
          }

          // Get Zoom account details
          const zoomAccount = await c.env.DB
            .prepare('SELECT * FROM ZoomAccount WHERE id = ?')
            .bind(streamWithClass.zoomAccountId)
            .first() as any;

          if (!zoomAccount) {
            console.error('[Zoom Webhook] Zoom account not found:', streamWithClass.zoomAccountId);
            return;
          }

          console.log('[Zoom Webhook] Using OAuth token from account:', zoomAccount.accountName);
          const accessToken = zoomAccount.accessToken;

          // Fetch recording details from Zoom API (using OAuth token directly)
          // IMPORTANT: Use UUID (double-encoded for API) instead of numeric meeting ID
          const encodedUuid = encodeURIComponent(encodeURIComponent(meetingUuid));
          console.log('[Zoom Webhook] Fetching recordings from Zoom API with UUID:', encodedUuid);
          const recordingsResponse = await fetch(
            `https://api.zoom.us/v2/meetings/${encodedUuid}/recordings`,
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
          console.log('[Zoom Webhook] Recording files:', recordingsData.recording_files?.length || 0);

          // Find the MP4 recording
          const mp4Recording = recordingsData.recording_files?.find(
            (file: any) => file.file_type === 'MP4' && file.recording_type === 'shared_screen_with_speaker_view'
          );

          if (!mp4Recording) {
            console.log('[Zoom Webhook] No MP4 recording found');
            return;
          }

          const downloadUrl = mp4Recording.download_url;
          console.log('[Zoom Webhook] Download URL:', downloadUrl);

          // Upload to Bunny Stream using /fetch endpoint
          const bunnyFetchResponse = await fetch(
            `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/fetch`,
            {
              method: 'POST',
              headers: {
                'AccessKey': c.env.BUNNY_STREAM_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: `${downloadUrl}?access_token=${accessToken}`,
                title: stream.title || `Recording ${new Date().toLocaleDateString()}`,
              }),
            }
          );

          if (!bunnyFetchResponse.ok) {
            const errorText = await bunnyFetchResponse.text();
            console.error('[Zoom Webhook] Bunny fetch failed:', bunnyFetchResponse.status, errorText);
            return;
          }

          const bunnyData = await bunnyFetchResponse.json() as any;
          const videoGuid = bunnyData.guid;
          console.log('[Zoom Webhook] Bunny video created:', videoGuid);

          // Update stream with recordingId
          await c.env.DB
            .prepare('UPDATE LiveStream SET recordingId = ? WHERE id = ?')
            .bind(videoGuid, stream.id)
            .run();

          console.log('[Zoom Webhook] Updated stream', stream.id, 'with recordingId:', videoGuid);
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
      const participantCount = data.object.participant_count || 0;

      console.log('[Zoom Webhook] Participant event:', event, 'Meeting:', meetingId, 'Count:', participantCount);

      // Update participant count
      const result = await c.env.DB
        .prepare('UPDATE LiveStream SET participantCount = ?, participantsFetchedAt = ? WHERE zoomMeetingId = ?')
        .bind(participantCount, new Date().toISOString(), meetingId.toString())
        .run();

      console.log('[Zoom Webhook] Participant update result:', result.meta?.changes, 'rows affected');
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

    if (event === 'checkout.session.completed') {
      const { id: sessionId, metadata, payment_status } = data;

      if (payment_status === 'paid') {
        const { enrollmentId, classId, userId } = metadata;

        // Update enrollment payment status
        await c.env.DB
          .prepare(`
            UPDATE ClassEnrollment 
            SET paymentStatus = 'PAID',
                paymentMethod = 'stripe',
                updatedAt = datetime('now')
            WHERE id = ?
          `)
          .bind(enrollmentId)
          .run();

        console.log('[Stripe Webhook] Payment confirmed for enrollment:', enrollmentId);
      }
    }

    return c.json(successResponse({ received: true }));
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return c.json(successResponse({ received: true, error: error.message }));
  }
});

export default webhooks;
