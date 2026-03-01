import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const documents = new Hono<{ Bindings: Bindings }>();

// GET /documents - Get documents for a class/lesson
documents.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    const { classId, lessonId } = c.req.query();

    // Verify the user has access to this class
    const targetClassId = classId || (lessonId ? null : null);

    // Helper: resolve classId from lessonId if needed
    let resolvedClassId = classId;
    if (!resolvedClassId && lessonId) {
      const lesson: any = await c.env.DB
        .prepare('SELECT classId FROM Lesson WHERE id = ?')
        .bind(lessonId)
        .first();
      if (!lesson) return c.json(errorResponse('Lesson not found'), 404);
      resolvedClassId = lesson.classId;
    }

    if (!resolvedClassId) {
      return c.json(errorResponse('classId or lessonId required'), 400);
    }

    // Access check: students must be enrolled, teachers must own the class, academy must own it
    if (session.role === 'STUDENT') {
      const enrolled: any = await c.env.DB
        .prepare('SELECT id FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = ?')
        .bind(session.id, resolvedClassId, 'APPROVED')
        .first();
      if (!enrolled) return c.json(errorResponse('Not authorized'), 403);
    } else if (session.role === 'TEACHER') {
      const owns: any = await c.env.DB
        .prepare('SELECT id FROM Class WHERE id = ? AND teacherId = ?')
        .bind(resolvedClassId, session.id)
        .first();
      if (!owns) return c.json(errorResponse('Not authorized'), 403);
    } else if (session.role === 'ACADEMY') {
      const owns: any = await c.env.DB
        .prepare('SELECT id FROM Class WHERE id = ? AND academyId IN (SELECT id FROM Academy WHERE ownerId = ?)')
        .bind(resolvedClassId, session.id)
        .first();
      if (!owns) return c.json(errorResponse('Not authorized'), 403);
    }
    // ADMIN passes through

    if (lessonId) {
      // Get documents for specific lesson
      const result = await c.env.DB
        .prepare(`
          SELECT d.id, d.title, d.lessonId, d.uploadId, d.createdAt, 
                 u.fileName, u.fileSize, u.mimeType, u.storagePath, l.title as lessonTitle
          FROM Document d
          LEFT JOIN Upload u ON d.uploadId = u.id
          JOIN Lesson l ON d.lessonId = l.id
          WHERE d.lessonId = ?
          ORDER BY d.createdAt
        `)
        .bind(lessonId)
        .all();

      return c.json(successResponse(result.results || []));
    } else if (classId) {
      // Get all documents for class (across lessons)
      const result = await c.env.DB
        .prepare(`
          SELECT d.id, d.title, d.lessonId, d.uploadId, d.createdAt, 
                 u.fileName, u.fileSize, u.mimeType, u.storagePath, l.title as lessonTitle
          FROM Document d
          LEFT JOIN Upload u ON d.uploadId = u.id
          JOIN Lesson l ON d.lessonId = l.id
          WHERE l.classId = ?
          ORDER BY l.createdAt, d.createdAt
        `)
        .bind(classId)
        .all();

      return c.json(successResponse(result.results || []));
    }

    return c.json(errorResponse('classId or lessonId required'), 400);
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Get Documents] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default documents;
