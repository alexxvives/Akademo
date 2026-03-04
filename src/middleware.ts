import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://maps.googleapis.com",
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/api/auth', '/join', '/api/join'];

  if (publicPaths.some(path => pathname.startsWith(path))) {
    const res = NextResponse.next();
    res.headers.set('Content-Security-Policy', CSP);
    return res;
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('academy_session');

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const res = NextResponse.next();
  res.headers.set('Content-Security-Policy', CSP);
  return res;
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
