import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { getDB, generateId } from '@/lib/db';
import { getZoomRecordingDownloadUrl, getZoomMeetingParticipants } from '@/lib/zoom';
import { fetchVideoFromUrl } from '@/lib/bunny-stream';
import { getCloudflareContext } from '@/lib/cloudflare';
import * as crypto from 'crypto';

// Zoom Webhook Verification Token (set in Zoom app settings)
function getWebhookSecret(): string {
  const ctx = getCloudflareContext();
  return ctx?.ZOOM_WEBHOOK_SECRET || process.env.ZOOM_WEBHOOK_SECRET || '';
}

// Verify Zoom webhook signature
async function verifyZoomWebhook(request: Request, body: string): Promise<boolean> {
  const secret = getWebhookSecret();
  if (!secret) {
    console.warn('ZOOM_WEBHOOK_SECRET not configured, skipping verification');
    return true; // Skip verification if no secret configured
  }

  const signature = request.headers.get('x-zm-signature');
  const timestamp = request.headers.get('x-zm-request-timestamp');

  if (!signature || !timestamp) {
    console.error('Missing Zoom webhook headers');
    return false;
  }

  // Zoom uses HMAC-SHA256
  const message = `v0:${timestamp}:${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signatureArray = new Uint8Array(signatureBuffer);
  let hex = '';
  for (let i = 0; i < signatureArray.length; i++) {
    hex += signatureArray[i].toString(16).padStart(2, '0');
  }
  const expectedSignature = `v0=${hex}`;

  return signature === expectedSignature;
}

interface ZoomRecordingFile {
  id: string;
  meeting_id: string;
  file_type: string;
  file_size: number;
  play_url: string;
  download_url: string;
  recording_type: string; // 'shared_screen_with_speaker_view', 'active_speaker', etc.
}

interface ZoomWebhookPayload {
  event: string;
  event_ts: number;
  payload: {
    account_id: string;
    object: {
      uuid: string;
      id: number;
      host_id: string;
      host_email: string;
      topic: string;
      start_time: string;
      duration: number;
      recording_files?: ZoomRecordingFile[];
      download_token?: string;
    };
  };
  download_token?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);
    
    console.log('===== ZOOM WEBHOOK RECEIVED =====');
    console.log('Event:', payload.event);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Full payload:', JSON.stringify(payload, null, 2));

    // Handle endpoint URL validation FIRST (before signature check)
    // Zoom validation requests don't have signature headers
    if (payload.event === 'endpoint.url_validation') {
      const plainToken = payload.payload?.plainToken;
      if (plainToken) {
        const secret = getWebhookSecret();
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(plainToken));
        const signatureArray = new Uint8Array(signatureBuffer);
        let encryptedToken = '';
        for (let i = 0; i < signatureArray.length; i++) {
          encryptedToken += signatureArray[i].toString(16).padStart(2, '0');
        }
        console.log('Zoom validation response:', { plainToken, encryptedToken });
        return Response.json({
          plainToken,
          encryptedToken,
        });
      }
    }

    // For other events, verify webhook signature
    const isValid = await verifyZoomWebhook(request, body);
    if (!isValid) {
      console.error('Invalid Zoom webhook signature');
      return errorResponse('Invalid signature', 401);
    }

    // Handle recording completed event
    if (payload.event === 'recording.completed') {
      await handleRecordingCompleted(payload);
    }

    // Handle meeting started event - set stream to active and notify students
    if (payload.event === 'meeting.started') {
      await handleMeetingStarted(payload);
    }

    // Handle meeting ended event - auto-end the stream
    if (payload.event === 'meeting.ended') {
      console.log('\n>>> Handling meeting.ended event');
      await handleMeetingEnded(payload);
      console.log('>>> meeting.ended handler completed\n');
    }

    // Handle recording transcript completed (optional)
    if (payload.event === 'recording.transcript_completed') {
      console.log('Transcript completed for meeting:', payload.payload.object.id);
    }

    return Response.json(successResponse({ received: true }));
  } catch (error) {
    console.error('Zoom webhook error:', error);
    return handleApiError(error);
  }
}

async function handleRecordingCompleted(payload: ZoomWebhookPayload) {
  console.log('\n===== HANDLING RECORDING COMPLETED =====');
  const { object } = payload.payload;
  const meetingId = String(object.id);
  const recordings = object.recording_files || [];
  const downloadToken = payload.download_token || object.download_token;

  console.log('Meeting ID:', meetingId);
  console.log('Topic:', object.topic);
  console.log('Recording files count:', recordings.length);
  console.log('Recording files:', JSON.stringify(recordings.map(r => ({
    type: r.recording_type,
    file_type: r.file_type,
    size: r.file_size
  })), null, 2));
  console.log('Download token present:', !!downloadToken);

  const db = await getDB();

  // Find the LiveStream associated with this Zoom meeting
  const liveStream = await db.prepare(`
    SELECT ls.*, c.name as className, c.teacherId
    FROM LiveStream ls
    JOIN Class c ON ls.classId = c.id
    WHERE ls.zoomMeetingId = ?
  `).bind(meetingId).first() as {
    id: string;
    classId: string;
    teacherId: string;
    title: string;
    className: string;
  } | null;

  if (!liveStream) {
    console.error('❌ ERROR: No LiveStream found for Zoom meeting:', meetingId);
    console.log('This means the meeting was not initiated through the platform');
    return;
  }
  
  console.log('✓ LiveStream found:', {
    id: liveStream.id,
    classId: liveStream.classId,
    teacherId: liveStream.teacherId,
    title: liveStream.title
  });

  // Find the best MP4 recording (prefer shared_screen_with_speaker_view or gallery_view)
  const mp4Recordings = recordings.filter(r => r.file_type === 'MP4');
  
  // Priority: shared_screen_with_speaker_view > gallery_view > active_speaker > any MP4
  const priorityOrder = ['shared_screen_with_speaker_view', 'gallery_view', 'active_speaker'];
  let bestRecording: ZoomRecordingFile | null = null;
  
  for (const type of priorityOrder) {
    bestRecording = mp4Recordings.find(r => r.recording_type === type) || null;
    if (bestRecording) break;
  }
  
  // Fallback to first MP4 if no priority match
  if (!bestRecording && mp4Recordings.length > 0) {
    bestRecording = mp4Recordings[0];
  }

  if (!bestRecording) {
    console.error('❌ ERROR: No MP4 recording found for meeting:', meetingId);
    console.log('Available recordings:', recordings.map(r => `${r.file_type} (${r.recording_type})`));
    console.log('Total recording files:', recordings.length);
    console.log('Full recording data:', JSON.stringify(recordings, null, 2));
    
    // Update stream status to show no recording available
    await db.prepare(`
      UPDATE LiveStream SET status = 'recording_failed', endedAt = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), liveStream.id).run();
    console.log('❌ Stream marked as recording_failed in database');
    return;
  }

  console.log('✓ Best recording selected:', {
    type: bestRecording.recording_type,
    size: bestRecording.file_size,
    id: bestRecording.id
  });

  try {
    // Get authenticated download URL
    console.log('\n--- Getting download URL ---');
    let downloadUrl = bestRecording.download_url;
    if (downloadToken) {
      console.log('Using download token from webhook payload');
      downloadUrl += `?access_token=${downloadToken}`;
    } else {
      console.log('Fetching download URL via Zoom API');
      downloadUrl = await getZoomRecordingDownloadUrl(bestRecording.download_url);
    }
    console.log('Download URL ready (length):', downloadUrl.length);

    // Upload to Bunny Stream from URL
    const videoTitle = 'Stream iniciado';
    
    console.log('\n--- Uploading to Bunny Stream ---');
    console.log('Video title:', videoTitle);
    console.log('Starting upload...');
    
    const bunnyVideo = await fetchVideoFromUrl(downloadUrl, videoTitle);
    
    console.log('✓ Bunny video created successfully!');
    const videoId = bunnyVideo.id || bunnyVideo.guid;
    console.log('Video ID:', videoId);
    console.log('Video details:', JSON.stringify(bunnyVideo, null, 2));

    if (!videoId) {
      throw new Error('Bunny Stream API did not return video ID');
    }

    // Update LiveStream with recording info
    console.log('\n--- Updating database ---');
    await db.prepare(`
      UPDATE LiveStream 
      SET recordingId = ?, status = 'ended', endedAt = ?
      WHERE id = ?
    `).bind(videoId, new Date().toISOString(), liveStream.id).run();
    console.log('✓ LiveStream updated with Bunny Stream ID');

    // Create a notification for the teacher that recording is ready
    const notificationId = generateId();
    await db.prepare(`
      INSERT INTO Notification (id, userId, type, title, message, data, isRead, createdAt)
      VALUES (?, ?, 'recording_ready', ?, ?, ?, 0, ?)
    `).bind(
      notificationId,
      liveStream.teacherId,
      '📹 Grabación lista',
      `La grabación de "${liveStream.title}" está siendo procesada en Bunny Stream.`,
      JSON.stringify({
        liveStreamId: liveStream.id,
        classId: liveStream.classId,
        bunnyGuid: videoId,
      }),
      new Date().toISOString()
    ).run();

    console.log('✓ Recording uploaded and notification created');

    // Automatically fetch participant count after recording is processed
    console.log('\n--- Fetching participants ---');
    try {
      console.log('Meeting ID:', meetingId);
      console.log('Calling getZoomMeetingParticipants...');
      const participantsData = await getZoomMeetingParticipants(meetingId);
      console.log('Participants API response:', participantsData ? 'SUCCESS' : 'NULL');
      
      if (participantsData && participantsData.participants.length > 0) {
        console.log('✓ Received', participantsData.participants.length, 'participant records');
        await db.prepare(`
          UPDATE LiveStream 
          SET participantCount = ?, participantsFetchedAt = ?, participantsData = ?
          WHERE id = ?
        `).bind(
          participantsData.total_records,
          new Date().toISOString(),
          JSON.stringify(participantsData.participants),
          liveStream.id
        ).run();
        
        console.log(`Stored ${participantsData.total_records} participants for stream ${liveStream.id}`);
      } else {
        console.log('⚠️ No participants data available yet for meeting:', meetingId);
        console.log('API returned empty or null data');
      }
    } catch (participantError) {
      console.error('❌ Failed to fetch participants (non-critical):', participantError);
      console.error('Error type:', participantError instanceof Error ? participantError.name : typeof participantError);
      console.error('Error message:', participantError instanceof Error ? participantError.message : String(participantError));
      // Don't fail the whole webhook if participant fetching fails
    }

  } catch (error) {
    console.error('\n❌ RECORDING UPLOAD FAILED ❌');
    console.error('Error type:', error instanceof Error ? error.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Update LiveStream status to indicate recording failed
    await db.prepare(`
      UPDATE LiveStream SET status = 'recording_failed', endedAt = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), liveStream.id).run();
    console.log('Stream status updated to recording_failed');
  }
  
  console.log('===== RECORDING COMPLETED HANDLER FINISHED =====\n');
}

// Handle meeting.started event - set stream to active and notify students
async function handleMeetingStarted(payload: ZoomWebhookPayload) {
  const { object } = payload.payload;
  const meetingId = String(object.id);
  const startTime = new Date().toISOString();

  console.log(`Meeting started: ${meetingId}`);

  const db = await getDB();

  // Find the LiveStream associated with this Zoom meeting
  const liveStream = await db.prepare(`
    SELECT ls.id, ls.classId, ls.title, ls.zoomLink, ls.status,
           c.name as className, u.firstName, u.lastName
    FROM LiveStream ls
    JOIN Class c ON ls.classId = c.id
    JOIN User u ON ls.teacherId = u.id
    WHERE ls.zoomMeetingId = ? AND ls.status = 'scheduled'
  `).bind(meetingId).first() as {
    id: string;
    classId: string;
    title: string;
    zoomLink: string;
    status: string;
    className: string;
    firstName: string;
    lastName: string;
  } | null;

  if (!liveStream) {
    console.log('No scheduled LiveStream found for started meeting:', meetingId);
    return;
  }

  // Update the stream status to active and set startedAt
  await db.prepare(`
    UPDATE LiveStream 
    SET status = 'active', startedAt = ?
    WHERE id = ?
  `).bind(startTime, liveStream.id).run();

  console.log(`Stream ${liveStream.id} marked as active`);

  // Now notify all enrolled students
  try {
    const enrollments = await db.prepare(`
      SELECT ce.userId
      FROM ClassEnrollment ce
      WHERE ce.classId = ? AND ce.status = 'APPROVED'
    `).bind(liveStream.classId).all();

    const students = enrollments.results || [];
    const teacherName = `${liveStream.firstName} ${liveStream.lastName}`;

    for (const student of students as any[]) {
      const notificationId = generateId();
      const notificationData = JSON.stringify({
        classId: liveStream.classId,
        liveStreamId: liveStream.id,
        zoomLink: liveStream.zoomLink,
        className: liveStream.className,
        teacherName,
      });

      await db.prepare(`
        INSERT INTO Notification (id, userId, type, title, message, data, isRead, createdAt)
        VALUES (?, ?, 'live_class', ?, ?, ?, 0, ?)
      `).bind(
        notificationId,
        student.userId,
        `🔴 Clase en vivo: ${liveStream.title}`,
        `${teacherName} ha iniciado una clase en vivo en ${liveStream.className}. ¡Únete ahora!`,
        notificationData,
        startTime
      ).run();
    }

    console.log(`Notified ${students.length} students about live class`);
  } catch (error) {
    console.error('Error notifying students:', error);
    // Don't throw - notifications are not critical
  }
}

// Handle meeting.ended event - automatically end the stream when Zoom meeting ends
async function handleMeetingEnded(payload: ZoomWebhookPayload) {
  const { object } = payload.payload;
  const meetingId = String(object.id);
  const endTime = object.start_time ? new Date().toISOString() : new Date().toISOString();

  console.log(`Meeting ended: ${meetingId}`);

  const db = await getDB();

  // Find the LiveStream associated with this Zoom meeting
  const liveStream = await db.prepare(`
    SELECT ls.id, ls.status, ls.title
    FROM LiveStream ls
    WHERE ls.zoomMeetingId = ? AND ls.status = 'active'
  `).bind(meetingId).first() as { id: string; status: string; title: string } | null;

  if (!liveStream) {
    console.log('No active LiveStream found for ended meeting:', meetingId);
    return;
  }

  // Update the stream status to ended
  // Note: We set status to 'processing' because recording might still be processing
  // The recording.completed webhook will set final status
  await db.prepare(`
    UPDATE LiveStream 
    SET status = 'ended', endedAt = ?
    WHERE id = ?
  `).bind(endTime, liveStream.id).run();

  console.log(`Stream ${liveStream.id} marked as ended`);

  // Schedule participant fetch after 10 minutes (using Cloudflare Workers Durable Objects or external service)
  // For now, we'll use a simple approach: trigger the participant fetch API after 10 minutes
  // In production, you'd use Cloudflare Workers Cron Triggers or Durable Objects
  try {
    // Get the current request URL to construct the API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://akademo-edu.com';
    
    // Schedule a delayed fetch (this is a simplified approach)
    // In production, use Cloudflare Workers Cron Triggers or Queue
    setTimeout(async () => {
      try {
        console.log(`Fetching participants for stream ${liveStream.id} after 10 minutes`);
        await fetch(`${baseUrl}/api/zoom/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId: liveStream.id,
            cronSecret: process.env.CRON_SECRET || 'your-secret-here',
          }),
        });
      } catch (error) {
        console.error('Failed to fetch participants:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes
  } catch (error) {
    console.error('Failed to schedule participant fetch:', error);
  }
}

