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
  console.log('[getSession] === SESSION CHECK START ===');
  let sessionId = getCookie(c, SESSION_COOKIE_NAME);
  
  console.log('[getSession] Cookie value:', sessionId || 'NOT FOUND');
  console.log('[getSession] All cookies:', c.req.header('Cookie'));

  // Also check Authorization header (Bearer token) for cross-domain support
  const authHeader = c.req.header('Authorization');
  console.log('[getSession] Authorization header:', authHeader || 'NOT FOUND');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionId = authHeader.split(' ')[1];
    console.log('[getSession] Using Bearer token:', sessionId);
  }

  if (!sessionId) {
    console.log('[getSession] FAILED - No session ID found in cookie or Bearer token');
    return null;
  }

  try {
    let userId: string;
    try {
        // Decode base64 session ID to get user ID
        console.log('[getSession] Attempting to decode sessionId:', sessionId);
        userId = atob(sessionId);
        console.log('[getSession] Decoded userId:', userId);
    } catch (e) {
        console.error('[getSession] FAILED to decode session ID:', e);
        console.error('[getSession] Invalid sessionId format:', sessionId);
        return null;
    }
    
    // Query user directly from D1 database
    console.log('[getSession] Querying database for userId:', userId);
    const user = await c.env.DB.prepare('SELECT id, email, firstName, lastName, role FROM User WHERE id = ?')
      .bind(userId)
      .first<UserRow>();

    if (!user) {
      console.log('[getSession] FAILED - User not found in database for userId:', userId);
      return null;
    }
    
    console.log('[getSession] SUCCESS - User found:', user.email, 'Role:', user.role, 'ID:', user.id);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
    };
  } catch (error) {
    console.error('[getSession] EXCEPTION:', error);
    return null;
  }
}

export async function requireAuth(c: Context<{ Bindings: Bindings }>): Promise<SessionUser> {
  console.log('[requireAuth] Starting authentication check...');
  const session = await getSession(c);
  if (!session) {
    console.error('[requireAuth] FAILED - No session found');
    throw new Error('Unauthorized');
  }
  console.log('[requireAuth] SUCCESS - Session found for user:', session.id, 'role:', session.role);
  return session;
}

export async function requireRole(c: Context<{ Bindings: Bindings }>, allowedRoles: UserRole[]): Promise<SessionUser> {
  const session = await requireAuth(c);
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden');
  }
  return session;
}
