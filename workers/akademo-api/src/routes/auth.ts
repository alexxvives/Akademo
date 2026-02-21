import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import { Bindings } from '../types';
import { getSession, createSignedSession } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { loginSchema, registerSchema, validateBody } from '../lib/validation';
import { loginRateLimit, registerRateLimit, checkEmailRateLimit, emailVerificationRateLimit } from '../lib/rate-limit';

const auth = new Hono<{ Bindings: Bindings }>();

// GET /auth/me
auth.get('/me', async (c) => {
  
  const session = await getSession(c);

  if (!session) {
    return c.json(errorResponse('Not authenticated'), 401);
  }

  // Check if user has monoacademy access
  let monoacademy = false;
  let linkedUserId = null;
  
  if (session.role === 'ACADEMY') {
    // Check if academy has monoacademy flag
    const academy = await c.env.DB
      .prepare('SELECT monoacademy FROM Academy WHERE ownerId = ?')
      .bind(session.id)
      .first();
    
    if (academy?.monoacademy === 1) {
      monoacademy = true;
      // Find linked teacher user (same email, different role)
      const teacherUser = await c.env.DB
        .prepare('SELECT id FROM User WHERE email = ? AND role = ?')
        .bind(session.email, 'TEACHER')
        .first();
      linkedUserId = teacherUser?.id || null;
    }
  } else if (session.role === 'TEACHER') {
    // Check if teacher has monoacademy flag
    const teacher = await c.env.DB
      .prepare('SELECT monoacademy, academyId FROM Teacher WHERE userId = ?')
      .bind(session.id)
      .first();
    
    if (teacher?.monoacademy === 1) {
      monoacademy = true;
      // Find linked academy owner (same email, different role)
      const academyUser = await c.env.DB
        .prepare('SELECT id FROM User WHERE email = ? AND role = ?')
        .bind(session.email, 'ACADEMY')
        .first();
      linkedUserId = academyUser?.id || null;
    }
  }

  return c.json(successResponse({
    ...session,
    monoacademy,
    linkedUserId,
  }));
});

// POST /auth/session/check - Check if session is valid
auth.post('/session/check', async (c) => {
  
  const session = await getSession(c);

  if (!session) {
    return c.json(errorResponse('Not authenticated'), 401);
  }

  return c.json(successResponse(session));
});

// POST /auth/register
auth.post('/register', registerRateLimit, validateBody(registerSchema), async (c) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName,
      academyName,    // For ACADEMY role (instead of firstName/lastName)
      monoacademy = false, // For ACADEMY role - owner is also the only teacher
      role = 'STUDENT',
      academyId,      // For STUDENT and TEACHER
      classId,        // For STUDENT
      classIds = [],  // For TEACHER (can join multiple classes)
    } = await c.req.json();

    // Zod validates: email format, password min 8, role enum
    // Conditional validations below (cross-field):
    if (role === 'ACADEMY' && !academyName) {
      return c.json(errorResponse('Academy name is required'), 400);
    }

    if ((role === 'STUDENT' || role === 'TEACHER') && (!firstName || !lastName)) {
      return c.json(errorResponse('First name and last name are required'), 400);
    }

    // Validate required fields based on role
    // For STUDENT: academyId and classId are optional (can enroll later via /requests/student)
    // For TEACHER: academyId and at least one class required
    if (role === 'TEACHER' && (!academyId || classIds.length === 0)) {
      return c.json(errorResponse('Academy and at least one class required for teachers'), 400);
    }

    // Check if user exists
    const existing = await c.env.DB
      .prepare('SELECT id FROM User WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    if (existing) {
      return c.json(errorResponse('Email already registered'), 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user ID
    const userId = crypto.randomUUID();

    // Create user with appropriate name fields
    const userFirstName = role === 'ACADEMY' ? academyName : firstName;
    const userLastName = role === 'ACADEMY' ? '' : lastName;

    await c.env.DB
      .prepare('INSERT INTO User (id, email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(userId, email.toLowerCase(), hashedPassword, userFirstName, userLastName, role)
      .run();

    // Handle different signup flows
    if (role === 'ACADEMY') {
      // Academy owner - create academy
      const newAcademyId = crypto.randomUUID();
      const monoacademyFlag = monoacademy ? 1 : 0;
      const now = new Date().toISOString();
      await c.env.DB
        .prepare('INSERT INTO Academy (id, name, description, ownerId, monoacademy, paymentStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(
          newAcademyId,
          academyName,
          `Welcome to ${academyName}`,
          userId,
          monoacademyFlag,
          'NOT PAID', // Demo mode by default
          now
        )
        .run();

      // If monoacademy, create a teacher account for the owner
      if (monoacademy) {
        // Use same email for teacher account (same person, different role)
        const teacherUserId = crypto.randomUUID();
        const teacherEmail = email; // Same email, not +teacher variant
        
        // Create teacher User account (same password, role TEACHER)
        await c.env.DB
          .prepare('INSERT INTO User (id, email, password, firstName, lastName, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(teacherUserId, teacherEmail.toLowerCase(), hashedPassword, userFirstName, userLastName, 'TEACHER', now)
          .run();
        
        // Create Teacher record linking to academy
        const teacherId = crypto.randomUUID();
        await c.env.DB
          .prepare('INSERT INTO Teacher (id, userId, academyId, monoacademy, createdAt) VALUES (?, ?, ?, ?, ?)')
          .bind(teacherId, teacherUserId, newAcademyId, monoacademyFlag, now)
          .run();
      }

    } else if (role === 'TEACHER') {
      // Teacher - link to academy with PENDING status
      const teacherId = crypto.randomUUID();
      const now = new Date().toISOString();
      await c.env.DB
        .prepare('INSERT INTO Teacher (id, userId, academyId, status, createdAt) VALUES (?, ?, ?, ?, ?)')
        .bind(teacherId, userId, academyId, 'PENDING', now)
        .run();

      // Enroll teacher in selected classes with PENDING status (awaiting academy approval)
      for (const cId of classIds) {
        const enrollmentId = crypto.randomUUID();
        const now = new Date().toISOString();
        await c.env.DB
          .prepare('INSERT INTO ClassEnrollment (id, classId, userId, status, enrolledAt) VALUES (?, ?, ?, ?, ?)')
          .bind(enrollmentId, cId, userId, 'PENDING', now)
          .run();
      }

    } else if (role === 'STUDENT') {
      // Student - optionally enroll in class with PENDING status if classId provided
      // If not provided, student can enroll later via /requests/student endpoint
      if (classId) {
        const enrollmentId = crypto.randomUUID();
        const now = new Date().toISOString();
        await c.env.DB
          .prepare('INSERT INTO ClassEnrollment (id, classId, userId, status, enrolledAt) VALUES (?, ?, ?, ?, ?)')
          .bind(enrollmentId, classId, userId, 'PENDING', now)
          .run();
      }
    }

    // Create device session for students to prevent account sharing
    let deviceSessionId = null;
    if (role === 'STUDENT') {
      deviceSessionId = crypto.randomUUID();
      const now = new Date().toISOString();
      const userAgent = c.req.header('User-Agent') || 'Unknown';
      const deviceFingerprint = btoa(`${userId}-${Date.now()}`);
      
      await c.env.DB
        .prepare('INSERT INTO DeviceSession (id, userId, deviceFingerprint, userAgent, isActive, lastActiveAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(deviceSessionId, userId, deviceFingerprint, userAgent, 1, now, now)
        .run();
    }

    // Create signed session token - include deviceSessionId for students
    const sessionData = deviceSessionId 
      ? JSON.stringify({ userId, deviceSessionId }) 
      : userId;
    const sessionId = await createSignedSession(sessionData, c.env);
    setCookie(c, 'academy_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      domain: '.akademo-edu.com',
    });

    return c.json(successResponse({
      token: sessionId, // Return signed token for cross-domain auth
      id: userId,
      email: email.toLowerCase(),
      firstName: userFirstName,
      lastName: userLastName,
      role,
    }), 201);
  } catch (error: any) {
    console.error('[Register] Error:', error);
    return c.json(errorResponse('Registration failed'), 500);
  }
});

// POST /auth/login
auth.post('/login', loginRateLimit, validateBody(loginSchema), async (c) => {
  try {
    const { email, password } = await c.req.json();

    // Find user
    const user = await c.env.DB
      .prepare('SELECT * FROM User WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    if (!user) {
      return c.json(errorResponse('Credenciales incorrectas'), 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password as string);
    
    if (!isValid) {
      return c.json(errorResponse('Credenciales incorrectas'), 401);
    }

    // PREVENT CONCURRENT LOGINS FOR STUDENTS ONLY
    // Deactivate all previous sessions for this user (only for STUDENT role)
    if (user.role === 'STUDENT') {
      await c.env.DB
        .prepare('UPDATE DeviceSession SET isActive = 0 WHERE userId = ? AND isActive = 1')
        .bind(user.id)
        .run();
    }
    
    // Update lastLoginAt timestamp
    await c.env.DB
      .prepare('UPDATE User SET lastLoginAt = ? WHERE id = ?')
      .bind(new Date().toISOString(), user.id)
      .run();
    
    // Create device session record (only for students) and include in token
    let deviceSessionId = null;
    if (user.role === 'STUDENT') {
      deviceSessionId = crypto.randomUUID();
      const now = new Date().toISOString();
      const userAgent = c.req.header('User-Agent') || 'Unknown';
      const deviceFingerprint = btoa(`${user.id}-${Date.now()}`);
      
      await c.env.DB
        .prepare('INSERT INTO DeviceSession (id, userId, deviceFingerprint, userAgent, isActive, lastActiveAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(deviceSessionId, user.id, deviceFingerprint, userAgent, 1, now, now)
        .run();
    }
    
    // Create signed session token - include deviceSessionId for students to track specific session
    const sessionData = deviceSessionId 
      ? JSON.stringify({ userId: user.id, deviceSessionId }) 
      : user.id as string;
    const sessionId = await createSignedSession(sessionData, c.env);
    
    setCookie(c, 'academy_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      domain: '.akademo-edu.com', // Share cookie with frontend
    });

    return c.json(successResponse({
      token: sessionId, // Return signed token for cross-domain auth
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    }));
  } catch (error: any) {
    console.error('[Login] Error:', error);
    console.error('[Login] Error stack:', error.stack);
    return c.json(errorResponse('Login failed'), 500);
  }
});

// POST /auth/logout
auth.post('/logout', async (c) => {
  try {
    // Get current user from token if available
    const authHeader = c.req.header('Authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      // Get session to extract userId (uses signed token verification)
      const session = await getSession(c);
      const userId = session?.id;
      
      // Deactivate all device sessions for this user
      if (userId) {
        await c.env.DB
          .prepare('UPDATE DeviceSession SET isActive = 0 WHERE userId = ? AND isActive = 1')
          .bind(userId)
          .run();
      }
      
      // Demo data reset removed - all demo data is now hardcoded in src/lib/demo-data.ts
      // Demo accounts (paymentStatus='NOT PAID') automatically see fresh generated data on every login
    }
  } catch (error) {
    // Silently fail - logout should always succeed
    console.error('Error during logout:', error);
  }
  
  setCookie(c, 'academy_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 0,
    path: '/',
    domain: '.akademo-edu.com',
  });

  return c.json(successResponse({ message: 'Logged out successfully' }));
});

// POST /auth/check-email - Check if email exists
auth.post('/check-email', checkEmailRateLimit, async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json(errorResponse('Email is required'), 400);
    }

    // Check if email exists
    const existingUser = await c.env.DB
      .prepare('SELECT id FROM User WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    return c.json(successResponse({
      exists: !!existingUser,
    }));
  } catch (error: any) {
    console.error('[Check Email] Error:', error);
    return c.json(errorResponse('Failed to check email'), 500);
  }
});

// POST /auth/send-verification
auth.post('/send-verification', emailVerificationRateLimit, async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json(errorResponse('Email is required'), 400);
    }

    // Check if email already registered
    const existingUser = await c.env.DB
      .prepare('SELECT id FROM User WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    if (existingUser) {
      return c.json(errorResponse('Email already registered'), 400);
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code in database
    await c.env.DB
      .prepare('INSERT OR REPLACE INTO VerificationCode (email, code, expiresAt) VALUES (?, ?, ?)')
      .bind(email.toLowerCase(), code, new Date(expires).toISOString())
      .run();

    // Send email via Resend API
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
            subject: 'Tu código de verificación - AKADEMO',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Verifica tu correo electrónico</h2>
                <p>Tu código de verificación es:</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <h1 style="color: #1f2937; letter-spacing: 8px; margin: 0;">${code}</h1>
                </div>
                <p style="color: #6b7280;">Este código expirará en 10 minutos.</p>
                <p style="color: #6b7280;">Si no solicitaste este código, puedes ignorar este mensaje.</p>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.error('[Send Verification] Resend API error:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('[Send Verification] Email sending failed:', emailError);
      }
    }

    // Log code for development/testing

    return c.json(successResponse({
      message: 'Verification code sent',
      // Note: In production, remove this - code should only be sent via email
    }));
  } catch (error: any) {
    console.error('[Send Verification] Error:', error);
    return c.json(errorResponse('Failed to send verification'), 500);
  }
});

// POST /auth/verify-email
auth.post('/verify-email', async (c) => {
  try {
    const { email, code } = await c.req.json();


    if (!email || !code) {
      return c.json(errorResponse('Email and code are required'), 400);
    }

    if (code.length !== 6) {
      return c.json(errorResponse('Code must be 6 digits'), 400);
    }

    // Check if code exists
    const stored = await c.env.DB
      .prepare('SELECT code, expiresAt FROM VerificationCode WHERE email = ?')
      .bind(email.toLowerCase())
      .first() as { code: string; expiresAt: string } | null;

    if (!stored) {
      return c.json(errorResponse('No verification code found. Please request a new one.'), 400);
    }

    // Check if expired
    if (Date.now() > new Date(stored.expiresAt).getTime()) {
      await c.env.DB.prepare('DELETE FROM VerificationCode WHERE email = ?').bind(email.toLowerCase()).run();
      return c.json(errorResponse('Verification code expired. Please request a new one.'), 400);
    }

    // Check if code matches
    if (stored.code !== code) {
      return c.json(errorResponse('Invalid verification code'), 400);
    }

    // Code is valid - remove it
    await c.env.DB.prepare('DELETE FROM VerificationCode WHERE email = ?').bind(email.toLowerCase()).run();

    return c.json(successResponse({
      message: 'Email verified successfully',
      verified: true,
    }));
  } catch (error: any) {
    console.error('[Verify Email] Error:', error);
    return c.json(errorResponse('Verification failed'), 500);
  }
});

// GET /auth/join/:teacherId - Get teacher info and classes for student enrollment
// This is a public endpoint (no auth required) for the student join flow
auth.get('/join/:teacherId', async (c) => {
  try {
    const teacherId = c.req.param('teacherId');

    // teacherId can be either a User.id (e.g., "teacher1") or a Teacher.id
    // First, try to find by User.id directly (most common case)
    let teacherUser = await c.env.DB.prepare(`
      SELECT id, firstName, lastName, email
      FROM User
      WHERE id = ? AND role = 'TEACHER'
    `).bind(teacherId).first() as { id: string; firstName: string; lastName: string; email: string } | null;

    // If not found as TEACHER, check if it's a Teacher table id
    if (!teacherUser) {
      const teacherRecord = await c.env.DB.prepare(`
        SELECT u.id, u.firstName, u.lastName, u.email
        FROM Teacher t
        JOIN User u ON t.userId = u.id
        WHERE t.id = ?
      `).bind(teacherId).first() as { id: string; firstName: string; lastName: string; email: string } | null;
      
      if (teacherRecord) {
        teacherUser = teacherRecord;
      }
    }

    // Also check for academy owners who might be teachers
    if (!teacherUser) {
      teacherUser = await c.env.DB.prepare(`
        SELECT id, firstName, lastName, email
        FROM User
        WHERE id = ? AND role = 'ACADEMY'
      `).bind(teacherId).first() as { id: string; firstName: string; lastName: string; email: string } | null;
    }

    if (!teacherUser) {
      return c.json(errorResponse('No se encontró el profesor'), 404);
    }

    // Get all classes taught by this teacher (by User.id)
    const classesResult = await c.env.DB.prepare(`
      SELECT c.id, c.name, c.description, a.name as academyName
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      WHERE c.teacherId = ?
      ORDER BY c.name
    `).bind(teacherUser.id).all();

    return c.json(successResponse({
      teacher: {
        id: teacherUser.id,
        firstName: teacherUser.firstName,
        lastName: teacherUser.lastName,
        email: teacherUser.email
      },
      classes: classesResult.results || []
    }));
  } catch (error: any) {
    console.error('[Join API] Error:', error);
    return c.json(errorResponse('Error al cargar los datos del profesor'), 500);
  }
});

// GET /auth/join/academy/:academyId - Get academy info and classes for student enrollment
// This is a public endpoint (no auth required) for the academy join flow
auth.get('/join/academy/:academyId', async (c) => {
  try {
    const academyId = c.req.param('academyId');

    // Get academy details
    const academy = await c.env.DB.prepare(`
      SELECT a.id, a.name, a.description, u.firstName as ownerFirstName, u.lastName as ownerLastName
      FROM Academy a
      JOIN User u ON a.ownerId = u.id
      WHERE a.id = ?
    `).bind(academyId).first() as { 
      id: string; 
      name: string; 
      description: string | null;
      ownerFirstName: string;
      ownerLastName: string;
    } | null;

    if (!academy) {
      return c.json(errorResponse('No se encontró la academia'), 404);
    }

    // Get all classes in this academy with teacher names
    const classesResult = await c.env.DB.prepare(`
      SELECT c.id, c.name, c.description, u.firstName || ' ' || u.lastName as teacherName
      FROM Class c
      JOIN User u ON c.teacherId = u.id
      WHERE c.academyId = ?
      ORDER BY c.name
    `).bind(academyId).all();

    return c.json(successResponse({
      academy: {
        id: academy.id,
        name: academy.name,
        description: academy.description,
        ownerFirstName: academy.ownerFirstName,
        ownerLastName: academy.ownerLastName
      },
      classes: classesResult.results || []
    }));
  } catch (error: any) {
    console.error('[Academy Join API] Error:', error);
    return c.json(errorResponse('Error al cargar los datos de la academia'), 500);
  }
});

// POST /auth/switch-role - Switch between ACADEMY and TEACHER roles (monoacademy only)
auth.post('/switch-role', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json(errorResponse('Not authenticated'), 401);
    }

    // Only ACADEMY and TEACHER roles can switch
    if (session.role !== 'ACADEMY' && session.role !== 'TEACHER') {
      return c.json(errorResponse('Role switching not available for your account'), 403);
    }

    let newRole: string;

    if (session.role === 'ACADEMY') {
      // Check if academy has monoacademy flag
      const academy = await c.env.DB
        .prepare('SELECT id, monoacademy FROM Academy WHERE ownerId = ?')
        .bind(session.id)
        .first();
      
      if (!academy || academy.monoacademy !== 1) {
        return c.json(errorResponse('Role switching not enabled for your academy'), 403);
      }

      // Ensure Teacher record exists for this user
      let teacher = await c.env.DB
        .prepare('SELECT id FROM Teacher WHERE userId = ?')
        .bind(session.id)
        .first();
      
      if (!teacher) {
        // Create Teacher record for this user
        const teacherId = crypto.randomUUID();
        const now = new Date().toISOString();
        
        await c.env.DB
          .prepare('INSERT INTO Teacher (id, userId, academyId, status, monoacademy, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(teacherId, session.id, academy.id, 'APPROVED', 1, now)
          .run();
      }

      newRole = 'TEACHER';
    } else if (session.role === 'TEACHER') {
      // Check if teacher has monoacademy flag
      const teacher = await c.env.DB
        .prepare('SELECT monoacademy, academyId FROM Teacher WHERE userId = ?')
        .bind(session.id)
        .first();
      
      if (!teacher || teacher.monoacademy !== 1) {
        return c.json(errorResponse('Role switching not enabled for your account'), 403);
      }

      // Verify this user owns the academy
      const academy = await c.env.DB
        .prepare('SELECT id FROM Academy WHERE id = ? AND ownerId = ?')
        .bind(teacher.academyId, session.id)
        .first();
      
      if (!academy) {
        return c.json(errorResponse('You do not own this academy'), 403);
      }

      newRole = 'ACADEMY';
    } else {
      return c.json(errorResponse('Invalid role'), 400);
    }

    // Update user's role
    await c.env.DB
      .prepare('UPDATE User SET role = ? WHERE id = ?')
      .bind(newRole, session.id)
      .run();

    // Create new signed session (same user, new role)
    const sessionId = await createSignedSession(session.id, c.env);
    setCookie(c, 'academy_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      domain: '.akademo-edu.com',
    });

    // Get the updated user info
    const updatedUser = await c.env.DB
      .prepare('SELECT id, email, firstName, lastName, role FROM User WHERE id = ?')
      .bind(session.id)
      .first();

    return c.json(successResponse({
      token: sessionId,
      user: updatedUser,
    }));
  } catch (error: any) {
    console.error('[Switch Role] Error:', error);
    return c.json(errorResponse('Failed to switch role'), 500);
  }
});

export default auth;
