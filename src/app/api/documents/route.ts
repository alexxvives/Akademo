import { documentQueries, uploadQueries, enrollmentQueries } from '@/lib/db';
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

    if (!file || !title || !lessonId) {
      return errorResponse('Missing required fields');
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('document')) {
      return errorResponse('Only PDF and document files are allowed');
    }

    // Upload file
    const storage = await getStorageAdapter();
    const storagePath = await storage.upload(file, 'documents');

    // Create upload record
    const upload = await uploadQueries.create({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storagePath,
      uploadedById: session.id,
    });

    // Create document record
    const document = await documentQueries.create({
      title,
      lessonId,
      uploadId: upload.id,
    });

    return Response.json(successResponse({ ...document, upload }), { status: 201 });
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

    const documents = await documentQueries.findByClass(classId);

    return Response.json(successResponse(documents));
  } catch (error) {
    return handleApiError(error);
  }
}
