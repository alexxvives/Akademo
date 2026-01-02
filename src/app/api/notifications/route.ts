import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { getDB, generateId } from '@/lib/db';

// Create notification - notify students about live stream
export async function POST(request: Request) {
  try {
    const session = await requireRole(['TEACHER', 'ADMIN']);
    const { classId, liveStreamId, message } = await request.json();

    if (!classId || !liveStreamId || !message) {
      return errorResponse('classId, liveStreamId, and message are required');
    }

    const db = await getDB();

    // Get all enrolled students in this class
    const enrollments = await db.prepare(`
      SELECT userId FROM ClassEnrollment 
      WHERE classId = ? AND status = 'APPROVED'
    `).bind(classId).all();

    if (!enrollments.results || enrollments.results.length === 0) {
      return Response.json(successResponse({ notified: 0, message: 'No students enrolled' }));
    }

    // Create notifications for each student
    const notificationPromises = enrollments.results.map((enrollment: any) => {
      const notificationId = generateId();
      return db.prepare(`
        INSERT INTO Notification (id, userId, type, title, message, data, isRead, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        notificationId,
        enrollment.userId,
        'LIVE_STREAM',
        'Clase en Vivo',
        message,
        JSON.stringify({ classId, liveStreamId }),
        0,
        new Date().toISOString()
      ).run();
    });

    await Promise.all(notificationPromises);

    return Response.json(successResponse({ 
      notified: enrollments.results.length,
      message: `${enrollments.results.length} estudiantes notificados`
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

// Get notifications for the current user
export async function GET(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'STUDENT']);
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const db = await getDB();
    
    let query = `
      SELECT * FROM Notification 
      WHERE userId = ?
    `;
    
    if (unreadOnly) {
      query += ` AND isRead = 0`;
    }
    
    query += ` ORDER BY createdAt DESC LIMIT 50`;

    const notifications = await db.prepare(query).bind(session.id).all();

    // Parse JSON data field
    const results = (notifications.results || []).map((n: any) => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : null,
      isRead: Boolean(n.isRead),
    }));

    return Response.json(successResponse(results));
  } catch (error) {
    return handleApiError(error);
  }
}

// Mark notifications as read
export async function PUT(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'STUDENT']);
    const { notificationIds, markAll } = await request.json();

    const db = await getDB();

    if (markAll) {
      // Mark all notifications as read for this user
      await db.prepare(`
        UPDATE Notification SET isRead = 1 WHERE userId = ?
      `).bind(session.id).run();
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      for (const id of notificationIds) {
        await db.prepare(`
          UPDATE Notification SET isRead = 1 WHERE id = ? AND userId = ?
        `).bind(id, session.id).run();
      }
    } else {
      return errorResponse('notificationIds or markAll required');
    }

    return Response.json(successResponse({ updated: true }));
  } catch (error) {
    return handleApiError(error);
  }
}

// Delete old notifications (cleanup)
export async function DELETE(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'STUDENT']);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const db = await getDB();

    if (id) {
      // Delete specific notification
      await db.prepare(`
        DELETE FROM Notification WHERE id = ? AND userId = ?
      `).bind(id, session.id).run();
    } else {
      // Delete all read notifications older than 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await db.prepare(`
        DELETE FROM Notification WHERE userId = ? AND isRead = 1 AND createdAt < ?
      `).bind(session.id, weekAgo).run();
    }

    return Response.json(successResponse({ deleted: true }));
  } catch (error) {
    return handleApiError(error);
  }
}
