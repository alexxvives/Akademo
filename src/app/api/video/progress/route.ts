import { playStateQueries } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { z } from 'zod';

const progressSchema = z.object({
  videoId: z.string(),
  studentId: z.string(),
  currentPositionSeconds: z.number(),
  watchTimeElapsed: z.number(),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = progressSchema.parse(body);

    // Verify student ID matches session
    if (session.role === 'STUDENT' && data.studentId !== session.id) {
      return errorResponse('Unauthorized', 403);
    }

    // Get current play state
    const playState = await playStateQueries.findByVideoAndStudent(data.videoId, data.studentId) as any;

    if (!playState) {
      return errorResponse('Play state not found', 404);
    }

    // Check if already blocked
    if (playState.status === 'BLOCKED') {
      return errorResponse('Video access blocked - watch time limit reached', 403);
    }

    // Update watch time
    const newTotalWatchTime = playState.totalWatchTimeSeconds + data.watchTimeElapsed;

    // Check if need to block (get video to check limit)
    const { videoQueries } = await import('@/lib/db');
    const video = await videoQueries.findById(data.videoId) as any;
    const maxWatchTime = video ? (video.durationSeconds * video.maxWatchTimeMultiplier) : Infinity;
    
    const shouldBlock = newTotalWatchTime >= maxWatchTime;

    const updatedPlayState = await playStateQueries.upsert(data.videoId, data.studentId, {
      totalWatchTimeSeconds: newTotalWatchTime,
      lastPositionSeconds: data.currentPositionSeconds,
      status: shouldBlock ? 'BLOCKED' : 'ACTIVE',
    });

    return Response.json(
      successResponse({
        playState: updatedPlayState,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const studentId = searchParams.get('studentId');

    if (!videoId) {
      return errorResponse('Video ID required');
    }

    const targetStudentId = studentId || session.id;

    // Verify authorization
    if (session.role === 'STUDENT' && targetStudentId !== session.id) {
      return errorResponse('Unauthorized', 403);
    }

    let playState = await playStateQueries.findByVideoAndStudent(videoId, targetStudentId);

    if (!playState) {
      // Create initial play state
      playState = await playStateQueries.upsert(videoId, targetStudentId, {
        totalWatchTimeSeconds: 0,
        lastPositionSeconds: 0,
      });
    }

    return Response.json(
      successResponse({
        playState,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
