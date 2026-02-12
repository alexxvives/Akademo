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
const SESSION_SIGNING_ALG = { name: 'HMAC', hash: 'SHA-256' };

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

/**
 * Derive an HMAC-SHA256 signing key from a secret string.
 * Uses the first available secret (SESSION_SECRET env var, or falls back to a derived key from DB binding).
 */
async function getSigningKey(env: Bindings): Promise<CryptoKey> {
  // Use SESSION_SECRET env var if available, otherwise deterministic fallback
  const secret = (env as unknown as Record<string, unknown>).SESSION_SECRET as string
    || 'akademo-session-key-' + (env.DB ? 'prod' : 'dev');
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    SESSION_SIGNING_ALG,
    false,
    ['sign', 'verify']
  );
}

/**
 * Sign a payload with HMAC-SHA256 and return `base64url(payload).base64url(signature)`
 */
async function signToken(payload: string, env: Bindings): Promise<string> {
  const key = await getSigningKey(env);
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  // Base64url encode both parts
  const payloadB64 = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${payloadB64}.${sigB64}`;
}

/**
 * Verify a signed token and return the payload, or null if invalid.
 */
async function verifyToken(token: string, env: Bindings): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 2) {
    // Legacy unsigned token (base64-only) — accept during migration but log warning
    try {
      const decoded = atob(token);
      if (decoded && decoded.length > 0) {
        console.warn('[Auth] Legacy unsigned session token detected — will be replaced on next login');
        return decoded;
      }
    } catch { /* invalid */ }
    return null;
  }
  try {
    const [payloadB64, sigB64] = parts;
    // Restore base64 padding
    const pad = (s: string) => s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - s.length % 4) % 4);
    const payload = atob(pad(payloadB64));
    const sigStr = atob(pad(sigB64));
    const sigArray = new Uint8Array([...sigStr].map(c => c.charCodeAt(0)));

    const key = await getSigningKey(env);
    const encoder = new TextEncoder();
    const valid = await crypto.subtle.verify('HMAC', key, sigArray, encoder.encode(payload));
    return valid ? payload : null;
  } catch {
    return null;
  }
}

export async function createSession(c: Context<{ Bindings: Bindings }>, userId: string): Promise<string> {
  const sessionId = await signToken(userId, c.env);
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

export async function createSignedSession(data: string, env: Bindings): Promise<string> {
  return signToken(data, env);
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
        // Verify signed token and decode payload
        const decoded = await verifyToken(sessionId, c.env);
        if (!decoded) {
          console.error('[getSession] Token verification failed');
          return null;
        }
        
        // Try to parse as JSON (format with deviceSessionId)
        try {
          const parsed = JSON.parse(decoded);
          userId = parsed.userId;
          deviceSessionId = parsed.deviceSessionId || null;
        } catch {
          // Simple format - just userId
          userId = decoded;
        }
    } catch (e) {
        console.error('[getSession] FAILED to decode session ID:', e);
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
