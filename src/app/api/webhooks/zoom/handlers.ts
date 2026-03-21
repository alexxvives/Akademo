import type { WebhookEnv, ZoomRecordingFile, ZoomMeetingData } from './types';

type DB = WebhookEnv['DB'];

export async function handleMeetingStarted(db: DB, data: ZoomMeetingData): Promise<void> {
  const meetingId = data.object.id;

  await db
    .prepare('UPDATE LiveStream SET status = ?, startedAt = ? WHERE zoomMeetingId = ?')
    .bind('active', new Date().toISOString(), meetingId.toString())
    .run();
}

export async function handleMeetingEnded(db: DB, env: WebhookEnv, data: ZoomMeetingData): Promise<void> {
  const meetingId = data.object.id;

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

  // Try to fetch participants via Zoom API as fallback
  if (participantCount === null || participantCount === 0) {
    try {
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
          }
        }
      }
    } catch (apiError: unknown) {
      console.error('[Zoom Webhook] Failed to fetch participants via API:', apiError instanceof Error ? apiError.message : String(apiError));
    }
  }
}

export async function handleRecordingCompleted(db: DB, env: WebhookEnv, data: ZoomMeetingData): Promise<void> {
  const meetingId = data.object.id;
  const meetingTopic = data.object.topic || 'Zoom Recording';
  const recordingFiles = data.object.recording_files || [];
  const downloadToken = data.download_token;

  // Find MP4 recording (shared_screen_with_speaker_view or speaker_view preferred)
  const mp4Recording = recordingFiles.find((f: ZoomRecordingFile) =>
    f.file_type === 'MP4' && f.recording_type === 'shared_screen_with_speaker_view'
  ) || recordingFiles.find((f: ZoomRecordingFile) =>
    f.file_type === 'MP4' && f.recording_type === 'speaker_view'
  ) || recordingFiles.find((f: ZoomRecordingFile) =>
    f.file_type === 'MP4'
  );

  if (!mp4Recording) return;

  let downloadUrl = mp4Recording.download_url;

  // Add download token if provided (required for authenticated access)
  if (downloadToken && downloadUrl) {
    downloadUrl = `${downloadUrl}?access_token=${downloadToken}`;
  }

  // Get Zoom access token to fetch the recording with proper auth
  const ZOOM_ACCOUNT_ID = env.ZOOM_ACCOUNT_ID;
  const ZOOM_CLIENT_ID = env.ZOOM_CLIENT_ID;
  const ZOOM_CLIENT_SECRET = env.ZOOM_CLIENT_SECRET;
  const BUNNY_LIBRARY_ID = env.BUNNY_STREAM_LIBRARY_ID || '571240';
  // Try both possible env var names for Bunny API key
  const BUNNY_API_KEY = env.BUNNY_STREAM_API_KEY || env.BUNNY_STREAM_LIVE_API_KEY;

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
          const apiMp4 = apiRecordingFiles.find((f: ZoomRecordingFile) => f.file_type === 'MP4');

          if (apiMp4 && apiMp4.download_url) {
            // Use download_access_token if available (preferred), otherwise use OAuth token
            authToken = recordingData.download_access_token || accessToken;
            downloadUrl = `${apiMp4.download_url}?access_token=${authToken}`;
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

    if (bunnyResponse.ok) {
      const bunnyData = JSON.parse(bunnyResponseText);
      const bunnyGuid = bunnyData.guid || bunnyData.id;

      if (bunnyGuid) {
        // Update LiveStream with Bunny recording ID
        await db
          .prepare('UPDATE LiveStream SET recordingId = ? WHERE zoomMeetingId = ?')
          .bind(bunnyGuid, meetingId.toString())
          .run();
      } else {
        console.error('[Zoom Webhook] Bunny response missing guid/id:', bunnyResponseText);
      }
    } else {
      console.error('[Zoom Webhook] Bunny fetch failed:', bunnyResponseText);
    }
  } catch (bunnyError: unknown) {
    console.error('[Zoom Webhook] Recording upload error:', bunnyError instanceof Error ? bunnyError.message : String(bunnyError));
  }
}

export async function handleParticipantEvent(db: DB, data: ZoomMeetingData): Promise<void> {
  const meetingId = data.object.id;
  const participantCount = data.object.participant?.count || data.object.participant_count || 0;

  await db
    .prepare('UPDATE LiveStream SET participantCount = ?, participantsFetchedAt = ? WHERE zoomMeetingId = ?')
    .bind(participantCount, new Date().toISOString(), meetingId.toString())
    .run();
}
