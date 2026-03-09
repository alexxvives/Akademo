import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { nanoid } from 'nanoid';
import { writeAuditLog } from '../lib/audit';

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
        COUNT(DISTINCT e.id) as enrollmentCount
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

export default admin;
