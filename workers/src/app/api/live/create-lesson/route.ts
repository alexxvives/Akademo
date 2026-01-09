import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDB, generateId } from '@/lib/db';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    console.log('[create-lesson] Starting request');
    
    let user;
    try {
      user = await requireRole(['TEACHER', 'ACADEMY']);
      console.log('[create-lesson] User authenticated:', user.id, user.role);
    } catch (authError: any) {
      console.error('[create-lesson] Auth failed:', authError.message);
      return errorResponse(authError.message || 'Authentication failed', 401);
    }
    
    const db = await getDB();

    let body;
    try {
      body = await request.json();
      console.log('[create-lesson] Request body:', JSON.stringify(body));
    } catch (parseError: any) {
      console.error('[create-lesson] JSON parse failed:', parseError.message);
      return errorResponse('Invalid JSON body', 400);
    }
    
    const { streamId, videoPath, title: customTitle, description: customDescription, releaseDate: customReleaseDate } = body;

    if (!streamId) {
      console.error('[create-lesson] Missing streamId in body:', body);
      return errorResponse('Stream ID required', 400);
    }

    console.log('[create-lesson] Processing - streamId:', streamId, 'videoPath:', videoPath);

    // Verify the stream exists and user has access (teacher or academy owner)
    const stream = await db.prepare(`
      SELECT ls.id, ls.classId, ls.title, ls.startedAt, ls.endedAt, ls.createdAt, ls.recordingId, c.teacherId, c.academyId, a.ownerId
      FROM LiveStream ls
      JOIN Class c ON c.id = ls.classId
      LEFT JOIN Academy a ON c.academyId = a.id
      WHERE ls.id = ?
    `).bind(streamId).first() as any;

    if (!stream) {
      console.error('[create-lesson] Stream not found:', streamId);
      return errorResponse('Stream not found', 404);
    }

    // Check authorization: must be the class teacher or academy owner
    const isTeacher = stream.teacherId === user.id;
    const isAcademyOwner = stream.ownerId === user.id;
    
    if (!isTeacher && !isAcademyOwner) {
      console.error('[create-lesson] Unauthorized. User:', user.id, 'Teacher:', stream.teacherId, 'Owner:', stream.ownerId);
      return errorResponse('Not authorized to create lesson for this stream', 403);
    }

    // Calculate duration if we have start and end times
    let durationSeconds: number | null = null;
    if (stream.startedAt && stream.endedAt) {
      const startMs = new Date(stream.startedAt).getTime();
      const endMs = new Date(stream.endedAt).getTime();
      durationSeconds = Math.floor((endMs - startMs) / 1000);
    }

    // Create IDs
    const lessonId = generateId();
    const uploadId = generateId();
    const videoId = generateId();

    const streamDate = new Date(stream.startedAt || stream.createdAt).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create the lesson with custom or default values
    const lessonTitle = customTitle || `[Grabación] ${stream.title}`;
    const lessonDescription = customDescription || `Grabación de la clase en vivo del ${streamDate}`;
    const lessonReleaseDate = customReleaseDate || new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO Lesson (id, classId, title, description, releaseDate, maxWatchTimeMultiplier, watermarkIntervalMins, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 2.0, 5, datetime('now'), datetime('now'))
    `).bind(
      lessonId,
      stream.classId,
      lessonTitle,
      lessonDescription,
      lessonReleaseDate
    ).run();

    // Always create upload and video records to store duration
    // If stream.recordingId exists, it's the Bunny GUID from webhook upload
    const bunnyGuid = stream.recordingId;
    const storagePath = videoPath || bunnyGuid || 'pending';
    const storageType = bunnyGuid ? 'bunny' : 'r2';
    
    // Create the upload record
    await db.prepare(`
      INSERT INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, createdAt, bunnyGuid, storageType)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
    `).bind(
      uploadId,
      `${stream.title}.mp4`,
      0,
      'video/mp4',
      storagePath,
      user.id,
      bunnyGuid,
      storageType
    ).run();

    // Create the video record with calculated duration
    await db.prepare(`
      INSERT INTO Video (id, title, lessonId, uploadId, durationSeconds, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      videoId,
      stream.title,
      lessonId,
      uploadId,
      durationSeconds ?? null
    ).run();

    // Note: We keep the original recordingId (Bunny GUID) and don't overwrite it
    // The lesson is linked via Video -> Upload -> bunnyGuid

    // Notify students about the new recording
    const enrollments = await db.prepare(`
      SELECT userId FROM ClassEnrollment WHERE classId = ? AND status = 'APPROVED'
    `).bind(stream.classId).all() as any;

    if (enrollments.results?.length > 0) {
      const now = new Date().toISOString();
      for (const enrollment of enrollments.results) {
        const notifId = generateId();
        await db.prepare(`
          INSERT INTO Notification (id, userId, type, title, message, isRead, createdAt)
          VALUES (?, ?, 'stream_recording', ?, ?, 0, ?)
        `).bind(
          notifId,
          enrollment.userId,
          '🎬 Nueva grabación disponible',
          `La grabación de "${stream.title}" ya está disponible para ver.`,
          now
        ).run();
      }
    }

    return Response.json(successResponse({
      lessonId,
      message: 'Lesson created from recording',
    }));

  } catch (error) {
    return handleApiError(error);
  }
}
