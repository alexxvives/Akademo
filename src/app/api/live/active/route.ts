import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/api-utils';
import { getDB } from '@/lib/db';

// Get all active live streams for a student's enrolled classes
export async function GET(request: Request) {
  try {
    const session = await requireRole(['STUDENT']);
    const db = await getDB();
    
    // Get all active live streams for classes the student is enrolled in
    const activeStreams = await db.prepare(`
      SELECT 
        ls.id,
        ls.classId,
        ls.title,
        ls.zoomLink,
        ls.status,
        ls.createdAt,
        c.name as className,
        u.firstName || ' ' || u.lastName as teacherName
      FROM LiveStream ls
      JOIN Class c ON ls.classId = c.id
      JOIN User u ON ls.teacherId = u.id
      JOIN ClassEnrollment ce ON ce.classId = c.id
      WHERE ce.studentId = ? 
        AND ce.status = 'APPROVED'
        AND ls.status = 'active'
      ORDER BY ls.createdAt DESC
    `).bind(session.id).all();

    return Response.json(successResponse(activeStreams.results || []));
  } catch (error) {
    return handleApiError(error);
  }
}
