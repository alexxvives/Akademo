import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/api-utils';
import { getDB } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await requireRole(['TEACHER']);
    const db = await getDB();

    // Get all students enrolled in teacher's classes
    // Query classes where teacher is assigned (Class.teacherId = session.id)
    const studentsData = await db.prepare(`
      SELECT 
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        COUNT(DISTINCT ce.classId) as classCount,
        COUNT(DISTINCT CASE 
          WHEN v.durationSeconds > 0 AND (vps.lastPositionSeconds / v.durationSeconds * 100) >= 95 
          THEN vps.videoId 
        END) as lessonsCompleted,
        COUNT(DISTINCT v.id) as totalLessons,
        CAST(COALESCE(SUM(vps.totalWatchTimeSeconds), 0) AS INTEGER) as totalWatchTime,
        CAST(COALESCE(AVG(
          CASE 
            WHEN v.durationSeconds > 0 
            THEN (vps.lastPositionSeconds / v.durationSeconds * 100) 
            ELSE 0 
          END
        ), 0) AS REAL) as averageProgress,
        MAX(vps.lastWatchedAt) as lastActivity
      FROM User u
      INNER JOIN ClassEnrollment ce ON u.id = ce.userId AND ce.status = 'APPROVED'
      INNER JOIN Class c ON ce.classId = c.id AND c.teacherId = ?
      LEFT JOIN Lesson l ON c.id = l.classId
      LEFT JOIN Video v ON l.id = v.lessonId
      LEFT JOIN VideoPlayState vps ON v.id = vps.videoId AND vps.studentId = u.id
      GROUP BY u.id, u.firstName, u.lastName, u.email
      ORDER BY u.firstName, u.lastName
    `).bind(session.id).all();

    console.log('Students progress query result:', JSON.stringify(studentsData, null, 2));
    return Response.json(successResponse(studentsData.results || []));
  } catch (error) {
    console.error('Students progress API error:', error);
    return handleApiError(error);
  }
}
