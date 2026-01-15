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
      const meetingId = data.object.id;
      console.log('[Zoom Webhook] Recording completed for meeting:', meetingId);
      console.log('[Zoom Webhook] Full payload:', JSON.stringify(data, null, 2));
      
      // Find the livestream
      const stream = await c.env.DB
        .prepare('SELECT * FROM LiveStream WHERE zoomMeetingId = ?')
        .bind(meetingId.toString())
        .first() as any;

      if (stream) {
        console.log('[Zoom Webhook] Found stream:', stream.id, 'Title:', stream.title);
        
        // Zoom has uploaded to Bunny - we need to find which Bunny video matches this stream
        // We'll poll Bunny API to find videos with matching title
        try {
          const bunnyResponse = await fetch(
            `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos?page=1&itemsPerPage=100&orderBy=date`,
            {
              headers: {
                'AccessKey': c.env.BUNNY_STREAM_API_KEY,
              },
            }
          );

          if (bunnyResponse.ok) {
            const bunnyData = await bunnyResponse.json() as any;
            const videos = bunnyData.items || [];
            
            console.log('[Zoom Webhook] Found', videos.length, 'videos in Bunny library');
            console.log('[Zoom Webhook] Looking for title:', stream.title);
            
            // Try to match by title (case-insensitive)
            const streamTitle = (stream.title || '').toLowerCase().trim();
            let matchedVideo = videos.find((v: any) => 
              v.title && v.title.toLowerCase().trim() === streamTitle
            );
            
            // If exact match fails, try fuzzy matching (contains)
            if (!matchedVideo) {
              console.log('[Zoom Webhook] Exact match failed, trying fuzzy match');
              matchedVideo = videos.find((v: any) => 
                v.title && (
                  v.title.toLowerCase().includes(streamTitle) ||
                  streamTitle.includes(v.title.toLowerCase())
                )
              );
            }

            if (matchedVideo) {
              console.log('[Zoom Webhook] Matched Bunny video:', matchedVideo.guid, 'Title:', matchedVideo.title);
              
              // Update stream with recordingId
              await c.env.DB
                .prepare('UPDATE LiveStream SET recordingId = ? WHERE id = ?')
                .bind(matchedVideo.guid, stream.id)
                .run();
                
              console.log('[Zoom Webhook] Updated stream', stream.id, 'with recordingId:', matchedVideo.guid);
            } else {
              console.log('[Zoom Webhook] No matching Bunny video found for title:', stream.title);
              console.log('[Zoom Webhook] Available video titles (first 10):', videos.map((v: any) => v.title).slice(0, 10));
            }
          } else {
            console.error('[Zoom Webhook] Bunny API returned error:', bunnyResponse.status);
          }
        } catch (bunnyError: any) {
          console.error('[Zoom Webhook] Error fetching Bunny videos:', bunnyError.message);
        }
      } else {
        console.log('[Zoom Webhook] No stream found for meetingId:', meetingId);
      }
    } else if (event === 'meeting.participant_joined' || event === 'meeting.participant_left') {
      const meetingId = data.object.id;
      const participantCount = data.object.participant_count || 0;

      // Update participant count
      await c.env.DB
        .prepare('UPDATE LiveStream SET participantCount = ?, participantsFetchedAt = ? WHERE zoomMeetingId = ?')
        .bind(participantCount, new Date().toISOString(), meetingId.toString())
        .run();

      console.log('[Zoom Webhook] Participant update:', meetingId, participantCount);
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

export default webhooks;
