import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const lessons = new Hono<{ Bindings: Bindings }>();

// GET /lessons/:id - Get lesson with content
lessons.get('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.param('id');

    // Get lesson with videos and documents
    const lesson = await c.env.DB
      .prepare(`
        SELECT 
          l.*,
          c.name as className,
          c.id as classId,
          c.teacherId,
          a.id as academyId
        FROM Lesson l
        JOIN Class c ON l.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE l.id = ?
      `)
      .bind(lessonId)
      .first();

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    // Check access
    if (session.role === 'STUDENT') {
      const enrollment = await c.env.DB
        .prepare('SELECT * FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = ?')
        .bind(session.id, lesson.classId, 'APPROVED')
        .first();

      if (!enrollment) {
        return c.json(errorResponse('Not enrolled in this class'), 403);
      }
    } else if (session.role === 'TEACHER') {
      if (lesson.teacherId !== session.id) {
        return c.json(errorResponse('Not authorized'), 403);
      }
    } else if (session.role === 'ACADEMY') {
      const academy = await c.env.DB
        .prepare('SELECT * FROM Academy WHERE id = ? AND ownerId = ?')
        .bind(lesson.academyId, session.id)
        .first();

      if (!academy) {
        return c.json(errorResponse('Not authorized'), 403);
      }
    }

    // Get videos
    const videos = await c.env.DB
      .prepare(`
        SELECT v.*, u.fileName, u.fileSize, u.mimeType, u.storagePath
        FROM Video v
        LEFT JOIN Upload u ON v.uploadId = u.id
        WHERE v.lessonId = ?
        ORDER BY v.createdAt
      `)
      .bind(lessonId)
      .all();

    // Get documents
    const documents = await c.env.DB
      .prepare(`
        SELECT d.*, u.fileName, u.fileSize, u.mimeType, u.storagePath
        FROM Document d
        LEFT JOIN Upload u ON d.uploadId = u.id
        WHERE d.lessonId = ?
        ORDER BY d.createdAt
      `)
      .bind(lessonId)
      .all();

    return c.json(successResponse({
      ...lesson,
      videos: videos.results || [],
      documents: documents.results || [],
    }));
  } catch (error: any) {
    console.error('[Get Lesson] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PATCH /lessons/:id - Update lesson
lessons.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.param('id');
    const { title, description, releaseDate, maxWatchTimeMultiplier, watermarkIntervalMins } = await c.req.json();

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Verify access
    const lesson = await c.env.DB
      .prepare('SELECT l.*, c.teacherId, a.ownerId FROM Lesson l JOIN Class c ON l.classId = c.id JOIN Academy a ON c.academyId = a.id WHERE l.id = ?')
      .bind(lessonId)
      .first();

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    if (session.role === 'TEACHER' && lesson.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    if (session.role === 'ACADEMY' && lesson.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Update lesson
    await c.env.DB
      .prepare('UPDATE Lesson SET title = ?, description = ?, releaseDate = ?, maxWatchTimeMultiplier = ?, watermarkIntervalMins = ? WHERE id = ?')
      .bind(title, description || null, releaseDate, maxWatchTimeMultiplier, watermarkIntervalMins, lessonId)
      .run();

    const updated = await c.env.DB
      .prepare('SELECT * FROM Lesson WHERE id = ?')
      .bind(lessonId)
      .first();

    return c.json(successResponse(updated));
  } catch (error: any) {
    console.error('[Update Lesson] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// DELETE /lessons/:id - Delete lesson
lessons.delete('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.param('id');

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Verify access
    const lesson = await c.env.DB
      .prepare('SELECT l.*, c.teacherId, a.ownerId FROM Lesson l JOIN Class c ON l.classId = c.id JOIN Academy a ON c.academyId = a.id WHERE l.id = ?')
      .bind(lessonId)
      .first();

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    if (session.role === 'TEACHER' && lesson.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    if (session.role === 'ACADEMY' && lesson.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Delete lesson (cascade will handle videos/documents/play states)
    await c.env.DB
      .prepare('DELETE FROM Lesson WHERE id = ?')
      .bind(lessonId)
      .run();

    return c.json(successResponse({ message: 'Lesson deleted' }));
  } catch (error: any) {
    console.error('[Delete Lesson] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /lessons/:id/rating - Rate a lesson
lessons.post('/:id/rating', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.param('id');
    const { rating, comment } = await c.req.json();

    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can rate lessons'), 403);
    }

    if (!rating || rating < 1 || rating > 5) {
      return c.json(errorResponse('Rating must be between 1 and 5'), 400);
    }

    // Check if enrolled
    const lesson = await c.env.DB
      .prepare('SELECT classId FROM Lesson WHERE id = ?')
      .bind(lessonId)
      .first();

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    const enrollment = await c.env.DB
      .prepare('SELECT * FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = ?')
      .bind(session.id, lesson.classId, 'APPROVED')
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Not enrolled'), 403);
    }

    // Check if already rated
    const existing = await c.env.DB
      .prepare('SELECT id FROM LessonRating WHERE lessonId = ? AND studentId = ?')
      .bind(lessonId, session.id)
      .first();

    if (existing) {
      // Update existing rating
      await c.env.DB
        .prepare('UPDATE LessonRating SET rating = ?, comment = ? WHERE id = ?')
        .bind(rating, comment || null, existing.id)
        .run();
    } else {
      // Create new rating
      const ratingId = crypto.randomUUID();
      await c.env.DB
        .prepare('INSERT INTO LessonRating (id, lessonId, studentId, rating, comment) VALUES (?, ?, ?, ?, ?)')
        .bind(ratingId, lessonId, session.id, rating, comment || null)
        .run();
    }

    return c.json(successResponse({ message: 'Rating saved' }));
  } catch (error: any) {
    console.error('[Rate Lesson] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default lessons;
