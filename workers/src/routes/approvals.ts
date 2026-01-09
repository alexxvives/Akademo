import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const approvals = new Hono<{ Bindings: Bindings }>();

// GET /approvals/academy - Get pending enrollments for academy
approvals.get('/academy', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only academy owners can access this'), 403);
    }

    const result = await c.env.DB
      .prepare(`
        SELECT 
          ce.*,
          u.firstName as studentFirstName,
          u.lastName as studentLastName,
          u.email as studentEmail,
          c.name as className,
          a.name as academyName
        FROM ClassEnrollment ce
        JOIN User u ON ce.userId = u.id
        JOIN Class c ON ce.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE a.ownerId = ? AND ce.status = 'PENDING'
        ORDER BY ce.createdAt DESC
      `)
      .bind(session.id)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Academy Approvals] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /approvals/academy - Approve/reject enrollment
approvals.post('/academy', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only academy owners can approve enrollments'), 403);
    }

    const { enrollmentId, action } = await c.req.json();

    if (!enrollmentId || !['approve', 'reject'].includes(action)) {
      return c.json(errorResponse('Invalid request'), 400);
    }

    // Verify ownership
    const enrollment = await c.env.DB
      .prepare(`
        SELECT ce.*, a.ownerId
        FROM ClassEnrollment ce
        JOIN Class c ON ce.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE ce.id = ?
      `)
      .bind(enrollmentId)
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Enrollment not found'), 404);
    }

    if (enrollment.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    await c.env.DB
      .prepare('UPDATE ClassEnrollment SET status = ? WHERE id = ?')
      .bind(status, enrollmentId)
      .run();

    return c.json(successResponse({ message: `Enrollment ${status.toLowerCase()}` }));
  } catch (error: any) {
    console.error('[Approve Academy Enrollment] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /approvals/teacher - Get pending enrollments for teacher
approvals.get('/teacher', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER') {
      return c.json(errorResponse('Only teachers can access this'), 403);
    }

    const result = await c.env.DB
      .prepare(`
        SELECT 
          ce.*,
          u.firstName as studentFirstName,
          u.lastName as studentLastName,
          u.email as studentEmail,
          c.name as className
        FROM ClassEnrollment ce
        JOIN User u ON ce.userId = u.id
        JOIN Class c ON ce.classId = c.id
        WHERE c.teacherId = ? AND ce.status = 'PENDING'
        ORDER BY ce.createdAt DESC
      `)
      .bind(session.id)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Teacher Approvals] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /approvals/teacher - Approve/reject enrollment
approvals.post('/teacher', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER') {
      return c.json(errorResponse('Only teachers can approve enrollments'), 403);
    }

    const { enrollmentId, action } = await c.req.json();

    if (!enrollmentId || !['approve', 'reject'].includes(action)) {
      return c.json(errorResponse('Invalid request'), 400);
    }

    // Verify ownership
    const enrollment = await c.env.DB
      .prepare(`
        SELECT ce.*, c.teacherId
        FROM ClassEnrollment ce
        JOIN Class c ON ce.classId = c.id
        WHERE ce.id = ?
      `)
      .bind(enrollmentId)
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Enrollment not found'), 404);
    }

    if (enrollment.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    await c.env.DB
      .prepare('UPDATE ClassEnrollment SET status = ? WHERE id = ?')
      .bind(status, enrollmentId)
      .run();

    return c.json(successResponse({ message: `Enrollment ${status.toLowerCase()}` }));
  } catch (error: any) {
    console.error('[Approve Teacher Enrollment] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default approvals;
