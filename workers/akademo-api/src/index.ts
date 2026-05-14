import * as Sentry from '@sentry/cloudflare';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import authRoutes from './routes/auth';
import classRoutes from './routes/classes';
import enrollmentRoutes from './routes/enrollments';
import requestRoutes from './routes/requests';
import lessonRoutes from './routes/lessons';
import topicRoutes from './routes/topics';
import videoRoutes from './routes/videos';
import academyRoutes from './routes/academies';
import exploreRoutes from './routes/explore';
import userRoutes from './routes/users';
import documentRoutes from './routes/documents';
import ratingRoutes from './routes/ratings';
import liveRoutes from './routes/live';
import bunnyRoutes from './routes/bunny';
import storageRoutes from './routes/storage';
import webhookRoutes from './routes/webhooks';
import studentRoutes from './routes/students';
import adminRoutes from './routes/admin';
import paymentsRoutes from './routes/payments';
import studentPaymentsRoutes from './routes/student-payments';
import { zoomAccounts } from './routes/zoom-accounts';
import assignmentsRoutes from './routes/assignments';
import zoomRoutes from './routes/zoom';
import calendarEventsRoutes from './routes/calendar-events';
import academicYearsRoutes from './routes/academic-years';
import leadsRoutes from './routes/leads';
import mediaRoutes from './routes/media';
import dashboardRoutes from './routes/dashboard';
import { Bindings } from './types';

import { requireAuth } from './lib/auth';
import { successResponse, errorResponse } from './lib/utils';
import { csrfProtection } from './lib/csrf';

const CORS_ALLOWED_ORIGINS = [
  'https://akademo-edu.com',
  'https://www.akademo-edu.com',
  'https://akademo.alexxvives.workers.dev',
  'http://localhost:3000',
];

const app = new Hono<{ Bindings: Bindings }>();

// Global error handler - map auth errors to proper status codes
app.onError((err, c) => {
  // Enriched error log: includes route, method, request id, and user context
  // (when available) so we can correlate 5xx errors with the user that hit them
  // without having to reproduce the issue.
  const reqId =
    c.req.header('cf-ray') || c.req.header('x-request-id') || crypto.randomUUID();
  const userCtx = (() => {
    try {
      const u = (c.get as any)?.('user');
      if (u && typeof u === 'object') {
        return { userId: u.id, role: u.role, email: u.email };
      }
    } catch { /* no auth context */ }
    return null;
  })();
  console.error('[API Error]', {
    reqId,
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    err: err.message,
    stack: err.stack,
    user: userCtx,
  });
  const origin = c.req.header('Origin') || '';
  const corsOrigin = CORS_ALLOWED_ORIGINS.includes(origin) ? origin : CORS_ALLOWED_ORIGINS[0];
  c.header('Access-Control-Allow-Origin', corsOrigin);
  c.header('Access-Control-Allow-Credentials', 'true');
  if (err.message === 'Unauthorized') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  if (err.message === 'Forbidden') {
    return c.json({ success: false, error: 'Forbidden' }, 403);
  }
  return c.json({ success: false, error: 'Internal server error', reqId }, 500);
});

// Middleware
app.use('*', logger());

// Response-status auditor: logs ANY 4xx/5xx response (including those returned
// via `c.json(errorResponse(...), 500)` that never reach app.onError). This is
// what catches silent 500s before users complain.
app.use('*', async (c, next) => {
  await next();
  const status = c.res.status;
  if (status >= 400) {
    const reqId =
      c.req.header('cf-ray') || c.req.header('x-request-id') || 'no-req-id';
    let userCtx: { userId?: string; role?: string } | null = null;
    try {
      const u = (c.get as any)?.('user');
      if (u && typeof u === 'object') userCtx = { userId: u.id, role: u.role };
    } catch { /* no auth context */ }
    const tag = status >= 500 ? '[5xx]' : '[4xx]';
    console.warn(tag, {
      reqId,
      status,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      user: userCtx,
    });
  }
});

// Make env available via getCloudflareContext() for utility functions
import { runWithEnv, CloudflareEnv } from './lib/cloudflare';
app.use('*', async (c, next) => {
  return runWithEnv(c.env as unknown as CloudflareEnv, () => next());
});

// CORS: handles OPTIONS preflight and adds headers to all responses.
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || '';
  if (c.req.method === 'OPTIONS') {
    if (CORS_ALLOWED_ORIGINS.includes(origin)) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, Cache-Control, Pragma, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
  }
  await next();
  if (CORS_ALLOWED_ORIGINS.includes(origin)) {
    c.res.headers.set('Access-Control-Allow-Origin', origin);
    c.res.headers.set('Access-Control-Allow-Credentials', 'true');
  }
});

// CSRF protection: validate Origin + custom header on state-changing requests
app.use('*', csrfProtection());

// Security headers
app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});

// Health check (minimal info in production to prevent reconnaissance)
app.get('/', (c) => c.json({ status: 'ok' }));

// Routes - Phase 1: Core Routes
app.route('/auth', authRoutes);
app.route('/admin', adminRoutes);
app.route('/classes', classRoutes);
app.route('/enrollments', enrollmentRoutes);
app.route('/requests', requestRoutes);
app.route('/lessons', lessonRoutes);
app.route('/topics', topicRoutes);
app.route('/videos', videoRoutes);
app.route('/academies', academyRoutes);
app.route('/explore', exploreRoutes);
app.route('/users', userRoutes);
app.route('/students', studentRoutes);
app.route('/documents', documentRoutes);
app.route('/ratings', ratingRoutes);
app.route('/payments', paymentsRoutes);
app.route('/student-payments', studentPaymentsRoutes);
app.route('/assignments', assignmentsRoutes);

// Routes - Phase 2: Advanced Features
app.route('/live', liveRoutes);
app.route('/bunny', bunnyRoutes);
app.route('/storage', storageRoutes);
app.route('/webhooks', webhookRoutes);
app.route('/zoom-accounts', zoomAccounts);
app.route('/calendar-events', calendarEventsRoutes);
app.route('/zoom', zoomRoutes);
app.route('/academic-years', academicYearsRoutes);
app.route('/leads', leadsRoutes);
app.route('/media', mediaRoutes);
app.route('/dashboard', dashboardRoutes);

// GET /teacher/academy - Get teacher's academy with paymentStatus (for demo mode detection)
app.get('/teacher/academy', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'TEACHER') {
      return c.json(errorResponse('Only teachers can use this endpoint'), 403);
    }
    const result = await c.env.DB.prepare(`
      SELECT a.id, a.name, a.logoUrl, a.paymentStatus, a.requireGrading
      FROM Academy a
      JOIN Teacher t ON t.academyId = a.id
      WHERE t.userId = ?
    `).bind(session.id).first<{ id: string; name: string; logoUrl: string | null; paymentStatus: string | null; requireGrading: number | null }>();
    if (!result) {
      return c.json(errorResponse('Academy not found'), 404);
    }
    return c.json(successResponse({ academy: result }));
  } catch (error: unknown) {
    console.error('[Teacher Academy] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PATCH /student/tutorial-seen - Mark onboarding tutorial as seen
app.patch('/student/tutorial-seen', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can use this endpoint'), 403);
    }
    await c.env.DB
      .prepare('UPDATE User SET tutorialSeenAt = ? WHERE id = ?')
      .bind(new Date().toISOString(), session.id)
      .run();
    return c.json(successResponse({ ok: true }));
  } catch (error: unknown) {
    console.error('[Student Tutorial] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /student/tutorial-status - Check if tutorial has been seen
app.get('/student/tutorial-status', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can use this endpoint'), 403);
    }
    const row = await c.env.DB
      .prepare('SELECT tutorialSeenAt FROM User WHERE id = ?')
      .bind(session.id)
      .first<{ tutorialSeenAt: string | null }>();
    return c.json(successResponse({ seen: !!row?.tutorialSeenAt, userId: session.id }));
  } catch (error: unknown) {
    console.error('[Student Tutorial] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PATCH /teacher/tutorial-seen - Mark onboarding tutorial as seen (persisted in DB)
app.patch('/teacher/tutorial-seen', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'TEACHER') {
      return c.json(errorResponse('Only teachers can use this endpoint'), 403);
    }
    await c.env.DB
      .prepare('UPDATE Teacher SET tutorialSeenAt = ? WHERE userId = ?')
      .bind(new Date().toISOString(), session.id)
      .run();
    return c.json(successResponse({ ok: true }));
  } catch (error: unknown) {
    console.error('[Teacher Tutorial] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /teacher/tutorial-status - Check if tutorial has been seen
app.get('/teacher/tutorial-status', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'TEACHER') {
      return c.json(errorResponse('Only teachers can use this endpoint'), 403);
    }
    const row = await c.env.DB
      .prepare('SELECT tutorialSeenAt FROM Teacher WHERE userId = ?')
      .bind(session.id)
      .first<{ tutorialSeenAt: string | null }>();
    return c.json(successResponse({ seen: !!row?.tutorialSeenAt, userId: session.id }));
  } catch (error: unknown) {
    console.error('[Teacher Tutorial] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// ============ Orphan Cleanup ============
// Deletes R2 objects that have no matching Upload row in D1.
// Runs daily at 3am; only removes objects older than 24 hours to avoid
// racing with in-progress uploads.
async function handleOrphanCleanup(env: Bindings) {
  console.log('[Cleanup] Orphan R2 object scan started');
  const oneDayMs = 24 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - oneDayMs);
  let deleted = 0;
  let scanned = 0;
  let cursor: string | undefined;

  try {
    do {
      const listed = await env.STORAGE.list({ limit: 500, cursor });
      scanned += listed.objects.length;

      // Filter to objects older than 24h (skip recent uploads to avoid races)
      const oldObjects = listed.objects.filter(
        obj => !obj.uploaded || new Date(obj.uploaded) <= cutoff
      );

      if (oldObjects.length > 0) {
        // Batch check: one D1 query per page instead of one per object (N+1 fix)
        const keys = oldObjects.map(obj => obj.key);
        const placeholders = keys.map(() => '?').join(', ');
        const existingRows = await env.DB
          .prepare(`SELECT storagePath FROM Upload WHERE storagePath IN (${placeholders})`)
          .bind(...keys)
          .all<{ storagePath: string }>();
        const existingSet = new Set(existingRows.results.map(r => r.storagePath));

        for (const obj of oldObjects) {
          if (!existingSet.has(obj.key)) {
            await env.STORAGE.delete(obj.key);
            deleted++;
            console.log(`[Cleanup] Deleted orphan: ${obj.key}`);
          }
        }
      }

      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    console.log(`[Cleanup] Done - scanned ${scanned}, deleted ${deleted} orphan(s)`);
  } catch (error) {
    console.error('[Cleanup] Error during orphan scan:', error);
  }
}

// Export handler that supports both HTTP requests and scheduled events
export default Sentry.withSentry(
  (env: Bindings) => ({
    dsn: 'https://37deb84c09ff2d19b29fe83a83fc8088@o4511153106190336.ingest.de.sentry.io/4511153109729360',
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  }),
  {
    fetch: app.fetch,
    scheduled: async (_event: unknown, env: Bindings, ctx: ExecutionContext) => {
      ctx.waitUntil(handleOrphanCleanup(env));
    },
  } satisfies ExportedHandler<Bindings>,
);
