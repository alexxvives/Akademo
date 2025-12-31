import { requireAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const classId = searchParams.get('classId');

    // Only teachers and admins can access analytics
    if (session.role !== 'TEACHER' && session.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403);
    }

    const db = await getDB();

    if (videoId) {
      // Get analytics for a specific video
      
      // Verify teacher has access to this video
      const video = await db
        .prepare(
          `SELECT v.id, v.title, l.classId, c.academyId, a.ownerId
           FROM Video v 
           JOIN Lesson l ON v.lessonId = l.id
           JOIN Class c ON l.classId = c.id 
           JOIN Academy a ON c.academyId = a.id
           WHERE v.id = ?`
        )
        .bind(videoId)
        .first<{ id: string; title: string; classId: string; academyId: string; ownerId: string }>();

      if (!video) {
        return errorResponse('Video not found', 404);
      }

      // Check if teacher has access
      if (session.role === 'TEACHER') {
        const membership = await db
          .prepare(
            `SELECT id FROM AcademyMembership 
             WHERE userId = ? AND academyId = ? AND status = 'APPROVED'`
          )
          .bind(session.id, video.academyId)
          .first();

        const isOwner = video.ownerId === session.id;

        if (!membership && !isOwner) {
          return errorResponse('You do not have access to this video', 403);
        }
      }

      // Get student watch data for this video
      const studentsData = await db
        .prepare(
          `SELECT 
             u.id as studentId,
             u.firstName,
             u.lastName,
             u.email,
             vps.totalWatchTimeSeconds,
             vps.lastWatchedAt,
             vps.sessionStartTime,
             vps.createdAt
           FROM VideoPlayState vps
           JOIN User u ON vps.studentId = u.id
           WHERE vps.videoId = ?
           ORDER BY vps.totalWatchTimeSeconds DESC`
        )
        .bind(videoId)
        .all();

      // Get general video stats
      const stats = await db
        .prepare(
          `SELECT 
             COUNT(DISTINCT studentId) as totalStudents,
             AVG(totalWatchTimeSeconds) as avgWatchTime,
             MAX(totalWatchTimeSeconds) as maxWatchTime,
             SUM(totalWatchTimeSeconds) as totalWatchTime
           FROM VideoPlayState
           WHERE videoId = ?`
        )
        .bind(videoId)
        .first();

      return Response.json(
        successResponse({
          video: {
            id: video.id,
            title: video.title,
          },
          stats,
          students: studentsData.results || [],
        })
      );
    } else if (classId) {
      // Get analytics for all videos in a class
      
      // Verify teacher has access to this class
      const classData = await db
        .prepare(
          `SELECT c.id, c.name, c.academyId, a.ownerId
           FROM Class c 
           JOIN Academy a ON c.academyId = a.id
           WHERE c.id = ?`
        )
        .bind(classId)
        .first<{ id: string; name: string; academyId: string; ownerId: string }>();

      if (!classData) {
        return errorResponse('Class not found', 404);
      }

      // Check if teacher has access
      if (session.role === 'TEACHER') {
        const membership = await db
          .prepare(
            `SELECT id FROM AcademyMembership 
             WHERE userId = ? AND academyId = ? AND status = 'APPROVED'`
          )
          .bind(session.id, classData.academyId)
          .first();

        const isOwner = classData.ownerId === session.id;

        if (!membership && !isOwner) {
          return errorResponse('You do not have access to this class', 403);
        }
      }

      // Get video watch stats for all videos in the class
      const videosData = await db
        .prepare(
          `SELECT 
             v.id,
             v.title,
             v.durationSeconds,
             l.maxWatchTimeMultiplier,
             COUNT(DISTINCT vps.studentId) as studentsWatched,
             AVG(vps.totalWatchTimeSeconds) as avgWatchTime,
             SUM(vps.totalWatchTimeSeconds) as totalWatchTime
           FROM Video v
           JOIN Lesson l ON v.lessonId = l.id
           LEFT JOIN VideoPlayState vps ON v.id = vps.videoId
           WHERE l.classId = ?
           GROUP BY v.id, v.title, v.durationSeconds, l.maxWatchTimeMultiplier
           ORDER BY v.createdAt DESC`
        )
        .bind(classId)
        .all();

      // Get student engagement summary
      const studentEngagement = await db
        .prepare(
          `SELECT 
             u.id as studentId,
             u.firstName,
             u.lastName,
             COUNT(DISTINCT vps.videoId) as videosWatched,
             SUM(vps.totalWatchTimeSeconds) as totalWatchTime,
             MAX(vps.lastWatchedAt) as lastActivity
           FROM ClassEnrollment ce
           JOIN User u ON ce.studentId = u.id
           LEFT JOIN VideoPlayState vps ON vps.studentId = u.id
           LEFT JOIN Video v ON vps.videoId = v.id
           LEFT JOIN Lesson l ON v.lessonId = l.id AND l.classId = ?
           WHERE ce.classId = ?
           GROUP BY u.id, u.firstName, u.lastName
           ORDER BY totalWatchTime DESC`
        )
        .bind(classId, classId)
        .all();

      return Response.json(
        successResponse({
          class: {
            id: classData.id,
            name: classData.name,
          },
          videos: videosData.results || [],
          studentEngagement: studentEngagement.results || [],
        })
      );
    } else {
      return errorResponse('Either videoId or classId is required');
    }
  } catch (error) {
    return handleApiError(error);
  }
}
