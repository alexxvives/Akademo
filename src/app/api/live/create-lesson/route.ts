import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDB, generateId } from '@/lib/db';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['TEACHER']);
    const db = await getDB();

    const { streamId, videoPath } = await request.json();

    if (!streamId || !videoPath) {
      return errorResponse('Stream ID and video path required', 400);
    }

    // Verify the stream exists and belongs to a class the teacher owns
    const stream = await db.prepare(`
      SELECT ls.id, ls.classId, ls.title, ls.startedAt, ls.endedAt, c.teacherId
      FROM LiveStream ls
      JOIN Class c ON c.id = ls.classId
      WHERE ls.id = ? AND c.teacherId = ?
    `).bind(streamId, user.id).first() as any;

    if (!stream) {
      return errorResponse('Stream not found or unauthorized', 404);
    }

    // Calculate duration if we have start and end times
    let durationSeconds = null;
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

    // Create the lesson
    await db.prepare(`
      INSERT INTO Lesson (id, classId, title, description, releaseDate, maxWatchTimeMultiplier, watermarkIntervalMins, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, datetime('now'), 2.0, 5, datetime('now'), datetime('now'))
    `).bind(
      lessonId,
      stream.classId,
      `[Grabación] ${stream.title}`,
      `Grabación de la clase en vivo del ${streamDate}`
    ).run();

    // Create the upload record
    await db.prepare(`
      INSERT INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      uploadId,
      `${stream.title}.mp4`,
      0, // We don't know the exact size from the upload
      'video/mp4',
      videoPath,
      user.id
    ).run();

    // Create the video record linked to lesson and upload
    await db.prepare(`
      INSERT INTO Video (id, title, description, lessonId, uploadId, durationSeconds, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      videoId,
      stream.title,
      `Grabación de stream en vivo`,
      lessonId,
      uploadId,
      durationSeconds
    ).run();

    // Update the stream with the recording reference
    await db.prepare(`
      UPDATE LiveStream SET recordingId = ? WHERE id = ?
    `).bind(lessonId, streamId).run();

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
          enrollment.studentId,
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
