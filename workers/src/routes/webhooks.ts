import { Hono } from 'hono';
import { Bindings } from '../types';
import { successResponse, errorResponse } from '../lib/utils';

const webhooks = new Hono<{ Bindings: Bindings }>();

// POST /webhooks/zoom - Zoom webhook handler
webhooks.post('/zoom', async (c) => {
  try {
    const payload = await c.req.json();

    console.log('[Zoom Webhook] Received:', payload.event);

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
      const recordingFiles = data.payload.object.recording_files || [];

      // Find MP4 recording
      const mp4Recording = recordingFiles.find((f: any) => f.file_type === 'MP4');

      if (mp4Recording) {
        // Update livestream with recording URL
        await c.env.DB
          .prepare('UPDATE LiveStream SET recordingUrl = ? WHERE zoomMeetingId = ?')
          .bind(mp4Recording.download_url, meetingId.toString())
          .run();

        console.log('[Zoom Webhook] Recording ready:', meetingId);
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

export default webhooks;
