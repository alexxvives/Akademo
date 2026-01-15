import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Zoom webhook handler
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    console.log('[Zoom Webhook] Received:', payload.event);
    
    const ctx = await getCloudflareContext();
    const env = ctx.env as any;
    const db = env.DB;
    
    // Handle Zoom URL validation (required for webhook setup)
    if (payload.event === 'endpoint.url_validation') {
      const plainToken = payload.payload.plainToken;
      const secretToken = process.env.ZOOM_WEBHOOK_SECRET || env.ZOOM_WEBHOOK_SECRET || '';
      
      console.log('[Zoom Webhook] URL validation request received');
      console.log('[Zoom Webhook] plainToken:', plainToken);
      console.log('[Zoom Webhook] secretToken configured:', !!secretToken);
      
      // Use Web Crypto API
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
      
      console.log('[Zoom Webhook] encryptedToken generated:', hashForValidate);
      
      const response = {
        plainToken: plainToken,
        encryptedToken: hashForValidate
      };
      
      console.log('[Zoom Webhook] Sending validation response:', response);
      return NextResponse.json(response, { status: 200 });
    }

    const { event, payload: data } = payload;
    
    // Log full payload for debugging
    console.log('[Zoom Webhook] Full payload:', JSON.stringify(payload, null, 2));

    // Handle different Zoom events
    if (event === 'meeting.started') {
      const meetingId = data.object.id;

      await db
        .prepare('UPDATE LiveStream SET status = ?, startedAt = ? WHERE zoomMeetingId = ?')
        .bind('active', new Date().toISOString(), meetingId.toString())
        .run();

      console.log('[Zoom Webhook] Meeting started:', meetingId);
    } else if (event === 'meeting.ended') {
      const meetingId = data.object.id;
      
      // Log all possible participant count locations
      console.log('[Zoom Webhook] meeting.ended data.object keys:', Object.keys(data.object || {}));
      
      // Try multiple possible locations for participant count
      const participantCount = 
        data.object.participant_count || 
        data.object.participants_count ||
        data.object.total_participants ||
        data.object.participants?.length ||
        null;

      await db
        .prepare('UPDATE LiveStream SET status = ?, endedAt = ?, participantCount = ?, participantsFetchedAt = ? WHERE zoomMeetingId = ?')
        .bind('ended', new Date().toISOString(), participantCount, new Date().toISOString(), meetingId.toString())
        .run();

      console.log('[Zoom Webhook] Meeting ended:', meetingId, 'participants:', participantCount);
      
      // Try to fetch participants via Zoom API as fallback
      if (participantCount === null || participantCount === 0) {
        try {
          // Get Zoom access token
          const ZOOM_ACCOUNT_ID = env.ZOOM_ACCOUNT_ID;
          const ZOOM_CLIENT_ID = env.ZOOM_CLIENT_ID;
          const ZOOM_CLIENT_SECRET = env.ZOOM_CLIENT_SECRET;
          
          if (ZOOM_ACCOUNT_ID && ZOOM_CLIENT_ID && ZOOM_CLIENT_SECRET) {
            const tokenResponse = await fetch(
              `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`)}`,
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              }
            );
            
            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json();
              const accessToken = tokenData.access_token;
              
              // Fetch past meeting participants
              const participantsResponse = await fetch(
                `https://api.zoom.us/v2/past_meetings/${meetingId}/participants`,
                {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                }
              );
              
              if (participantsResponse.ok) {
                const participantsData = await participantsResponse.json();
                const apiParticipantCount = participantsData.total_records || participantsData.participants?.length || 0;
                
                await db
                  .prepare('UPDATE LiveStream SET participantCount = ?, participantsFetchedAt = ? WHERE zoomMeetingId = ?')
                  .bind(apiParticipantCount, new Date().toISOString(), meetingId.toString())
                  .run();
                
                console.log('[Zoom Webhook] Fetched participants via API:', apiParticipantCount);
              }
            }
          }
        } catch (apiError: any) {
          console.error('[Zoom Webhook] Failed to fetch participants via API:', apiError.message);
        }
      }
    } else if (event === 'recording.completed') {
      const meetingId = data.object.id;
      const meetingTopic = data.object.topic || 'Zoom Recording';
      const recordingFiles = data.object?.recording_files || [];
      const downloadToken = data.download_token; // Zoom provides this for authenticated download

      console.log('[Zoom Webhook] Recording completed for meeting:', meetingId, 'files:', recordingFiles.length);
      console.log('[Zoom Webhook] Download token present:', !!downloadToken);

      // Find MP4 recording (shared_screen_with_speaker_view or speaker_view preferred)
      const mp4Recording = recordingFiles.find((f: any) => 
        f.file_type === 'MP4' && f.recording_type === 'shared_screen_with_speaker_view'
      ) || recordingFiles.find((f: any) => 
        f.file_type === 'MP4' && f.recording_type === 'speaker_view'
      ) || recordingFiles.find((f: any) => 
        f.file_type === 'MP4'
      );

      if (mp4Recording) {
        let downloadUrl = mp4Recording.download_url;
        
        // Add download token if provided (required for authenticated access)
        if (downloadToken) {
          downloadUrl = `${downloadUrl}?access_token=${downloadToken}`;
        }
        
        console.log('[Zoom Webhook] Found MP4 recording:', mp4Recording.recording_type);
        console.log('[Zoom Webhook] Download URL (with token):', downloadUrl.substring(0, 100) + '...');

        // Get Zoom access token to fetch the recording with proper auth
        const ZOOM_ACCOUNT_ID = env.ZOOM_ACCOUNT_ID;
        const ZOOM_CLIENT_ID = env.ZOOM_CLIENT_ID;
        const ZOOM_CLIENT_SECRET = env.ZOOM_CLIENT_SECRET;
        const BUNNY_LIBRARY_ID = env.BUNNY_STREAM_LIBRARY_ID || '571240';
        // Try both possible env var names for Bunny API key
        const BUNNY_API_KEY = env.BUNNY_STREAM_API_KEY || env.BUNNY_STREAM_LIVE_API_KEY;
        
        console.log('[Zoom Webhook] Config check - BUNNY_LIBRARY_ID:', BUNNY_LIBRARY_ID, 'BUNNY_API_KEY present:', !!BUNNY_API_KEY, 'key length:', BUNNY_API_KEY?.length);
        
        // Track the token we'll use for Bunny headers
        let authToken = downloadToken; // Start with webhook-provided token

        try {
          // First, try to get the recording download URL with OAuth token
          if (ZOOM_ACCOUNT_ID && ZOOM_CLIENT_ID && ZOOM_CLIENT_SECRET) {
            const tokenResponse = await fetch(
              `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`)}`,
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              }
            );
            
            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json();
              const accessToken = tokenData.access_token;
              
              // Get recording details with download_access_token
              const recordingResponse = await fetch(
                `https://api.zoom.us/v2/meetings/${meetingId}/recordings?include_fields=download_access_token`,
                {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                }
              );
              
              if (recordingResponse.ok) {
                const recordingData = await recordingResponse.json();
                const apiRecordingFiles = recordingData.recording_files || [];
                
                // Find MP4 in API response (has fresh download URL)
                const apiMp4 = apiRecordingFiles.find((f: any) => f.file_type === 'MP4');
                
                if (apiMp4 && apiMp4.download_url) {
                  // Use download_access_token if available (preferred), otherwise use OAuth token
                  authToken = recordingData.download_access_token || accessToken;
                  downloadUrl = `${apiMp4.download_url}?access_token=${authToken}`;
                  console.log('[Zoom Webhook] Got fresh download URL from API, using download_access_token:', !!recordingData.download_access_token);
                }
              }
            }
          }

          // Create video in Bunny via fetch URL with auth headers
          const bunnyResponse = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/fetch`, {
            method: 'POST',
            headers: {
              'AccessKey': BUNNY_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              url: downloadUrl,
              title: `${meetingTopic} - Recording`,
              headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : undefined
            })
          });

          const bunnyResponseText = await bunnyResponse.text();
          console.log('[Zoom Webhook] Bunny response:', bunnyResponse.status, bunnyResponseText);

          if (bunnyResponse.ok) {
            const bunnyData = JSON.parse(bunnyResponseText);
            const bunnyGuid = bunnyData.guid || bunnyData.id;

            if (bunnyGuid) {
              // Update LiveStream with Bunny recording ID
              await db
                .prepare('UPDATE LiveStream SET recordingId = ? WHERE zoomMeetingId = ?')
                .bind(bunnyGuid, meetingId.toString())
                .run();

              console.log('[Zoom Webhook] Recording queued in Bunny:', bunnyGuid);
            } else {
              console.error('[Zoom Webhook] Bunny response missing guid/id:', bunnyResponseText);
            }
          } else {
            console.error('[Zoom Webhook] Bunny fetch failed:', bunnyResponseText);
          }
        } catch (bunnyError: any) {
          console.error('[Zoom Webhook] Recording upload error:', bunnyError.message);
        }
      } else {
        console.log('[Zoom Webhook] No MP4 recording found in', recordingFiles.length, 'files');
        console.log('[Zoom Webhook] Available file types:', recordingFiles.map((f: any) => f.file_type).join(', '));
      }
    } else if (event === 'meeting.participant_joined' || event === 'meeting.participant_left' || event === 'participant.joined' || event === 'participant.left') {
      const meetingId = data.object.id;
      const participantCount = data.object.participant?.count || data.object.participant_count || 0;

      await db
        .prepare('UPDATE LiveStream SET participantCount = ?, participantsFetchedAt = ? WHERE zoomMeetingId = ?')
        .bind(participantCount, new Date().toISOString(), meetingId.toString())
        .run();

      console.log('[Zoom Webhook] Participant update:', meetingId, participantCount);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error('[Zoom Webhook] Error:', error);
    // Return 200 even on error to avoid Zoom retries
    return NextResponse.json({ success: true, received: true, error: error.message });
  }
}

// Also handle GET for webhook validation test
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: 'zoom-webhook',
    message: 'Zoom webhook endpoint is active' 
  });
}
