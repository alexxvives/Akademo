import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Debug endpoint to check and manually fetch Zoom recordings
// GET: Check if recording exists for a meeting
// POST: Manually trigger recording fetch to Bunny

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('streamId');
    const meetingId = searchParams.get('meetingId');

    const ctx = await getCloudflareContext();
    const env = ctx.env as any;
    const db = env.DB;

    // If streamId provided, look up meeting ID
    let zoomMeetingId = meetingId;
    let stream = null;

    if (streamId) {
      stream = await db
        .prepare('SELECT * FROM LiveStream WHERE id = ?')
        .bind(streamId)
        .first();
      
      if (!stream) {
        return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
      }
      zoomMeetingId = stream.zoomMeetingId;
    }

    if (!zoomMeetingId) {
      return NextResponse.json({ 
        error: 'No meetingId provided',
        usage: 'GET /api/debug/zoom-recording?streamId=xxx or ?meetingId=xxx'
      }, { status: 400 });
    }

    // Get Zoom access token
    const ZOOM_ACCOUNT_ID = env.ZOOM_ACCOUNT_ID;
    const ZOOM_CLIENT_ID = env.ZOOM_CLIENT_ID;
    const ZOOM_CLIENT_SECRET = env.ZOOM_CLIENT_SECRET;

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

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      return NextResponse.json({ error: 'Failed to get Zoom token', details: error }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Check for recordings - include download_access_token for authenticated downloads
    const recordingResponse = await fetch(
      `https://api.zoom.us/v2/meetings/${zoomMeetingId}/recordings?include_fields=download_access_token`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (recordingResponse.status === 404) {
      return NextResponse.json({
        success: true,
        hasRecording: false,
        message: 'No recordings found for this meeting',
        stream: stream ? {
          id: stream.id,
          title: stream.title,
          status: stream.status,
          zoomMeetingId: stream.zoomMeetingId,
          recordingId: stream.recordingId,
          endedAt: stream.endedAt
        } : null,
        possibleReasons: [
          'Recording is still being processed by Zoom (wait 5-30 minutes)',
          'Cloud recording was not enabled for this meeting',
          'Meeting was too short to generate a recording',
          'Recording was deleted from Zoom'
        ]
      });
    }

    if (!recordingResponse.ok) {
      const error = await recordingResponse.text();
      return NextResponse.json({ 
        error: 'Failed to get recordings from Zoom', 
        status: recordingResponse.status,
        details: error 
      }, { status: 500 });
    }

    const recordingData = await recordingResponse.json();

    // Find MP4 files
    const mp4Files = (recordingData.recording_files || []).filter((f: any) => f.file_type === 'MP4');

    return NextResponse.json({
      success: true,
      hasRecording: mp4Files.length > 0,
      stream: stream ? {
        id: stream.id,
        title: stream.title,
        status: stream.status,
        zoomMeetingId: stream.zoomMeetingId,
        recordingId: stream.recordingId,
        endedAt: stream.endedAt
      } : null,
      recording: {
        topic: recordingData.topic,
        duration: recordingData.duration,
        totalSize: recordingData.total_size,
        recordingCount: recordingData.recording_count,
        downloadAccessToken: recordingData.download_access_token ? 'present' : 'missing',
        mp4Files: mp4Files.map((f: any) => ({
          id: f.id,
          recordingType: f.recording_type,
          fileSize: f.file_size,
          status: f.status,
          downloadUrlPreview: f.download_url?.substring(0, 80) + '...'
        })),
        allFileTypes: (recordingData.recording_files || []).map((f: any) => f.file_type)
      },
      canFetch: mp4Files.length > 0 && !stream?.recordingId,
      instruction: mp4Files.length > 0 && !stream?.recordingId 
        ? 'POST to this endpoint to manually fetch recording to Bunny'
        : null
    });

  } catch (error: any) {
    console.error('[Debug Zoom Recording] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('streamId');

    if (!streamId) {
      return NextResponse.json({ 
        error: 'streamId is required for POST',
        usage: 'POST /api/debug/zoom-recording?streamId=xxx'
      }, { status: 400 });
    }

    const ctx = await getCloudflareContext();
    const env = ctx.env as any;
    const db = env.DB;

    const stream = await db
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    if (!stream.zoomMeetingId) {
      return NextResponse.json({ error: 'Stream has no Zoom meeting ID' }, { status: 400 });
    }

    if (stream.recordingId) {
      return NextResponse.json({ 
        error: 'Stream already has a recording',
        recordingId: stream.recordingId
      }, { status: 400 });
    }

    // Get Zoom access token
    const ZOOM_ACCOUNT_ID = env.ZOOM_ACCOUNT_ID;
    const ZOOM_CLIENT_ID = env.ZOOM_CLIENT_ID;
    const ZOOM_CLIENT_SECRET = env.ZOOM_CLIENT_SECRET;
    const BUNNY_LIBRARY_ID = env.BUNNY_STREAM_LIBRARY_ID || '571240';
    // API key is in wrangler.toml vars, not secrets
    const BUNNY_API_KEY = env.BUNNY_STREAM_API_KEY || '93fa73e5-fd14-4d81-b3431ad52c89-f75a-452a';

    if (!BUNNY_API_KEY || BUNNY_API_KEY === 'undefined') {
      return NextResponse.json({ 
        error: 'BUNNY_STREAM_API_KEY not configured',
        envKeys: Object.keys(env).filter(k => k.includes('BUNNY'))
      }, { status: 500 });
    }

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

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      return NextResponse.json({ error: 'Failed to get Zoom token', details: error }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get recordings - include download_access_token for authenticated downloads
    const recordingResponse = await fetch(
      `https://api.zoom.us/v2/meetings/${stream.zoomMeetingId}/recordings?include_fields=download_access_token`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (recordingResponse.status === 404) {
      return NextResponse.json({ 
        error: 'No recordings found',
        message: 'Recording may still be processing or was never created'
      }, { status: 404 });
    }

    if (!recordingResponse.ok) {
      const error = await recordingResponse.text();
      return NextResponse.json({ error: 'Failed to get recordings', details: error }, { status: 500 });
    }

    const recordingData = await recordingResponse.json();

    // Find best MP4 recording
    const recordingFiles = recordingData.recording_files || [];
    const mp4Recording = recordingFiles.find((f: any) => 
      f.file_type === 'MP4' && f.recording_type === 'shared_screen_with_speaker_view'
    ) || recordingFiles.find((f: any) => 
      f.file_type === 'MP4' && f.recording_type === 'speaker_view'
    ) || recordingFiles.find((f: any) => 
      f.file_type === 'MP4'
    );

    if (!mp4Recording) {
      return NextResponse.json({ 
        error: 'No MP4 recording found',
        availableTypes: recordingFiles.map((f: any) => f.file_type)
      }, { status: 404 });
    }

    // Build download URL - prefer download_access_token from Zoom, fallback to OAuth token
    const downloadToken = recordingData.download_access_token || accessToken;
    const downloadUrl = `${mp4Recording.download_url}?access_token=${downloadToken}`;
    const meetingTopic = recordingData.topic || stream.title || 'Zoom Recording';

    console.log('[Debug] Fetching recording to Bunny');
    console.log('[Debug] Topic:', meetingTopic);
    console.log('[Debug] File size:', mp4Recording.file_size);
    console.log('[Debug] Using download_access_token:', !!recordingData.download_access_token);

    // Send to Bunny with headers for authenticated fetch
    const bunnyResponse = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/fetch`, {
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: downloadUrl,
        title: `${meetingTopic} - Recording`,
        headers: {
          'Authorization': `Bearer ${downloadToken}`
        }
      })
    });

    const bunnyResponseText = await bunnyResponse.text();
    console.log('[Debug] Bunny response:', bunnyResponse.status, bunnyResponseText);

    if (!bunnyResponse.ok) {
      return NextResponse.json({
        error: 'Bunny fetch failed',
        status: bunnyResponse.status,
        details: bunnyResponseText
      }, { status: 500 });
    }

    let bunnyData;
    try {
      bunnyData = JSON.parse(bunnyResponseText);
    } catch (parseError) {
      return NextResponse.json({
        error: 'Failed to parse Bunny response',
        rawResponse: bunnyResponseText
      }, { status: 500 });
    }

    const bunnyGuid = bunnyData.guid || bunnyData.id;
    
    if (!bunnyGuid) {
      return NextResponse.json({
        error: 'Bunny did not return a video GUID',
        bunnyResponse: bunnyData
      }, { status: 500 });
    }

    // Update database
    await db
      .prepare('UPDATE LiveStream SET recordingId = ? WHERE id = ?')
      .bind(bunnyGuid, streamId)
      .run();

    return NextResponse.json({
      success: true,
      message: 'Recording fetch initiated',
      recordingId: bunnyGuid,
      streamId: streamId,
      fileSize: mp4Recording.file_size,
      note: 'Bunny is now downloading and transcoding the video. Check Bunny dashboard for progress.'
    });

  } catch (error: any) {
    console.error('[Debug Zoom Recording] POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
