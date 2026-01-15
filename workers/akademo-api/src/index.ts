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
  version: '3.1',
  routes: 18,
  phase: 'Topics Support',
  timestamp: new Date().toISOString() 
}));

// Routes - Phase 1: Core Routes
app.route('/auth', authRoutes);
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

// Routes - Phase 2: Advanced Features
app.route('/live', liveRoutes);
app.route('/bunny', bunnyRoutes);
app.route('/storage', storageRoutes);
app.route('/webhooks', webhookRoutes);

export default app;
