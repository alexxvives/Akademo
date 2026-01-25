import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, requireRole } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const students = new Hono<{ Bindings: Bindings }>();

// GET /students/progress - Get student progress for teacher's classes
students.get('/progress', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER' && session.role !== 'ACADEMY') {
      return c.json(errorResponse('Not authorized'), 403);
    }

    let query = '';
    let params: any[] = [];

    if (session.role === 'TEACHER') {
      // Get aggregated progress for students across all classes taught by this teacher
      query = `
        SELECT 
          u.id,
          u.firstName,
          u.lastName,
          u.email,
          u.lastLoginAt as lastActive,
          (SELECT c2.name FROM Class c2 
           JOIN ClassEnrollment e2 ON e2.classId = c2.id 
           WHERE e2.userId = u.id AND c2.teacherId = ? AND e2.status = 'APPROVED' 
           LIMIT 1) as className,
          COUNT(DISTINCT c.id) as classCount,
          COUNT(DISTINCT CASE 
            WHEN vps.videoId IS NOT NULL AND v.lessonId IN (
              SELECT l2.id FROM Lesson l2 WHERE l2.classId = c.id
            ) THEN vps.videoId 
          END) as lessonsCompleted,
          COUNT(DISTINCT l.id) as totalLessons,
          COALESCE(SUM(CASE 
            WHEN vps.videoId IS NOT NULL AND v.lessonId IN (
              SELECT l2.id FROM Lesson l2 WHERE l2.classId = c.id
            ) THEN vps.totalWatchTimeSeconds 
            ELSE 0 
          END), 0) as totalWatchTime,
          COALESCE(AVG(CASE 
            WHEN lr.lessonId IN (
              SELECT l2.id FROM Lesson l2 WHERE l2.classId = c.id
            ) THEN lr.rating 
          END), 0) as averageRating
        FROM User u
        JOIN ClassEnrollment e ON e.userId = u.id AND e.status = 'APPROVED'
        JOIN Class c ON e.classId = c.id AND c.teacherId = ?
        LEFT JOIN Lesson l ON l.classId = c.id
        LEFT JOIN VideoPlayState vps ON vps.studentId = u.id
        LEFT JOIN Video v ON v.id = vps.videoId
        LEFT JOIN LessonRating lr ON lr.studentId = u.id AND lr.lessonId = l.id
        GROUP BY u.id, u.firstName, u.lastName, u.email, u.lastLoginAt
        ORDER BY u.lastName, u.firstName
      `;
      params = [session.id, session.id];
    } else if (session.role === 'ACADEMY') {
      // Get aggregated progress for all students in academy owner's classes
      query = `
        SELECT 
          u.id,
          u.firstName,
          u.lastName,
          u.email,
          u.lastLoginAt as lastActive,
          (SELECT c2.name FROM Class c2 
           JOIN ClassEnrollment e2 ON e2.classId = c2.id 
           WHERE e2.userId = u.id AND e2.status = 'APPROVED' 
           LIMIT 1) as className,
          (SELECT ut.firstName || ' ' || ut.lastName FROM Class c2 
           JOIN User ut ON c2.teacherId = ut.id
           JOIN ClassEnrollment e2 ON e2.classId = c2.id 
           WHERE e2.userId = u.id AND e2.status = 'APPROVED' 
           LIMIT 1) as teacherName,
          COUNT(DISTINCT c.id) as classCount,
          COUNT(DISTINCT CASE 
            WHEN vps.videoId IS NOT NULL AND v.lessonId IN (
              SELECT l2.id FROM Lesson l2 WHERE l2.classId = c.id
            ) THEN vps.videoId 
          END) as lessonsCompleted,
          COUNT(DISTINCT l.id) as totalLessons,
          COALESCE(SUM(CASE 
            WHEN vps.videoId IS NOT NULL AND v.lessonId IN (
              SELECT l2.id FROM Lesson l2 WHERE l2.classId = c.id
            ) THEN vps.totalWatchTimeSeconds 
            ELSE 0 
          END), 0) as totalWatchTime,
          COALESCE(AVG(CASE 
            WHEN lr.lessonId IN (
              SELECT l2.id FROM Lesson l2 WHERE l2.classId = c.id
            ) THEN lr.rating 
          END), 0) as averageRating
        FROM User u
        JOIN ClassEnrollment e ON e.userId = u.id AND e.status = 'APPROVED'
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id AND a.ownerId = ?
        LEFT JOIN Lesson l ON l.classId = c.id
        LEFT JOIN VideoPlayState vps ON vps.studentId = u.id
        LEFT JOIN Video v ON v.id = vps.videoId
        LEFT JOIN LessonRating lr ON lr.studentId = u.id AND lr.lessonId = l.id
        GROUP BY u.id, u.firstName, u.lastName, u.email, u.lastLoginAt
        ORDER BY u.lastName, u.firstName
      `;
      params = [session.id];
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Students Progress] Error:', error);
    // Return detailed error for debugging
    const errorDetail = error.cause?.message || error.message || String(error);
    return c.json(errorResponse(`Students progress error: ${errorDetail}`), 500);
  }
});

export default students;
