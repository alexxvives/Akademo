import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { liveStreamQueries } from '@/lib/db';
import { deleteRoom, getRecordings, getRecordingAccessLink } from '@/lib/daily';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// GET /api/stream/[id] - Get stream details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const stream = await liveStreamQueries.findById(id);

    if (!stream) {
      return errorResponse('Stream not found', 404);
    }

    return NextResponse.json({ success: true, data: stream });
  } catch (error) {
    console.error('Get stream error:', error);
    return errorResponse('Failed to get stream', 500);
  }
}

// PATCH /api/stream/[id] - Update stream status (start/end)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'TEACHER') {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'start' | 'end'

    const stream = await liveStreamQueries.findById(id) as any;
    if (!stream) {
      return errorResponse('Stream not found', 404);
    }

    if (stream.teacherId !== session.id) {
      return errorResponse('You do not own this stream', 403);
    }

    if (action === 'start') {
      if (stream.status !== 'PENDING') {
        return errorResponse('Stream already started or ended');
      }
      const updated = await liveStreamQueries.updateStatus(id, 'LIVE');
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'end') {
      if (stream.status === 'ENDED') {
        return errorResponse('Stream already ended');
      }
      
      // End the stream
      await liveStreamQueries.updateStatus(id, 'ENDED');
      
      // Get recording info from Daily.co
      let recordingData = null;
      try {
        const recordings = await getRecordings(stream.roomName);
        if (recordings.length > 0) {
          const latestRecording = recordings[recordings.length - 1];
          await liveStreamQueries.setRecordingId(id, latestRecording.id);
          
          // Get download link
          const downloadLink = await getRecordingAccessLink(latestRecording.id);
          recordingData = {
            recordingId: latestRecording.id,
            duration: latestRecording.duration,
            downloadLink,
          };
        }
      } catch (e) {
        console.error('Error getting recording:', e);
      }

      // Delete the Daily.co room (optional - rooms auto-expire)
      try {
        await deleteRoom(stream.roomName);
      } catch (e) {
        console.error('Error deleting room:', e);
      }

      const updated = await liveStreamQueries.findById(id);
      return NextResponse.json({
        success: true,
        data: updated,
        recording: recordingData,
      });
    }

    return errorResponse('Invalid action. Use "start" or "end"');
  } catch (error) {
    console.error('Update stream error:', error);
    return errorResponse('Failed to update stream', 500);
  }
}

// DELETE /api/stream/[id] - Delete stream (cancel before starting)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'TEACHER') {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const stream = await liveStreamQueries.findById(id) as any;

    if (!stream) {
      return errorResponse('Stream not found', 404);
    }

    if (stream.teacherId !== session.id) {
      return errorResponse('You do not own this stream', 403);
    }

    // Delete Daily.co room
    try {
      await deleteRoom(stream.roomName);
    } catch (e) {
      console.error('Error deleting room:', e);
    }

    await liveStreamQueries.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete stream error:', error);
    return errorResponse('Failed to delete stream', 500);
  }
}
