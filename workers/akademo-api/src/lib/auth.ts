import { Context } from 'hono';
import { getCookie } from 'hono/cookie';
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
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — kept for legacy token back-compat
export const ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15 minutes (new tokens embed exp field)
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
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

/**
 * Derive an HMAC-SHA256 signing key from SESSION_SECRET.
 * Throws if SESSION_SECRET is not configured — fail closed.
 */
async function getSigningKey(env: Bindings): Promise<CryptoKey> {
  const secret = (env as unknown as Record<string, unknown>).SESSION_SECRET as string;
  if (!secret) {
    throw new Error('[Auth] CRITICAL: SESSION_SECRET is not configured. Cannot sign/verify sessions.');
  }
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
 * New tokens embed an `exp` field; legacy tokens fall back to SESSION_MAX_AGE.
 */
async function verifyToken(token: string, env: Bindings): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 2) {
    // Reject any token that is not properly signed (payload.signature format)
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
    if (!valid) return null;

    // Check expiry
    try {
      const parsed = JSON.parse(payload);
      const now = Math.floor(Date.now() / 1000);
      if (parsed.exp) {
        // New-style token: explicit exp field
        if (now > parsed.exp) return null;
      } else if (parsed.iat) {
        // Legacy token: iat + SESSION_MAX_AGE window
        if (now - parsed.iat > SESSION_MAX_AGE) return null;
      } else {
        return null; // No timing info — reject
      }
    } catch {
      // Non-JSON payload — reject
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Hash a refresh token with SHA-256 for safe DB storage.
 * The plain token is stored in the HttpOnly cookie; only the hash lives in the DB.
 */
export async function hashRefreshToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generate a cryptographically random refresh token (256-bit entropy).
 */
export function generateRefreshToken(): string {
  return `${crypto.randomUUID()}-${crypto.randomUUID()}`;
}

export async function createSignedSession(data: string, env: Bindings): Promise<string> {
  return signToken(data, env);
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
    
    // SESSION REVOCATION CHECK
    // If token includes a deviceSessionId, verify it hasn't been revoked in D1.
    // Applies to ALL roles (extended from STUDENT-only for full session control).
    if (deviceSessionId) {
      const activeSession = await c.env.DB
        .prepare('SELECT id FROM DeviceSession WHERE id = ? AND userId = ? AND isActive = 1 LIMIT 1')
        .bind(deviceSessionId, user.id)
        .first();
      
      if (!activeSession) {
        // This specific session has been revoked/deactivated
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
