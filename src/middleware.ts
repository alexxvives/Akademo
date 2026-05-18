import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://maps.googleapis.com https://static.cloudflareinsights.com https://www.googletagmanager.com https://cloud.umami.is",
  "worker-src blob: 'self'",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https: wss:",
  "font-src 'self' https: data:",
  "frame-src 'self' https:",
  "media-src 'self' blob: https:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

/** Apply all security headers to a response */
function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('Content-Security-Policy', CSP);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()');
  return res;
}

/**
 * Structural validation of the session cookie format (V-17).
 * Verifies the cookie looks like a properly signed token (base64url.base64url)
 * without requiring the SESSION_SECRET (which is in the API worker).
 * Full HMAC verification happens at the API layer.
 */
const SIGNED_TOKEN_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
function hasValidCookieFormat(value: string): boolean {
  return SIGNED_TOKEN_RE.test(value);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/api/auth', '/join', '/api/join', '/docs', '/pricing', '/blog'];

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Check for session cookie — must exist AND have the correct signed-token format
  const sessionCookie = request.cookies.get('academy_session');

  if (!sessionCookie || !hasValidCookieFormat(sessionCookie.value)) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('modal', 'login');
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
