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
    const classId = formData.get('classId') as string;
    const maxWatchTimeMultiplier = formData.get('maxWatchTimeMultiplier') as string;

    if (!file || !title || !classId) {
      return errorResponse('Missing required fields');
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return errorResponse('Only video files are allowed');
    }

    // Validate file size (100MB limit for Cloudflare Workers)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return errorResponse('File size exceeds 100MB limit');
    }

    // Upload file
    const storage = await getStorageAdapter();
    const storagePath = await storage.upload(file, 'videos');

    // Create upload record
    const upload = await uploadQueries.create({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storageType: 'r2',
      storagePath,
      uploadedById: session.id,
    });

    // Create video record
    const video = await videoQueries.create({
      title,
      description: description || undefined,
      classId,
      uploadId: upload.id,
      maxWatchTimeMultiplier: maxWatchTimeMultiplier ? parseFloat(maxWatchTimeMultiplier) : 2.0,
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

    return Response.json(successResponse(videos));
  } catch (error) {
    return handleApiError(error);
  }
}
