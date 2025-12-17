import { lessonQueries, videoQueries, documentQueries, uploadQueries, membershipQueries, classQueries } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { getStorageAdapter } from '@/lib/storage';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

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
      const classData = await classQueries.findWithAcademyAndCounts(classId) as any;
      if (!classData) {
        return errorResponse('Class not found', 404);
      }
      
      const membership = await membershipQueries.findByUserAndAcademy(session.id, classData.academyId);
      if (!membership || (membership as any).status !== 'APPROVED') {
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
        description: videoDescriptions[i] || undefined,
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
        description: documentDescriptions[i] || undefined,
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

    if (!classId) {
      return errorResponse('Class ID required');
    }

    const lessons = await lessonQueries.findByClass(classId);

    return Response.json(successResponse(lessons));
  } catch (error) {
    return handleApiError(error);
  }
}
