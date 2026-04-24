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
      // Get ALL student progress across platform — using CTEs to avoid N×5 correlated subqueries
      query = `
        WITH lesson_progress AS (
          SELECT
            vps.studentId,
            l.classId,
            COUNT(DISTINCT v.lessonId) AS lessonsCompleted,
            SUM(vps.totalWatchTimeSeconds) AS totalWatchTime
          FROM VideoPlayState vps
          JOIN Video v ON v.id = vps.videoId
          JOIN Lesson l ON l.id = v.lessonId
          GROUP BY vps.studentId, l.classId
        ),
        lesson_counts AS (
          SELECT classId, COUNT(*) AS totalLessons
          FROM Lesson
          GROUP BY classId
        ),
        payments_agg AS (
          SELECT payerId, classId, SUM(amount) AS totalPaid
          FROM Payment
          WHERE status IN ('PAID', 'COMPLETED')
          GROUP BY payerId, classId
        )
        SELECT
          u.id,
          u.firstName,
          u.lastName,
          u.email,
          u.lastLoginAt as lastActive,
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
          COALESCE(pa.totalPaid, 0) as totalPaid,
          COALESCE(lp.lessonsCompleted, 0) as lessonsCompleted,
          COALESCE(lc.totalLessons, 0) as totalLessons,
          COALESCE(lp.totalWatchTime, 0) as totalWatchTime,
          0 as averageRating
        FROM User u
        JOIN ClassEnrollment e ON e.userId = u.id AND e.status = 'APPROVED'
        JOIN Class c ON e.classId = c.id
        LEFT JOIN User ut ON c.teacherId = ut.id
        LEFT JOIN lesson_progress lp ON lp.studentId = u.id AND lp.classId = c.id
        LEFT JOIN lesson_counts lc ON lc.classId = c.id
        LEFT JOIN payments_agg pa ON pa.payerId = u.id AND pa.classId = c.id
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
          u.lastLoginAt as lastActive,
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
          (SELECT COUNT(DISTINCT v2.lessonId) FROM VideoPlayState vps2 JOIN Video v2 ON v2.id = vps2.videoId JOIN Lesson l2 ON l2.id = v2.lessonId WHERE vps2.studentId = u.id AND l2.classId = c.id) as lessonsCompleted,
          (SELECT COUNT(*) FROM Lesson l3 WHERE l3.classId = c.id) as totalLessons,
          (SELECT COALESCE(SUM(vps3.totalWatchTimeSeconds), 0) FROM VideoPlayState vps3 JOIN Video v3 ON v3.id = vps3.videoId JOIN Lesson l3b ON l3b.id = v3.lessonId WHERE vps3.studentId = u.id AND l3b.classId = c.id) as totalWatchTime,
          (SELECT COALESCE(AVG(lr.rating), 0) FROM LessonRating lr JOIN Lesson lrl ON lrl.id = lr.lessonId WHERE lr.studentId = u.id AND lrl.classId = c.id) as averageRating
        FROM User u
        JOIN ClassEnrollment e ON e.userId = u.id AND e.status = 'APPROVED'
        JOIN Class c ON e.classId = c.id AND c.teacherId = ?
        ORDER BY u.lastName, u.firstName, c.name
      `;
      params = [session.id];
    } else if (session.role === 'ACADEMY') {
      // Get progress for each student-class combination — using CTEs to avoid N×5 correlated subqueries
      query = `
        WITH academy_classes AS (
          SELECT c.id as classId
          FROM Class c
          JOIN Academy a ON c.academyId = a.id
          WHERE a.ownerId = ?
        ),
        lesson_progress AS (
          SELECT
            vps.studentId,
            l.classId,
            COUNT(DISTINCT v.lessonId) AS lessonsCompleted,
            SUM(vps.totalWatchTimeSeconds) AS totalWatchTime
          FROM VideoPlayState vps
          JOIN Video v ON v.id = vps.videoId
          JOIN Lesson l ON l.id = v.lessonId
          WHERE l.classId IN (SELECT classId FROM academy_classes)
          GROUP BY vps.studentId, l.classId
        ),
        lesson_counts AS (
          SELECT classId, COUNT(*) AS totalLessons
          FROM Lesson
          WHERE classId IN (SELECT classId FROM academy_classes)
          GROUP BY classId
        ),
        payments_agg AS (
          SELECT payerId, classId, SUM(amount) AS totalPaid
          FROM Payment
          WHERE status IN ('PAID', 'COMPLETED')
            AND classId IN (SELECT classId FROM academy_classes)
          GROUP BY payerId, classId
        )
        SELECT
          u.id,
          u.firstName,
          u.lastName,
          u.email,
          u.lastLoginAt as lastActive,
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
          COALESCE(pa.totalPaid, 0) as totalPaid,
          COALESCE(lp.lessonsCompleted, 0) as lessonsCompleted,
          COALESCE(lc.totalLessons, 0) as totalLessons,
          COALESCE(lp.totalWatchTime, 0) as totalWatchTime,
          0 as averageRating
        FROM User u
        JOIN ClassEnrollment e ON e.userId = u.id AND e.status = 'APPROVED'
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id AND a.ownerId = ?
        LEFT JOIN User ut ON c.teacherId = ut.id
        LEFT JOIN lesson_progress lp ON lp.studentId = u.id AND lp.classId = c.id
        LEFT JOIN lesson_counts lc ON lc.classId = c.id
        LEFT JOIN payments_agg pa ON pa.payerId = u.id AND pa.classId = c.id
        ORDER BY u.lastName, u.firstName, c.name
      `;
      params = [session.id, session.id];
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Students Progress] Error:', error);
    return c.json(errorResponse('Failed to fetch student progress'), 500);
  }
});

// PATCH /students/:id/warn â€” send suspicion warning to student (shown on their next login)
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Students Warn] Error:', error);
    return c.json(errorResponse('Failed to send warning'), 500);
  }
});

export default students;

