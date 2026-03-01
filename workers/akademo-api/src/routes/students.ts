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
          u.suspicionCount,
          c.name as className,
          c.id as classId,
          c.academyId,
          e.id as enrollmentId,
          ut.firstName || ' ' || ut.lastName as teacherName,
          e.paymentFrequency,
          c.monthlyPrice,
          c.oneTimePrice,
          c.startDate as classStartDate,
          e.enrolledAt,
          (SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.payerId = u.id AND p.classId = c.id AND p.status IN ('PAID', 'COMPLETED')) as totalPaid,
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
        GROUP BY u.id, u.firstName, u.lastName, u.email, u.lastLoginAt, u.suspicionCount, c.id, c.name, c.academyId, e.id, ut.firstName, ut.lastName
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
          u.suspicionCount,
          c.name as className,
          c.id as classId,
          e.id as enrollmentId,
          e.paymentFrequency,
          c.monthlyPrice,
          c.oneTimePrice,
          c.startDate as classStartDate,
          e.enrolledAt,
          (SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.payerId = u.id AND p.classId = c.id AND p.status IN ('PAID', 'COMPLETED')) as totalPaid,
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
        GROUP BY u.id, u.firstName, u.lastName, u.email, u.lastLoginAt, u.suspicionCount, c.id, c.name, e.id
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
          u.suspicionCount,
          c.name as className,
          c.id as classId,
          e.id as enrollmentId,
          ut.firstName || ' ' || ut.lastName as teacherName,
          e.paymentFrequency,
          c.monthlyPrice,
          c.oneTimePrice,
          c.startDate as classStartDate,
          e.enrolledAt,
          (SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.payerId = u.id AND p.classId = c.id AND p.status IN ('PAID', 'COMPLETED')) as totalPaid,
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
        GROUP BY u.id, u.firstName, u.lastName, u.email, u.lastLoginAt, u.suspicionCount, c.id, c.name, e.id, ut.firstName, ut.lastName
        ORDER BY u.lastName, u.firstName, c.name
      `;
      params = [session.id];
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Students Progress] Error:', error);
    return c.json(errorResponse('Failed to fetch student progress'), 500);
  }
});

// PATCH /students/:id/warn — send suspicion warning to student (shown on their next login)
students.patch('/:id/warn', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ACADEMY' && session.role !== 'ADMIN') {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const studentId = c.req.param('id');

    // Verify the student belongs to this academy (unless ADMIN)
    if (session.role === 'ACADEMY') {
      const belongs: any = await c.env.DB
        .prepare(`
          SELECT ce.id FROM ClassEnrollment ce
          JOIN Class c ON ce.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          WHERE ce.userId = ? AND a.ownerId = ?
          LIMIT 1
        `)
        .bind(studentId, session.id)
        .first();
      if (!belongs) {
        return c.json(errorResponse('Student does not belong to your academy'), 403);
      }
    }

    await c.env.DB
      .prepare('UPDATE User SET suspicionWarning = 1 WHERE id = ?')
      .bind(studentId)
      .run();

    return c.json(successResponse({ warned: true }));
  } catch (error: any) {
    console.error('[Students Warn] Error:', error);
    return c.json(errorResponse('Failed to send warning'), 500);
  }
});

export default students;
