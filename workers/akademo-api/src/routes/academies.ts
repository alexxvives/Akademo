import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, getSession } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

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
          COUNT(DISTINCT c.id) as classCount,
          COUNT(DISTINCT t.id) as teacherCount
        FROM Academy a
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
      .prepare('INSERT INTO Academy (id, name, description, ownerId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(academyId, name, description || null, session.id, now, now)
      .run();

    const academy = await c.env.DB
      .prepare('SELECT * FROM Academy WHERE id = ?')
      .bind(academyId)
      .first();

    return c.json(successResponse(academy), 201);
  } catch (error: any) {
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

    if (password.length < 6) {
      return c.json(errorResponse('Password must be at least 6 characters'), 400);
    }

    // Get academy ID
    const academyResult = await c.env.DB.prepare(
      'SELECT id FROM Academy WHERE ownerId = ?'
    ).bind(session.id).first<{ id: string }>();
    
    if (!academyResult) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    const academyId = academyResult.id;

    // Check if email already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM User WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      return c.json(errorResponse('Email already registered'), 400);
    }

    // Hash password using Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

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

    // Send onboarding email via Resend API
    const resendApiKey = c.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'AKADEMO <onboarding@akademo-edu.com>',
            to: [email],
            subject: 'Bienvenido a AKADEMO - Tus credenciales de acceso',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #b1e787 0%, #8dd65f 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: #1f2937; margin: 0; font-size: 28px;">¡Bienvenido a AKADEMO!</h1>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hola <strong>${firstName}</strong>,</p>
                  <p style="color: #374151; font-size: 16px; line-height: 1.6;">Has sido agregado como profesor en AKADEMO. A continuación encontrarás tus credenciales de acceso:</p>
                  
                  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #b1e787;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Correo electrónico:</p>
                    <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; font-weight: 600;">${email}</p>
                    
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Contraseña temporal:</p>
                    <div style="background: #ffffff; padding: 15px; border-radius: 6px; border: 2px dashed #b1e787;">
                      <p style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 700; letter-spacing: 3px; text-align: center;">${password}</p>
                    </div>
                  </div>

                  <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      <strong>⚠️ Importante:</strong> Por tu seguridad, te recomendamos cambiar esta contraseña después de tu primer inicio de sesión.
                    </p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://akademo-edu.com" style="background: #b1e787; color: #1f2937; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                      Iniciar Sesión
                    </a>
                  </div>

                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                    Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
                  </p>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                    Saludos,<br>
                    <strong style="color: #1f2937;">El equipo de AKADEMO</strong>
                  </p>
                </div>
                <div style="text-align: center; padding: 20px 0; color: #9ca3af; font-size: 12px;">
                  <p style="margin: 0;">© 2026 AKADEMO - Plataforma de Educación en Línea</p>
                </div>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.error('[Create Teacher] Resend API error:', await emailResponse.text());
        } else {
        }
      } catch (emailError) {
        console.error('[Create Teacher] Email sending failed:', emailError);
        // Continue even if email fails - teacher is created
      }
    } else {
      console.warn('[Create Teacher] RESEND_API_KEY not configured - email not sent');
    }

    return c.json(successResponse({ 
      id: userId, 
      email, 
      firstName, 
      lastName,
      message: 'Teacher created successfully'
    }));
  } catch (error: any) {
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

    const academy = await c.env.DB
      .prepare('SELECT * FROM Academy WHERE id = ?')
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

    return c.json(successResponse({
      ...academy,
      classCount: classCount?.count || 0,
      teacherCount: teacherCount?.count || 0,
    }));
  } catch (error: any) {
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
      updates.push('email = ?');
      values.push(body.email || null);
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
    if (body.allowMultipleTeachers !== undefined) {
      updates.push('allowMultipleTeachers = ?');
      values.push(body.allowMultipleTeachers);
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
    console.error('[Academy Classes List] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default academies;
