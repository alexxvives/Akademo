import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { userQueries } from './db';

type UserRole = 'ADMIN' | 'ACADEMY' | 'TEACHER' | 'STUDENT';

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

export async function createSession(userId: string): Promise<string> {
  const sessionId = Buffer.from(userId).toString('base64');
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return sessionId;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  console.log('[getSession] Cookie name:', SESSION_COOKIE_NAME);
  console.log('[getSession] Session ID found:', sessionId ? 'Yes' : 'No');

  if (!sessionId) {
    console.log('[getSession] No session cookie found');
    return null;
  }

  // Simple session: decode base64 userId
  try {
    const userId = Buffer.from(sessionId, 'base64').toString('utf-8');
    console.log('[getSession] Decoded userId:', userId);
    
    const user = await userQueries.findById(userId) as any;
    console.log('[getSession] User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('[getSession] User not found in database');
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
    };
  } catch (error) {
    console.error('[getSession] Error decoding session:', error);
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}



export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden');
  }
  return session;
}
