import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { getDB } from '@/lib/db';
import { getZoomMeetingParticipants } from '@/lib/zoom';

// GET: Fetch participant data for a specific stream (manual trigger)
export async function GET(request: Request) {
  try {
    console.log('\n========================================');
    console.log('MANUAL PARTICIPANT FETCH REQUEST');
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================================');
    
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('streamId');
    
    console.log('Session user:', session.id);
    console.log('Stream ID:', streamId);

    if (!streamId) {
      return errorResponse('Stream ID required');
    }

    const db = await getDB();
    
    // Get the stream with Zoom meeting ID
    const stream = await db.prepare(`
      SELECT id, zoomMeetingId, title, status, endedAt
      FROM LiveStream
      WHERE id = ?
    `).bind(streamId).first() as {
      id: string;
      zoomMeetingId: string | null;
      title: string;
      status: string;
      endedAt: string | null;
    } | null;

    if (!stream) {
      return errorResponse('Stream not found', 404);
    }

    if (!stream.zoomMeetingId) {
      return errorResponse('Stream has no Zoom meeting ID', 400);
    }

    if (stream.status !== 'ended') {
      return errorResponse('Stream must be ended before fetching participants', 400);
    }

    // Fetch participants from Zoom API
    const participantsData = await getZoomMeetingParticipants(stream.zoomMeetingId);

    if (!participantsData) {
      return errorResponse('No participant data available from Zoom', 404);
    }

    // Calculate unique participant count (deduplicate by user_email or name)
    const uniqueParticipants = new Map<string, any>();
    for (const participant of participantsData.participants) {
      const key = participant.user_email || participant.name;
      if (!uniqueParticipants.has(key)) {
        uniqueParticipants.set(key, participant);
      }
    }

    const participantCount = uniqueParticipants.size;
    const now = new Date().toISOString();

    // Store in database
    await db.prepare(`
      UPDATE LiveStream 
      SET participantCount = ?,
          participantsData = ?,
          participantsFetchedAt = ?
      WHERE id = ?
    `).bind(
      participantCount,
      JSON.stringify({
        totalRecords: participantsData.total_records,
        uniqueCount: participantCount,
        participants: Array.from(uniqueParticipants.values()).map(p => ({
          name: p.name,
          email: p.user_email,
          joinTime: p.join_time,
          leaveTime: p.leave_time,
          duration: p.duration,
        })),
      }),
      now,
      stream.id
    ).run();

    return Response.json(successResponse({
      participantCount,
      totalRecords: participantsData.total_records,
      uniqueCount: participantCount,
      fetchedAt: now,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Automatically fetch participants for ended streams (called by webhook or cron)
export async function POST(request: Request) {
  try {
    // This endpoint can be called by Cloudflare Workers Cron or webhook
    // No auth required for internal cron jobs, but we validate with a secret
    const { streamId, cronSecret } = await request.json();

    // Validate cron secret if provided
    const expectedSecret = process.env.CRON_SECRET || 'your-secret-here';
    if (cronSecret && cronSecret !== expectedSecret) {
      return errorResponse('Invalid cron secret', 401);
    }

    if (!streamId) {
      return errorResponse('Stream ID required');
    }

    const db = await getDB();
    
    // Get the stream with Zoom meeting ID
    const stream = await db.prepare(`
      SELECT id, zoomMeetingId, title, status, endedAt, participantsFetchedAt
      FROM LiveStream
      WHERE id = ?
    `).bind(streamId).first() as {
      id: string;
      zoomMeetingId: string | null;
      title: string;
      status: string;
      endedAt: string | null;
      participantsFetchedAt: string | null;
    } | null;

    if (!stream) {
      return errorResponse('Stream not found', 404);
    }

    if (!stream.zoomMeetingId) {
      console.log('Stream has no Zoom meeting ID, skipping');
      return Response.json(successResponse({ skipped: true, reason: 'no_zoom_meeting_id' }));
    }

    if (stream.status !== 'ended') {
      console.log('Stream not ended yet, skipping');
      return Response.json(successResponse({ skipped: true, reason: 'not_ended' }));
    }

    if (stream.participantsFetchedAt) {
      console.log('Participants already fetched, skipping');
      return Response.json(successResponse({ skipped: true, reason: 'already_fetched' }));
    }

    // Check if stream ended at least 10 minutes ago
    if (stream.endedAt) {
      const endedTime = new Date(stream.endedAt).getTime();
      const now = Date.now();
      const minutesSinceEnd = (now - endedTime) / (1000 * 60);
      
      if (minutesSinceEnd < 10) {
        console.log(`Stream ended only ${minutesSinceEnd.toFixed(1)} minutes ago, waiting...`);
        return Response.json(successResponse({ skipped: true, reason: 'too_soon', minutesSinceEnd }));
      }
    }

    // Fetch participants from Zoom API
    let participantsData;
    try {
      participantsData = await getZoomMeetingParticipants(stream.zoomMeetingId);
    } catch (error: any) {
      console.error('Failed to fetch participants:', error);
      return Response.json(successResponse({ 
        skipped: true, 
        reason: 'zoom_api_error',
        error: error.message 
      }));
    }

    if (!participantsData) {
      console.log('No participant data available from Zoom');
      return Response.json(successResponse({ skipped: true, reason: 'no_data_from_zoom' }));
    }

    // Calculate unique participant count
    const uniqueParticipants = new Map<string, any>();
    for (const participant of participantsData.participants) {
      const key = participant.user_email || participant.name;
      if (!uniqueParticipants.has(key)) {
        uniqueParticipants.set(key, participant);
      }
    }

    const participantCount = uniqueParticipants.size;
    const now = new Date().toISOString();

    // Store in database
    await db.prepare(`
      UPDATE LiveStream 
      SET participantCount = ?,
          participantsData = ?,
          participantsFetchedAt = ?
      WHERE id = ?
    `).bind(
      participantCount,
      JSON.stringify({
        totalRecords: participantsData.total_records,
        uniqueCount: participantCount,
        participants: Array.from(uniqueParticipants.values()).map(p => ({
          name: p.name,
          email: p.user_email,
          joinTime: p.join_time,
          leaveTime: p.leave_time,
          duration: p.duration,
        })),
      }),
      now,
      stream.id
    ).run();

    console.log(`Fetched ${participantCount} participants for stream ${stream.id}`);

    return Response.json(successResponse({
      participantCount,
      totalRecords: participantsData.total_records,
      uniqueCount: participantCount,
      fetchedAt: now,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
