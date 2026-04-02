import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, hashPassword } from '../lib/auth';
import bcrypt from 'bcryptjs';
import type { D1PreparedStatement } from '../lib/cloudflare';
import { successResponse, errorResponse } from '../lib/utils';
import { nanoid } from 'nanoid';
import { autoCreatePendingPayments, normalizeDateForStorage, deriveBillingState, BillingEnrollmentRow } from '../lib/payment-utils';
import { writeAuditLog } from '../lib/audit';
import { sendEmail } from '../lib/sendEmail';

const admin = new Hono<{ Bindings: Bindings }>();

// GET /admin/academies - Get all academies with detailed stats (admin only)
admin.get('/academies', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    // Query academies with owner info and counts
    const query = `
      SELECT 
        a.id,
        a.name,
        a.description,
        a.paymentStatus,
        a.dailyEnabled,
        a.createdAt,
        a.ownerId,
        u.firstName || ' ' || u.lastName as ownerName,
        u.email as ownerEmail,
        COUNT(DISTINCT c.id) as classCount,
        COUNT(DISTINCT t.id) as teacherCount,
        COUNT(DISTINCT e.userId) as studentCount,
        COUNT(DISTINCT e.id) as enrollmentCount,
        (
          SELECT COALESCE(SUM(
            CAST((strftime('%s', ls.endedAt) - strftime('%s', ls.startedAt)) AS INTEGER) / 60
          ), 0)
          FROM LiveStream ls
          JOIN Class cls ON ls.classId = cls.id
          WHERE cls.academyId = a.id
            AND ls.endedAt IS NOT NULL
            AND ls.startedAt IS NOT NULL
            AND ls.dailyRoomName IS NOT NULL
            AND ls.zoomMeetingId IS NULL
        ) as dailyCoMinutes
      FROM Academy a
      LEFT JOIN User u ON a.ownerId = u.id
      LEFT JOIN Class c ON a.id = c.academyId
      LEFT JOIN Teacher t ON a.id = t.academyId
      LEFT JOIN ClassEnrollment e ON c.id = e.classId AND e.status = 'APPROVED'
      WHERE a.id != 'demo-academy-id'
      GROUP BY a.id
      ORDER BY a.createdAt DESC
      LIMIT 200
    `;

    const result = await c.env.DB.prepare(query).all();
    
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Admin Academies] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /admin/payments - Get all payments (admin only)
admin.get('/payments', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const type = c.req.query('type'); // Filter by type (not used for enrollments)
    
    // Get all payments from Payment table
    const query = `
      SELECT 
        p.id,
        p.type,
        p.payerId,
        u.email as payerEmail,
        p.receiverId,
        a.name as receiverName,
        a.name as academyName,
        c.name as className,
        p.amount,
        p.currency,
        p.status,
        p.stripePaymentId,
        p.paymentMethod,
        JSON_EXTRACT(p.metadata, '$.className') as description,
        p.createdAt,
        p.completedAt
      FROM Payment p
      LEFT JOIN User u ON p.payerId = u.id
      LEFT JOIN Academy a ON p.receiverId = a.id
      LEFT JOIN Class c ON p.classId = c.id
      ORDER BY p.createdAt DESC
      LIMIT 500
    `;
    
    const result = await c.env.DB.prepare(query).all();
    
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Admin Payments] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /admin/classes - Get all classes across all academies (admin only)
admin.get('/classes', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const query = `
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.academyId,
        a.name as academyName,
        c.teacherId,
        u.firstName,
        u.lastName,
        u.firstName || ' ' || u.lastName as teacherName,
        u.email as teacherEmail,
        c.zoomAccountId,
        z.accountName as zoomAccountName,
        COUNT(DISTINCT e.userId) as studentCount,
        COUNT(DISTINCT l.id) as lessonCount,
        c.createdAt,
        c.carrera,
        c.university,
        c.monthlyPrice,
        c.oneTimePrice,
        c.startDate,
        c.whatsappGroupLink,
        c.maxStudents
      FROM Class c
      LEFT JOIN Academy a ON c.academyId = a.id
      LEFT JOIN User u ON c.teacherId = u.id
      LEFT JOIN ZoomAccount z ON c.zoomAccountId = z.id
      LEFT JOIN ClassEnrollment e ON c.id = e.classId AND e.status = 'APPROVED'
      LEFT JOIN Lesson l ON c.id = l.classId
      WHERE a.paymentStatus = 'PAID'
      GROUP BY c.id, c.name, c.slug, c.description, c.academyId, a.name, c.teacherId, u.firstName, u.lastName, u.email, c.zoomAccountId, z.accountName, c.createdAt, c.carrera, c.university, c.monthlyPrice, c.oneTimePrice, c.startDate, c.whatsappGroupLink, c.maxStudents
      ORDER BY c.createdAt DESC
      LIMIT 500
    `;

    const result = await c.env.DB.prepare(query).all();
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Admin Classes] Error:', error);
    console.error('[Admin Classes] Error stack:', error.stack);
    console.error('[Admin Classes] Error message:', error.message);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /admin/lessons - Get all lessons across all academies (admin only)
admin.get('/lessons', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const query = `
      SELECT 
        l.id,
        l.title,
        l.description,
        l.classId,
        c.name as className,
        c.academyId,
        a.name as academyName,
        COUNT(DISTINCT v.id) as videoCount,
        COUNT(DISTINCT d.id) as documentCount,
        l.releaseDate,
        l.createdAt
      FROM Lesson l
      LEFT JOIN Class c ON l.classId = c.id
      LEFT JOIN Academy a ON c.academyId = a.id
      LEFT JOIN Video v ON l.id = v.lessonId
      LEFT JOIN Document d ON l.id = d.lessonId
      GROUP BY l.id
      ORDER BY l.createdAt DESC
    `;

    const result = await c.env.DB.prepare(query).all();
    
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Admin Lessons] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PATCH /admin/academy/:id - Update academy (admin only)
admin.patch('/academy/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const academyId = c.req.param('id');
    const body = await c.req.json();
    
    const { paymentStatus, status, name, description, dailyEnabled } = body;
    
    const updates = [];
    const params = [];
    
    if (paymentStatus !== undefined) {
      updates.push('paymentStatus = ?');
      params.push(paymentStatus);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (dailyEnabled !== undefined) {
      updates.push('dailyEnabled = ?');
      params.push(dailyEnabled ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return c.json(errorResponse('No fields to update'), 400);
    }
    
    params.push(academyId);
    
    const query = `UPDATE Academy SET ${updates.join(', ')} WHERE id = ?`;
    await c.env.DB.prepare(query).bind(...params).run();

    void writeAuditLog(c.env.DB, {
      actorId: session.id,
      actorRole: session.role,
      action: 'ADMIN_UPDATE_ACADEMY',
      targetType: 'Academy',
      targetId: academyId,
      meta: { fields: Object.keys(body) },
      ip: c.req.header('CF-Connecting-IP') ?? undefined,
    });

    return c.json(successResponse({ id: academyId, updated: true }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Admin Update Academy] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /admin/teachers - Get all teachers (admin only)
admin.get('/teachers', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const query = `
      SELECT 
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        a.name as academyName,
        COUNT(DISTINCT c.id) as classCount,
        COUNT(DISTINCT e.userId) as studentCount,
        GROUP_CONCAT(DISTINCT c.name) as classNames,
        u.createdAt
      FROM User u
      LEFT JOIN Teacher t ON u.id = t.userId
      LEFT JOIN Academy a ON t.academyId = a.id
      LEFT JOIN Class c ON u.id = c.teacherId
      LEFT JOIN ClassEnrollment e ON c.id = e.classId AND e.status = 'APPROVED'
      WHERE u.role = 'TEACHER' AND (a.paymentStatus = 'PAID' OR a.paymentStatus IS NULL)
      GROUP BY u.id
      ORDER BY u.createdAt DESC
    `;

    const result = await c.env.DB.prepare(query).all();
    
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Admin Teachers] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /admin/students - Get all students (admin only)
admin.get('/students', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const query = `
      SELECT 
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        GROUP_CONCAT(DISTINCT a.name) as academyNames,
        COUNT(DISTINCT c.id) as classCount,
        COUNT(DISTINCT e.id) as enrollmentCount,
        u.createdAt
      FROM User u
      LEFT JOIN ClassEnrollment e ON u.id = e.userId AND e.status = 'APPROVED'
      LEFT JOIN Class c ON e.classId = c.id
      LEFT JOIN Academy a ON c.academyId = a.id
      WHERE u.role = 'STUDENT'
      GROUP BY u.id
      ORDER BY u.createdAt DESC
    `;

    const result = await c.env.DB.prepare(query).all();
    
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Admin Students] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /admin/zoom-accounts - Get all Zoom accounts (admin only)
admin.get('/zoom-accounts', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const query = `
      SELECT 
        id,
        accountId,
        accountName,
        createdAt,
        updatedAt
      FROM ZoomAccount
      ORDER BY createdAt DESC
    `;

    const result = await c.env.DB.prepare(query).all();
    
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Admin Zoom Accounts] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /admin/classes - Enhanced to include Zoom account info
// (Already exists above but needs to be updated to include zoomAccountId and zoomAccountName)

// PATCH /admin/classes/:id/assign-zoom - Assign Zoom account to class (admin only)
admin.patch('/classes/:id/assign-zoom', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const classId = c.req.param('id');
    const body = await c.req.json();
    const { zoomAccountId } = body;
    
    // Verify class exists
    const classCheck = await c.env.DB.prepare('SELECT id FROM Class WHERE id = ?').bind(classId).first();
    if (!classCheck) {
      return c.json(errorResponse('Class not found'), 404);
    }

    // If zoomAccountId provided, verify it exists
    if (zoomAccountId) {
      const zoomCheck = await c.env.DB.prepare('SELECT id FROM ZoomAccount WHERE id = ?').bind(zoomAccountId).first();
      if (!zoomCheck) {
        return c.json(errorResponse('Zoom account not found'), 404);
      }
    }

    // Update class with new Zoom account
    await c.env.DB.prepare(
      'UPDATE Class SET zoomAccountId = ? WHERE id = ?'
    ).bind(zoomAccountId || null, classId).run();

    void writeAuditLog(c.env.DB, {
      actorId: session.id,
      actorRole: session.role,
      action: 'ADMIN_ASSIGN_ZOOM',
      targetType: 'Class',
      targetId: classId,
      meta: { zoomAccountId: zoomAccountId ?? null },
      ip: c.req.header('CF-Connecting-IP') ?? undefined,
    });

    return c.json(successResponse({ message: 'Zoom account assigned successfully' }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Admin Assign Zoom] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// DELETE /admin/users/:id - Delete user account (admin only)
admin.delete('/users/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden - Admin access required'), 403);
    }

    const userId = c.req.param('id');

    // Get user details first
    const user = await c.env.DB.prepare('SELECT * FROM User WHERE id = ?').bind(userId).first<any>();
    
    if (!user) {
      return c.json(errorResponse(`User ${userId} not found`), 404);
    }


    // Role-specific deletion logic (same as the user self-delete endpoint)
    if (user.role === 'STUDENT') {
      // Delete student-specific data
      await c.env.DB.prepare('DELETE FROM ClassEnrollment WHERE userId = ?').bind(userId).run();
      await c.env.DB.prepare('DELETE FROM LessonRating WHERE studentId = ?').bind(userId).run();
      await c.env.DB.prepare('DELETE FROM VideoPlayState WHERE studentId = ?').bind(userId).run();
      
    } else if (user.role === 'TEACHER') {
      // Unassign teacher from classes
      await c.env.DB.prepare('UPDATE Class SET teacherId = NULL WHERE teacherId = ?').bind(userId).run();
      await c.env.DB.prepare('DELETE FROM Teacher WHERE userId = ?').bind(userId).run();
      await c.env.DB.prepare('DELETE FROM LiveStream WHERE teacherId = ?').bind(userId).run();
      
    } else if (user.role === 'ACADEMY') {
      // CASCADE DELETE: Delete entire academy using subquery DELETEs (no N+1)
      const academies = await c.env.DB.prepare('SELECT id FROM Academy WHERE ownerId = ?').bind(userId).all();
      
      for (const academy of (academies.results || [])) {
        const academyId = (academy as any).id;
        
        // Batch delete using subqueries — no nested loops needed
        await c.env.DB.batch([
          // Delete leaf entities first (Videos, Documents, Ratings for all lessons in all classes)
          c.env.DB.prepare('DELETE FROM Video WHERE lessonId IN (SELECT id FROM Lesson WHERE classId IN (SELECT id FROM Class WHERE academyId = ?))').bind(academyId),
          c.env.DB.prepare('DELETE FROM Document WHERE lessonId IN (SELECT id FROM Lesson WHERE classId IN (SELECT id FROM Class WHERE academyId = ?))').bind(academyId),
          c.env.DB.prepare('DELETE FROM LessonRating WHERE lessonId IN (SELECT id FROM Lesson WHERE classId IN (SELECT id FROM Class WHERE academyId = ?))').bind(academyId),
          c.env.DB.prepare('DELETE FROM VideoPlayState WHERE videoId IN (SELECT v.id FROM Video v JOIN Lesson l ON v.lessonId = l.id JOIN Class c ON l.classId = c.id WHERE c.academyId = ?)').bind(academyId),
          // Delete mid-level entities
          c.env.DB.prepare('DELETE FROM Lesson WHERE classId IN (SELECT id FROM Class WHERE academyId = ?)').bind(academyId),
          c.env.DB.prepare('DELETE FROM ClassEnrollment WHERE classId IN (SELECT id FROM Class WHERE academyId = ?)').bind(academyId),
          c.env.DB.prepare('DELETE FROM LiveStream WHERE classId IN (SELECT id FROM Class WHERE academyId = ?)').bind(academyId),
          c.env.DB.prepare('DELETE FROM Payment WHERE classId IN (SELECT id FROM Class WHERE academyId = ?)').bind(academyId),
          // Delete classes, teachers, and the academy
          c.env.DB.prepare('DELETE FROM Class WHERE academyId = ?').bind(academyId),
          c.env.DB.prepare('DELETE FROM Teacher WHERE academyId = ?').bind(academyId),
          c.env.DB.prepare('DELETE FROM Academy WHERE id = ?').bind(academyId),
        ]);
      }
      
    }

    // Delete device sessions
    await c.env.DB.prepare('DELETE FROM DeviceSession WHERE userId = ?').bind(userId).run();
    
    // Finally, delete the user
    await c.env.DB.prepare('DELETE FROM User WHERE id = ?').bind(userId).run();

    void writeAuditLog(c.env.DB, {
      actorId: session.id,
      actorRole: session.role,
      action: 'ADMIN_DELETE_USER',
      targetType: 'User',
      targetId: userId,
      meta: { email: user.email, role: user.role },
      ip: c.req.header('CF-Connecting-IP') ?? undefined,
    });

    return c.json(successResponse({ message: `User ${user.email} deleted successfully` }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Admin Delete Account] Error:', error);
    return c.json(errorResponse('Failed to delete user account'), 500);
  }
});

// ─── Academy Billing ───────────────────────────────────────────────────────

// GET /admin/academy/:id/billing
admin.get('/academy/:id/billing', async (c) => {
  const session = await requireAuth(c);
  if (session.role !== 'ADMIN') return c.json(errorResponse('Forbidden'), 403);
  const academyId = c.req.param('id');
  const rows = await c.env.DB
    .prepare('SELECT * FROM AcademyBilling WHERE academyId = ? ORDER BY year DESC, month DESC')
    .bind(academyId).all();
  return c.json(successResponse(rows.results ?? []));
});

// POST /admin/academy/:id/billing — upsert a billing record
admin.post('/academy/:id/billing', async (c) => {
  const session = await requireAuth(c);
  if (session.role !== 'ADMIN') return c.json(errorResponse('Forbidden'), 403);
  const academyId = c.req.param('id');
  const body = await c.req.json<{
    month: number; year: number;
    studentCount?: number; enrollmentCount?: number; teacherCount?: number;
    pricePerEnrollment?: number; notes?: string; paidAt?: string | null;
  }>();
  const { month, year } = body;
  if (!month || !year) return c.json(errorResponse('month and year required'), 400);

  // Try to auto-fill counts from DB if not provided
  let { studentCount, enrollmentCount, teacherCount } = body;
  if (studentCount === undefined || enrollmentCount === undefined || teacherCount === undefined) {
    try {
      const counts = await c.env.DB.prepare(`
        SELECT
          COUNT(DISTINCT ce.userId) AS enrollmentCount,
          COUNT(DISTINCT c.id) AS classCount
        FROM Class c
        LEFT JOIN ClassEnrollment ce ON ce.classId = c.id AND ce.status = 'active'
        WHERE c.academyId = (SELECT id FROM Academy WHERE id = ?)
      `).bind(academyId).first<{ enrollmentCount: number; classCount: number }>();
      if (enrollmentCount === undefined) enrollmentCount = counts?.enrollmentCount ?? 0;
      if (studentCount === undefined) studentCount = counts?.enrollmentCount ?? 0;

      if (teacherCount === undefined) {
        const tc = await c.env.DB.prepare(
          `SELECT COUNT(*) AS cnt FROM Teacher WHERE academyId = ?`
        ).bind(academyId).first<{ cnt: number }>();
        teacherCount = tc?.cnt ?? 0;
      }
    } catch { /* use 0 */ }
  }

  // Upsert
  const existing = await c.env.DB
    .prepare('SELECT id FROM AcademyBilling WHERE academyId = ? AND month = ? AND year = ?')
    .bind(academyId, month, year).first<{ id: string }>();
  const id = existing?.id ?? nanoid();
  await c.env.DB.prepare(`
    INSERT INTO AcademyBilling (id, academyId, month, year, studentCount, enrollmentCount, teacherCount, pricePerEnrollment, notes, paidAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(academyId, month, year) DO UPDATE SET
      studentCount = excluded.studentCount,
      enrollmentCount = excluded.enrollmentCount,
      teacherCount = excluded.teacherCount,
      pricePerEnrollment = excluded.pricePerEnrollment,
      notes = excluded.notes,
      paidAt = excluded.paidAt
  `).bind(
    id, academyId, month, year,
    studentCount ?? 0, enrollmentCount ?? 0, teacherCount ?? 0,
    body.pricePerEnrollment ?? 0,
    body.notes ?? null,
    body.paidAt ?? null,
  ).run();
  const record = await c.env.DB
    .prepare('SELECT * FROM AcademyBilling WHERE id = ?')
    .bind(id).first();

  void writeAuditLog(c.env.DB, {
    actorId: session.id,
    actorRole: session.role,
    action: 'ADMIN_UPSERT_BILLING',
    targetType: 'AcademyBilling',
    targetId: id,
    meta: { academyId, month, year, existing: !!existing?.id },
    ip: c.req.header('CF-Connecting-IP') ?? undefined,
  });

  return c.json(successResponse(record));
});

// DELETE /admin/academy/:id/billing/:billingId
admin.delete('/academy/:id/billing/:billingId', async (c) => {
  const session = await requireAuth(c);
  if (session.role !== 'ADMIN') return c.json(errorResponse('Forbidden'), 403);
  const academyId = c.req.param('id');
  const billingId = c.req.param('billingId');
  await c.env.DB.prepare('DELETE FROM AcademyBilling WHERE id = ?').bind(billingId).run();

  void writeAuditLog(c.env.DB, {
    actorId: session.id,
    actorRole: session.role,
    action: 'ADMIN_DELETE_BILLING',
    targetType: 'AcademyBilling',
    targetId: billingId,
    meta: { academyId },
    ip: c.req.header('CF-Connecting-IP') ?? undefined,
  });

  return c.json(successResponse({ deleted: true }));
});

// GET /admin/audit-logs - Query audit log (admin only)
admin.get('/audit-logs', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ADMIN') return c.json(errorResponse('Forbidden'), 403);

    const action = c.req.query('action');          // filter by action
    const actorId = c.req.query('actorId');        // filter by actor
    const targetId = c.req.query('targetId');      // filter by affected entity
    const limit = Math.min(parseInt(c.req.query('limit') ?? '100', 10), 500);

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (action)   { conditions.push('action = ?');   params.push(action); }
    if (actorId)  { conditions.push('actorId = ?');  params.push(actorId); }
    if (targetId) { conditions.push('targetId = ?'); params.push(targetId); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);

    const rows = await c.env.DB
      .prepare(`SELECT * FROM AuditLog ${where} ORDER BY createdAt DESC LIMIT ?`)
      .bind(...params)
      .all();

    return c.json(successResponse(rows.results ?? []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Admin Audit Logs] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /admin/daily-webhook-setup - Programmatically create or update the Daily.co webhook subscription
// Auth: valid ADMIN session cookie OR Authorization: Bearer <DAILY_API_KEY> (for terminal/curl use)
admin.get('/daily-webhook-setup', async (c) => {
  try {
    const apiKey = c.env.DAILY_API_KEY;
    const bearerToken = (c.req.header('Authorization') || '').replace(/^Bearer /, '');
    if (!bearerToken || !apiKey || bearerToken !== apiKey) {
      // Fall back to session auth
      const session = await requireAuth(c);
      if (session.role !== 'ADMIN') {
        return c.json(errorResponse('Forbidden'), 403);
      }
    }

    if (!apiKey) {
      return c.json(errorResponse('DAILY_API_KEY secret is not configured on this worker'), 500);
    }

    const webhookUrl = 'https://akademo-api.alexxvives.workers.dev/webhooks/daily';
    const eventTypes = ['meeting.ended', 'recording.started', 'recording.ready-to-download', 'participant.joined', 'participant.left'];
    const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

    // 1. List existing webhooks
    const listRes = await fetch('https://api.daily.co/v1/webhooks', { headers });
    if (!listRes.ok) {
      const err = await listRes.text();
      return c.json(errorResponse(`Daily API error listing webhooks: ${err}`), 502);
    }
    const listJson = await listRes.json() as any;
    // Daily returns a bare array (not { data: [] }) — handle both shapes defensively
    const webhooksList: Array<{ uuid: string; url: string; eventTypes: string[] }> =
      Array.isArray(listJson) ? listJson : (listJson.data || []);
    // Daily only allows 1 webhook per domain — always update the existing one if any, create only if none
    const existing = webhooksList[0];

    const body: Record<string, unknown> = { url: webhookUrl, eventTypes };
    // Pass our existing DAILY_WEBHOOK_SECRET as the hmac so verification continues to work
    if (c.env.DAILY_WEBHOOK_SECRET) {
      body.hmac = c.env.DAILY_WEBHOOK_SECRET;
    }

    let result: unknown;
    if (existing) {
      // Update the existing webhook (sets new URL + event types)
      const updateRes = await fetch(`https://api.daily.co/v1/webhooks/${existing.uuid}`, {
        method: 'POST', headers, body: JSON.stringify(body),
      });
      result = await updateRes.json();
      console.log(`[Admin] Daily webhook updated: uuid=${existing.uuid}`);
    } else {
      // No webhook exists yet — create one
      const createRes = await fetch('https://api.daily.co/v1/webhooks', {
        method: 'POST', headers, body: JSON.stringify(body),
      });
      result = await createRes.json();
      console.log('[Admin] Daily webhook created');
    }

    return c.json(successResponse({ action: existing ? 'updated' : 'created', webhook: result }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Admin] Daily webhook setup error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /admin/bulk-import - Bulk import teachers and students for an academy
admin.post('/bulk-import', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ADMIN' && session.role !== 'ACADEMY') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const { academyId, users: rows, classes: classRows = [] } = await c.req.json();
    if (!academyId || !Array.isArray(rows) || rows.length === 0) {
      return c.json(errorResponse('academyId and users array required'), 400);
    }
    if (rows.length > 500) {
      return c.json(errorResponse('Maximum 500 users per import'), 400);
    }

    // Verify academy exists and ACADEMY role owns it
    const academy = await c.env.DB
      .prepare('SELECT id, name, ownerId FROM Academy WHERE id = ?')
      .bind(academyId)
      .first() as any;
    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }
    if (session.role === 'ACADEMY' && academy.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized for this academy'), 403);
    }

    // Load all classes for this academy (for matching by name)
    const classesResult = await c.env.DB
      .prepare('SELECT id, name, monthlyPrice, oneTimePrice, startDate, cuotas FROM Class WHERE academyId = ?')
      .bind(academyId)
      .all();
    const classes = classesResult.results || [];
    const classMap = new Map<string, string>(); // lowercase name -> id
    const classPriceMap = new Map<string, { monthlyPrice: number | null; oneTimePrice: number | null; startDate: string | null; cuotas: number | null }>();
    for (const cls of classes) {
      classMap.set((cls.name as string).toLowerCase().trim(), cls.id as string);
      classPriceMap.set(cls.id as string, {
        monthlyPrice: cls.monthlyPrice as number | null,
        oneTimePrice: cls.oneTimePrice as number | null,
        startDate: cls.startDate as string | null,
        cuotas: cls.cuotas as number | null,
      });
    }

    let classesCreated = 0;
    const unmatchedClassNames = new Set<string>();
    const classResults: Array<{ name: string; status: 'created' | 'existed' | 'error'; message?: string }> = [];
    // Create any new classes from classRows that don't already exist
    if (Array.isArray(classRows) && classRows.length > 0) {
      const now = new Date().toISOString();
      const classTeacherMap = new Map<string, string>(); // classId → teacherEmail
      for (const cr of classRows) {
        const name = (cr.name || '').trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (classMap.has(key)) {
          classResults.push({ name, status: 'existed' });
          continue; // already exists
        }
        if (!cr.price || !cr.startDate) {
          classResults.push({ name, status: 'error' as any, message: `Missing required fields: ${[!cr.price && 'precio', !cr.startDate && 'fechaInicio'].filter(Boolean).join(', ')}` });
          continue;
        }
        const classId = crypto.randomUUID();
        const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        // Resolve slug collisions (slug is globally unique across all academies)
        let slug = baseSlug;
        let slugCounter = 1;
        while (true) {
          const existing = await c.env.DB.prepare('SELECT id FROM Class WHERE slug = ?').bind(slug).first();
          if (!existing) break;
          slug = `${baseSlug}-${slugCounter++}`;
        }
        const price = parseFloat(String(cr.price));
        const cuotas = cr.cuotas ? parseInt(String(cr.cuotas), 10) : 0;
        // precio in the Excel = per-installment monthly price (not total)
        // If cuotas → monthlyPrice = price (per-installment), oneTimePrice = null
        // If no cuotas → oneTimePrice = price (single one-time payment)
        const monthlyPrice = cuotas > 0 ? price : null;
        const oneTimePrice = cuotas > 0 ? null : price;
        const cuotasValue = cuotas > 0 ? cuotas : null;
        const startDate = normalizeDateForStorage(cr.startDate);
        const description = cr.description || null;
        const university = cr.university || null;
        const carrera = cr.carrera || null;
        const maxStudents = cr.maxStudents ?? null;
        const whatsappGroupLink = cr.whatsappGroupLink || null;
        await c.env.DB
          .prepare('INSERT INTO Class (id, name, slug, academyId, monthlyPrice, oneTimePrice, startDate, description, university, carrera, maxStudents, whatsappGroupLink, cuotas, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(classId, name, slug, academyId, monthlyPrice, oneTimePrice, startDate, description, university, carrera, maxStudents, whatsappGroupLink, cuotasValue, now)
          .run();
        classMap.set(key, classId);
        classPriceMap.set(classId, { monthlyPrice, oneTimePrice, startDate: startDate as string | null, cuotas: cuotasValue });
        classesCreated++;
        classResults.push({ name, status: 'created' });
        if (cr.teacherEmail) classTeacherMap.set(classId, cr.teacherEmail.toLowerCase().trim());
      }
      // Store for teacher assignment after users are processed
      (c as any)._classTeacherMap = classTeacherMap;
    }

    const results: Array<{
      row: number;
      email: string;
      role: string;
      status: 'created' | 'skipped' | 'error';
      message: string;
      tempPassword?: string;
    }> = [];
    // Track pagado enrollments: create COMPLETED payments before auto-sync so those students are never shown as pending
    const pagadoEnrollments: Array<{ userId: string; classId: string }> = [];
    // Track non-pagado enrollments: batch-create PENDING payments so they appear immediately in the academy dashboard
    const pendingEnrollments: Array<{ userId: string; classId: string; firstName: string; lastName: string; email: string }> = [];

    // Pre-batch existence checks to reduce sequential DB round-trips (saves ~2N queries)
    const uniqueEmails: string[] = [];
    const emailSet = new Set<string>();
    for (const row of rows) {
      const email = (row.email || '').toLowerCase().trim();
      if (email && !emailSet.has(email)) {
        emailSet.add(email);
        uniqueEmails.push(email);
      }
    }

    const existsInAcademySet = new Set<string>();
    const existingUserMap = new Map<string, { id: string; role: string }>();

    if (uniqueEmails.length > 0) {
      const [academyCheckResults, globalCheckResults] = await Promise.all([
        c.env.DB.batch(
          uniqueEmails.map(email =>
            c.env.DB.prepare(`
              SELECT u.id FROM User u
              LEFT JOIN Teacher t ON t.userId = u.id
              LEFT JOIN ClassEnrollment ce ON ce.userId = u.id
              LEFT JOIN Class c ON c.id = ce.classId OR c.teacherId = u.id
              WHERE u.email = ? AND (t.academyId = ? OR c.academyId = ?)
              LIMIT 1
            `).bind(email, academyId, academyId)
          )
        ),
        c.env.DB.batch(
          uniqueEmails.map(email =>
            c.env.DB.prepare('SELECT id, role FROM User WHERE email = ?').bind(email)
          )
        ),
      ]);

      for (let i = 0; i < uniqueEmails.length; i++) {
        if ((academyCheckResults[i] as any)?.results?.[0]) existsInAcademySet.add(uniqueEmails[i]);
        const row = (globalCheckResults[i] as any)?.results?.[0];
        if (row) existingUserMap.set(uniqueEmails[i], { id: String(row.id), role: String(row.role) });
      }
    }

    // ── Phase 1: Validate all rows and plan operations (no DB writes, no async) ──
    type UserPlan = {
      i: number; email: string; firstName: string; lastName: string; role: string;
      classIds: string[]; existingId: string | null; tempPassword: string | null;
      pagado: boolean; unmatchedClasses: string[];
    };
    const plans: UserPlan[] = [];
    const newUsersToHash: Array<{ plan: UserPlan; raw: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const email = (row.email || '').toLowerCase().trim();
      const firstName = (row.firstName || '').trim();
      const lastName = (row.lastName || '').trim();
      const role = (row.role || 'STUDENT').toUpperCase().trim();
      const classNames: string[] = (row.classNames || '')
        .split(',').map((n: string) => n.trim().toLowerCase()).filter(Boolean);

      if (!email || !firstName || !lastName) {
        results.push({ row: i + 1, email, role, status: 'error', message: 'Missing email, firstName, or lastName' });
        continue;
      }
      if (!['STUDENT', 'TEACHER'].includes(role)) {
        results.push({ row: i + 1, email, role, status: 'error', message: `Invalid role: ${role}. Must be STUDENT or TEACHER` });
        continue;
      }
      if (existsInAcademySet.has(email)) {
        results.push({ row: i + 1, email, role, status: 'skipped', message: 'User already exists in this academy' });
        continue;
      }

      const existing = existingUserMap.get(email) || null;
      const classIds = classNames.map(cn => classMap.get(cn)).filter(Boolean) as string[];
      const unmatchedClasses = classNames.filter(cn => !classMap.has(cn));
      const tempPassword = existing ? null : (firstName.slice(0, 3).toLowerCase() + Math.floor(10000 + Math.random() * 90000));

      const plan: UserPlan = {
        i, email, firstName, lastName, role, classIds,
        existingId: existing ? String(existing.id) : null,
        tempPassword, pagado: !!row.pagado, unmatchedClasses,
      };
      plans.push(plan);
      if (!existing && tempPassword) newUsersToHash.push({ plan, raw: tempPassword });
    }

    // ── Phase 2: Hash all new-user passwords in parallel (cost 8 — temp pwd, meant to be changed) ──
    const hashedPasswords = new Map<string, string>();
    await Promise.all(
      newUsersToHash.map(async ({ plan, raw }) => {
        const hashed = await bcrypt.hash(raw, 8);
        hashedPasswords.set(plan.email, hashed);
      })
    );

    // ── Phase 3: Build DB statements and collect tracking data (no sequential awaits) ──
    const dbStatements: D1PreparedStatement[] = [];
    const now = new Date().toISOString();

    for (const plan of plans) {
      const { email, firstName, lastName, role, classIds, existingId, tempPassword, pagado, unmatchedClasses } = plan;
      const userId = existingId ?? nanoid();

      // New user INSERT
      if (!existingId) {
        const hashed = hashedPasswords.get(email)!;
        dbStatements.push(
          c.env.DB.prepare('INSERT INTO User (id, email, password, firstName, lastName, role, createdAt, tempPassword) VALUES (?, ?, ?, ?, ?, ?, datetime("now"), ?)')
            .bind(userId, email, hashed, firstName, lastName, role, tempPassword)
        );
      }

      if (role === 'TEACHER') {
        // Teacher record
        dbStatements.push(
          c.env.DB.prepare('INSERT INTO Teacher (id, userId, academyId, createdAt) VALUES (?, ?, ?, ?)')
            .bind(nanoid(), userId, academyId, now)
        );
        // Assign to classes
        for (const classId of classIds) {
          dbStatements.push(
            c.env.DB.prepare('UPDATE Class SET teacherId = ? WHERE id = ? AND academyId = ?')
              .bind(userId, classId, academyId)
          );
        }
      }

      if (role === 'STUDENT') {
        for (const classId of classIds) {
          const enrollmentId = nanoid();
          const classPrice = classPriceMap.get(classId);
          const paymentFrequency = classPrice?.monthlyPrice ? 'MONTHLY' : 'ONE_TIME';
          dbStatements.push(
            c.env.DB.prepare('INSERT INTO ClassEnrollment (id, classId, userId, status, enrolledAt, documentSigned, paymentFrequency) VALUES (?, ?, ?, ?, datetime("now"), ?, ?)')
              .bind(enrollmentId, classId, userId, 'APPROVED', 0, paymentFrequency)
          );
          if (pagado) {
            pagadoEnrollments.push({ userId, classId });
          } else {
            pendingEnrollments.push({ userId, classId, firstName, lastName, email });
          }
        }
      }

      for (const cn of unmatchedClasses) { unmatchedClassNames.add(cn); }
      const msg = unmatchedClasses.length > 0
        ? `Created. Unmatched classes: ${unmatchedClasses.join(', ')}`
        : existingId ? 'Added to academy' : 'Created successfully';
      results.push({ row: plan.i + 1, email, role, status: 'created', message: msg, tempPassword: tempPassword ?? '' });
    }

    // ── Phase 4: Execute all user/teacher/enrollment inserts in one batch ──
    if (dbStatements.length > 0) {
      // D1 batch limit is 100 statements — chunk if needed
      for (let s = 0; s < dbStatements.length; s += 100) {
        await c.env.DB.batch(dbStatements.slice(s, s + 100));
      }
    }

    // Assign teachers to newly created classes (resolve email → userId)
    // Batch: collect all teacher assignments, resolve emails, then batch-update
    const classTeacherMap: Map<string, string> = (c as any)._classTeacherMap || new Map();
    if (classTeacherMap.size > 0) {
      const teacherEmails = [...new Set(classTeacherMap.values())];
      const teacherLookups = await c.env.DB.batch(
        teacherEmails.map(e => c.env.DB.prepare('SELECT id, LOWER(email) as email FROM User WHERE LOWER(email) = ?').bind(e))
      );
      const emailToId = new Map<string, string>();
      for (const r of teacherLookups) {
        const row = r.results?.[0] as any;
        if (row) emailToId.set(row.email, row.id);
      }
      const teacherUpdates = [];
      for (const [classId, teacherEmail] of classTeacherMap) {
        const teacherId = emailToId.get(teacherEmail);
        if (teacherId) {
          teacherUpdates.push(c.env.DB.prepare('UPDATE Class SET teacherId = ? WHERE id = ?').bind(teacherId, classId));
        }
      }
      if (teacherUpdates.length > 0) await c.env.DB.batch(teacherUpdates);
    }

    // Create COMPLETED payment records for pagado students — batch insert
    if (pagadoEnrollments.length > 0) {
      const pagadoStatements = [];
      for (const { userId, classId } of pagadoEnrollments) {
        const classPrice = classPriceMap.get(classId);
        if (!classPrice) continue;
        const paymentFrequency = classPrice.monthlyPrice ? 'MONTHLY' : 'ONE_TIME';
        const dummyRow: BillingEnrollmentRow = {
          enrollmentId: '', studentId: userId, classId,
          enrolledAt: new Date().toISOString(), paymentFrequency, paymentMethod: null,
          monthlyPrice: classPrice.monthlyPrice, oneTimePrice: classPrice.oneTimePrice,
          classStartDate: classPrice.startDate,
          firstName: '', lastName: '', email: '',
          academyId: academy.id, academyName: academy.name,
          totalPaid: 0,
          cuotas: classPrice.cuotas,
        };
        const derived = deriveBillingState(dummyRow);
        if (derived.amountOwed > 0) {
          pagadoStatements.push(
            c.env.DB
              .prepare(`INSERT INTO Payment (id, type, payerId, receiverId, amount, currency, status, paymentMethod, classId, metadata, completedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
              .bind(
                crypto.randomUUID(), 'STUDENT_TO_ACADEMY', userId, academy.id,
                derived.amountOwed, 'EUR', 'COMPLETED', 'cash', classId,
                JSON.stringify({ source: 'bulk-import', pagado: true }),
              )
          );
        }
      }
      if (pagadoStatements.length > 0) await c.env.DB.batch(pagadoStatements);
    }

    // Create PENDING payment records for non-pagado students so they appear immediately in the dashboard
    if (pendingEnrollments.length > 0) {
      const pendingStatements = [];
      for (const { userId, classId, firstName, lastName, email } of pendingEnrollments) {
        const classPrice = classPriceMap.get(classId);
        if (!classPrice) continue;
        const paymentFrequency = classPrice.monthlyPrice ? 'MONTHLY' : 'ONE_TIME';
        const dummyRow: BillingEnrollmentRow = {
          enrollmentId: '', studentId: userId, classId,
          enrolledAt: new Date().toISOString(), paymentFrequency, paymentMethod: null,
          monthlyPrice: classPrice.monthlyPrice, oneTimePrice: classPrice.oneTimePrice,
          classStartDate: classPrice.startDate,
          firstName, lastName, email,
          academyId: academy.id, academyName: academy.name,
          totalPaid: 0,
          cuotas: classPrice.cuotas,
        };
        const derived = deriveBillingState(dummyRow);
        const amount = derived.amountOwed;
        const description = derived.description;
        if (amount > 0) {
          pendingStatements.push(
            c.env.DB
              .prepare(`INSERT INTO Payment (id, type, payerId, payerType, payerName, payerEmail, receiverId, receiverName, amount, currency, status, paymentMethod, classId, description, metadata, nextPaymentDue, billingCycleEnd, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
              .bind(
                crypto.randomUUID(), 'STUDENT_TO_ACADEMY', userId, 'STUDENT',
                `${firstName} ${lastName}`, email,
                academy.id, academy.name,
                amount, 'EUR', 'PENDING', 'cash', classId,
                description,
                JSON.stringify({ autoCreated: true, source: 'bulk-import', monthsOwed: derived.monthsOwed || 1 }),
                derived.nextPaymentDue || classPrice.startDate, derived.billingCycleEnd,
              )
          );
        }
      }
      if (pendingStatements.length > 0) await c.env.DB.batch(pendingStatements);
    }

    // Pending payments are batch-inserted above. The lazy sync in GET /classes
    // and GET /payments/my-payments will reconcile amounts if billing state changes later.

    const created = results.filter(r => r.status === 'created').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const errors = results.filter(r => r.status === 'error').length;

    await writeAuditLog(c.env.DB, {
      actorId: session.id,
      actorRole: session.role,
      action: 'ADMIN_BULK_IMPORT',
      targetType: 'User',
      targetId: academyId,
      meta: { created, skipped, errors, academyName: academy.name },
    });

    return c.json(successResponse({ created, skipped, errors, total: rows.length, classesCreated, classesUnmatched: unmatchedClassNames.size, classResults, results }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    const msg = error?.message || String(error);
    console.error('[Admin Bulk Import] Error:', msg, error?.stack || '');
    return c.json(errorResponse(`Error: ${msg}`), 500);
  }
});

// POST /admin/send-welcome-emails - Send onboarding emails to bulk-imported users
admin.post('/send-welcome-emails', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const { academyName, users } = await c.req.json();
    if (!academyName || !Array.isArray(users) || users.length === 0) {
      return c.json(errorResponse('academyName and users array required'), 400);
    }
    if (users.length > 500) {
      return c.json(errorResponse('Maximum 500 users per batch'), 400);
    }

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const { email, firstName, role, tempPassword } = user;
      if (!email || !firstName || !tempPassword) { failed++; continue; }
      const roleLabel = role === 'TEACHER' ? 'profesor' : 'alumno';
      try {
        const ok = await sendEmail(c.env, {
          from: 'AKADEMO <onboarding@akademo-edu.com>',
          to: email,
          subject: `Tus credenciales de acceso — ${academyName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #f8fafc; padding: 24px;">
              <div style="background-color: #0f172a; padding: 32px 40px; border-radius: 12px 12px 0 0;">
                <p style="color: #94a3b8; margin: 0 0 4px 0; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Bienvenido a</p>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${academyName}</h1>
              </div>
              <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Hola, ${firstName}</p>
                <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">Has sido dado de alta como ${roleLabel} en <strong style="color: #0f172a;">${academyName}</strong>. A continuación tienes tus credenciales de acceso.</p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin-bottom: 24px;">
                  <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Correo electrónico</p>
                  <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 15px; font-weight: 500;">${email}</p>
                  <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Contraseña temporal</p>
                  <div style="background-color: #1e293b; border-radius: 8px; padding: 14px 20px; text-align: center;">
                    <span style="color: #e2e8f0; font-size: 22px; font-weight: 700; letter-spacing: 4px; font-family: 'Courier New', Courier, monospace;">${tempPassword}</span>
                  </div>
                </div>
                <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin-bottom: 28px;">
                  <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;"><strong>Importante:</strong> Cambia tu contraseña al iniciar sesión por primera vez.</p>
                </div>
                <div style="text-align: center; margin-bottom: 36px;">
                  <a href="https://akademo-edu.com" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 15px; font-weight: 600;">Acceder a la plataforma →</a>
                </div>
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0; padding-top: 24px; border-top: 1px solid #f1f5f9;">Saludos,<br><strong style="color: #475569;">Equipo de ${academyName}</strong></p>
              </div>
              <p style="text-align: center; color: #cbd5e1; font-size: 11px; margin: 16px 0 0 0;">Powered by AKADEMO · akademo-edu.com</p>
            </div>
          `,
        });
        if (ok) sent++; else failed++;
      } catch (emailErr) {
        console.error('[Send Welcome Emails] Email failed:', emailErr);
        failed++;
      }
    }

    return c.json(successResponse({ sent, failed }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Send Welcome Emails] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default admin;
