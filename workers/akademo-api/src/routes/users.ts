import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const users = new Hono<{ Bindings: Bindings }>();

// POST /users/create-student - Create student account
users.post('/create-student', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'ACADEMY', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { email, password, firstName, lastName, classId } = await c.req.json();

    if (!email || !password || !firstName || !lastName) {
      return c.json(errorResponse('All fields required'), 400);
    }

    // Check if user exists
    const existing = await c.env.DB
      .prepare('SELECT id FROM User WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    if (existing) {
      return c.json(errorResponse('Email already registered'), 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = crypto.randomUUID();
    await c.env.DB
      .prepare('INSERT INTO User (id, email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(userId, email.toLowerCase(), hashedPassword, firstName, lastName, 'STUDENT')
      .run();

    // If classId provided, auto-enroll
    if (classId) {
      // Verify teacher owns this class
      if (session.role === 'TEACHER') {
        const classRecord = await c.env.DB
          .prepare('SELECT teacherId FROM Class WHERE id = ?')
          .bind(classId)
          .first();

        if (!classRecord || classRecord.teacherId !== session.id) {
          return c.json(errorResponse('Not authorized for this class'), 403);
        }
      } else if (session.role === 'ACADEMY') {
        const classRecord = await c.env.DB
          .prepare('SELECT c.id, c.name, c.slug, c.description, c.academyId, c.teacherId, c.createdAt, c.feedbackEnabled, c.whatsappGroupLink, c.price, c.currency, c.zoomAccountId, a.ownerId FROM Class c JOIN Academy a ON c.academyId = a.id WHERE c.id = ?')
          .bind(classId)
          .first();

        if (!classRecord || classRecord.ownerId !== session.id) {
          return c.json(errorResponse('Not authorized for this class'), 403);
        }
      }

      const enrollmentId = crypto.randomUUID();
      await c.env.DB
        .prepare('INSERT INTO ClassEnrollment (id, classId, userId, status, documentSigned) VALUES (?, ?, ?, ?, ?)')
        .bind(enrollmentId, classId, userId, 'APPROVED', 0)
        .run();
    }

    const user = await c.env.DB
      .prepare('SELECT id, email, firstName, lastName, role FROM User WHERE id = ?')
      .bind(userId)
      .first();

    return c.json(successResponse(user), 201);
  } catch (error: any) {
    console.error('[Create Student] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /users/create-teacher - Create teacher account
users.post('/create-teacher', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { email, password, firstName, lastName, academyId } = await c.req.json();

    if (!email || !password || !firstName || !lastName) {
      return c.json(errorResponse('All fields required'), 400);
    }

    // Check if user exists
    const existing = await c.env.DB
      .prepare('SELECT id FROM User WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    if (existing) {
      return c.json(errorResponse('Email already registered'), 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = crypto.randomUUID();
    await c.env.DB
      .prepare('INSERT INTO User (id, email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(userId, email.toLowerCase(), hashedPassword, firstName, lastName, 'TEACHER')
      .run();

    // If academyId provided, add to academy
    if (academyId) {
      // Verify ownership
      if (session.role === 'ACADEMY') {
        const academy = await c.env.DB
          .prepare('SELECT ownerId FROM Academy WHERE id = ?')
          .bind(academyId)
          .first();

        if (!academy || academy.ownerId !== session.id) {
          return c.json(errorResponse('Not authorized for this academy'), 403);
        }
      }

      const teacherId = crypto.randomUUID();
      await c.env.DB
        .prepare('INSERT INTO Teacher (id, userId, academyId) VALUES (?, ?, ?)')
        .bind(teacherId, userId, academyId)
        .run();
    }

    const user = await c.env.DB
      .prepare('SELECT id, email, firstName, lastName, role FROM User WHERE id = ?')
      .bind(userId)
      .first();

    return c.json(successResponse(user), 201);
  } catch (error: any) {
    console.error('[Create Teacher] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// DELETE /users/delete-account - Delete user account
users.delete('/delete-account', async (c) => {
  try {
    const session = await requireAuth(c);
    const userId = session.id;

    console.log('[Delete Account] User:', userId, 'Role:', session.role);

    // Perform different cleanup based on role
    if (session.role === 'STUDENT') {
      // Delete student enrollments and ratings
      await c.env.DB.prepare('DELETE FROM ClassEnrollment WHERE userId = ?').bind(userId).run();
      await c.env.DB.prepare('DELETE FROM LessonRating WHERE studentId = ?').bind(userId).run();
      await c.env.DB.prepare('DELETE FROM VideoPlayState WHERE studentId = ?').bind(userId).run();
      
    } else if (session.role === 'TEACHER') {
      // Unassign from classes and delete teacher records
      await c.env.DB.prepare('UPDATE Class SET teacherId = NULL WHERE teacherId = ?').bind(userId).run();
      await c.env.DB.prepare('DELETE FROM Teacher WHERE userId = ?').bind(userId).run();
      await c.env.DB.prepare('DELETE FROM LiveStream WHERE teacherId = ?').bind(userId).run();
      
    } else if (session.role === 'ACADEMY') {
      // Delete academy and all related data (dangerous!)
      const academy: any = await c.env.DB.prepare('SELECT id FROM Academy WHERE ownerId = ?').bind(userId).first();
      
      if (academy) {
        const academyId = academy.id;
        
        // Delete all classes and their related data
        const classes: any = await c.env.DB.prepare('SELECT id FROM Class WHERE academyId = ?').bind(academyId).all();
        
        for (const classRow of classes.results || []) {
          const classId = classRow.id;
          
          // Delete lessons and their content
          const lessons: any = await c.env.DB.prepare('SELECT id FROM Lesson WHERE classId = ?').bind(classId).all();
          for (const lesson of lessons.results || []) {
            await c.env.DB.prepare('DELETE FROM Video WHERE lessonId = ?').bind(lesson.id).run();
            await c.env.DB.prepare('DELETE FROM Document WHERE lessonId = ?').bind(lesson.id).run();
            await c.env.DB.prepare('DELETE FROM LessonRating WHERE lessonId = ?').bind(lesson.id).run();
          }
          await c.env.DB.prepare('DELETE FROM Lesson WHERE classId = ?').bind(classId).run();
          
          // Delete enrollments and live streams
          await c.env.DB.prepare('DELETE FROM ClassEnrollment WHERE classId = ?').bind(classId).run();
          await c.env.DB.prepare('DELETE FROM LiveStream WHERE classId = ?').bind(classId).run();
        }
        
        // Delete all classes
        await c.env.DB.prepare('DELETE FROM Class WHERE academyId = ?').bind(academyId).run();
        
        // Delete teachers
        await c.env.DB.prepare('DELETE FROM Teacher WHERE academyId = ?').bind(academyId).run();
        
        // Delete academy
        await c.env.DB.prepare('DELETE FROM Academy WHERE id = ?').bind(academyId).run();
      }
    }

    // Delete the user account
    await c.env.DB.prepare('DELETE FROM User WHERE id = ?').bind(userId).run();
    
    console.log('[Delete Account] Successfully deleted user:', userId);
    
    return c.json(successResponse({ message: 'Account deleted successfully' }));
    
  } catch (error: any) {
    console.error('[Delete Account] Error:', error);
    return c.json(errorResponse(error.message || 'Failed to delete account'), 500);
  }
});

export default users;
