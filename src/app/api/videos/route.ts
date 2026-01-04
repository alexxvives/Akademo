import { videoQueries, uploadQueries, enrollmentQueries } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { getStorageAdapter } from '@/lib/storage';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const lessonId = formData.get('lessonId') as string;
    const durationSeconds = formData.get('durationSeconds') as string;

    if (!file || !title || !lessonId) {
      return errorResponse('Missing required fields');
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return errorResponse('Only video files are allowed');
    }

    // Validate file size (500MB limit for video uploads)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return errorResponse('File size exceeds 500MB limit');
    }

    // Upload file
    const storage = await getStorageAdapter();
    const storagePath = await storage.upload(file, 'videos');

    // Create upload record
    const upload = await uploadQueries.create({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storagePath,
      uploadedById: session.id,
    });

    // Create video record
    const video = await videoQueries.create({
      title,
      lessonId,
      uploadId: upload.id,
      durationSeconds: durationSeconds ? parseFloat(durationSeconds) : undefined,
    });

    return Response.json(successResponse({ ...video, upload }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'STUDENT']);
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return errorResponse('Class ID required');
    }

    // Check access
    if (session.role === 'STUDENT') {
      const enrollment = await enrollmentQueries.findByClassAndStudent(classId, session.id);

      if (!enrollment) {
        return errorResponse('Not enrolled in this class', 403);
      }
    }

    const videos = await videoQueries.findByClass(classId);

    // If student, include their play state for each video
    let videosWithPlayState = videos;
    if (session.role === 'STUDENT') {
      const { playStateQueries } = await import('@/lib/db');
      videosWithPlayState = await Promise.all(
        videos.map(async (video: any) => {
          const playState = await playStateQueries.findByVideoAndStudent(video.id, session.id);
          return {
            ...video,
            playStates: playState ? [playState] : [],
          };
        })
      );
    }

    return Response.json(successResponse(videosWithPlayState));
  } catch (error) {
    return handleApiError(error);
  }
}
