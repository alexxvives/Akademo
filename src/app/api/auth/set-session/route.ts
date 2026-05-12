/**
 * Next.js API route that sets the academy_session cookie from the same origin.
 *
 * WHY THIS EXISTS:
 * The Hono API worker runs on akademo-api.alexxvives.workers.dev. Browsers reject
 * Set-Cookie responses where the Domain attribute doesn't match the response
 * origin (RFC 6265). So the API's attempt to set academy_session for
 * domain=.akademo-edu.com is silently dropped by every browser.
 *
 * This route runs on akademo-edu.com (same origin as the frontend), so it CAN
 * set cookies that the Next.js middleware will see on subsequent page loads.
 * Without this, Safari iOS users get redirected to /login on every hard reload
 * because the middleware never finds the cookie.
 *
 * SECURITY: the cookie is httpOnly and the token format is validated before
 * setting. Real authentication happens in the API worker (Bearer token check).
 * This cookie is only used by the middleware as a routing gate.
 */

import { NextRequest, NextResponse } from 'next/server';

const SIGNED_TOKEN_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, matches API worker

/** POST — store a new session token as a cookie */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token: unknown = body?.token;

    if (typeof token !== 'string' || !SIGNED_TOKEN_RE.test(token)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('academy_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

/** DELETE — clear the session cookie on logout */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('academy_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
