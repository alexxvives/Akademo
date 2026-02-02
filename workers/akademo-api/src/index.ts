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
import { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

// Global error handler - provides detailed errors for debugging
app.onError((err, c) => {
  console.error('[API Error]', err);
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorCause = err instanceof Error && 'cause' in err && err.cause instanceof Error 
    ? err.cause.message 
    : undefined;
  return c.json({
    success: false,
    error: `API Error: ${errorCause || errorMessage}`,
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
app.route('/zoom', zoomRoutes);

// Cron trigger handler for monthly payment generation
async function handleScheduled(env: Bindings) {
  console.log('[Cron] Monthly payment generation triggered at', new Date().toISOString());

  try {
    // Find all active monthly cash/bizum enrollments that are due for payment
    const enrollments = await env.DB.prepare(`
      SELECT 
        e.id as enrollmentId,
        e.classId,
        e.userId,
        e.nextPaymentDue,
        c.monthlyPrice,
        c.name as className,
        c.academyId,
        u.firstName,
        u.lastName,
        u.email
      FROM ClassEnrollment e
      JOIN Class c ON e.classId = c.id
      JOIN User u ON e.userId = u.id
      WHERE e.paymentFrequency = 'MONTHLY'
      AND e.paymentMethod IN ('cash', 'bizum')
      AND e.paymentStatus = 'PAID'
      AND date(e.nextPaymentDue) <= date('now')
      AND c.monthlyPrice IS NOT NULL
    `).all();

    console.log(`[Cron] Found ${enrollments.results.length} enrollments due for payment`);

    let created = 0;
    for (const enrollment of enrollments.results as any[]) {
      try {
        // Create pending payment record
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
          `Pago mensual - ${enrollment.className}`,
          JSON.stringify({ generatedBySystem: true, dueDate: enrollment.nextPaymentDue }),
        ).run();

        // Update next payment due date (add 1 month)
        await env.DB.prepare(`
          UPDATE ClassEnrollment
          SET nextPaymentDue = date(nextPaymentDue, '+1 month'),
              updatedAt = datetime('now')
          WHERE id = ?
        `).bind(enrollment.enrollmentId).run();

        created++;
        console.log(`[Cron] Created pending payment for enrollment ${enrollment.enrollmentId}`);
      } catch (error) {
        console.error(`[Cron] Error creating payment for enrollment ${enrollment.enrollmentId}:`, error);
      }
    }

    console.log(`[Cron] Successfully created ${created} pending payments`);
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
