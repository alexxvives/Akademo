import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

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

/**
 * Web API compatible base64 encoding (replaces Buffer.from().toString('base64'))
 */
function encodeBase64(str: string): string {
  // Use btoa for simple ASCII strings (user IDs are typically alphanumeric)
  try {
    return btoa(str);
  } catch {
    // Fallback for unicode: encode as UTF-8 first
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    ));
  }
}

/**
 * Web API compatible base64 decoding (replaces Buffer.from(str, 'base64').toString())
 */
function decodeBase64(str: string): string {
  try {
    return atob(str);
  } catch {
    // Fallback for unicode
    const decoded = atob(str);
    return decodeURIComponent(decoded.split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = encodeBase64(userId);
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


  if (!sessionId) {
    return null;
  }

  // Simple session: decode base64 userId
  try {
    const userId = decodeBase64(sessionId);
    
    // Fetch user from worker API instead of direct DB access
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://akademo-api.alexxvives.workers.dev';
    const response = await fetch(`${apiUrl}/users/${userId}`, {
      headers: {
        'Cookie': `${SESSION_COOKIE_NAME}=${sessionId}`,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    const user = result.data;

    if (!user) {
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
