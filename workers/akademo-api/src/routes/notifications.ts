import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const notifications = new Hono<{ Bindings: Bindings }>();

// POST /notifications - Send notifications to all students in a class
notifications.post('/', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { classId, liveStreamId, message } = await c.req.json();

    if (!classId || !message) {
      return c.json(errorResponse('classId and message required'), 400);
    }

    // Get all approved students in the class
    const enrollments = await c.env.DB
      .prepare(`
        SELECT ce.userId, u.firstName, u.lastName 
        FROM ClassEnrollment ce
        JOIN User u ON ce.userId = u.id
        WHERE ce.classId = ? AND ce.status = 'APPROVED'
      `)
      .bind(classId)
      .all();

    const students = enrollments.results || [];

    if (students.length === 0) {
      return c.json(successResponse({ 
        message: 'No hay estudiantes aprobados en esta clase',
        notified: 0 
      }));
    }

    // Create notifications for all students
    const now = new Date().toISOString();
    const notifications_created: string[] = [];

    for (const student of students) {
      const notificationId = crypto.randomUUID();
      await c.env.DB
        .prepare(`
          INSERT INTO Notification (id, userId, type, title, message, isRead, createdAt)
          VALUES (?, ?, ?, ?, ?, 0, ?)
        `)
        .bind(
          notificationId,
          student.userId,
          'LIVE_STREAM',
          'Clase en vivo',
          message,
          now
        )
        .run();
      notifications_created.push(notificationId);
    }

    return c.json(successResponse({ 
      message: `Notificación enviada a ${students.length} estudiantes`,
      notified: students.length 
    }));
  } catch (error: any) {
    console.error('[Send Notifications] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /notifications - Get user notifications
notifications.get('/', async (c) => {
  try {
    const session = await requireAuth(c);

    const result = await c.env.DB
      .prepare(`
        SELECT * FROM Notification
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT 50
      `)
      .bind(session.id)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Get Notifications] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PATCH /notifications/:id - Mark notification as read
notifications.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const notificationId = c.req.param('id');

    // Verify ownership
    const notification = await c.env.DB
      .prepare('SELECT * FROM Notification WHERE id = ?')
      .bind(notificationId)
      .first();

    if (!notification) {
      return c.json(errorResponse('Notification not found'), 404);
    }

    if (notification.userId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    await c.env.DB
      .prepare('UPDATE Notification SET isRead = 1 WHERE id = ?')
      .bind(notificationId)
      .run();

    return c.json(successResponse({ message: 'Marked as read' }));
  } catch (error: any) {
    console.error('[Mark Notification Read] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// DELETE /notifications/:id - Delete notification
notifications.delete('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const notificationId = c.req.param('id');

    // Verify ownership
    const notification = await c.env.DB
      .prepare('SELECT * FROM Notification WHERE id = ?')
      .bind(notificationId)
      .first();

    if (!notification) {
      return c.json(errorResponse('Notification not found'), 404);
    }

    if (notification.userId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    await c.env.DB
      .prepare('DELETE FROM Notification WHERE id = ?')
      .bind(notificationId)
      .run();

    return c.json(successResponse({ message: 'Notification deleted' }));
  } catch (error: any) {
    console.error('[Delete Notification] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default notifications;
