import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const notifications = new Hono<{ Bindings: Bindings }>();

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
      .prepare('UPDATE Notification SET read = 1 WHERE id = ?')
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
