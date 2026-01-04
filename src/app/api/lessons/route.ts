import { lessonQueries, videoQueries, documentQueries, uploadQueries, membershipQueries, classQueries, getDB } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { getStorageAdapter } from '@/lib/storage';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { getBunnyVideo } from '@/lib/bunny-stream';

export async function POST(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const formData = await request.formData();

    const title = formData.get('title') as string || new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const description = formData.get('description') as string;
    const classId = formData.get('classId') as string;
    const releaseDate = formData.get('releaseDate') as string || new Date().toISOString();
    const maxWatchTimeMultiplier = parseFloat(formData.get('maxWatchTimeMultiplier') as string) || 2.0;
    const watermarkIntervalMins = parseInt(formData.get('watermarkIntervalMins') as string) || 5;
    
    // Get all video files
    const videoFiles: File[] = [];
    const videoTitles: string[] = [];
    const videoDescriptions: string[] = [];
    const videoDurations: string[] = [];
    
    for (let i = 0; ; i++) {
      const file = formData.get(`video_${i}`) as File;
      if (!file) break;
      videoFiles.push(file);
      videoTitles.push(formData.get(`video_title_${i}`) as string || file.name);
      videoDescriptions.push(formData.get(`video_description_${i}`) as string || '');
      videoDurations.push(formData.get(`video_duration_${i}`) as string || '0');
    }
    
    // Get all document files
    const documentFiles: File[] = [];
    const documentTitles: string[] = [];
    const documentDescriptions: string[] = [];
    
    for (let i = 0; ; i++) {
      const file = formData.get(`document_${i}`) as File;
      if (!file) break;
      documentFiles.push(file);
      documentTitles.push(formData.get(`document_title_${i}`) as string || '');
      documentDescriptions.push(formData.get(`document_description_${i}`) as string || '');
    }

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
      title,
      description: description || undefined,
      classId,
      releaseDate,
      maxWatchTimeMultiplier,
      watermarkIntervalMins,
    });

    const storage = await getStorageAdapter();
    const uploadedVideos = [];
    const uploadedDocuments = [];

    // Upload videos
    for (let i = 0; i < videoFiles.length; i++) {
      const file = videoFiles[i];
      
      // Validate file type
      if (!file.type.startsWith('video/')) {
        continue;
      }
      
      // Validate file size (500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        continue;
      }
      
      const storagePath = await storage.upload(file, 'videos');
      const upload = await uploadQueries.create({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath,
        uploadedById: session.id,
      });
      
      const video = await videoQueries.create({
        title: videoTitles[i] || file.name,
        lessonId: lesson.id,
        uploadId: upload.id,
        durationSeconds: parseFloat(videoDurations[i]) || undefined,
      });
      
      uploadedVideos.push({ ...video, upload });
    }

    // Upload documents
    for (let i = 0; i < documentFiles.length; i++) {
      const file = documentFiles[i];
      
      // Validate file type (PDFs and common document types)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
        continue;
      }
      
      // Validate file size (50MB limit for documents)
      if (file.size > 50 * 1024 * 1024) {
        continue;
      }
      
      const storagePath = await storage.upload(file, 'documents');
      const upload = await uploadQueries.create({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath,
        uploadedById: session.id,
      });
      
      const document = await documentQueries.create({
        title: documentTitles[i] || file.name,
        lessonId: lesson.id,
        uploadId: upload.id,
      });
      
      uploadedDocuments.push({ ...document, upload });
    }

    return Response.json(successResponse({
      ...lesson,
      videos: uploadedVideos,
      documents: uploadedDocuments,
    }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'STUDENT']);
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const checkTranscoding = searchParams.get('checkTranscoding') === 'true';

    if (!classId) {
      return errorResponse('Class ID required');
    }

    // If checkTranscoding is true, update any pending Bunny videos first
    if (checkTranscoding) {
      const db = await getDB();
      // Find all pending Bunny videos in this class
      const pendingVideos = await db.prepare(`
        SELECT u.id as uploadId, u.bunnyGuid
        FROM Upload u
        JOIN Video v ON v.uploadId = u.id
        JOIN Lesson l ON v.lessonId = l.id
        WHERE l.classId = ? AND u.storageType = 'bunny' AND u.bunnyGuid IS NOT NULL AND (u.bunnyStatus IS NULL OR u.bunnyStatus < 4)
      `).bind(classId).all();

      // Check each video's status with Bunny and update DB
      for (const video of (pendingVideos.results || []) as any[]) {
        try {
          const bunnyVideo = await getBunnyVideo(video.bunnyGuid);
          if (bunnyVideo && bunnyVideo.status !== undefined) {
            await uploadQueries.updateBunnyStatusByGuid(video.bunnyGuid, bunnyVideo.status);
            // If finished, also update duration
            if (bunnyVideo.status === 4 && bunnyVideo.length > 0) {
              await videoQueries.updateDurationByBunnyGuid(video.bunnyGuid, bunnyVideo.length);
            }
          }
        } catch (e) {
          console.error('Failed to check Bunny status for', video.bunnyGuid, e);
        }
      }
    }

    const lessons = await lessonQueries.findByClass(classId);

    return Response.json(successResponse(lessons));
  } catch (error) {
    return handleApiError(error);
  }
}
