import { lessonQueries, videoQueries, documentQueries, uploadQueries, classQueries, getDB } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

// Create lesson with pre-uploaded files (via multipart upload or Bunny Stream)
export async function POST(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const body = await request.json();

    const {
      title,
      description,
      classId,
      releaseDate,
      maxWatchTimeMultiplier = 2.0,
      watermarkIntervalMins = 5,
      videos = [],
      documents = [],
    } = body;

    if (!classId) {
      return errorResponse('Class ID is required');
    }

    // Verify teacher has access to this class
    if (session.role === 'TEACHER') {
      const db = await getDB();
      const classData = await db
        .prepare('SELECT teacherId FROM Class WHERE id = ?')
        .bind(classId)
        .first() as any;
      
      if (!classData) {
        return errorResponse('Class not found', 404);
      }
      
      if (classData.teacherId !== session.id) {
        return errorResponse('Not authorized to add lessons to this class', 403);
      }
    }

    // Create the lesson
    const lesson = await lessonQueries.create({
      title: title || new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
      description: description || undefined,
      classId,
      releaseDate: releaseDate || new Date().toISOString(),
      maxWatchTimeMultiplier,
      watermarkIntervalMins,
    });

    const createdVideos = [];
    const createdDocuments = [];

    // Create video records for pre-uploaded files
    for (const video of videos) {
      let upload;
      
      // Check if video was uploaded to Bunny Stream (has bunnyGuid) or R2 (has storagePath)
      if (video.bunnyGuid) {
        // Bunny Stream video
        upload = await uploadQueries.createBunnyUpload({
          fileName: video.fileName,
          fileSize: video.fileSize,
          mimeType: video.mimeType,
          bunnyGuid: video.bunnyGuid,
          bunnyStatus: video.bunnyStatus || 1, // 1 = uploaded
          uploadedById: session.id,
        });
      } else {
        // R2 video (legacy support)
        upload = await uploadQueries.create({
          fileName: video.fileName,
          fileSize: video.fileSize,
          mimeType: video.mimeType,
          storagePath: video.storagePath,
          uploadedById: session.id,
        });
      }
      
      const videoRecord = await videoQueries.create({
        title: video.title || video.fileName,
        description: video.description || undefined,
        lessonId: lesson.id,
        uploadId: upload.id,
        durationSeconds: video.durationSeconds || undefined,
      });
      
      createdVideos.push({ ...videoRecord, upload });
    }

    // Create document records for pre-uploaded files (always R2)
    for (const doc of documents) {
      const upload = await uploadQueries.create({
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        storagePath: doc.storagePath, // Always R2 for documents
        uploadedById: session.id,
      });
      
      const documentRecord = await documentQueries.create({
        title: doc.title || doc.fileName,
        description: doc.description || undefined,
        lessonId: lesson.id,
        uploadId: upload.id,
      });
      
      createdDocuments.push({ ...documentRecord, upload });
    }

    // Calculate if any video is still transcoding (bunnyStatus < 4)
    const isTranscoding = createdVideos.some((v: any) => 
      v.upload.storageType === 'bunny' && (v.upload.bunnyStatus == null || v.upload.bunnyStatus < 4)
    ) ? 1 : 0;

    return Response.json(successResponse({
      ...lesson,
      videos: createdVideos,
      documents: createdDocuments,
      videoCount: createdVideos.length,
      documentCount: createdDocuments.length,
      isTranscoding,
    }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
