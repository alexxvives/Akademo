import { lessonQueries, membershipQueries, enrollmentQueries, playStateQueries } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'STUDENT']);
    const { id: lessonId } = await params;

    const lesson = await lessonQueries.findWithContent(lessonId);
    
    if (!lesson) {
      return errorResponse('Lesson not found', 404);
    }

    // Check access
    if (session.role === 'STUDENT') {
      const enrollment = await enrollmentQueries.findApprovedByClassAndStudent(lesson.class.id, session.id);
      if (!enrollment) {
        return errorResponse('Not enrolled in this class', 403);
      }
      
      // Add play states for student's videos
      const videosWithPlayState = await Promise.all(
        lesson.videos.map(async (video: any) => {
          const playState = await playStateQueries.findByVideoAndStudent(video.id, session.id);
          return {
            ...video,
            playStates: playState ? [playState] : [],
          };
        })
      );
      lesson.videos = videosWithPlayState;
    } else if (session.role === 'TEACHER') {
      const membership = await membershipQueries.findByUserAndAcademy(session.id, lesson.class.academyId);
      if (!membership || (membership as any).status !== 'APPROVED') {
        return errorResponse('Not authorized to view this lesson', 403);
      }
    }

    return Response.json(successResponse(lesson));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const { id: lessonId } = await params;
    const data = await request.json();

    const lesson = await lessonQueries.findWithContent(lessonId);
    
    if (!lesson) {
      return errorResponse('Lesson not found', 404);
    }

    // Check authorization
    if (session.role === 'TEACHER') {
      const membership = await membershipQueries.findByUserAndAcademy(session.id, lesson.class.academyId);
      if (!membership || (membership as any).status !== 'APPROVED') {
        return errorResponse('Not authorized to edit this lesson', 403);
      }
    }

    const updated = await lessonQueries.update(lessonId, {
      title: data.title,
      description: data.description,
      releaseDate: data.releaseDate,
      maxWatchTimeMultiplier: data.maxWatchTimeMultiplier,
      watermarkIntervalMins: data.watermarkIntervalMins,
    });

    return Response.json(successResponse(updated));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const { id: lessonId } = await params;

    const lesson = await lessonQueries.findWithContent(lessonId);
    
    if (!lesson) {
      return errorResponse('Lesson not found', 404);
    }

    // Check authorization
    if (session.role === 'TEACHER') {
      const membership = await membershipQueries.findByUserAndAcademy(session.id, lesson.class.academyId);
      if (!membership || (membership as any).status !== 'APPROVED') {
        return errorResponse('Not authorized to delete this lesson', 403);
      }
    }

    await lessonQueries.delete(lessonId);

    return Response.json(successResponse({ message: 'Lesson deleted successfully' }));
  } catch (error) {
    return handleApiError(error);
  }
}
