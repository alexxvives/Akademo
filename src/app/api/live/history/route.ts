import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/api-utils';
import { getDB } from '@/lib/db';

// Get all streams history for a teacher or academy
export async function GET(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'ACADEMY']);
    const db = await getDB();
    
    // Academy role: get all streams from all teachers in their academy
    if (session.role === 'ACADEMY') {
      const streams = await db.prepare(`
        SELECT 
          ls.id,
          ls.title,
          ls.classId,
          c.name as className,
          c.slug as classSlug,
          ls.teacherId,
          u.firstName || ' ' || u.lastName as teacherName,
          ls.status,
          ls.createdAt,
          ls.startedAt,
          ls.endedAt,
          ls.zoomMeetingId,
          ls.recordingId,
          CASE WHEN l.id IS NOT NULL THEN ls.recordingId ELSE NULL END as validRecordingId,
          ls.participantCount,
          ls.participantsFetchedAt
        FROM LiveStream ls
        JOIN Class c ON ls.classId = c.id
        JOIN User u ON ls.teacherId = u.id
        JOIN Teacher t ON c.academyId = t.academyId
        LEFT JOIN Lesson l ON ls.recordingId = l.id
        WHERE t.userId = ?
        ORDER BY ls.createdAt DESC
      `).bind(session.id).all();
      
      return Response.json(successResponse(streams.results || []));
    }
    
    // Teacher role: get only their streams
    const streams = await db.prepare(`
      SELECT 
        ls.id,
        ls.title,
        ls.classId,
        c.name as className,
        c.slug as classSlug,
        ls.status,
        ls.createdAt,
        ls.startedAt,
        ls.endedAt,
        ls.zoomMeetingId,
        ls.recordingId,
        CASE WHEN l.id IS NOT NULL THEN ls.recordingId ELSE NULL END as validRecordingId,
        ls.participantCount,
        ls.participantsFetchedAt
      FROM LiveStream ls
      JOIN Class c ON ls.classId = c.id
      LEFT JOIN Lesson l ON ls.recordingId = l.id
      WHERE ls.teacherId = ?
      ORDER BY ls.createdAt DESC
    `).bind(session.id).all();

    return Response.json(successResponse(streams.results || []));
  } catch (error) {
    return handleApiError(error);
  }
}
