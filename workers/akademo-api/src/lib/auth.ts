import { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import { Bindings } from '../types';

type UserRole = 'ADMIN' | 'ACADEMY' | 'TEACHER' | 'STUDENT';

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const SESSION_COOKIE_NAME = 'academy_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createSession(c: Context<{ Bindings: Bindings }>, userId: string): Promise<string> {
  const sessionId = btoa(userId);
  setCookie(c, SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
    domain: '.akademo-edu.com',
  });
  return sessionId;
}

export async function deleteSession(c: Context<{ Bindings: Bindings }>): Promise<void> {
  deleteCookie(c, SESSION_COOKIE_NAME, {
      path: '/',
      domain: '.akademo-edu.com',
  });
}

export async function getSession(c: Context<{ Bindings: Bindings }>): Promise<SessionUser | null> {
  let sessionId = getCookie(c, SESSION_COOKIE_NAME);
  
  console.log('[getSession] Cookie value:', sessionId || 'NOT FOUND');
  console.log('[getSession] All cookies:', c.req.header('Cookie'));

  // Also check Authorization header (Bearer token) for cross-domain support
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionId = authHeader.split(' ')[1];
    console.log('[getSession] Using Bearer token');
  }

  if (!sessionId) {
    console.log('[getSession] No session ID found');
    return null;
  }

  try {
    let userId: string;
    try {
        // Decode base64 session ID to get user ID
        userId = atob(sessionId);
        console.log('[getSession] Decoded userId:', userId);
    } catch (e) {
        console.error('[getSession] Failed to decode session ID:', e);
        return null;
    }
    
    // Query user directly from D1 database
    const user = await c.env.DB.prepare('SELECT id, email, firstName, lastName, role FROM User WHERE id = ?')
      .bind(userId)
      .first<UserRow>();

    if (!user) {
      console.log('[getSession] User not found in database for userId:', userId);
      return null;
    }
    
    console.log('[getSession] User found:', user.email, 'Role:', user.role);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
    };
  } catch (error) {
    console.error('[getSession] Error:', error);
    return null;
  }
}

export async function requireAuth(c: Context<{ Bindings: Bindings }>): Promise<SessionUser> {
  const session = await getSession(c);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireRole(c: Context<{ Bindings: Bindings }>, allowedRoles: UserRole[]): Promise<SessionUser> {
  const session = await requireAuth(c);
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden');
  }
  return session;
}
