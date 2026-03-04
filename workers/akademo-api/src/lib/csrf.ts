/**
 * CSRF Protection — Origin Validation + Custom Header Check
 * 
 * Two layers of defense against cross-site request forgery:
 * 
 * 1. **Origin/Referer check**: State-changing requests (POST/PUT/PATCH/DELETE)
 *    must have an Origin or Referer header matching our allowed origins.
 *    HTML forms from attacker sites will have their own origin.
 * 
 * 2. **Custom header requirement**: All non-exempt mutating requests must include
 *    an `X-Requested-With` header. HTML forms cannot set custom headers — only
 *    JavaScript (which is blocked by CORS from other origins) can.
 * 
 * Exempt paths: /webhooks/* (external services like Zoom, Bunny, Stripe)
 */

import { Context, Next } from 'hono';
import { Bindings } from '../types';
import { errorResponse } from './utils';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXEMPT_PREFIXES = ['/webhooks/'];
const ALLOWED_ORIGINS = new Set([
  'https://akademo-edu.com',
  'https://www.akademo-edu.com',
  'https://akademo.alexxvives.workers.dev',
  'http://localhost:3000',
]);

/**
 * CSRF middleware — checks Origin + X-Requested-With on state-changing requests.
 */
export function csrfProtection() {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const method = c.req.method.toUpperCase();
    const path = new URL(c.req.url).pathname;

    // Safe methods and webhook paths skip CSRF checks
    if (SAFE_METHODS.has(method) || EXEMPT_PREFIXES.some(p => path.startsWith(p))) {
      return next();
    }

    // Layer 1: Origin validation
    const origin = c.req.header('Origin');
    const referer = c.req.header('Referer');

    if (origin) {
      if (!ALLOWED_ORIGINS.has(origin)) {
        console.error(`[CSRF] Blocked request from disallowed origin: ${origin}`);
        return c.json(errorResponse('Forbidden — origin not allowed'), 403);
      }
    } else if (referer) {
      // Fallback to Referer if Origin is missing (some privacy proxies strip Origin)
      try {
        const refOrigin = new URL(referer).origin;
        if (!ALLOWED_ORIGINS.has(refOrigin)) {
          console.error(`[CSRF] Blocked request from disallowed referer: ${refOrigin}`);
          return c.json(errorResponse('Forbidden — origin not allowed'), 403);
        }
      } catch {
        return c.json(errorResponse('Forbidden — invalid referer'), 403);
      }
    }
    // Note: If both Origin and Referer are missing, we allow it.
    // Mobile apps and server-to-server calls may not include either.
    // The CORS + custom header checks provide the second layer of defense.

    // Layer 2: Require custom header (forms cannot set this)
    const xRequestedWith = c.req.header('X-Requested-With');
    const contentType = c.req.header('Content-Type') || '';
    
    // If the Content-Type is a "simple" type that forms can submit
    // (application/x-www-form-urlencoded, multipart/form-data, text/plain),
    // require X-Requested-With header as proof it came from JS, not a form.
    const isSimpleContentType = 
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data') ||
      contentType.includes('text/plain');
    
    // application/json is NOT a simple content type — it triggers CORS preflight,
    // which is sufficient protection on its own. Only enforce custom header
    // for simple content types.
    if (isSimpleContentType && !xRequestedWith) {
      console.error('[CSRF] Blocked form-like request without X-Requested-With header');
      return c.json(errorResponse('Forbidden — custom header required'), 403);
    }

    return next();
  };
}
