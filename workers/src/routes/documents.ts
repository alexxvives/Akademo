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

    if (lessonId) {
      // Get documents for specific lesson
      const result = await c.env.DB
        .prepare(`
          SELECT d.*, u.fileName, u.fileSize, u.mimeType, u.storagePath, l.title as lessonTitle
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
          SELECT d.*, u.fileName, u.fileSize, u.mimeType, u.storagePath, l.title as lessonTitle
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
    console.error('[Get Documents] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default documents;
