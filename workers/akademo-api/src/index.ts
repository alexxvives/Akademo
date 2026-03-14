import { Hono } from 'hono';
import { cors } from 'hono/cors';
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
import approvalRoutes from './routes/approvals';
import userRoutes from './routes/users';
import documentRoutes from './routes/documents';
import ratingRoutes from './routes/ratings';
import analyticsRoutes from './routes/analytics';
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
import { Bindings } from './types';

import { requireAuth } from './lib/auth';
import { successResponse, errorResponse } from './lib/utils';
import { csrfProtection } from './lib/csrf';

const app = new Hono<{ Bindings: Bindings }>();

// Global error handler - map auth errors to proper status codes
app.onError((err, c) => {
  console.error('[API Error]', err);
  if (err.message === 'Unauthorized') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  if (err.message === 'Forbidden') {
    return c.json({ success: false, error: 'Forbidden' }, 403);
  }
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

// Middleware
app.use('*', logger());

// Make env available via getCloudflareContext() for utility functions
import { runWithEnv, CloudflareEnv } from './lib/cloudflare';
app.use('*', async (c, next) => {
  return runWithEnv(c.env as unknown as CloudflareEnv, () => next());
});

app.use('*', cors({
  origin: ['https://akademo-edu.com', 'https://www.akademo-edu.com', 'https://akademo.alexxvives.workers.dev', 'http://localhost:3000'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Cache-Control', 'Pragma', 'X-Requested-With'],
  exposeHeaders: [],
}));

// CSRF protection: validate Origin + custom header on state-changing requests
app.use('*', csrfProtection());

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
app.route('/approvals', approvalRoutes);
app.route('/users', userRoutes);
app.route('/students', studentRoutes);
app.route('/documents', documentRoutes);
app.route('/ratings', ratingRoutes);
app.route('/analytics', analyticsRoutes);
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
    return c.json(successResponse({ seen: !!row?.tutorialSeenAt }));
  } catch (error: unknown) {
    console.error('[Teacher Tutorial] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// ============ Orphan Cleanup ============
// Deletes R2 objects that have no matching Upload row in D1.
// Runs daily; only removes objects older than 24 hours to avoid
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
      for (const obj of listed.objects) {
        scanned++;
        if (obj.uploaded && new Date(obj.uploaded) > cutoff) continue;

        const row = await env.DB
          .prepare('SELECT id FROM Upload WHERE storagePath = ? LIMIT 1')
          .bind(obj.key)
          .first();

        if (!row) {
          await env.STORAGE.delete(obj.key);
          deleted++;
          console.log(`[Cleanup] Deleted orphan: ${obj.key}`);
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
export default {
  fetch: app.fetch,
  scheduled: async (_event: unknown, env: Bindings, ctx: ExecutionContext) => {
    ctx.waitUntil(handleOrphanCleanup(env));
  },
};
