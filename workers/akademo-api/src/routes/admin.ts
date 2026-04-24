import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, hashPassword } from '../lib/auth';
import bcrypt from 'bcryptjs';
import { successResponse, errorResponse, escapeHtml } from '../lib/utils';
import { nanoid } from 'nanoid';
import { autoCreatePendingPayments, normalizeDateForStorage } from '../lib/payment-utils';
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
      // Delete student-specific data — atomic batch
      await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM ClassEnrollment WHERE userId = ?').bind(userId),
        c.env.DB.prepare('DELETE FROM LessonRating WHERE studentId = ?').bind(userId),
        c.env.DB.prepare('DELETE FROM VideoPlayState WHERE studentId = ?').bind(userId),
      ]);
      
    } else if (user.role === 'TEACHER') {
      // Unassign teacher from classes — atomic batch
      await c.env.DB.batch([
        c.env.DB.prepare('UPDATE Class SET teacherId = NULL WHERE teacherId = ?').bind(userId),
        c.env.DB.prepare('DELETE FROM Teacher WHERE userId = ?').bind(userId),
        c.env.DB.prepare('DELETE FROM LiveStream WHERE teacherId = ?').bind(userId),
      ]);
      
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

    // Delete device sessions and user — atomic batch
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM DeviceSession WHERE userId = ?').bind(userId),
      c.env.DB.prepare('DELETE FROM User WHERE id = ?').bind(userId),
    ]);

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

    const { academyId, users: rows, classes: classRows = [], quizzes: quizRows = [], questions: questionRows = [], files: fileRows = [], documents: documentRows = [], approveAll = false } = await c.req.json();
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

    const t0 = Date.now();
    const log = (msg: string) => console.log(`[bulk-import +${Date.now() - t0}ms] ${msg}`);
    log(`start — users=${rows.length}, classes=${classRows.length}, quizzes=${quizRows.length}, questions=${questionRows.length}, files=${fileRows.length}, documents=${documentRows.length}, approveAll=${approveAll}`);

    // Load all classes for this academy (for matching by name)
    const classesResult = await c.env.DB
      .prepare('SELECT id, name, monthlyPrice, oneTimePrice, startDate, cuotas, teacherId FROM Class WHERE academyId = ?')
      .bind(academyId)
      .all();
    const classes = classesResult.results || [];
    const classMap = new Map<string, string>(); // lowercase name -> id
    const classTeacherIdMap = new Map<string, string | null>(); // classId -> teacherId
    const classPriceMap = new Map<string, { monthlyPrice: number | null; oneTimePrice: number | null; startDate: string | null; cuotas: number | null }>();
    for (const cls of classes) {
      classMap.set((cls.name as string).toLowerCase().trim(), cls.id as string);
      classTeacherIdMap.set(cls.id as string, cls.teacherId as string | null);
      classPriceMap.set(cls.id as string, {
        monthlyPrice: cls.monthlyPrice as number | null,
        oneTimePrice: cls.oneTimePrice as number | null,
        startDate: cls.startDate as string | null,
        cuotas: cls.cuotas as number | null,
      });
    }
    log(`loaded ${classes.length} existing classes`);

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
        if (!cr.startDate) {
          classResults.push({ name, status: 'error' as any, message: 'Missing required field: fechaInicio' });
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
        // If no price is provided the class is created unpublished (isPublished=0).
        // The academy must set a price before students can enroll or see the class.
        const hasPrice = !!cr.price;
        const price = hasPrice ? parseFloat(String(cr.price)) : null;
        const cuotas = cr.cuotas ? parseInt(String(cr.cuotas), 10) : 0;
        // precio in the Excel = per-installment monthly price (not total)
        // If cuotas → monthlyPrice = price (per-installment), oneTimePrice = null
        // If no cuotas → oneTimePrice = price (single one-time payment)
        const monthlyPrice = (price !== null && cuotas > 0) ? price : null;
        const oneTimePrice = (price !== null && cuotas === 0) ? price : null;
        const cuotasValue = cuotas > 0 ? cuotas : null;
        const isPublished = hasPrice ? 1 : 0;
        const startDate = normalizeDateForStorage(cr.startDate);
        const description = cr.description || null;
        const university = cr.university || null;
        const carrera = cr.carrera || null;
        const maxStudents = cr.maxStudents ?? null;
        const whatsappGroupLink = cr.whatsappGroupLink || null;
        await c.env.DB
          .prepare('INSERT INTO Class (id, name, slug, academyId, monthlyPrice, oneTimePrice, startDate, description, university, carrera, maxStudents, whatsappGroupLink, cuotas, isPublished, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(classId, name, slug, academyId, monthlyPrice, oneTimePrice, startDate, description, university, carrera, maxStudents, whatsappGroupLink, cuotasValue, isPublished, now)
          .run();
        classMap.set(key, classId);
        classPriceMap.set(classId, { monthlyPrice, oneTimePrice, startDate: startDate as string | null, cuotas: cuotasValue });
        classesCreated++;
        // Note: isPublished=0 classes are created but won't be visible until the academy adds a price
        classResults.push({ name, status: 'created' });
        if (cr.teacherEmail) classTeacherMap.set(classId, cr.teacherEmail.toLowerCase().trim());
      }
      // Store for teacher assignment after users are processed
      (c as any)._classTeacherMap = classTeacherMap;
    }

    // Auto-create AcademicYear periods for each distinct calendar year found in class start dates
    {
      const allYears = new Set<number>();
      // Collect from existing DB classes
      for (const cls of classes) {
        if (cls.startDate) {
          const y = new Date(cls.startDate as string).getFullYear();
          if (!isNaN(y)) allYears.add(y);
        }
      }
      // Collect from newly imported classRows
      for (const cr of classRows) {
        if (cr.startDate) {
          const normalised = normalizeDateForStorage(cr.startDate);
          if (normalised) {
            const y = new Date(normalised as string).getFullYear();
            if (!isNaN(y)) allYears.add(y);
          }
        }
      }
      if (allYears.size > 0) {
        const existingPeriods = await c.env.DB
          .prepare('SELECT id, startDate, isCurrent FROM AcademicYear WHERE academyId = ?')
          .bind(academyId)
          .all();
        const existingYears = new Set<number>();
        for (const ep of (existingPeriods.results || [])) {
          if (ep.startDate) existingYears.add(new Date(ep.startDate as string).getFullYear());
        }
        const hasCurrentPeriod = (existingPeriods.results || []).some(ep => (ep.isCurrent as number) === 1);
        const sortedYears = Array.from(allYears).sort((a, b) => b - a);
        const periodsToCreate: Array<{ id: string; name: string; startDate: string; endDate: string; isCurrent: number }> = [];
        for (const year of sortedYears) {
          if (existingYears.has(year)) continue;
          const isCurrent = (!hasCurrentPeriod && year === sortedYears[0]) ? 1 : 0;
          periodsToCreate.push({
            id: crypto.randomUUID(),
            name: `Año ${year}`,
            startDate: `${year}-01-01`,
            endDate: `${year}-12-31`,
            isCurrent,
          });
        }
        if (periodsToCreate.length > 0) {
          if (periodsToCreate.some(p => p.isCurrent === 1)) {
            await c.env.DB.prepare('UPDATE AcademicYear SET isCurrent = 0 WHERE academyId = ?').bind(academyId).run();
          }
          for (const p of periodsToCreate) {
            await c.env.DB
              .prepare(`INSERT INTO AcademicYear (id, academyId, name, startDate, endDate, isCurrent, createdAt) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`)
              .bind(p.id, academyId, p.name, p.startDate, p.endDate, p.isCurrent)
              .run();
          }
          log(`created ${periodsToCreate.length} academic year periods: ${periodsToCreate.map(p => p.name).join(', ')}`);
        }
      }
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
      // D1 batch limit is 100 statements — chunk pre-checks to avoid runtime crash on large imports
      const D1_CHUNK = 100;
      const academyCheckResults: any[] = [];
      const globalCheckResults: any[] = [];
      for (let s = 0; s < uniqueEmails.length; s += D1_CHUNK) {
        const slice = uniqueEmails.slice(s, s + D1_CHUNK);
        const [aBatch, gBatch] = await Promise.all([
          c.env.DB.batch(
            slice.map(email =>
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
            slice.map(email =>
              c.env.DB.prepare('SELECT id, role FROM User WHERE email = ?').bind(email)
            )
          ),
        ]);
        academyCheckResults.push(...aBatch);
        globalCheckResults.push(...gBatch);
      }

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
      const rawRole = (row.role || 'STUDENT').toUpperCase().trim();
      // Moodle exports 'editingteacher' — normalise to TEACHER
      const role = rawRole === 'EDITINGTEACHER' ? 'TEACHER' : rawRole;
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
        tempPassword, pagado: approveAll || !!row.pagado, unmatchedClasses,
      };
      plans.push(plan);
      if (!existing && tempPassword) newUsersToHash.push({ plan, raw: tempPassword });
    }

    // ── Phase 2: Hash all new-user passwords sequentially (cost 4 — temp pwd, changed on first login) ──
    // Sequential to avoid saturating Worker CPU with many parallel bcrypt operations
    const hashedPasswords = new Map<string, string>();
    for (const { plan, raw } of newUsersToHash) {
      const hashed = await bcrypt.hash(raw, 4);
      hashedPasswords.set(plan.email, hashed);
    }

    // ── Phase 3: Build DB statements and collect tracking data (no sequential awaits) ──
    const dbStatements: D1PreparedStatement[] = [];
    const now = new Date().toISOString();
    // Track newly created users in this import: email → userId
    // Prevents duplicate INSERTs when the same student appears on multiple rows (one row per enrollment)
    const newUserIdMap = new Map<string, string>();

    for (const plan of plans) {
      const { email, firstName, lastName, role, classIds, existingId, tempPassword, pagado, unmatchedClasses } = plan;

      // Resolve userId: existing DB user > already-planned new user > brand new
      let userId: string;
      if (existingId) {
        userId = existingId;
      } else if (newUserIdMap.has(email)) {
        userId = newUserIdMap.get(email)!;
        // User INSERT already queued for this email — skip to enrollments below
      } else {
        userId = nanoid();
        newUserIdMap.set(email, userId);
        const hashed = hashedPasswords.get(email)!;
        dbStatements.push(
          c.env.DB.prepare('INSERT INTO User (id, email, password, firstName, lastName, role, createdAt, tempPassword) VALUES (?, ?, ?, ?, ?, ?, datetime("now"), ?)')
            .bind(userId, email, hashed, firstName, lastName, role, tempPassword)
        );
      }

      if (role === 'TEACHER') {
        // Teacher record — ON CONFLICT to handle re-imports safely
        dbStatements.push(
          c.env.DB.prepare('INSERT INTO Teacher (id, userId, academyId, createdAt) VALUES (?, ?, ?, ?) ON CONFLICT(userId, academyId) DO NOTHING')
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
            c.env.DB.prepare('INSERT INTO ClassEnrollment (id, classId, userId, status, enrolledAt, documentSigned, paymentFrequency) VALUES (?, ?, ?, ?, datetime("now"), ?, ?) ON CONFLICT(classId, userId) DO UPDATE SET status = ?')
              .bind(enrollmentId, classId, userId, 'APPROVED', 0, paymentFrequency, 'APPROVED')
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
        // For migrations, always create a completed payment regardless of class start date.
        // Use per-installment amount (monthlyPrice) or full one-time amount.
        // For legacy migrations the class may have no price yet — still create a $0 completed payment
        // so the student is never shown as "pending payment" in the academy dashboard.
        const amount = classPrice.monthlyPrice ?? classPrice.oneTimePrice ?? 0;
        pagadoStatements.push(
          c.env.DB
            .prepare(`INSERT INTO Payment (id, type, payerId, receiverId, amount, currency, status, paymentMethod, classId, metadata, completedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
            .bind(
              crypto.randomUUID(), 'STUDENT_TO_ACADEMY', userId, academy.id,
              amount, 'EUR', 'COMPLETED', 'migration', classId,
              JSON.stringify({ source: 'bulk-import', pagado: true }),
            )
        );
      }
      if (pagadoStatements.length > 0) {
        for (let s = 0; s < pagadoStatements.length; s += 100) {
          await c.env.DB.batch(pagadoStatements.slice(s, s + 100));
        }
      }
    }

    // Create PENDING payment records for non-pagado students so they appear immediately in the dashboard
    if (pendingEnrollments.length > 0) {
      const pendingStatements = [];
      for (const { userId, classId, firstName, lastName, email } of pendingEnrollments) {
        const classPrice = classPriceMap.get(classId);
        if (!classPrice) continue;
        // For migrations, always create a pending payment regardless of class start date.
        // Use per-installment amount (monthlyPrice) or full one-time amount.
        const amount = classPrice.monthlyPrice ?? classPrice.oneTimePrice;
        const description = classPrice.monthlyPrice ? 'Pago pendiente mensual' : 'Pago único pendiente';
        if (amount && amount > 0) {
          pendingStatements.push(
            c.env.DB
              .prepare(`INSERT INTO Payment (id, type, payerId, payerType, payerName, payerEmail, receiverId, receiverName, amount, currency, status, paymentMethod, classId, description, metadata, nextPaymentDue, billingCycleEnd, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
              .bind(
                crypto.randomUUID(), 'STUDENT_TO_ACADEMY', userId, 'STUDENT',
                `${firstName} ${lastName}`, email,
                academy.id, academy.name,
                amount, 'EUR', 'PENDING', 'cash', classId,
                description,
                JSON.stringify({ autoCreated: true, source: 'bulk-import', monthsOwed: 1 }),
                classPrice.startDate, null,
              )
          );
        }
      }
      if (pendingStatements.length > 0) {
        for (let s = 0; s < pendingStatements.length; s += 100) {
          await c.env.DB.batch(pendingStatements.slice(s, s + 100));
        }
      }
    }

    // Pending payments are batch-inserted above. The lazy sync in GET /classes
    // and GET /payments/my-payments will reconcile amounts if billing state changes later.

    // ── Quiz & Question import ──────────────────────────────────────────────────
    const MOODLE_DATA_ROOT = '/home/customer/www/maximoexponente.es/campus/moodledata/filedir';
    let quizzesCreated = 0;
    let questionsCreatedCount = 0;
    const quizResultsList: Array<{ quizName: string; courseName: string; questionsCount: number; status: 'created' | 'skipped' | 'error'; message?: string }> = [];
    const pdfManifest: Array<{ fileTitle: string; courseName: string; filename: string; fileSizeKB: number; sitegroundPath: string }> = [];

    if (Array.isArray(quizRows) && quizRows.length > 0 && Array.isArray(questionRows)) {
      // Helper: strip HTML tags and decode entities
      const stripHtml = (str: string) => String(str || '')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        // Spanish and common accented characters
        .replace(/&aacute;/g, 'á').replace(/&Aacute;/g, 'Á')
        .replace(/&eacute;/g, 'é').replace(/&Eacute;/g, 'É')
        .replace(/&iacute;/g, 'í').replace(/&Iacute;/g, 'Í')
        .replace(/&oacute;/g, 'ó').replace(/&Oacute;/g, 'Ó')
        .replace(/&uacute;/g, 'ú').replace(/&Uacute;/g, 'Ú')
        .replace(/&ntilde;/g, 'ñ').replace(/&Ntilde;/g, 'Ñ')
        .replace(/&uuml;/g, 'ü').replace(/&Uuml;/g, 'Ü')
        .replace(/&agrave;/g, 'à').replace(/&Agrave;/g, 'À')
        .replace(/&egrave;/g, 'è').replace(/&Egrave;/g, 'È')
        .replace(/&igrave;/g, 'ì').replace(/&Igrave;/g, 'Ì')
        .replace(/&ograve;/g, 'ò').replace(/&Ograve;/g, 'Ò')
        .replace(/&ugrave;/g, 'ù').replace(/&Ugrave;/g, 'Ù')
        .replace(/&auml;/g, 'ä').replace(/&Auml;/g, 'Ä')
        .replace(/&euml;/g, 'ë').replace(/&Euml;/g, 'Ë')
        .replace(/&iuml;/g, 'ï').replace(/&Iuml;/g, 'Ï')
        .replace(/&ouml;/g, 'ö').replace(/&Ouml;/g, 'Ö')
        .replace(/&acirc;/g, 'â').replace(/&Acirc;/g, 'Â')
        .replace(/&ecirc;/g, 'ê').replace(/&Ecirc;/g, 'Ê')
        .replace(/&icirc;/g, 'î').replace(/&Icirc;/g, 'Î')
        .replace(/&ocirc;/g, 'ô').replace(/&Ocirc;/g, 'Ô')
        .replace(/&ucirc;/g, 'û').replace(/&Ucirc;/g, 'Û')
        .replace(/&ccedil;/g, 'ç').replace(/&Ccedil;/g, 'Ç')
        .replace(/&iexcl;/g, '¡').replace(/&iquest;/g, '¿')
        .replace(/&laquo;/g, '«').replace(/&raquo;/g, '»')
        .replace(/&mdash;/g, '\u2014').replace(/&ndash;/g, '\u2013')
        .replace(/&ldquo;/g, '\u201C').replace(/&rdquo;/g, '\u201D')
        .replace(/&lsquo;/g, '\u2018').replace(/&rsquo;/g, '\u2019')
        .replace(/&hellip;/g, '\u2026').replace(/&bull;/g, '\u2022')
        .replace(/&deg;/g, '°').replace(/&plusmn;/g, '±')
        .replace(/&times;/g, '×').replace(/&divide;/g, '÷')
        // Numeric decimal and hex entities
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\s+/g, ' ')
        .trim();

      // Build quiz map: quizId → { quizName, courseName, description }
      const quizMap = new Map<string, { quizName: string; courseName: string; description: string }>();
      for (const row of quizRows) {
        const quizId = String(row.quizId || '').trim();
        if (!quizId) continue;
        quizMap.set(quizId, {
          quizName: stripHtml(row.quizName || ''),
          courseName: String(row.courseName || '').trim(),
          description: stripHtml(row.quizDescription || ''),
        });
      }

      // Build questions grouped by quizId → questionId → { text, answers[] }
      const questionsByQuiz = new Map<string, Map<string, { text: string; answers: Array<{ id: string; text: string; correct: boolean }> }>>();
      for (const row of questionRows) {
        const quizId = String(row.quizId || '').trim();
        const qId = String(row.questionId || '').trim();
        if (!quizId || !qId) continue;

        if (!questionsByQuiz.has(quizId)) questionsByQuiz.set(quizId, new Map());
        const qMap = questionsByQuiz.get(quizId)!;

        if (!qMap.has(qId)) {
          qMap.set(qId, { text: stripHtml(row.questionText || ''), answers: [] });
        }
        qMap.get(qId)!.answers.push({
          id: String(row.answerId || '').trim(),
          text: stripHtml(row.answerText || ''),
          correct: parseFloat(String(row.isCorrect || '0')) === 1,
        });
      }

      // Create Assignment + QuizQuestion records — flush incrementally to avoid OOM (30K+ statements)
      let pendingQuizStatements: D1PreparedStatement[] = [];
      const FLUSH_AT = 100; // D1 batch limit
      const flushQuizStatements = async () => {
        if (pendingQuizStatements.length === 0) return;
        await c.env.DB.batch(pendingQuizStatements);
        pendingQuizStatements = [];
      };
      const now = new Date().toISOString();

      // Batch-load all existing quiz assignments for this academy in one query (avoids 258 sequential SELECTs)
      const classIdsArr = Array.from(classMap.values());
      const existingAssignmentTitles = new Set<string>(); // key: `${classId}::${title}`
      if (classIdsArr.length > 0) {
        // SQL has a hard limit on placeholder count (~999) — chunk the IN clause if needed
        for (let s = 0; s < classIdsArr.length; s += 200) {
          const slice = classIdsArr.slice(s, s + 200);
          const placeholders = slice.map(() => '?').join(',');
          const existingRes = await c.env.DB
            .prepare(`SELECT classId, title FROM Assignment WHERE type = 'quiz' AND classId IN (${placeholders})`)
            .bind(...slice)
            .all();
          for (const r of (existingRes.results || []) as Array<{ classId: string; title: string }>) {
            existingAssignmentTitles.add(`${r.classId}::${r.title}`);
          }
        }
      }
      log(`pre-loaded ${existingAssignmentTitles.size} existing quiz assignments`);

      for (const [moodleQuizId, quiz] of quizMap.entries()) {
        const questions = questionsByQuiz.get(moodleQuizId);
        if (!questions || questions.size === 0) {
          quizResultsList.push({ quizName: quiz.quizName, courseName: quiz.courseName, questionsCount: 0, status: 'skipped', message: 'Sin preguntas' });
          continue;
        }

        // Resolve class by course name
        const classId = classMap.get(quiz.courseName.toLowerCase().trim());
        if (!classId) {
          quizResultsList.push({ quizName: quiz.quizName, courseName: quiz.courseName, questionsCount: questions.size, status: 'error', message: 'Asignatura no encontrada' });
          continue;
        }

        const title = quiz.quizName || `Quiz ${moodleQuizId}`;
        if (existingAssignmentTitles.has(`${classId}::${title}`)) {
          quizResultsList.push({ quizName: quiz.quizName, courseName: quiz.courseName, questionsCount: questions.size, status: 'skipped', message: 'Ya existe' });
          continue;
        }

        const assignmentId = crypto.randomUUID();

        // Get teacher for this class from in-memory map (avoids per-quiz DB query)
        const teacherId = classTeacherIdMap.get(classId) || academy.ownerId;

        pendingQuizStatements.push(
          c.env.DB.prepare(
            'INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(assignmentId, classId, teacherId, title, quiz.description || null, 'quiz', 100, now, now)
        );
        if (pendingQuizStatements.length >= FLUSH_AT) await flushQuizStatements();
        quizzesCreated++;

        let questionOrder = 0;
        for (const [, question] of questions.entries()) {
          const correctAnswer = question.answers.find(a => a.correct);
          if (!correctAnswer) continue;

          const questionId = crypto.randomUUID();
          const options = question.answers.map(a => ({ id: a.id, text: a.text }));
          const optionsJson = JSON.stringify(options);

          pendingQuizStatements.push(
            c.env.DB.prepare(
              'INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(questionId, assignmentId, question.text, questionOrder, optionsJson, correctAnswer.id, now)
          );
          if (pendingQuizStatements.length >= FLUSH_AT) await flushQuizStatements();
          questionOrder++;
          questionsCreatedCount++;
        }

        quizResultsList.push({ quizName: quiz.quizName, courseName: quiz.courseName, questionsCount: questionOrder, status: 'created' });
      }
      // Flush any remaining statements
      await flushQuizStatements();
      log(`quiz import done: ${quizzesCreated} quizzes, ${questionsCreatedCount} questions`);
    }

    // ── Document import (from documents-manifest.json generated by ftp-to-r2.js) ──
    // Creates: Topic "Documentos" per course → Lesson per fileTitle → Upload + Document per file
    let documentsCreated = 0;
    if (Array.isArray(documentRows) && documentRows.length > 0) {
      // Group by courseName → Map<fileTitle → entries[]>
      const byCourse = new Map<string, Map<string, Array<{ filename: string; filesize: number; contentType: string; r2Key: string; uploadId: string }>>>();
      for (const entry of documentRows) {
        const course = String(entry.courseName || '').trim();
        const title  = String(entry.fileTitle  || '').trim();
        if (!course || !title || !entry.r2Key) continue;
        if (!byCourse.has(course)) byCourse.set(course, new Map());
        const byTitle = byCourse.get(course)!;
        if (!byTitle.has(title)) byTitle.set(title, []);
        byTitle.get(title)!.push({
          filename:    String(entry.filename    || 'document').trim(),
          filesize:    Number(entry.filesize)   || 0,
          contentType: String(entry.contentType || 'application/octet-stream').trim(),
          r2Key:       String(entry.r2Key).trim(),
          uploadId:    String(entry.uploadId || crypto.randomUUID()).trim(),
        });
      }
      const docNow = new Date().toISOString();
      for (const [courseName, byTitle] of byCourse) {
        const classId = classMap.get(courseName.toLowerCase().trim());
        if (!classId) {
          log(`documents: skipping course "${courseName}" — class not found`);
          continue;
        }
        // Skip if a "Documentos" topic already exists for this class (idempotent re-run guard)
        const existingTopic = await c.env.DB
          .prepare('SELECT id FROM Topic WHERE classId = ? AND name = ?')
          .bind(classId, 'Documentos')
          .first();
        if (existingTopic) {
          log(`documents: topic "Documentos" already exists for "${courseName}", skipping`);
          continue;
        }
        const topicId = crypto.randomUUID();
        await c.env.DB
          .prepare('INSERT INTO Topic (id, name, classId, orderIndex, createdAt) VALUES (?, ?, ?, ?, ?)')
          .bind(topicId, 'Documentos', classId, 1, docNow)
          .run();
        let lessonPos = 1;
        for (const [fileTitle, files] of byTitle) {
          const lessonId = crypto.randomUUID();
          await c.env.DB
            .prepare('INSERT INTO Lesson (id, title, classId, topicId, releaseDate, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(lessonId, fileTitle, classId, topicId, docNow, docNow)
            .run();
          const seenUploads = new Set<string>();
          for (const file of files) {
            if (seenUploads.has(file.uploadId)) continue;
            seenUploads.add(file.uploadId);
            await c.env.DB
              .prepare('INSERT OR IGNORE INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, storageType, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
              .bind(file.uploadId, file.filename, file.filesize, file.contentType, file.r2Key, session.id, 'r2', docNow)
              .run();
            const docId = crypto.randomUUID();
            await c.env.DB
              .prepare('INSERT INTO Document (id, title, lessonId, uploadId, createdAt) VALUES (?, ?, ?, ?, ?)')
              .bind(docId, fileTitle, lessonId, file.uploadId, docNow)
              .run();
            documentsCreated++;
          }
          lessonPos++;
        }
      }
      log(`documents import done: ${documentsCreated} documents created`);
    }

    // ── PDF Manifest (files are NOT stored in DB, just returned for manual download) ──
    if (Array.isArray(fileRows) && fileRows.length > 0) {
      const seen = new Set<string>();
      for (const row of fileRows) {
        const filePath = String(row.filePath || '').trim();
        if (!filePath || seen.has(filePath)) continue;
        seen.add(filePath);
        pdfManifest.push({
          fileTitle: String(row.fileTitle || '').trim(),
          courseName: String(row.courseName || '').trim(),
          filename: String(row.filename || '').trim(),
          fileSizeKB: Math.round(parseInt(String(row.filesize || '0'), 10) / 1024),
          sitegroundPath: `${MOODLE_DATA_ROOT}/${filePath}`,
        });
      }
    }

    const created = results.filter(r => r.status === 'created').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const errors = results.filter(r => r.status === 'error').length;

    await writeAuditLog(c.env.DB, {
      actorId: session.id,
      actorRole: session.role,
      action: 'ADMIN_BULK_IMPORT',
      targetType: 'User',
      targetId: academyId,
      meta: { created, skipped, errors, quizzesCreated, questionsCreated: questionsCreatedCount, academyName: academy.name },
    });

    return c.json(successResponse({ created, skipped, errors, total: rows.length, classesCreated, classesUnmatched: unmatchedClassNames.size, classResults, results, quizzesCreated, questionsCreated: questionsCreatedCount, quizResults: quizResultsList, documentsCreated, pdfManifest }));
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
      const safeName = escapeHtml(academyName);
      const safeFirst = escapeHtml(firstName);
      const safeEmail = escapeHtml(email);
      const safePwd = escapeHtml(tempPassword);
      try {
        const ok = await sendEmail(c.env, {
          from: 'AKADEMO <onboarding@akademo-edu.com>',
          to: email,
          subject: `Tus credenciales de acceso — ${academyName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #f8fafc; padding: 24px;">
              <div style="background-color: #0f172a; padding: 32px 40px; border-radius: 12px 12px 0 0;">
                <p style="color: #94a3b8; margin: 0 0 4px 0; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Bienvenido a</p>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${safeName}</h1>
              </div>
              <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Hola, ${safeFirst}</p>
                <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">Has sido dado de alta como ${roleLabel} en <strong style="color: #0f172a;">${safeName}</strong>. A continuación tienes tus credenciales de acceso.</p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin-bottom: 24px;">
                  <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Correo electrónico</p>
                  <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 15px; font-weight: 500;">${safeEmail}</p>
                  <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Contraseña temporal</p>
                  <div style="background-color: #1e293b; border-radius: 8px; padding: 14px 20px; text-align: center;">
                    <span style="color: #e2e8f0; font-size: 22px; font-weight: 700; letter-spacing: 4px; font-family: 'Courier New', Courier, monospace;">${safePwd}</span>
                  </div>
                </div>
                <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin-bottom: 28px;">
                  <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;"><strong>Importante:</strong> Cambia tu contraseña al iniciar sesión por primera vez.</p>
                </div>
                <div style="text-align: center; margin-bottom: 36px;">
                  <a href="https://akademo-edu.com" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 15px; font-weight: 600;">Acceder a la plataforma →</a>
                </div>
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0; padding-top: 24px; border-top: 1px solid #f1f5f9;">Saludos,<br><strong style="color: #475569;">Equipo de ${safeName}</strong></p>
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
