/**
 * Simple in-memory rate limiter for Cloudflare Workers.
 * Uses a sliding window approach with a Map<string, number[]>.
 * 
 * NOTE: This is per-isolate, so doesn't persist across cold starts
 * or different edge locations — but it's effective against sustained attacks
 * and costs nothing (no KV/D1 dependency).
 */

import { Context, Next } from 'hono';
import { Bindings } from '../types';
import { errorResponse } from './utils';

interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyFn?: (c: Context<{ Bindings: Bindings }>) => string; // Custom key function
}

const store = new Map<string, number[]>();

// Cleanup old entries every 60 seconds
let lastCleanup = Date.now();
function cleanupStore(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, timestamps] of store) {
    const valid = timestamps.filter(t => t > cutoff);
    if (valid.length === 0) {
      store.delete(key);
    } else {
      store.set(key, valid);
    }
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
 * Create a rate-limiting middleware for Hono
 */
export function rateLimit(config: RateLimitConfig) {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const key = config.keyFn ? config.keyFn(c) : getClientIp(c);
    const now = Date.now();
    const cutoff = now - config.windowMs;

    cleanupStore(config.windowMs);

    const timestamps = store.get(key) || [];
    const validTimestamps = timestamps.filter(t => t > cutoff);

    if (validTimestamps.length >= config.maxRequests) {
      const retryAfter = Math.ceil((validTimestamps[0] + config.windowMs - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(errorResponse('Too many requests. Please try again later.'), 429);
    }

    validTimestamps.push(now);
    store.set(key, validTimestamps);

    await next();
  };
}

// Pre-configured rate limiters
export const loginRateLimit = rateLimit({
  windowMs: 60_000,      // 1 minute
  maxRequests: 5,         // 5 login attempts per minute per IP
});

export const registerRateLimit = rateLimit({
  windowMs: 3_600_000,   // 1 hour
  maxRequests: 3,         // 3 registrations per hour per IP
});

export const emailVerificationRateLimit = rateLimit({
  windowMs: 3_600_000,   // 1 hour
  maxRequests: 5,         // 5 verification emails per hour per IP
});

export const checkEmailRateLimit = rateLimit({
  windowMs: 60_000,      // 1 minute
  maxRequests: 10,        // 10 email checks per minute per IP
});
