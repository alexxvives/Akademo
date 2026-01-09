import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const analytics = new Hono<{ Bindings: Bindings }>();

// GET /analytics - Get platform analytics
analytics.get('/', async (c) => {
  try {
    const session = await requireAuth(c);

    let stats: any = {};

    if (session.role === 'ADMIN') {
      // Admin sees everything
      const academyCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM Academy').first();
      const teacherCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM User WHERE role = ?').bind('TEACHER').first();
      const studentCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM User WHERE role = ?').bind('STUDENT').first();
      const classCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM Class').first();
      const lessonCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM Lesson').first();
      const enrollmentCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM ClassEnrollment WHERE status = ?').bind('APPROVED').first();

      stats = {
        academies: academyCount?.count || 0,
        teachers: teacherCount?.count || 0,
        students: studentCount?.count || 0,
        classes: classCount?.count || 0,
        lessons: lessonCount?.count || 0,
        enrollments: enrollmentCount?.count || 0,
      };
    } else if (session.role === 'ACADEMY') {
      // Academy owners see their stats
      const academyCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM Academy WHERE ownerId = ?').bind(session.id).first();
      const classCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM Class WHERE academyId IN (SELECT id FROM Academy WHERE ownerId = ?)').bind(session.id).first();
      const lessonCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM Lesson WHERE classId IN (SELECT id FROM Class WHERE academyId IN (SELECT id FROM Academy WHERE ownerId = ?))').bind(session.id).first();
      const studentCount = await c.env.DB.prepare('SELECT COUNT(DISTINCT userId) as count FROM ClassEnrollment WHERE classId IN (SELECT id FROM Class WHERE academyId IN (SELECT id FROM Academy WHERE ownerId = ?)) AND status = ?').bind(session.id, 'APPROVED').first();

      stats = {
        academies: academyCount?.count || 0,
        classes: classCount?.count || 0,
        lessons: lessonCount?.count || 0,
        students: studentCount?.count || 0,
      };
    } else if (session.role === 'TEACHER') {
      // Teachers see their stats
      const classCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM Class WHERE teacherId = ?').bind(session.id).first();
      const lessonCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM Lesson WHERE classId IN (SELECT id FROM Class WHERE teacherId = ?)').bind(session.id).first();
      const studentCount = await c.env.DB.prepare('SELECT COUNT(DISTINCT userId) as count FROM ClassEnrollment WHERE classId IN (SELECT id FROM Class WHERE teacherId = ?) AND status = ?').bind(session.id, 'APPROVED').first();

      stats = {
        classes: classCount?.count || 0,
        lessons: lessonCount?.count || 0,
        students: studentCount?.count || 0,
      };
    } else {
      // Students see their stats
      const enrollmentCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM ClassEnrollment WHERE userId = ? AND status = ?').bind(session.id, 'APPROVED').first();
      const completedVideos = await c.env.DB.prepare('SELECT COUNT(*) as count FROM VideoPlayState WHERE studentId = ? AND completed = 1').bind(session.id).first();

      stats = {
        enrolledClasses: enrollmentCount?.count || 0,
        completedVideos: completedVideos?.count || 0,
      };
    }

    return c.json(successResponse(stats));
  } catch (error: any) {
    console.error('[Analytics] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default analytics;
