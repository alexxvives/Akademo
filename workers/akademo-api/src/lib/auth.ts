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
  

  // Also check Authorization header (Bearer token) for cross-domain support
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionId = authHeader.split(' ')[1];
  }

  if (!sessionId) {
    return null;
  }

  try {
    let userId: string;
    let deviceSessionId: string | null = null;
    
    try {
        // Decode base64 session ID to get user ID (and deviceSessionId for students)
        const decoded = atob(sessionId);
        
        // Try to parse as JSON (new format with deviceSessionId)
        try {
          const parsed = JSON.parse(decoded);
          userId = parsed.userId;
          deviceSessionId = parsed.deviceSessionId || null;
        } catch {
          // Old format - just userId
          userId = decoded;
        }
    } catch (e) {
        console.error('[getSession] FAILED to decode session ID:', e);
        console.error('[getSession] Invalid sessionId format:', sessionId);
        return null;
    }
    
    // Query user directly from D1 database
    const user = await c.env.DB.prepare('SELECT id, email, firstName, lastName, role FROM User WHERE id = ?')
      .bind(userId)
      .first<UserRow>();

    if (!user) {
      return null;
    }
    
    // CONCURRENT LOGIN PREVENTION FOR STUDENTS
    // Check if THIS SPECIFIC device session is active (only for STUDENT role)
    if (user.role === 'STUDENT' && deviceSessionId) {
      const activeSession = await c.env.DB
        .prepare('SELECT id FROM DeviceSession WHERE id = ? AND userId = ? AND isActive = 1 LIMIT 1')
        .bind(deviceSessionId, user.id)
        .first();
      
      if (!activeSession) {
        // This specific session has been deactivated - user logged in elsewhere
        return null;
      }
    }
    
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
  const session = await getSession(c);
  if (!session) {
    console.error('[requireAuth] FAILED - No session found');
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
