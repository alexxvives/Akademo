import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

interface CountResult {
  count: number;
}

const analytics = new Hono<{ Bindings: Bindings }>();

// GET /analytics - Get platform analytics
analytics.get('/', async (c) => {
  try {
    const session = await requireAuth(c);

    let stats: Record<string, number> = {};

    if (session.role === 'ADMIN') {
      // Admin sees everything - use batch for efficiency
      const [
        academyResult,
        teacherResult,
        studentResult,
        classResult,
        lessonResult,
        enrollmentResult
      ] = await c.env.DB.batch([
        c.env.DB.prepare('SELECT COUNT(*) as count FROM Academy'),
        c.env.DB.prepare('SELECT COUNT(*) as count FROM User WHERE role = ?').bind('TEACHER'),
        c.env.DB.prepare('SELECT COUNT(*) as count FROM User WHERE role = ?').bind('STUDENT'),
        c.env.DB.prepare('SELECT COUNT(*) as count FROM Class'),
        c.env.DB.prepare('SELECT COUNT(*) as count FROM Lesson'),
        c.env.DB.prepare('SELECT COUNT(*) as count FROM ClassEnrollment WHERE status = ?').bind('APPROVED'),
      ]);

      stats = {
        academies: (academyResult.results?.[0] as CountResult)?.count || 0,
        teachers: (teacherResult.results?.[0] as CountResult)?.count || 0,
        students: (studentResult.results?.[0] as CountResult)?.count || 0,
        classes: (classResult.results?.[0] as CountResult)?.count || 0,
        lessons: (lessonResult.results?.[0] as CountResult)?.count || 0,
        enrollments: (enrollmentResult.results?.[0] as CountResult)?.count || 0,
      };
    } else if (session.role === 'ACADEMY') {
      // Academy owners see their stats - use batch
      const [academyResult, classResult, lessonResult, studentResult] = await c.env.DB.batch([
        c.env.DB.prepare('SELECT COUNT(*) as count FROM Academy WHERE ownerId = ?').bind(session.id),
        c.env.DB.prepare('SELECT COUNT(*) as count FROM Class WHERE academyId IN (SELECT id FROM Academy WHERE ownerId = ?)').bind(session.id),
        c.env.DB.prepare('SELECT COUNT(*) as count FROM Lesson WHERE classId IN (SELECT id FROM Class WHERE academyId IN (SELECT id FROM Academy WHERE ownerId = ?))').bind(session.id),
        c.env.DB.prepare('SELECT COUNT(DISTINCT userId) as count FROM ClassEnrollment WHERE classId IN (SELECT id FROM Class WHERE academyId IN (SELECT id FROM Academy WHERE ownerId = ?)) AND status = ?').bind(session.id, 'APPROVED'),
      ]);

      stats = {
        academies: (academyResult.results?.[0] as CountResult)?.count || 0,
        classes: (classResult.results?.[0] as CountResult)?.count || 0,
        lessons: (lessonResult.results?.[0] as CountResult)?.count || 0,
        students: (studentResult.results?.[0] as CountResult)?.count || 0,
      };
    } else if (session.role === 'TEACHER') {
      // Teachers see their stats - use batch
      const [classResult, lessonResult, studentResult] = await c.env.DB.batch([
        c.env.DB.prepare('SELECT COUNT(*) as count FROM Class WHERE teacherId = ?').bind(session.id),
        c.env.DB.prepare('SELECT COUNT(*) as count FROM Lesson WHERE classId IN (SELECT id FROM Class WHERE teacherId = ?)').bind(session.id),
        c.env.DB.prepare('SELECT COUNT(DISTINCT userId) as count FROM ClassEnrollment WHERE classId IN (SELECT id FROM Class WHERE teacherId = ?) AND status = ?').bind(session.id, 'APPROVED'),
      ]);

      stats = {
        classes: (classResult.results?.[0] as CountResult)?.count || 0,
        lessons: (lessonResult.results?.[0] as CountResult)?.count || 0,
        students: (studentResult.results?.[0] as CountResult)?.count || 0,
      };
    } else {
      // Students see their stats - use batch
      const [enrollmentResult, completedResult] = await c.env.DB.batch([
        c.env.DB.prepare('SELECT COUNT(*) as count FROM ClassEnrollment WHERE userId = ? AND status = ?').bind(session.id, 'APPROVED'),
        c.env.DB.prepare('SELECT COUNT(*) as count FROM VideoPlayState WHERE studentId = ? AND completed = 1').bind(session.id),
      ]);

      stats = {
        enrolledClasses: (enrollmentResult.results?.[0] as CountResult)?.count || 0,
        completedVideos: (completedResult.results?.[0] as CountResult)?.count || 0,
      };
    }

    return c.json(successResponse(stats));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Analytics] Error:', error);
    return c.json(errorResponse(message), 500);
  }
});

export default analytics;
