import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import { Bindings } from '../types';
import { getSession, createSignedSession, hashPassword } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { loginSchema, registerSchema, validateBody } from '../lib/validation';
import { loginRateLimit, registerRateLimit, checkEmailRateLimit, emailVerificationRateLimit, forgotPasswordRateLimit } from '../lib/rate-limit';

const auth = new Hono<{ Bindings: Bindings }>();

// GET /auth/me
auth.get('/me', async (c) => {
  
  const session = await getSession(c);

  if (!session) {
    return c.json(errorResponse('Not authenticated'), 401);
  }

  return c.json(successResponse(session));
});

// POST /auth/session/check - Check if session is valid
auth.post('/session/check', async (c) => {
  
  const session = await getSession(c);

  if (!session) {
    return c.json(errorResponse('Not authenticated'), 401);
  }

  // Check for pending suspicion warning (and clear it so it shows only once)
  let suspicionWarning = false;
  if (session.role === 'STUDENT') {
    try {
      const freshUser = await c.env.DB
        .prepare('SELECT suspicionWarning FROM User WHERE id = ?')
        .bind(session.id)
        .first<{ suspicionWarning: number }>();
      if (freshUser?.suspicionWarning === 1) {
        suspicionWarning = true;
        await c.env.DB
          .prepare('UPDATE User SET suspicionWarning = 0 WHERE id = ?')
          .bind(session.id)
          .run();
      }
    } catch {
      // non-fatal
    }
  }

  return c.json(successResponse({ ...session, suspicionWarning }));
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

    if ((role === 'STUDENT' || role === 'TEACHER') && (!firstName || firstName.trim() === '')) {
      return c.json(errorResponse('First name and last name are required'), 400);
    }

    // TEACHER self-registration is disabled — teachers are invited directly by academies
    if (role === 'TEACHER') {
      return c.json(errorResponse('Teachers must be invited directly by an academy'), 400);
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
    const hashedPassword = await hashPassword(password);

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
      const now = new Date().toISOString();
      await c.env.DB
        .prepare('INSERT INTO Academy (id, name, description, ownerId, paymentStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(
          newAcademyId,
          academyName,
          `Welcome to ${academyName}`,
          userId,
          'NOT PAID', // Demo mode by default
          now
        )
        .run();

    } else if (role === 'STUDENT') {
      // Student - auto-approve enrollment on registration (no manual approval needed)
      // If not provided, student can enroll later via /requests/student endpoint
      if (classId) {
        const enrollmentId = crypto.randomUUID();
        const now = new Date().toISOString();
        await c.env.DB
          .prepare('INSERT INTO ClassEnrollment (id, classId, userId, status, enrolledAt) VALUES (?, ?, ?, ?, ?)')
          .bind(enrollmentId, classId, userId, 'APPROVED', now)
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
    let suspicionAlreadyIncremented = false;
    if (user.role === 'STUDENT') {
      // If another session is already active, flag as suspicious (possible account sharing)
      const activeSessionCheck = await c.env.DB
        .prepare('SELECT COUNT(*) as count FROM DeviceSession WHERE userId = ? AND isActive = 1')
        .bind(user.id)
        .first<{ count: number }>();
      if ((activeSessionCheck?.count ?? 0) > 0) {
        await c.env.DB
          .prepare('UPDATE User SET suspicionCount = suspicionCount + 1 WHERE id = ?')
          .bind(user.id)
          .run();
        suspicionAlreadyIncremented = true;
      }
      await c.env.DB
        .prepare('UPDATE DeviceSession SET isActive = 0 WHERE userId = ? AND isActive = 1')
        .bind(user.id)
        .run();
    }
    
    // Update lastLoginAt timestamp
    const now = new Date().toISOString();
    await c.env.DB
      .prepare('UPDATE User SET lastLoginAt = ? WHERE id = ?')
      .bind(now, user.id)
      .run();

    // --- Impossible Travel Detection ---
    const cf = (c.req.raw as any).cf || {};
    const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || null;
    const country = (cf.country as string) || null;
    const city = (cf.city as string) || null;
    const latitude = cf.latitude ? parseFloat(cf.latitude as string) : null;
    const longitude = cf.longitude ? parseFloat(cf.longitude as string) : null;

    // Check previous login event for impossible travel
    const prevEvent = await c.env.DB
      .prepare('SELECT latitude, longitude, createdAt FROM LoginEvent WHERE userId = ? ORDER BY createdAt DESC LIMIT 1')
      .bind(user.id)
      .first();

    if (prevEvent && prevEvent.latitude != null && prevEvent.longitude != null && latitude != null && longitude != null) {
      const prevLat = prevEvent.latitude as number;
      const prevLon = prevEvent.longitude as number;
      const prevTime = new Date(prevEvent.createdAt as string).getTime();
      const curTime = new Date(now).getTime();
      const hoursElapsed = (curTime - prevTime) / (1000 * 60 * 60);

      if (hoursElapsed > 0) {
        // Haversine distance in km
        const R = 6371;
        const dLat = (latitude - prevLat) * Math.PI / 180;
        const dLon = (longitude - prevLon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(prevLat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const speedKmh = distKm / hoursElapsed;

        if (speedKmh > 300 && !suspicionAlreadyIncremented) {
          // Impossible travel detected — increment suspicion counter only if not already counted
          // (avoids double-counting when both session duplicate + impossible travel fire on the same login)
          // 300 km/h threshold: above TGV speed but safely above IP geolocation error margin (±50km = ~100km/h false positive risk)
          await c.env.DB
            .prepare('UPDATE User SET suspicionCount = suspicionCount + 1 WHERE id = ?')
            .bind(user.id)
            .run();
        }
      }
    }

    // Save this login event
    await c.env.DB
      .prepare('INSERT INTO LoginEvent (id, userId, ipAddress, country, city, latitude, longitude, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), user.id, ipAddress, country, city, latitude, longitude, now)
      .run();
    // --- End Impossible Travel ---

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

    // Re-read suspicionCount and suspicionWarning after possible updates
    const freshUser = await c.env.DB
      .prepare('SELECT suspicionCount, suspicionWarning FROM User WHERE id = ?')
      .bind(user.id)
      .first();
    const currentSuspicionCount = (freshUser?.suspicionCount as number) || 0;
    const hasSuspicionWarning = ((freshUser?.suspicionWarning as number) || 0) === 1;

    // Clear the warning flag so it only shows once per manual trigger
    if (hasSuspicionWarning) {
      await c.env.DB
        .prepare('UPDATE User SET suspicionWarning = 0 WHERE id = ?')
        .bind(user.id)
        .run();
    }

    return c.json(successResponse({
      token: sessionId, // Return signed token for cross-domain auth
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      suspicionCount: currentSuspicionCount,
      suspicionWarning: hasSuspicionWarning,
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
auth.post('/verify-email', emailVerificationRateLimit, async (c) => {
  try {
    const { email, code } = await c.req.json();

    if (!email || !code) {
      return c.json(errorResponse('Email and code are required'), 400);
    }

    if (code.length !== 6) {
      return c.json(errorResponse('Code must be 6 digits'), 400);
    }

    // Check if code exists (with attempt tracking)
    const stored = await c.env.DB
      .prepare('SELECT code, expiresAt, attempts FROM VerificationCode WHERE email = ?')
      .bind(email.toLowerCase())
      .first() as { code: string; expiresAt: string; attempts: number | null } | null;

    if (!stored) {
      return c.json(errorResponse('No verification code found. Please request a new one.'), 400);
    }

    // Check if expired
    if (Date.now() > new Date(stored.expiresAt).getTime()) {
      await c.env.DB.prepare('DELETE FROM VerificationCode WHERE email = ?').bind(email.toLowerCase()).run();
      return c.json(errorResponse('Verification code expired. Please request a new one.'), 400);
    }

    // Check if too many failed attempts (max 5)
    const attempts = stored.attempts || 0;
    if (attempts >= 5) {
      await c.env.DB.prepare('DELETE FROM VerificationCode WHERE email = ?').bind(email.toLowerCase()).run();
      return c.json(errorResponse('Too many failed attempts. Please request a new verification code.'), 429);
    }

    // Check if code matches
    if (stored.code !== code) {
      // Increment attempt counter
      await c.env.DB.prepare('UPDATE VerificationCode SET attempts = ? WHERE email = ?')
        .bind(attempts + 1, email.toLowerCase()).run();
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

    // Get teacher's academy logo
    const academyRecord = await c.env.DB.prepare(`
      SELECT a.logoUrl, a.name as academyName
      FROM Teacher t
      JOIN Academy a ON t.academyId = a.id
      WHERE t.userId = ?
      LIMIT 1
    `).bind(teacherUser.id).first() as { logoUrl: string | null; academyName: string } | null;

    return c.json(successResponse({
      teacher: {
        id: teacherUser.id,
        firstName: teacherUser.firstName,
        lastName: teacherUser.lastName,
        academyLogoUrl: academyRecord?.logoUrl || null,
        academyName: academyRecord?.academyName || null,
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
      SELECT a.id, a.name, a.description, a.logoUrl, u.firstName as ownerFirstName, u.lastName as ownerLastName
      FROM Academy a
      JOIN User u ON a.ownerId = u.id
      WHERE a.id = ?
    `).bind(academyId).first() as { 
      id: string; 
      name: string; 
      description: string | null;
      logoUrl: string | null;
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
        logoUrl: academy.logoUrl || null,
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

// POST /auth/forgot-password
auth.post('/forgot-password', forgotPasswordRateLimit, async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) return c.json(errorResponse('Email is required'), 400);

    // Look up user — always return generic success to prevent email enumeration
    const user = await c.env.DB
      .prepare('SELECT id FROM User WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    if (user) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await c.env.DB
        .prepare('INSERT OR REPLACE INTO VerificationCode (email, code, expiresAt) VALUES (?, ?, ?)')
        .bind(email.toLowerCase(), code, expires)
        .run();

      const resendApiKey = c.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'AKADEMO <onboarding@akademo-edu.com>',
              to: [email],
              subject: 'Restablecer contraseña - AKADEMO',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">Restablecer contraseña</h2>
                  <p>Tu código de restablecimiento es:</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #1f2937; letter-spacing: 8px; margin: 0;">${code}</h1>
                  </div>
                  <p style="color: #6b7280;">Este código expirará en 10 minutos.</p>
                  <p style="color: #6b7280;">Si no solicitaste esto, puedes ignorar este mensaje.</p>
                </div>
              `,
            }),
          });
        } catch (emailError) {
          console.error('[Forgot Password] Email error:', emailError);
        }
      }
    }

    return c.json(successResponse({ message: 'If that email exists, a reset code has been sent' }));
  } catch (error: any) {
    console.error('[Forgot Password] Error:', error);
    return c.json(errorResponse('Failed to process request'), 500);
  }
});

// POST /auth/reset-password
auth.post('/reset-password', async (c) => {
  try {
    const { email, code, newPassword } = await c.req.json();
    if (!email || !code || !newPassword) {
      return c.json(errorResponse('Email, code, and new password are required'), 400);
    }
    if (newPassword.length < 8) {
      return c.json(errorResponse('La contraseña debe tener al menos 8 caracteres'), 400);
    }

    const record = await c.env.DB
      .prepare('SELECT code, expiresAt FROM VerificationCode WHERE email = ?')
      .bind(email.toLowerCase())
      .first<{ code: string; expiresAt: string }>();

    if (!record) {
      return c.json(errorResponse('Código no encontrado. Solicita uno nuevo.'), 400);
    }
    if (new Date(record.expiresAt) < new Date()) {
      await c.env.DB.prepare('DELETE FROM VerificationCode WHERE email = ?').bind(email.toLowerCase()).run();
      return c.json(errorResponse('Código expirado. Solicita uno nuevo.'), 400);
    }
    if (record.code !== code) {
      return c.json(errorResponse('Código incorrecto'), 400);
    }

    await c.env.DB.prepare('DELETE FROM VerificationCode WHERE email = ?').bind(email.toLowerCase()).run();

    const hashedPassword = await hashPassword(newPassword);
    await c.env.DB
      .prepare('UPDATE User SET password = ? WHERE email = ?')
      .bind(hashedPassword, email.toLowerCase())
      .run();

    return c.json(successResponse({ message: 'Contraseña actualizada correctamente' }));
  } catch (error: any) {
    console.error('[Reset Password] Error:', error);
    return c.json(errorResponse('Failed to reset password'), 500);
  }
});

export default auth;
