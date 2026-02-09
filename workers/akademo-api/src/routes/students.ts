import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, requireRole } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const students = new Hono<{ Bindings: Bindings }>();

// GET /students/progress - Get student progress for teacher's classes
students.get('/progress', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER' && session.role !== 'ACADEMY' && session.role !== 'ADMIN') {
      return c.json(errorResponse('Not authorized'), 403);
    }

    let query = '';
    let params: any[] = [];

    if (session.role === 'ADMIN') {
      // Get ALL student progress across platform
      query = `
        SELECT 
          u.id,
          u.firstName,
          u.lastName,
          u.email,
          COALESCE(u.lastLoginAt, u.createdAt) as lastActive,
          c.name as className,
          c.id as classId,
          c.academyId,
          e.id as enrollmentId,
          ut.firstName || ' ' || ut.lastName as teacherName,
          COUNT(DISTINCT CASE 
            WHEN vps.videoId IS NOT NULL AND v.id IS NOT NULL THEN vps.videoId 
          END) as lessonsCompleted,
          COUNT(DISTINCT l.id) as totalLessons,
          COALESCE(SUM(CASE 
            WHEN vps.videoId IS NOT NULL AND v.id IS NOT NULL THEN vps.totalWatchTimeSeconds 
            ELSE 0 
          END), 0) as totalWatchTime,
          COALESCE(AVG(CASE 
            WHEN lr.lessonId IS NOT NULL THEN lr.rating 
          END), 0) as averageRating
        FROM User u
        JOIN ClassEnrollment e ON e.userId = u.id AND e.status = 'APPROVED'
        JOIN Class c ON e.classId = c.id
        LEFT JOIN User ut ON c.teacherId = ut.id
        LEFT JOIN Lesson l ON l.classId = c.id
        LEFT JOIN Video v ON v.lessonId = l.id
        LEFT JOIN VideoPlayState vps ON vps.videoId = v.id AND vps.studentId = u.id
        LEFT JOIN LessonRating lr ON lr.studentId = u.id AND lr.lessonId = l.id
        GROUP BY u.id, u.firstName, u.lastName, u.email, u.lastLoginAt, c.id, c.name, c.academyId, e.id, ut.firstName, ut.lastName
        ORDER BY u.lastName, u.firstName, c.name
      `;
      params = [];
    } else if (session.role === 'TEACHER') {
      // Get progress for each student-class combination (one row per student per class)
      query = `
        SELECT 
          u.id,
          u.firstName,
          u.lastName,
          u.email,
          COALESCE(u.lastLoginAt, u.createdAt) as lastActive,
          c.name as className,
          c.id as classId,
          e.id as enrollmentId,
          COUNT(DISTINCT CASE 
            WHEN vps.videoId IS NOT NULL AND v.id IS NOT NULL THEN vps.videoId 
          END) as lessonsCompleted,
          COUNT(DISTINCT l.id) as totalLessons,
          COALESCE(SUM(CASE 
            WHEN vps.videoId IS NOT NULL AND v.id IS NOT NULL THEN vps.totalWatchTimeSeconds 
            ELSE 0 
          END), 0) as totalWatchTime,
          COALESCE(AVG(CASE 
            WHEN lr.lessonId IS NOT NULL THEN lr.rating 
          END), 0) as averageRating
        FROM User u
        JOIN ClassEnrollment e ON e.userId = u.id AND e.status = 'APPROVED'
        JOIN Class c ON e.classId = c.id AND c.teacherId = ?
        LEFT JOIN Lesson l ON l.classId = c.id
        LEFT JOIN Video v ON v.lessonId = l.id
        LEFT JOIN VideoPlayState vps ON vps.videoId = v.id AND vps.studentId = u.id
        LEFT JOIN LessonRating lr ON lr.studentId = u.id AND lr.lessonId = l.id
        GROUP BY u.id, u.firstName, u.lastName, u.email, u.lastLoginAt, c.id, c.name, e.id
        ORDER BY u.lastName, u.firstName, c.name
      `;
      params = [session.id];
    } else if (session.role === 'ACADEMY') {
      // Get progress for each student-class combination (one row per student per class)
      query = `
        SELECT 
          u.id,
          u.firstName,
          u.lastName,
          u.email,
          COALESCE(u.lastLoginAt, u.createdAt) as lastActive,
          c.name as className,
          c.id as classId,
          e.id as enrollmentId,
          ut.firstName || ' ' || ut.lastName as teacherName,
          COUNT(DISTINCT CASE 
            WHEN vps.videoId IS NOT NULL AND v.id IS NOT NULL THEN vps.videoId 
          END) as lessonsCompleted,
          COUNT(DISTINCT l.id) as totalLessons,
          COALESCE(SUM(CASE 
            WHEN vps.videoId IS NOT NULL AND v.id IS NOT NULL THEN vps.totalWatchTimeSeconds 
            ELSE 0 
          END), 0) as totalWatchTime,
          COALESCE(AVG(CASE 
            WHEN lr.lessonId IS NOT NULL THEN lr.rating 
          END), 0) as averageRating
        FROM User u
        JOIN ClassEnrollment e ON e.userId = u.id AND e.status = 'APPROVED'
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id AND a.ownerId = ?
        LEFT JOIN User ut ON c.teacherId = ut.id
        LEFT JOIN Lesson l ON l.classId = c.id
        LEFT JOIN Video v ON v.lessonId = l.id
        LEFT JOIN VideoPlayState vps ON vps.videoId = v.id AND vps.studentId = u.id
        LEFT JOIN LessonRating lr ON lr.studentId = u.id AND lr.lessonId = l.id
        GROUP BY u.id, u.firstName, u.lastName, u.email, u.lastLoginAt, c.id, c.name, e.id, ut.firstName, ut.lastName
        ORDER BY u.lastName, u.firstName, c.name
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
