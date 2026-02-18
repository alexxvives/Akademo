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
import notificationRoutes from './routes/notifications';
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
import { Bindings } from './types';

import { requireAuth } from './lib/auth';
import { successResponse, errorResponse } from './lib/utils';

const app = new Hono<{ Bindings: Bindings }>();

// Global error handler - log details server-side, return generic message to client
app.onError((err, c) => {
  console.error('[API Error]', err);
  return c.json({
    success: false,
    error: 'Internal server error',
  }, 500);
});

// Middleware
app.use('*', logger());

// Make env available via getCloudflareContext() for utility functions
import { runWithEnv, CloudflareEnv } from './lib/cloudflare';
app.use('*', async (c, next) => {
  return runWithEnv(c.env as unknown as CloudflareEnv, () => next());
});

app.use('*', cors({
  origin: ['https://akademo-edu.com', 'https://akademo.alexxvives.workers.dev', 'http://localhost:3000'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Cache-Control', 'Pragma'],
  exposeHeaders: ['Set-Cookie'],
}));

// Health check
app.get('/', (c) => c.json({ 
  status: 'ok', 
  service: 'akademo-api',
  version: '3.4',
  routes: 21,
  phase: 'Assignments System',
  timestamp: new Date().toISOString() 
}));

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
app.route('/notifications', notificationRoutes);
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

// Cron trigger handler for monthly payment generation
// Uses calculation-based approach: compares expected payments vs actual payments made
async function handleScheduled(env: Bindings) {
  console.log('[Cron] Monthly payment generation started');

  try {
    // Find all active monthly cash/bizum enrollments (exclude withdrawn/banned)
    const enrollments = await env.DB.prepare(`
      SELECT 
        e.id as enrollmentId,
        e.classId,
        e.userId,
        e.enrolledAt,
        e.paymentMethod,
        c.monthlyPrice,
        c.name as className,
        c.startDate as classStartDate,
        c.academyId,
        u.firstName,
        u.lastName,
        u.email,
        COALESCE((
          SELECT SUM(p.amount) FROM Payment p 
          WHERE p.payerId = e.userId 
            AND p.classId = e.classId 
            AND p.status IN ('PAID', 'COMPLETED')
        ), 0) as totalPaid,
        COALESCE((
          SELECT COUNT(*) FROM Payment p 
          WHERE p.payerId = e.userId 
            AND p.classId = e.classId 
            AND p.status = 'PENDING'
        ), 0) as pendingPayments
      FROM ClassEnrollment e
      JOIN Class c ON e.classId = c.id
      JOIN User u ON e.userId = u.id
      WHERE e.paymentFrequency = 'MONTHLY'
        AND e.paymentMethod IN ('cash', 'bizum')
        AND e.status IN ('APPROVED', 'PENDING')
        AND c.monthlyPrice IS NOT NULL
        AND c.monthlyPrice > 0
    `).all();

    console.log(`[Cron] Found ${enrollments.results.length} monthly cash/bizum enrollments`);

    let created = 0;
    for (const enrollment of enrollments.results as any[]) {
      try {
        // Calculate how many months should have been paid
        const startDate = new Date(enrollment.classStartDate || enrollment.enrolledAt);
        const now = new Date();
        const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 
          + (now.getMonth() - startDate.getMonth());
        const expectedMonths = Math.max(1, monthsDiff + 1);
        const expectedAmount = expectedMonths * enrollment.monthlyPrice;

        // How many months are overdue (excluding already pending payments)
        const paidAmount = Number(enrollment.totalPaid) || 0;
        const pendingCount = Number(enrollment.pendingPayments) || 0;
        const overdueAmount = expectedAmount - paidAmount - (pendingCount * enrollment.monthlyPrice);
        const overdueMonths = Math.max(0, Math.floor(overdueAmount / enrollment.monthlyPrice));

        if (overdueMonths <= 0) continue;

        console.log(`[Cron] ${enrollment.firstName} ${enrollment.lastName} - ${enrollment.className}: ${overdueMonths} months overdue (expected ${expectedMonths} months, paid ${paidAmount}€, ${pendingCount} pending)`);

        // Create one PENDING Payment per overdue month
        for (let i = 0; i < overdueMonths; i++) {
          const monthOffset = expectedMonths - overdueMonths + i;
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + monthOffset);

          await env.DB.prepare(`
            INSERT INTO Payment (
              id, type, payerId, payerType, payerName, payerEmail,
              receiverId, amount, currency, status, paymentMethod,
              classId, description, metadata, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `).bind(
            crypto.randomUUID(),
            'STUDENT_TO_ACADEMY',
            enrollment.userId,
            'STUDENT',
            `${enrollment.firstName} ${enrollment.lastName}`,
            enrollment.email,
            enrollment.academyId,
            enrollment.monthlyPrice,
            'EUR',
            'PENDING',
            enrollment.paymentMethod,
            enrollment.classId,
            `Pago mensual - ${enrollment.className} (${dueDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})`,
            JSON.stringify({ generatedBySystem: true, monthOffset, dueDate: dueDate.toISOString() }),
          ).run();

          created++;
        }
      } catch (error) {
        console.error(`[Cron] Error creating payment for enrollment ${enrollment.enrollmentId}:`, error);
      }
    }

    console.log(`[Cron] Created ${created} pending payment(s)`);
  } catch (error) {
    console.error('[Cron] Error in monthly payment generation:', error);
  }
}

// Export handler that supports both HTTP requests and scheduled events
export default {
  fetch: app.fetch,
  scheduled: async (event: any, env: Bindings, ctx: any) => {
    await handleScheduled(env);
  },
};
