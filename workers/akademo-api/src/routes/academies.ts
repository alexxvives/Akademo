import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, getSession } from '../lib/auth';
import { successResponse, errorResponse, escapeHtml } from '../lib/utils';
import { sendEmail } from '../lib/sendEmail';

const academies = new Hono<{ Bindings: Bindings }>();

// GET /academies - List academies
academies.get('/', async (c) => {
  try {
    const session = await getSession(c);
    const publicMode = c.req.query('publicMode') === 'true'; // For signup page

    let query = '';
    let params: any[] = [];

    // Force public mode for signup page, regardless of session
    if (publicMode) {
      query = `
        SELECT 
          a.id,
          a.name,
          a.description,
          a.createdAt,
          COUNT(DISTINCT c.id) as classCount
        FROM Academy a
        LEFT JOIN Class c ON a.id = c.academyId
        WHERE a.id != 'demo-academy-id'
        GROUP BY a.id
        ORDER BY a.name ASC
      `;
    } else if (session && session.role === 'ADMIN') {
      // Admin sees all with counts
      query = `
        SELECT 
          a.*,
          COUNT(DISTINCT c.id) as classCount,
          COUNT(DISTINCT t.id) as teacherCount
        FROM Academy a
        LEFT JOIN Class c ON a.id = c.academyId
        LEFT JOIN Teacher t ON a.id = t.academyId
        GROUP BY a.id
        ORDER BY a.createdAt DESC
      `;
    } else if (session && (session.role === 'ACADEMY' || session.role === 'TEACHER')) {
      // Academy owners see their own
      query = `
        SELECT 
          a.*,
          u.email as email,
          COUNT(DISTINCT c.id) as classCount,
          COUNT(DISTINCT t.id) as teacherCount
        FROM Academy a
        JOIN User u ON a.ownerId = u.id
        LEFT JOIN Class c ON a.id = c.academyId
        LEFT JOIN Teacher t ON a.id = t.academyId
        WHERE a.ownerId = ?
        GROUP BY a.id
        ORDER BY a.createdAt DESC
      `;
      params = [session.id];
    } else {
      // Public/students see all academies (for signup/browsing)
      query = `
        SELECT 
          a.id,
          a.name,
          a.description,
          a.createdAt,
          COUNT(DISTINCT c.id) as classCount
        FROM Academy a
        LEFT JOIN Class c ON a.id = c.academyId
        GROUP BY a.id
        ORDER BY a.name ASC
      `;
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();
    if (result.results && result.results.length > 0) {
    }

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[List Academies] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /academies - Create academy
academies.post('/', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['TEACHER', 'ADMIN', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { name, description } = await c.req.json();

    if (!name) {
      return c.json(errorResponse('Name is required'), 400);
    }

    const academyId = crypto.randomUUID();
    const now = new Date().toISOString();
    await c.env.DB
      .prepare('INSERT INTO Academy (id, name, description, ownerId, createdAt, updatedAt, allowedPaymentMethods) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(academyId, name, description || null, session.id, now, now, '["cash"]')
      .run();

    const academy = await c.env.DB
      .prepare('SELECT * FROM Academy WHERE id = ?')
      .bind(academyId)
      .first();

    return c.json(successResponse(academy), 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Create Academy] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /academies/students - Get all students across academies
// IMPORTANT: This must come BEFORE /:id route to avoid being captured as an ID
academies.get('/students', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    let query = '';
    let params: any[] = [];

    if (session.role === 'ADMIN') {
      query = `
        SELECT DISTINCT
          u.id, u.email, u.firstName, u.lastName,
          a.id as academyId, a.name as academyName,
          c.id as classId, c.name as className,
          ce.status as enrollmentStatus
        FROM User u
        JOIN ClassEnrollment ce ON u.id = ce.userId
        JOIN Class c ON ce.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE u.role = 'STUDENT'
        ORDER BY u.lastName, u.firstName
      `;
    } else {
      // Academy owners see students in their academies (unique students only)
      query = `
        SELECT 
          u.id, 
          u.email, 
          u.firstName, 
          u.lastName
        FROM User u
        JOIN ClassEnrollment ce ON u.id = ce.userId
        JOIN Class c ON ce.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE u.role = 'STUDENT' AND a.ownerId = ?
        GROUP BY u.id, u.email, u.firstName, u.lastName
        ORDER BY u.lastName, u.firstName
      `;
      params = [session.id];
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Academy Students] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /academies/teachers - Create a new teacher
// IMPORTANT: This must come BEFORE /:id route to avoid being captured as an ID
academies.post('/teachers', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only academy owners can create teachers'), 403);
    }

    const { email, fullName, password } = await c.req.json();

    if (!email || !fullName || !password) {
      return c.json(errorResponse('Email, nombre completo y contraseña son requeridos'), 400);
    }

    // Split fullName into firstName and lastName
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0]; // Use firstName as lastName if only one name provided

    if (password.length < 8) {
      return c.json(errorResponse('La contraseña debe tener al menos 8 caracteres'), 400);
    }

    // Get academy ID
    const academyResult = await c.env.DB.prepare(
      'SELECT id, name FROM Academy WHERE ownerId = ?'
    ).bind(session.id).first<{ id: string; name: string }>();
    
    if (!academyResult) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    const academyId = academyResult.id;

    // Check if email already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM User WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      return c.json(errorResponse('Este email ya está registrado'), 400);
    }

    // Hash password using bcrypt (must match login flow)
    const { hashPassword } = await import('../lib/auth');
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO User (id, email, firstName, lastName, password, role, createdAt)
       VALUES (?, ?, ?, ?, ?, 'TEACHER', datetime('now'))`
    ).bind(userId, email, firstName, lastName, passwordHash).run();

    // Create teacher record linking to academy
    await c.env.DB.prepare(
      `INSERT INTO Teacher (id, userId, academyId, createdAt)
       VALUES (?, ?, ?, datetime('now'))`
    ).bind(crypto.randomUUID(), userId, academyId).run();

    // Send onboarding email
    const academyNameForEmail = (academyResult as { id: string; name: string }).name;
    const safeAcademy = escapeHtml(academyNameForEmail);
    const safeFirst = escapeHtml(firstName);
    const safeEmail = escapeHtml(email);
    const safePassword = escapeHtml(password);
    const emailSent = await sendEmail(c.env, {
      from: 'AKADEMO <onboarding@akademo-edu.com>',
      to: email,
      subject: `Tus credenciales de acceso — ${academyNameForEmail}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #f8fafc; padding: 24px;">
          <div style="background-color: #0f172a; padding: 32px 40px; border-radius: 12px 12px 0 0;">
            <p style="color: #94a3b8; margin: 0 0 4px 0; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Bienvenido a</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${safeAcademy}</h1>
          </div>
          <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Hola, ${safeFirst}</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">Has sido dado de alta como profesor en <strong style="color: #0f172a;">${safeAcademy}</strong>. A continuación tienes tus credenciales de acceso.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin-bottom: 24px;">
              <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Correo electrónico</p>
              <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 15px; font-weight: 500;">${safeEmail}</p>
              <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Contraseña temporal</p>
              <div style="background-color: #1e293b; border-radius: 8px; padding: 14px 20px; text-align: center;">
                <span style="color: #e2e8f0; font-size: 22px; font-weight: 700; letter-spacing: 4px; font-family: 'Courier New', Courier, monospace;">${safePassword}</span>
              </div>
            </div>
            <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin-bottom: 28px;">
              <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;"><strong>Importante:</strong> Cambia tu contraseña al iniciar sesión por primera vez.</p>
            </div>
            <div style="text-align: center; margin-bottom: 36px;">
              <a href="https://akademo-edu.com" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 15px; font-weight: 600;">Acceder a la plataforma →</a>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0; padding-top: 24px; border-top: 1px solid #f1f5f9;">Saludos,<br><strong style="color: #475569;">Equipo de ${safeAcademy}</strong></p>
          </div>
          <p style="text-align: center; color: #cbd5e1; font-size: 11px; margin: 16px 0 0 0;">Powered by AKADEMO · akademo-edu.com</p>
        </div>
      `,
    });

    return c.json(successResponse({ 
      id: userId, 
      email, 
      firstName, 
      lastName,
      message: 'Teacher created successfully',
      emailSent,
    }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Create Teacher] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /academies/my-academy - Get teacher's academy (for sidebar logo)
academies.get('/my-academy', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER') {
      return c.json(errorResponse('Only teachers can use this endpoint'), 403);
    }

    // Get teacher's academy
    const result = await c.env.DB.prepare(`
      SELECT a.id, a.name, a.logoUrl
      FROM Academy a
      JOIN Teacher t ON t.academyId = a.id
      WHERE t.userId = ?
    `).bind(session.id).first();

    if (!result) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    return c.json(successResponse(result));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[My Academy] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /academies/teachers - Get all teachers
// IMPORTANT: This must come BEFORE /:id route to avoid being captured as an ID
academies.get('/teachers', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Get academy ID for ACADEMY role
    let academyId: string | null = null;
    if (session.role === 'ACADEMY') {
      const academyResult = await c.env.DB.prepare(
        'SELECT id FROM Academy WHERE ownerId = ?'
      ).bind(session.id).first<{ id: string }>();
      
      if (!academyResult) {
        return c.json(errorResponse('Academy not found'), 404);
      }
      academyId = academyResult.id;
    }

    // Get teachers with their class and student counts
    let teachersQuery = '';
    let params: any[] = [];

    if (session.role === 'ADMIN') {
      teachersQuery = `
        SELECT DISTINCT
          u.id, u.email, u.firstName, u.lastName, u.createdAt,
          t.academyId
        FROM User u
        LEFT JOIN Teacher t ON u.id = t.userId
        WHERE u.role = 'TEACHER'
        ORDER BY u.lastName, u.firstName
      `;
    } else {
      // Academy owners see only teachers in their academy
      teachersQuery = `
        SELECT DISTINCT
          u.id, u.email, u.firstName, u.lastName, u.createdAt
        FROM User u
        JOIN Teacher t ON u.id = t.userId
        WHERE u.role = 'TEACHER' AND t.academyId = ?
        ORDER BY u.lastName, u.firstName
      `;
      params = [academyId];
    }

    const teachersResult = await c.env.DB.prepare(teachersQuery).bind(...params).all();
    const teachers = teachersResult.results || [];

    // Get class and student counts for each teacher
    const teachersWithCounts = await Promise.all(
      teachers.map(async (teacher: any) => {
        // Get classes taught by this teacher (with names and student counts)
        const classesResult = await c.env.DB.prepare(
          `SELECT c.id, c.name,
           (SELECT COUNT(*) FROM ClassEnrollment ce WHERE ce.classId = c.id AND ce.status = 'APPROVED') as studentCount
           FROM Class c WHERE c.teacherId = ?`
        ).bind(teacher.id).all();
        
        const teacherClasses = (classesResult.results || []) as Array<{ id: string; name: string; studentCount: number }>;
        const classCount = teacherClasses.length;
        const studentCount = teacherClasses.reduce((sum, cls) => sum + (cls.studentCount || 0), 0);

        // Get revenue per class from completed payments
        const classRevenueMap: Record<string, number> = {};
        if (classCount > 0) {
          const classIds = teacherClasses.map(cls => cls.id);
          const placeholders = classIds.map(() => '?').join(',');
          const revenueResult = await c.env.DB.prepare(
            `SELECT classId, COALESCE(SUM(amount), 0) as total FROM Payment WHERE classId IN (${placeholders}) AND (status = 'COMPLETED' OR status = 'PAID') GROUP BY classId`
          ).bind(...classIds).all();
          for (const row of (revenueResult.results || []) as Array<{ classId: string; total: number }>) {
            classRevenueMap[row.classId] = row.total || 0;
          }
        }
        const totalRevenue = Object.values(classRevenueMap).reduce((sum: number, v: number) => sum + v, 0);

        return {
          id: teacher.id,
          email: teacher.email,
          name: `${teacher.firstName} ${teacher.lastName}`,
          classCount,
          studentCount,
          totalRevenue,
          classes: teacherClasses.map(cls => ({ id: cls.id, name: cls.name, studentCount: cls.studentCount || 0, revenue: classRevenueMap[cls.id] || 0 })),
          createdAt: teacher.createdAt,
        };
      })
    );

    return c.json(successResponse(teachersWithCounts));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Academy Teachers] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /academies/classes - Get classes for academies
// IMPORTANT: This must come BEFORE /:id route to avoid being captured as an ID
academies.get('/classes', async (c) => {
  try {
    const session = await requireAuth(c);

    let query = '';
    let params: any[] = [];

    if (session.role === 'ADMIN') {
      query = `
        SELECT 
          c.id, c.name, c.slug, c.description, c.academyId, c.teacherId, c.createdAt,
          c.whatsappGroupLink, c.monthlyPrice, c.oneTimePrice, c.zoomAccountId, c.maxStudents, c.startDate,
          c.university, c.carrera,
          a.name as academyName,
          u.firstName as teacherFirstName,
          u.lastName as teacherLastName,
          za.accountName as zoomAccountName,
          (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id AND status = 'APPROVED') as studentCount,
          (SELECT COUNT(*) FROM Lesson WHERE classId = c.id) as lessonCount,
          (SELECT COUNT(*) FROM Video v JOIN Lesson l ON v.lessonId = l.id WHERE l.classId = c.id) as videoCount,
          (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId = l.id WHERE l.classId = c.id) as documentCount,
          (SELECT ROUND(AVG(lr.rating), 1) FROM LessonRating lr JOIN Lesson l ON lr.lessonId = l.id WHERE l.classId = c.id) as avgRating
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN ZoomAccount za ON c.zoomAccountId = za.id
        ORDER BY c.createdAt DESC
      `;
    } else if (session.role === 'ACADEMY') {
      query = `
        SELECT 
          c.id, c.name, c.slug, c.description, c.academyId, c.teacherId, c.createdAt,
          c.whatsappGroupLink, c.monthlyPrice, c.oneTimePrice, c.zoomAccountId, c.maxStudents, c.startDate,
          c.university, c.carrera,
          a.name as academyName,
          u.firstName as teacherFirstName,
          u.lastName as teacherLastName,
          za.accountName as zoomAccountName,
          (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id AND status = 'APPROVED') as studentCount,
          (SELECT COUNT(*) FROM Lesson WHERE classId = c.id) as lessonCount,
          (SELECT COUNT(*) FROM Video v JOIN Lesson l ON v.lessonId = l.id WHERE l.classId = c.id) as videoCount,
          (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId = l.id WHERE l.classId = c.id) as documentCount,
          (SELECT ROUND(AVG(lr.rating), 1) FROM LessonRating lr JOIN Lesson l ON lr.lessonId = l.id WHERE l.classId = c.id) as avgRating
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN ZoomAccount za ON c.zoomAccountId = za.id
        WHERE a.ownerId = ?
        ORDER BY c.createdAt DESC
      `;
      params = [session.id];
    } else {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Academy Classes] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /academies/:id - Get academy details
// IMPORTANT: This must come AFTER specific routes like /students, /teachers, /classes
academies.get('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const academyId = c.req.param('id');

    const academy: any = await c.env.DB
      .prepare('SELECT a.*, u.email as ownerEmail FROM Academy a JOIN User u ON a.ownerId = u.id WHERE a.id = ?')
      .bind(academyId)
      .first();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    // Get class count
    const classCount = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM Class WHERE academyId = ?')
      .bind(academyId)
      .first();

    // Get teacher count
    const teacherCount = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM Teacher WHERE academyId = ?')
      .bind(academyId)
      .first();

    // Only expose stripeAccountId and internal fields to the academy owner
    const isOwner = academy.ownerId === session.id;
    const safeAcademy: Record<string, unknown> = {
      id: academy.id,
      name: academy.name,
      description: academy.description,
      logoUrl: academy.logoUrl,
      address: academy.address,
      phone: academy.phone,
      email: academy.ownerEmail,
      createdAt: academy.createdAt,
      feedbackEnabled: academy.feedbackEnabled,
      requireGrading: academy.requireGrading,
      defaultWatermarkIntervalMins: academy.defaultWatermarkIntervalMins,
      defaultMaxWatchTimeMultiplier: academy.defaultMaxWatchTimeMultiplier,
      allowedPaymentMethods: academy.allowedPaymentMethods,
      transferenciaIban: academy.transferenciaIban,
      bizumPhone: academy.bizumPhone,
      hiddenMenuItems: academy.hiddenMenuItems,
      classCount: classCount?.count || 0,
      teacherCount: teacherCount?.count || 0,
      hasStripe: Boolean(academy.stripeAccountId),
    };

    // Owner/admin gets additional fields
    if (isOwner || session.role === 'ADMIN') {
      safeAcademy.ownerId = academy.ownerId;
      safeAcademy.paymentStatus = academy.paymentStatus;
      safeAcademy.stripeAccountId = academy.stripeAccountId;
    }

    return c.json(successResponse(safeAcademy));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Get Academy] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PATCH /academies/:id - Update academy
academies.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const academyId = c.req.param('id');
    const body = await c.req.json();

    // Check ownership
    const academy = await c.env.DB
      .prepare('SELECT * FROM Academy WHERE id = ?')
      .bind(academyId)
      .first<any>();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    if (session.role !== 'ADMIN' && academy.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Build update query dynamically to only update provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description || null);
    }
    if (body.address !== undefined) {
      updates.push('address = ?');
      values.push(body.address || null);
    }
    if (body.phone !== undefined) {
      updates.push('phone = ?');
      values.push(body.phone || null);
    }
    if (body.email !== undefined) {
      // Email changes go through POST /auth/confirm-email-change (verified flow)
      // Direct PATCH no longer allowed to prevent unverified email changes
    }
    if (body.feedbackEnabled !== undefined) {
      updates.push('feedbackEnabled = ?');
      values.push(body.feedbackEnabled);
    }
    if (body.defaultWatermarkIntervalMins !== undefined) {
      updates.push('defaultWatermarkIntervalMins = ?');
      values.push(body.defaultWatermarkIntervalMins);
    }
    if (body.defaultMaxWatchTimeMultiplier !== undefined) {
      updates.push('defaultMaxWatchTimeMultiplier = ?');
      values.push(body.defaultMaxWatchTimeMultiplier);
    }
    if (body.logoUrl !== undefined) {
      updates.push('logoUrl = ?');
      values.push(body.logoUrl || null);
    }
    if (body.allowedPaymentMethods !== undefined) {
      updates.push('allowedPaymentMethods = ?');
      values.push(body.allowedPaymentMethods);
    }
    if (body.transferenciaIban !== undefined) {
      updates.push('transferenciaIban = ?');
      values.push(body.transferenciaIban || null);
    }
    if (body.bizumPhone !== undefined) {
      updates.push('bizumPhone = ?');
      values.push(body.bizumPhone || null);
    }
    if (body.requireGrading !== undefined) {
      updates.push('requireGrading = ?');
      values.push(body.requireGrading);
    }
    if (body.hiddenMenuItems !== undefined) {
      updates.push('hiddenMenuItems = ?');
      values.push(typeof body.hiddenMenuItems === 'string' ? body.hiddenMenuItems : JSON.stringify(body.hiddenMenuItems));
    }
    if (updates.length === 0) {
      return c.json(errorResponse('No fields to update'), 400);
    }

    values.push(academyId);

    await c.env.DB
      .prepare(`UPDATE Academy SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await c.env.DB
      .prepare('SELECT * FROM Academy WHERE id = ?')
      .bind(academyId)
      .first();

    return c.json(successResponse(updated));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Update Academy] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /academies/:id/classes - Get classes for an academy (public for signup)
academies.get('/:id/classes', async (c) => {
  try {
    const academyId = c.req.param('id');

    // Public endpoint - no auth required for signup flow
    const classes = await c.env.DB
      .prepare(`
        SELECT 
          c.id,
          c.name,
          c.description,
          u.firstName || ' ' || u.lastName as teacherName
        FROM Class c
        LEFT JOIN User u ON c.teacherId = u.id
        WHERE c.academyId = ?
        ORDER BY c.name ASC
      `)
      .bind(academyId)
      .all();

    return c.json(successResponse(classes.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Academy Classes List] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});


// GET /academies/welcome-emails/pending - Count users with pending welcome emails
// IMPORTANT: Must come BEFORE /:id routes
academies.get('/welcome-emails/pending', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only academy owners can access this'), 403);
    }

    const result = await c.env.DB.prepare(`
      SELECT
        SUM(CASE WHEN sub.role = 'STUDENT' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN sub.role = 'TEACHER' THEN 1 ELSE 0 END) as teachers
      FROM (
        SELECT DISTINCT u.id, u.role
        FROM User u
        JOIN ClassEnrollment ce ON u.id = ce.userId
        JOIN Class cls ON ce.classId = cls.id
        JOIN Academy a ON cls.academyId = a.id
        WHERE u.tempPassword IS NOT NULL AND a.ownerId = ?
        UNION
        SELECT DISTINCT u.id, u.role
        FROM User u
        JOIN Teacher t ON u.id = t.userId
        JOIN Academy a ON t.academyId = a.id
        WHERE u.tempPassword IS NOT NULL AND a.ownerId = ?
      ) sub
    `).bind(session.id, session.id).first() as any;

    return c.json(successResponse({
      students: result?.students ?? 0,
      teachers: result?.teachers ?? 0,
      total: (result?.students ?? 0) + (result?.teachers ?? 0),
    }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Welcome Emails Pending] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /academies/welcome-emails - Send welcome emails to pending users
// IMPORTANT: Must come BEFORE /:id routes
academies.post('/welcome-emails', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only academy owners can send welcome emails'), 403);
    }

    const body = await c.req.json().catch(() => ({}));
    const roleFilter: string | undefined = (body as any).role; // optional: 'STUDENT' | 'TEACHER'

    // Get academy info
    const academy = await c.env.DB
      .prepare('SELECT id, name FROM Academy WHERE ownerId = ? LIMIT 1')
      .bind(session.id)
      .first() as any;
    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    // Fetch pending users (students)
    let users: any[] = [];
    if (!roleFilter || roleFilter === 'STUDENT') {
      const studentsResult = await c.env.DB.prepare(`
        SELECT DISTINCT u.id, u.email, u.firstName, u.lastName, u.tempPassword, 'STUDENT' as role
        FROM User u
        JOIN ClassEnrollment ce ON u.id = ce.userId
        JOIN Class cls ON ce.classId = cls.id
        JOIN Academy a ON cls.academyId = a.id
        WHERE u.tempPassword IS NOT NULL AND a.ownerId = ?
        ORDER BY u.firstName, u.lastName
      `).bind(session.id).all();
      users = users.concat(studentsResult.results || []);
    }

    if (!roleFilter || roleFilter === 'TEACHER') {
      const teachersResult = await c.env.DB.prepare(`
        SELECT DISTINCT u.id, u.email, u.firstName, u.lastName, u.tempPassword, 'TEACHER' as role
        FROM User u
        JOIN Teacher t ON u.id = t.userId
        JOIN Academy a ON t.academyId = a.id
        WHERE u.tempPassword IS NOT NULL AND a.ownerId = ?
        ORDER BY u.firstName, u.lastName
      `).bind(session.id).all();
      users = users.concat(teachersResult.results || []);
    }

    if (users.length === 0) {
      return c.json(successResponse({ sent: 0, failed: 0, message: 'No pending users found' }));
    }

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const roleLabel = user.role === 'TEACHER' ? 'profesor' : 'alumno';
      const safeName = escapeHtml(academy.name);
      const safeUserFirst = escapeHtml(user.firstName);
      const safeUserEmail = escapeHtml(user.email);
      const safeTempPwd = escapeHtml(user.tempPassword);
      try {
        const ok = await sendEmail(c.env, {
          from: 'AKADEMO <onboarding@akademo-edu.com>',
          to: user.email,
          subject: `Tus credenciales de acceso — ${academy.name}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #f8fafc; padding: 24px;">
              <div style="background-color: #0f172a; padding: 32px 40px; border-radius: 12px 12px 0 0;">
                <p style="color: #94a3b8; margin: 0 0 4px 0; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Bienvenido a</p>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${safeName}</h1>
              </div>
              <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Hola, ${safeUserFirst}</p>
                <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">Has sido dado de alta como ${roleLabel} en <strong style="color: #0f172a;">${safeName}</strong>. A continuación tienes tus credenciales de acceso.</p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin-bottom: 24px;">
                  <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Correo electrónico</p>
                  <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 15px; font-weight: 500;">${safeUserEmail}</p>
                  <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Contraseña temporal</p>
                  <div style="background-color: #1e293b; border-radius: 8px; padding: 14px 20px; text-align: center;">
                    <span style="color: #e2e8f0; font-size: 22px; font-weight: 700; letter-spacing: 4px; font-family: 'Courier New', Courier, monospace;">${safeTempPwd}</span>
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
        if (ok) {
          // Clear the tempPassword after successful send
          await c.env.DB.prepare('UPDATE User SET tempPassword = NULL WHERE id = ?').bind(user.id).run();
          sent++;
        } else {
          failed++;
        }
      } catch (emailErr) {
        console.error('[Welcome Emails] Email failed for', user.email, emailErr);
        failed++;
      }
    }

    return c.json(successResponse({ sent, failed, total: users.length }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Welcome Emails] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default academies;
