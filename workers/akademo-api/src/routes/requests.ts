import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const requests = new Hono<{ Bindings: Bindings }>();

// POST /requests/student - Student requests to join a class
requests.post('/student', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can request to join classes'), 403);
    }

    const { classId } = await c.req.json();
    if (!classId) {
      return c.json(errorResponse('classId is required'), 400);
    }

    // Check if class exists and get details
    const classRecord: any = await c.env.DB
      .prepare(`
        SELECT c.id, c.name, c.monthlyPrice, c.oneTimePrice, c.maxStudents, c.academyId, a.email as academyEmail
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        WHERE c.id = ?
      `)
      .bind(classId)
      .first();

    if (!classRecord) {
      console.error('[Student Request] Class not found:', classId);
      return c.json(errorResponse('Class not found'), 404);
    }

    // Check if class has reached max students limit
    if (classRecord.maxStudents !== null && classRecord.maxStudents > 0) {
      const enrollmentCount = await c.env.DB
        .prepare('SELECT COUNT(*) as count FROM ClassEnrollment WHERE classId = ? AND status = ?')
        .bind(classId, 'APPROVED')
        .first() as any;
      
      if (enrollmentCount && enrollmentCount.count >= classRecord.maxStudents) {
        return c.json(errorResponse(
          `Esta clase ha alcanzado su límite de ${classRecord.maxStudents} estudiantes. ` +
          `Puedes contactar a la academia en ${classRecord.academyEmail} para solicitar más cupos.`
        ), 400);
      }
    }

    // Check if already enrolled
    const existing = await c.env.DB
      .prepare('SELECT * FROM ClassEnrollment WHERE userId = ? AND classId = ?')
      .bind(session.id, classId)
      .first();
    if (existing) {
      if (existing.status === 'APPROVED') {
        return c.json(errorResponse('Already enrolled in this class'), 400);
      } else if (existing.status === 'PENDING') {
        return c.json(errorResponse('Request already pending'), 400);
      } else if (existing.status === 'REJECTED' || existing.status === 'WITHDRAWN') {
        // Auto-approve re-requests (no manual approval needed)
        const now = new Date().toISOString();
        
        await c.env.DB
          .prepare(`
            UPDATE ClassEnrollment 
            SET status = ?, approvedAt = ?
            WHERE userId = ? AND classId = ?
          `)
          .bind('APPROVED', now, session.id, classId)
          .run();
        return c.json(successResponse({ message: 'Enrollment approved successfully' }));
      }
    }

    // Auto-approve new enrollments (no manual approval step)
    const enrollmentId = crypto.randomUUID();
    const now = new Date().toISOString();
    const classPrice = classRecord.price || 0;
    
    await c.env.DB
      .prepare(`
        INSERT INTO ClassEnrollment 
        (id, classId, userId, status, documentSigned, enrolledAt, approvedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(enrollmentId, classId, session.id, 'APPROVED', 0, now, now)
      .run();

    return c.json(successResponse({ 
      message: classPrice > 0 
        ? 'Enrollment approved! Please complete payment to access class content.' 
        : 'Enrollment approved! You can now access the class.',
      enrollmentId,
      requiresPayment: classPrice > 0
    }));
  } catch (error: any) {
    console.error('[Student Request] Error:', error);
    // Return proper status code for auth errors
    if (error.message === 'Unauthorized') {
      return c.json(errorResponse('Please login to request access to classes'), 401);
    }
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /requests/teacher - Get teacher's academy memberships
requests.get('/teacher', async (c) => {
  try {
    const session = await requireAuth(c);
    
    // Allow ACADEMY to view this too? No, mainly TEACHER role. 
    // But sometimes ACADEMY role users act as teachers? 
    // For now strictly TEACHER role as per frontend.
    
    const result = await c.env.DB.prepare(`
      SELECT 
        t.*,
        a.name as academyName,
        a.description as academyDescription,
        a.ownerId as academyOwnerId
      FROM Teacher t
      JOIN Academy a ON t.academyId = a.id
      WHERE t.userId = ?
      ORDER BY t.createdAt DESC
    `).bind(session.id).all();

    // Transform results to include status field (all Teacher table entries are APPROVED)
    const memberships = (result.results || []).map((row: any) => ({
      id: row.id,
      userId: row.userId,
      academyId: row.academyId,
      academyName: row.academyName,
      academyDescription: row.academyDescription,
      status: 'APPROVED', // Teacher table entries are always approved
      requestedAt: row.createdAt,
      createdAt: row.createdAt,
    }));

    return c.json(memberships);
  } catch (error: any) {
    console.error('[Teacher Requests] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /requests/teacher - Teacher requests to join an academy
requests.post('/teacher', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER') {
      return c.json(errorResponse('Only teachers can request to join academies'), 403);
    }

    const { academyId } = await c.req.json();

    if (!academyId) {
      return c.json(errorResponse('academyId is required'), 400);
    }

    // Check if academy exists
    const academy = await c.env.DB
      .prepare('SELECT * FROM Academy WHERE id = ?')
      .bind(academyId)
      .first();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    // Check if already a teacher in this academy
    const existing = await c.env.DB
      .prepare('SELECT * FROM Teacher WHERE userId = ? AND academyId = ?')
      .bind(session.id, academyId)
      .first();

    if (existing) {
      return c.json(errorResponse('Already a teacher in this academy'), 400);
    }

    // Create teacher record
    const teacherId = crypto.randomUUID();
    await c.env.DB
      .prepare('INSERT INTO Teacher (id, userId, academyId) VALUES (?, ?, ?)')
      .bind(teacherId, session.id, academyId)
      .run();

    return c.json(successResponse({ 
      message: 'Successfully joined academy',
      teacherId 
    }));
  } catch (error: any) {
    console.error('[Teacher Request] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default requests;
