/**
 * Distributed rate limiter for Cloudflare Workers backed by D1.
 * 
 * Uses a fixed-window approach with D1's RateLimit table.
 * Consistent across all edge locations and survives cold starts.
 * Includes in-memory fast-path to reduce D1 reads for hot keys.
 */

import { Context, Next } from 'hono';
import { Bindings } from '../types';
import { errorResponse } from './utils';

interface RateLimitConfig {
  /** Human-readable prefix for the rate limit key (e.g. "login", "register") */
  prefix: string;
  /** Time window in seconds */
  windowSec: number;
  /** Max requests per window */
  maxRequests: number;
  /** Custom key function (defaults to client IP) */
  keyFn?: (c: Context<{ Bindings: Bindings }>) => string;
}

/**
 * In-memory cache to avoid hitting D1 on every request for the same key.
 * Maps compositeKey -> { count, windowStart, lastChecked }
 * This is a best-effort optimization — D1 is the source of truth.
 */
const memCache = new Map<string, { count: number; windowStart: number; ts: number }>();

// Periodically clean stale in-memory entries (every 60s)
let lastMemCleanup = Date.now();
function cleanupMemCache() {
  const now = Date.now();
  if (now - lastMemCleanup < 60_000) return;
  lastMemCleanup = now;
  const cutoff = now - 3_600_000; // Keep entries up to 1 hour
  for (const [key, entry] of memCache) {
    if (entry.ts < cutoff) memCache.delete(key);
  }
}

/**
 * Get client IP from Cloudflare's CF-Connecting-IP header
 */
function getClientIp(c: Context<{ Bindings: Bindings }>): string {
  return c.req.header('CF-Connecting-IP')
    || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim()
    || 'unknown';
}

/**
 * Create a D1-backed rate-limiting middleware for Hono.
 * Falls back to in-memory-only if D1 query fails (fail-open for availability).
 */
export function rateLimit(config: RateLimitConfig) {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const rawKey = config.keyFn ? config.keyFn(c) : getClientIp(c);
    const compositeKey = `${config.prefix}:${rawKey}`;
    const nowSec = Math.floor(Date.now() / 1000);
    const windowStart = nowSec - (nowSec % config.windowSec); // Align to window boundary

    cleanupMemCache();

    // Fast path: check in-memory cache first
    const cached = memCache.get(compositeKey);
    if (cached && cached.windowStart === windowStart && cached.count >= config.maxRequests) {
      const retryAfter = windowStart + config.windowSec - nowSec;
      c.header('Retry-After', String(retryAfter));
      return c.json(errorResponse('Too many requests. Please try again later.'), 429);
    }

    try {
      // Upsert: increment counter for this key+window, or create with count=1
      const result = await c.env.DB.prepare(`
        INSERT INTO RateLimit (key, windowStart, count) VALUES (?, ?, 1)
        ON CONFLICT(key, windowStart) DO UPDATE SET count = count + 1
        RETURNING count
      `).bind(compositeKey, windowStart).first<{ count: number }>();

      const count = result?.count ?? 1;

      // Update in-memory cache
      memCache.set(compositeKey, { count, windowStart, ts: Date.now() });

      if (count > config.maxRequests) {
        const retryAfter = windowStart + config.windowSec - nowSec;
        c.header('Retry-After', String(retryAfter));
        return c.json(errorResponse('Too many requests. Please try again later.'), 429);
      }

      // Opportunistic cleanup: purge expired windows (at most once per invocation, async)
      // Non-blocking — fire and forget
      c.executionCtx.waitUntil(
        c.env.DB.prepare('DELETE FROM RateLimit WHERE windowStart < ?')
          .bind(windowStart - config.windowSec)
          .run()
          .catch(() => { /* ignore cleanup failures */ })
      );
    } catch {
      // D1 failure: fall back to in-memory only (fail-open for availability)
      if (cached && cached.windowStart === windowStart) {
        cached.count++;
        if (cached.count > config.maxRequests) {
          const retryAfter = windowStart + config.windowSec - nowSec;
          c.header('Retry-After', String(retryAfter));
          return c.json(errorResponse('Too many requests. Please try again later.'), 429);
        }
      } else {
        memCache.set(compositeKey, { count: 1, windowStart, ts: Date.now() });
      }
    }

    await next();
  };
}

// Pre-configured rate limiters
export const loginRateLimit = rateLimit({
  prefix: 'login',
  windowSec: 60,          // 1 minute
  maxRequests: 20,         // 20 login attempts per minute per IP
});

export const registerRateLimit = rateLimit({
  prefix: 'register',
  windowSec: 3600,         // 1 hour
  maxRequests: 20,         // 20 registrations per hour per IP
});

export const emailVerificationRateLimit = rateLimit({
  prefix: 'email-verify',
  windowSec: 3600,         // 1 hour
  maxRequests: 5,          // 5 verification emails per hour per IP
});

export const checkEmailRateLimit = rateLimit({
  prefix: 'check-email',
  windowSec: 60,           // 1 minute
  maxRequests: 10,         // 10 email checks per minute per IP
});

export const forgotPasswordRateLimit = rateLimit({
  prefix: 'forgot-pwd',
  windowSec: 3600,         // 1 hour
  maxRequests: 5,          // 5 password reset requests per hour per IP
});

export const resetPasswordRateLimit = rateLimit({
  prefix: 'reset-pwd',
  windowSec: 3600,         // 1 hour
  maxRequests: 5,          // 5 password reset attempts per hour per IP
});
