import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import { Bindings } from '../types';
import { getSession } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const auth = new Hono<{ Bindings: Bindings }>();

// Verification codes storage (in production, use KV or Durable Objects)
const verificationCodes = new Map<string, { code: string; expires: number }>();

// GET /auth/me
auth.get('/me', async (c) => {
  console.log('[Auth Me] Request received');
  
  const session = await getSession(c);
  console.log('[Auth Me] Session result:', session ? 'Found' : 'Not found');

  if (!session) {
    console.log('[Auth Me] Returning 401 - no session');
    return c.json(errorResponse('Not authenticated'), 401);
  }

  console.log('[Auth Me] Returning session for user:', session.id);
  return c.json(successResponse(session));
});

// POST /auth/register
auth.post('/register', async (c) => {
  try {
    const { email, password, firstName, lastName, role = 'STUDENT' } = await c.req.json();

    if (!email || !password || !firstName || !lastName) {
      return c.json(errorResponse('All fields are required'), 400);
    }

    if (password.length < 8) {
      return c.json(errorResponse('Password must be at least 8 characters'), 400);
    }

    if (!['STUDENT', 'TEACHER'].includes(role)) {
      return c.json(errorResponse('Invalid role'), 400);
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

    // Create user
    await c.env.DB
      .prepare('INSERT INTO User (id, email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(userId, email.toLowerCase(), hashedPassword, firstName, lastName, role)
      .run();

    // Auto-create academy for teachers
    if (role === 'TEACHER') {
      const academyId = crypto.randomUUID();
      await c.env.DB
        .prepare('INSERT INTO Academy (id, name, description, ownerId) VALUES (?, ?, ?, ?)')
        .bind(
          academyId,
          `${firstName} ${lastName}'s Academy`,
          `Welcome to ${firstName}'s teaching space`,
          userId
        )
        .run();
    }

    // Create session (use btoa for base64 encoding in Workers)
    const sessionId = btoa(userId);
    setCookie(c, 'academy_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      domain: '.akademo-edu.com',
    });

    return c.json(successResponse({
      token: sessionId, // Return token for cross-domain auth
      id: userId,
      email: email.toLowerCase(),
      firstName,
      lastName,
      role,
    }), 201);
  } catch (error: any) {
    console.error('[Register] Error:', error);
    return c.json(errorResponse(error.message || 'Registration failed'), 500);
  }
});

// POST /auth/login
auth.post('/login', async (c) => {
  try {
    console.log('[Login] Request received');
    const { email, password } = await c.req.json();

    if (!email || !password) {
      console.log('[Login] Missing email or password');
      return c.json(errorResponse('Email and password are required'), 400);
    }

    console.log('[Login] Looking up user:', email);
    // Find user
    const user = await c.env.DB
      .prepare('SELECT * FROM User WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    if (!user) {
      console.log('[Login] User not found');
      return c.json(errorResponse('Invalid credentials'), 401);
    }

    console.log('[Login] User found, verifying password');
    // Verify password
    const isValid = await bcrypt.compare(password, user.password as string);
    if (!isValid) {
      console.log('[Login] Invalid password');
      return c.json(errorResponse('Invalid credentials'), 401);
    }

    console.log('[Login] Password valid, creating session');
    // Create session (use btoa for base64 encoding in Workers)
    // We use lib/auth createSession if we imported it, but here we can just do it manually or import it.
    // For now, let's keep it manual but add the token to response.
    const sessionId = btoa(user.id as string);
    
    setCookie(c, 'academy_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      domain: '.akademo-edu.com', // Share cookie with frontend
    });

    console.log('[Login] Success for user:', user.id);
    return c.json(successResponse({
      token: sessionId, // Return token for cross-domain auth
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    }));
  } catch (error: any) {
    console.error('[Login] Error:', error);
    console.error('[Login] Error stack:', error.stack);
    return c.json(errorResponse(error.message || 'Login failed'), 500);
  }
});

// POST /auth/logout
auth.post('/logout', async (c) => {
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

// POST /auth/send-verification
auth.post('/send-verification', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json(errorResponse('Email is required'), 400);
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code
    verificationCodes.set(email.toLowerCase(), { code, expires });

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
            from: 'AKADEMO <onboarding@resend.dev>', // Change to verified domain in production
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
    console.log(`[Verification Code] ${email}: ${code}`);

    return c.json(successResponse({
      message: 'Verification code sent',
      ...(process.env.NODE_ENV !== 'production' && { code }), // Include code in dev mode only
    }));
  } catch (error: any) {
    console.error('[Send Verification] Error:', error);
    return c.json(errorResponse(error.message || 'Failed to send verification'), 500);
  }
});

// POST /auth/verify-email
auth.post('/verify-email', async (c) => {
  try {
    const { email, code } = await c.req.json();

    console.log('[Verify Email] Received:', { email, code });

    if (!email || !code) {
      return c.json(errorResponse('Email and code are required'), 400);
    }

    if (code.length !== 6) {
      return c.json(errorResponse('Code must be 6 digits'), 400);
    }

    // Check if code exists
    const stored = verificationCodes.get(email.toLowerCase());

    if (!stored) {
      return c.json(errorResponse('No verification code found. Please request a new one.'), 400);
    }

    // Check if expired
    if (Date.now() > stored.expires) {
      verificationCodes.delete(email.toLowerCase());
      return c.json(errorResponse('Verification code expired. Please request a new one.'), 400);
    }

    // Check if code matches
    if (stored.code !== code) {
      return c.json(errorResponse('Invalid verification code'), 400);
    }

    // Code is valid - remove it
    verificationCodes.delete(email.toLowerCase());

    return c.json(successResponse({
      message: 'Email verified successfully',
      verified: true,
    }));
  } catch (error: any) {
    console.error('[Verify Email] Error:', error);
    return c.json(errorResponse(error.message || 'Verification failed'), 500);
  }
});

export default auth;
