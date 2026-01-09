import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import authRoutes from './routes/auth';
import classRoutes from './routes/classes';
import enrollmentRoutes from './routes/enrollments';
import requestRoutes from './routes/requests';
import lessonRoutes from './routes/lessons';
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
import { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://akademo-edu.com', 'https://akademo.alexxvives.workers.dev', 'http://localhost:3000'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposeHeaders: ['Set-Cookie'],
}));

// Health check
app.get('/', (c) => c.json({ 
  status: 'ok', 
  service: 'akademo-api',
  version: '3.0',
  routes: 17,
  phase: 'Complete',
  timestamp: new Date().toISOString() 
}));

// Routes - Phase 1: Core Routes
app.route('/auth', authRoutes);
app.route('/classes', classRoutes);
app.route('/enrollments', enrollmentRoutes);
app.route('/requests', requestRoutes);
app.route('/lessons', lessonRoutes);
app.route('/videos', videoRoutes);
app.route('/academies', academyRoutes);
app.route('/explore', exploreRoutes);
app.route('/approvals', approvalRoutes);
app.route('/users', userRoutes);
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
