import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { getDB, generateId } from '@/lib/db';
import { createZoomMeeting, deleteZoomMeeting } from '@/lib/zoom';

// Helper function to notify all enrolled students about a live class
async function notifyEnrolledStudents(
  db: any, // D1Database type
  classId: string,
  liveStreamId: string,
  title: string,
  zoomLink: string,
  teacherName: string,
  className: string
) {
  try {
    // Get all enrolled students for this class
    const enrollments = await db.prepare(`
      SELECT ce.studentId, c.name as className
      FROM ClassEnrollment ce
      JOIN Class c ON ce.classId = c.id
      WHERE ce.classId = ? AND ce.status = 'APPROVED'
    `).bind(classId).all();

    const students = enrollments.results || [];
    const now = new Date().toISOString();

    // Create notifications for each student
    for (const student of students as any[]) {
      const notificationId = generateId();
      const notificationData = JSON.stringify({
        classId,
        liveStreamId,
        zoomLink,
        className,
        teacherName,
      });

      await db.prepare(`
        INSERT INTO Notification (id, userId, type, title, message, data, isRead, createdAt)
        VALUES (?, ?, 'live_class', ?, ?, ?, 0, ?)
      `).bind(
        notificationId,
        student.studentId,
        `🔴 Clase en vivo: ${title}`,
        `${teacherName} ha iniciado una clase en vivo en ${className}. ¡Únete ahora!`,
        notificationData,
        now
      ).run();
    }

    console.log(`Notified ${students.length} students about live class`);
  } catch (error) {
    console.error('Error notifying students:', error);
    // Don't throw - notifications are not critical
  }
}

// Get all live classes for a class
export async function GET(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'STUDENT']);
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return errorResponse('Class ID required');
    }

    const db = await getDB();
    
    // Get active/scheduled live classes from database (not ended ones)
    const liveClasses = await db.prepare(`
      SELECT ls.*, u.firstName, u.lastName
      FROM LiveStream ls
      JOIN User u ON ls.teacherId = u.id
      WHERE ls.classId = ? AND ls.status IN ('active', 'scheduled')
      ORDER BY ls.createdAt DESC
    `).bind(classId).all();

    return Response.json(successResponse(liveClasses.results || []));
  } catch (error) {
    return handleApiError(error);
  }
}

// Create a new live class with Zoom meeting (automatic)
export async function POST(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const { classId, title } = await request.json();

    if (!classId || !title) {
      return errorResponse('Class ID and title are required');
    }

    const db = await getDB();

    // Get class info and teacher name for notifications
    const classInfo = await db.prepare(`
      SELECT c.name as className, u.firstName, u.lastName
      FROM Class c
      JOIN User u ON c.teacherId = u.id
      WHERE c.id = ?
    `).bind(classId).first() as { className: string; firstName: string; lastName: string } | null;

    const teacherName = classInfo ? `${classInfo.firstName} ${classInfo.lastName}` : 'Tu profesor';
    const className = classInfo?.className || 'tu clase';

    // Create Zoom meeting automatically
    let zoomMeeting;
    try {
      zoomMeeting = await createZoomMeeting({
        topic: title,
        duration: 120, // 2 hours default
        waitingRoom: false,
      });
    } catch (zoomError: any) {
      console.error('Zoom API error:', zoomError);
      return errorResponse(`Error al crear reunión de Zoom: ${zoomError.message}`, 400);
    }

    // Save to database - status is 'scheduled' until teacher actually joins (meeting.started webhook)
    const id = generateId();
    const now = new Date().toISOString();

    try {
      await db.prepare(`
        INSERT INTO LiveStream (id, classId, teacherId, title, roomName, roomUrl, zoomLink, zoomMeetingId, zoomStartUrl, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
      `).bind(
        id,
        classId,
        session.id,
        title,
        `room_${id}`, // roomName = unique id to avoid constraint
        zoomMeeting.join_url, // roomUrl = join_url
        zoomMeeting.join_url,
        String(zoomMeeting.id),
        zoomMeeting.start_url,
        now  // createdAt
      ).run();
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      // Try to delete the Zoom meeting if DB fails
      try {
        await deleteZoomMeeting(zoomMeeting.id);
      } catch (e) {}
      return errorResponse(`Database error: ${dbError.message}`, 400);
    }

    const liveClass = {
      id,
      classId,
      teacherId: session.id,
      title,
      zoomLink: zoomMeeting.join_url,
      zoomMeetingId: String(zoomMeeting.id),
      zoomStartUrl: zoomMeeting.start_url,
      status: 'scheduled', // Will become 'active' when teacher joins (meeting.started webhook)
      createdAt: now,
    };

    // Students will be notified when meeting.started webhook fires
    // This ensures notifications only go out when teacher actually joins

    return Response.json(successResponse(liveClass), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// Delete a live class
export async function DELETE(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('ID required');
    }

    const db = await getDB();
    
    // Get the live class to find Zoom meeting ID
    const liveClass = await db.prepare(`
      SELECT * FROM LiveStream WHERE id = ? AND teacherId = ?
    `).bind(id, session.id).first() as { id: string; zoomMeetingId?: string } | null;

    if (!liveClass) {
      return errorResponse('Live class not found', 404);
    }

    // Delete from Zoom if meeting exists
    if (liveClass.zoomMeetingId) {
      try {
        await deleteZoomMeeting(liveClass.zoomMeetingId);
      } catch (e) {
        console.error('Failed to delete Zoom meeting:', e);
        // Continue anyway - meeting may already be deleted
      }
    }

    // Delete from database
    await db.prepare(`DELETE FROM LiveStream WHERE id = ?`).bind(id).run();

    return Response.json(successResponse({ deleted: true }));
  } catch (error) {
    return handleApiError(error);
  }
}
