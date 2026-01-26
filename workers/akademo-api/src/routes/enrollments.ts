import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, requireRole } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const enrollments = new Hono<{ Bindings: Bindings }>();

// GET /enrollments - Get user's enrollments OR enrollments for a specific class
enrollments.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    const classId = c.req.query('classId');

    // If classId provided, return enrollments for that class (TEACHER only)
    if (classId) {
      if (session.role !== 'TEACHER' && session.role !== 'ACADEMY') {
        return c.json(errorResponse('Not authorized'), 403);
      }

      // Verify teacher owns this class
      if (session.role === 'TEACHER') {
        const classCheck = await c.env.DB
          .prepare('SELECT id FROM Class WHERE id = ? AND teacherId = ?')
          .bind(classId, session.id)
          .first();

        if (!classCheck) {
          return c.json(errorResponse('Class not found or not authorized'), 403);
        }
      }

      // Get enrollments with student details (nested structure for frontend)
      const result = await c.env.DB
        .prepare(`
          SELECT 
            e.id,
            e.classId,
            e.userId,
            e.status,
            e.enrolledAt,
            e.approvedAt,
            u.id as student_id,
            u.firstName as student_firstName,
            u.lastName as student_lastName,
            u.email as student_email,
            u.lastLoginAt as student_lastLoginAt,
            c.name as class_name,
            c.id as class_id
          FROM ClassEnrollment e
          JOIN User u ON e.userId = u.id
          JOIN Class c ON e.classId = c.id
          WHERE e.classId = ? AND e.status = 'APPROVED'
          ORDER BY e.enrolledAt DESC
        `)
        .bind(classId)
        .all();

      // Transform to nested structure expected by frontend
      const enrollments = (result.results || []).map((row: any) => ({
        id: row.id,
        classId: row.classId,
        userId: row.userId,
        status: row.status,
        enrolledAt: row.enrolledAt,
        approvedAt: row.approvedAt,
        student: {
          id: row.student_id,
          firstName: row.student_firstName,
          lastName: row.student_lastName,
          email: row.student_email,
          lastLoginAt: row.student_lastLoginAt,
        },
        class: {
          id: row.class_id,
          name: row.class_name,
        },
      }));

      return c.json(successResponse(enrollments));
    }

    // Otherwise, return user's own enrollments
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

    // Document signing feature not currently used (documentSigned column removed)
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
          e.id,
          e.classId,
          e.userId,
          e.status,
          e.enrolledAt,
          e.approvedAt,
          u.id as student_id,
          u.firstName as student_firstName,
          u.lastName as student_lastName,
          u.email as student_email,
          c.name as class_name,
          c.id as class_id,
          c.teacherId,
          teacher.firstName || ' ' || teacher.lastName as teacherName,
          a.name as academyName
        FROM ClassEnrollment e
        JOIN User u ON e.userId = u.id
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User teacher ON c.teacherId = teacher.id
        WHERE a.ownerId = ? AND e.status = 'PENDING'
        ORDER BY e.enrolledAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'TEACHER') {
      // Get pending enrollments for teacher's classes
      query = `
        SELECT 
          e.id,
          e.classId,
          e.userId,
          e.status,
          e.enrolledAt,
          e.approvedAt,
          u.id as student_id,
          u.firstName as student_firstName,
          u.lastName as student_lastName,
          u.email as student_email,
          c.name as class_name,
          c.id as class_id,
          c.teacherId,
          teacher.firstName || ' ' || teacher.lastName as teacherName,
          a.name as academyName
        FROM ClassEnrollment e
        JOIN User u ON e.userId = u.id
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User teacher ON c.teacherId = teacher.id
        WHERE c.teacherId = ? AND e.status = 'PENDING'
        ORDER BY e.enrolledAt DESC
      `;
      params = [session.id];
    } else {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    // Transform to nested structure expected by frontend
    const enrollments = (result.results || []).map((row: any) => ({
      id: row.id,
      classId: row.classId,
      userId: row.userId,
      status: row.status,
      enrolledAt: row.enrolledAt,
      approvedAt: row.approvedAt,
      student: {
        id: row.student_id,
        firstName: row.student_firstName,
        lastName: row.student_lastName,
        email: row.student_email,
      },
      class: {
        id: row.class_id,
        name: row.class_name,
        teacherId: row.teacherId,
        teacherName: row.teacherName,
      },
      academyName: row.academyName,
    }));

    return c.json(successResponse(enrollments));
  } catch (error: any) {
    console.error('[Pending Enrollments] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /enrollments/rejected - Get rejected enrollments count
enrollments.get('/rejected', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    let query = '';
    let params: any[] = [];

    if (session.role === 'TEACHER') {
      query = `
        SELECT COUNT(*) as count
        FROM ClassEnrollment e
        JOIN Class c ON e.classId = c.id
        WHERE c.teacherId = ? AND e.status = 'REJECTED'
      `;
      params = [session.id];
    } else if (session.role === 'ACADEMY') {
      query = `
        SELECT COUNT(*) as count
        FROM ClassEnrollment e
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE a.ownerId = ? AND e.status = 'REJECTED'
      `;
      params = [session.id];
    }

    const result = await c.env.DB.prepare(query).bind(...params).first();
    return c.json(successResponse({ count: result?.count || 0 }));
  } catch (error: any) {
    console.error('[Rejected Enrollments] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PUT /enrollments/pending - Approve/Reject pending enrollment
enrollments.put('/pending', async (c) => {
  try {
    const session = await requireAuth(c);
    const { enrollmentId, action } = await c.req.json();

    if (!enrollmentId || !['APPROVE', 'REJECT'].includes(action)) {
      return c.json(errorResponse('enrollmentId and valid action (APPROVE/REJECT) required'), 400);
    }

    // Get enrollment details including class owner
    const enrollment = await c.env.DB
      .prepare(`
        SELECT e.*, c.teacherId, a.ownerId
        FROM ClassEnrollment e
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE e.id = ?
      `)
      .bind(enrollmentId)
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Enrollment not found'), 404);
    }

    // Check permissions
    if (session.role === 'ACADEMY') {
      if (enrollment.ownerId !== session.id) {
         return c.json(errorResponse('Not authorized'), 403);
      }
    } else if (session.role === 'TEACHER') {
      if (enrollment.teacherId !== session.id) {
         return c.json(errorResponse('Not authorized'), 403);
      }
    } else {
       return c.json(errorResponse('Not authorized'), 403);
    }

    // Track who approved/rejected
    const approverName = session.role === 'ACADEMY' 
      ? `Academia: ${session.firstName} ${session.lastName}`
      : `Profesor: ${session.firstName} ${session.lastName}`;

    if (action === 'APPROVE') {
      await c.env.DB
        .prepare("UPDATE ClassEnrollment SET status = 'APPROVED', approvedBy = ?, approvedByName = ?, updatedAt = datetime('now') WHERE id = ?")
        .bind(session.id, approverName, enrollmentId)
        .run();
    } else {
       // REJECT
       await c.env.DB
        .prepare("UPDATE ClassEnrollment SET status = 'REJECTED', approvedBy = ?, approvedByName = ?, updatedAt = datetime('now') WHERE id = ?")
        .bind(session.id, approverName, enrollmentId)
        .run();
    }

    return c.json(successResponse({ message: `Enrollment ${action.toLowerCase()}d successfully` }));

  } catch (error: any) {
    console.error('[Update Enrollment] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /enrollments/history - Get enrollment history (approved/rejected)
enrollments.get('/history', async (c) => {
  try {
    const session = await requireAuth(c);

    let query = '';
    let params: any[] = [];

    if (session.role === 'ACADEMY') {
      // Get enrollment history for owned academies
      query = `
        SELECT 
          e.id as enrollmentId,
          e.status,
          e.updatedAt,
          e.createdAt as enrolledAt,
          e.approvedByName,
          u.id as student_id,
          u.firstName as student_firstName,
          u.lastName as student_lastName,
          u.email as student_email,
          c.name as class_name,
          c.id as class_id,
          teacher.firstName || ' ' || teacher.lastName as teacherName
        FROM ClassEnrollment e
        JOIN User u ON e.userId = u.id
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User teacher ON c.teacherId = teacher.id
        WHERE a.ownerId = ? AND e.status IN ('APPROVED', 'REJECTED')
        ORDER BY e.updatedAt DESC
        LIMIT 50
      `;
      params = [session.id];
    } else if (session.role === 'TEACHER') {
      // Get enrollment history for teacher's classes
      query = `
        SELECT 
          e.id as enrollmentId,
          e.status,
          e.updatedAt,
          e.createdAt as enrolledAt,
          e.approvedByName,
          u.id as student_id,
          u.firstName as student_firstName,
          u.lastName as student_lastName,
          u.email as student_email,
          c.name as class_name,
          c.id as class_id
        FROM ClassEnrollment e
        JOIN User u ON e.userId = u.id
        JOIN Class c ON e.classId = c.id
        WHERE c.teacherId = ? AND e.status IN ('APPROVED', 'REJECTED')
        ORDER BY e.updatedAt DESC
        LIMIT 50
      `;
      params = [session.id];
    } else {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    // Transform to nested structure expected by frontend
    const enrollments = (result.results || []).map((row: any) => ({
      id: row.enrollmentId,
      status: row.status,
      updatedAt: row.updatedAt,
      enrolledAt: row.enrolledAt,
      approvedByName: row.approvedByName,
      student: {
        id: row.student_id,
        firstName: row.student_firstName,
        lastName: row.student_lastName,
        email: row.student_email,
      },
      class: {
        id: row.class_id,
        name: row.class_name,
      },
      teacherName: row.teacherName || undefined,
    }));

    return c.json(successResponse(enrollments));
  } catch (error: any) {
    console.error('[Enrollment History] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PUT /enrollments/history/:id/reverse - Reverse approval/rejection decision
enrollments.put('/history/:id/reverse', async (c) => {
  try {
    const session = await requireAuth(c);
    const enrollmentId = c.req.param('id');

    if (!enrollmentId) {
      return c.json(errorResponse('enrollmentId required'), 400);
    }

    // Get enrollment details including class owner
    const enrollment = await c.env.DB
      .prepare(`
        SELECT e.*, c.teacherId, a.ownerId
        FROM ClassEnrollment e
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE e.id = ?
      `)
      .bind(enrollmentId)
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Enrollment not found'), 404);
    }

    // Check permissions
    if (session.role === 'ACADEMY') {
      if (enrollment.ownerId !== session.id) {
         return c.json(errorResponse('Not authorized'), 403);
      }
    } else if (session.role === 'TEACHER') {
      if (enrollment.teacherId !== session.id) {
         return c.json(errorResponse('Not authorized'), 403);
      }
    } else {
       return c.json(errorResponse('Not authorized'), 403);
    }

    // Toggle status: APPROVED <-> REJECTED
    const newStatus = enrollment.status === 'APPROVED' ? 'REJECTED' : 'APPROVED';
    
    // Track who reversed the decision
    const approverName = session.role === 'ACADEMY' 
      ? `Academia: ${session.firstName} ${session.lastName}`
      : `Profesor: ${session.firstName} ${session.lastName}`;

    await c.env.DB
      .prepare("UPDATE ClassEnrollment SET status = ?, approvedBy = ?, approvedByName = ?, updatedAt = datetime('now') WHERE id = ?")
      .bind(newStatus, session.id, approverName, enrollmentId)
      .run();

    return c.json(successResponse({ 
      message: `Enrollment status changed to ${newStatus}`,
      newStatus 
    }));

  } catch (error: any) {
    console.error('[Reverse Enrollment] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default enrollments;
