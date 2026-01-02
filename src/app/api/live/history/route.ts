import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/api-utils';
import { getDB } from '@/lib/db';

// Get all streams history for a teacher
export async function GET(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const db = await getDB();
    
    // Get all streams for this teacher with class names
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
        ls.participantCount,
        ls.participantsFetchedAt
      FROM LiveStream ls
      JOIN Class c ON ls.classId = c.id
      WHERE ls.teacherId = ?
      ORDER BY ls.createdAt DESC
    `).bind(session.id).all();

    return Response.json(successResponse(streams.results || []));
  } catch (error) {
    return handleApiError(error);
  }
}
