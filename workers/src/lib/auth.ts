<<<<<<< HEAD
import { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { SessionUser, Bindings } from '../types';

const SESSION_COOKIE_NAME = 'academy_session';

export async function getSession(c: Context<{ Bindings: Bindings }>): Promise<SessionUser | null> {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
=======
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
>>>>>>> f24ea82795dafc5341396e30094ad22af463a926

  console.log('[getSession] Cookie name:', SESSION_COOKIE_NAME);
  console.log('[getSession] Session ID found:', sessionId ? 'Yes' : 'No');

  if (!sessionId) {
    console.log('[getSession] No session cookie found');
    return null;
  }

<<<<<<< HEAD
  try {
    // Decode base64 userId
    const userId = Buffer.from(sessionId, 'base64').toString('utf-8');
    console.log('[getSession] Decoded userId:', userId);

    // Query user from database
    const user = await c.env.DB
      .prepare('SELECT * FROM User WHERE id = ?')
      .bind(userId)
      .first();

=======
  // Simple session: decode base64 userId
  try {
    const userId = Buffer.from(sessionId, 'base64').toString('utf-8');
    console.log('[getSession] Decoded userId:', userId);
    
    const user = await userQueries.findById(userId) as any;
>>>>>>> f24ea82795dafc5341396e30094ad22af463a926
    console.log('[getSession] User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('[getSession] User not found in database');
      return null;
    }
<<<<<<< HEAD

    return {
      id: user.id as string,
      email: user.email as string,
      firstName: user.firstName as string,
      lastName: user.lastName as string,
      role: user.role as SessionUser['role'],
=======
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
>>>>>>> f24ea82795dafc5341396e30094ad22af463a926
    };
  } catch (error) {
    console.error('[getSession] Error decoding session:', error);
    return null;
  }
}

<<<<<<< HEAD
export async function requireAuth(c: Context<{ Bindings: Bindings }>): Promise<SessionUser> {
  const session = await getSession(c);
=======
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}



export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
>>>>>>> f24ea82795dafc5341396e30094ad22af463a926
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

<<<<<<< HEAD
export async function requireRole(c: Context<{ Bindings: Bindings }>, roles: SessionUser['role'][]): Promise<SessionUser> {
  const session = await requireAuth(c);
  if (!roles.includes(session.role)) {
=======
export async function requireRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
>>>>>>> f24ea82795dafc5341396e30094ad22af463a926
    throw new Error('Forbidden');
  }
  return session;
}
