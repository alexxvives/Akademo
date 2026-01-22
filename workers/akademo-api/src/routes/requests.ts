import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const requests = new Hono<{ Bindings: Bindings }>();

// POST /requests/student - Student requests to join a class
requests.post('/student', async (c) => {
  try {
    const session = await requireAuth(c);
    console.log('[Student Request] Session:', { id: session.id, role: session.role });

    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can request to join classes'), 403);
    }

    const { classId } = await c.req.json();
    console.log('[Student Request] ClassId:', classId);

    if (!classId) {
      return c.json(errorResponse('classId is required'), 400);
    }

    // Check if class exists and get price
    const classRecord: any = await c.env.DB
      .prepare('SELECT id, name, price FROM Class WHERE id = ?')
      .bind(classId)
      .first();

    if (!classRecord) {
      console.error('[Student Request] Class not found:', classId);
      return c.json(errorResponse('Class not found'), 404);
    }

    // Check if already enrolled
    const existing = await c.env.DB
      .prepare('SELECT * FROM ClassEnrollment WHERE userId = ? AND classId = ?')
      .bind(session.id, classId)
      .first();

    console.log('[Student Request] Existing enrollment:', existing);

    if (existing) {
      if (existing.status === 'APPROVED') {
        return c.json(errorResponse('Already enrolled in this class'), 400);
      } else if (existing.status === 'PENDING') {
        return c.json(errorResponse('Request already pending'), 400);
      } else if (existing.status === 'REJECTED') {
        // Auto-approve re-requests (no manual approval needed)
        const now = new Date().toISOString();
        const classPrice = classRecord.price || 0;
        
        // If class has a price, set paymentStatus to CASH_PENDING
        const paymentStatus = classPrice > 0 ? 'CASH_PENDING' : 'PAID';
        const paymentMethod = classPrice > 0 ? 'cash' : null;
        
        await c.env.DB
          .prepare(`
            UPDATE ClassEnrollment 
            SET status = ?, paymentStatus = ?, paymentMethod = ?, paymentAmount = ?, updatedAt = ?
            WHERE userId = ? AND classId = ?
          `)
          .bind('APPROVED', paymentStatus, paymentMethod, classPrice, now, session.id, classId)
          .run();
        return c.json(successResponse({ message: 'Enrollment approved successfully' }));
      }
    }

    // Auto-approve new enrollments (no manual approval step)
    const enrollmentId = crypto.randomUUID();
    const now = new Date().toISOString();
    const classPrice = classRecord.price || 0;
    
    // If class has a price > 0, create with CASH_PENDING payment status
    // Otherwise, mark as PAID (free classes)
    const paymentStatus = classPrice > 0 ? 'CASH_PENDING' : 'PAID';
    const paymentMethod = classPrice > 0 ? 'cash' : null;
    
    await c.env.DB
      .prepare(`
        INSERT INTO ClassEnrollment 
        (id, classId, userId, status, documentSigned, paymentStatus, paymentMethod, paymentAmount, enrolledAt, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(enrollmentId, classId, session.id, 'APPROVED', 0, paymentStatus, paymentMethod, classPrice, now, now, now)
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
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
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
      updatedAt: row.updatedAt,
    }));

    return c.json(memberships);
  } catch (error: any) {
    console.error('[Teacher Requests] Error:', error);
    return c.json(errorResponse(error.message), 500);
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
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default requests;
