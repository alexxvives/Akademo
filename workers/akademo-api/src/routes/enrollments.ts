import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, requireRole } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const enrollments = new Hono<{ Bindings: Bindings }>();

// GET /enrollments - Get user's enrollments
enrollments.get('/', async (c) => {
  try {
    const session = await requireAuth(c);

    const result = await c.env.DB
      .prepare(`
        SELECT 
          e.*,
          c.name as className,
          a.name as academyName
        FROM ClassEnrollment e
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE e.userId = ?
        ORDER BY e.createdAt DESC
      `)
      .bind(session.id)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Enrollments] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /enrollments/sign-document - Mark document as signed
enrollments.post('/sign-document', async (c) => {
  try {
    const session = await requireAuth(c);
    const { classId } = await c.req.json();

    if (!classId) {
      return c.json(errorResponse('classId is required'), 400);
    }

    // Check if enrollment exists
    const enrollment = await c.env.DB
      .prepare('SELECT * FROM ClassEnrollment WHERE userId = ? AND classId = ?')
      .bind(session.id, classId)
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Enrollment not found'), 404);
    }

    // Update documentSigned
    await c.env.DB
      .prepare('UPDATE ClassEnrollment SET documentSigned = 1 WHERE userId = ? AND classId = ?')
      .bind(session.id, classId)
      .run();

    return c.json(successResponse({ message: 'Document signed successfully' }));
  } catch (error: any) {
    console.error('[Sign Document] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /enrollments/pending - Get pending enrollments (ACADEMY/TEACHER)
enrollments.get('/pending', async (c) => {
  try {
    const session = await requireAuth(c);

    let query = '';
    let params: any[] = [];

    if (session.role === 'ACADEMY') {
      // Get pending enrollments for owned academies
      query = `
        SELECT 
          e.*,
          u.firstName as studentFirstName,
          u.lastName as studentLastName,
          u.email as studentEmail,
          c.name as className,
          a.name as academyName
        FROM ClassEnrollment e
        JOIN User u ON e.userId = u.id
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE a.ownerId = ? AND e.status = 'PENDING'
        ORDER BY e.createdAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'TEACHER') {
      // Get pending enrollments for teacher's classes
      query = `
        SELECT 
          e.*,
          u.firstName as studentFirstName,
          u.lastName as studentLastName,
          u.email as studentEmail,
          c.name as className,
          a.name as academyName
        FROM ClassEnrollment e
        JOIN User u ON e.userId = u.id
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE c.teacherId = ? AND e.status = 'PENDING'
        ORDER BY e.createdAt DESC
      `;
      params = [session.id];
    } else {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Pending Enrollments] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default enrollments;
