import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, hashPassword } from '../lib/auth';
import { successResponse, errorResponse, teacherCanAccessClass } from '../lib/utils';
import { validateBody, createStudentSchema, createTeacherSchema } from '../lib/validation';
import { createUserRateLimit } from '../lib/rate-limit';

const users = new Hono<{ Bindings: Bindings }>();

// POST /users/create-student - Create student account
users.post('/create-student', createUserRateLimit, validateBody(createStudentSchema), async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'ACADEMY', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { email, password, firstName, lastName, classId } = await c.req.json();

    // Check if user exists
    const existing = await c.env.DB
      .prepare('SELECT id FROM User WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    if (existing) {
      return c.json(errorResponse('Email already registered'), 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

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

        if (!classRecord || !(await teacherCanAccessClass(c.env.DB, session.id, classId))) {
          return c.json(errorResponse('Not authorized for this class'), 403);
        }
      } else if (session.role === 'ACADEMY') {
        const classRecord = await c.env.DB
          .prepare('SELECT c.id, c.name, c.slug, c.description, c.academyId, c.teacherId, c.createdAt, a.feedbackEnabled, c.whatsappGroupLink, c.monthlyPrice, c.oneTimePrice, c.zoomAccountId, c.maxStudents, c.startDate, a.ownerId FROM Class c JOIN Academy a ON c.academyId = a.id WHERE c.id = ?')
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Create Student] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /users/create-teacher - Create teacher account
users.post('/create-teacher', createUserRateLimit, validateBody(createTeacherSchema), async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { email, password, firstName, lastName, academyId, classId } = await c.req.json();

    // Check if user exists
    const existing = await c.env.DB
      .prepare('SELECT id FROM User WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    if (existing) {
      return c.json(errorResponse('Email already registered'), 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

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
      const now = new Date().toISOString();
      await c.env.DB
        .prepare('INSERT INTO Teacher (id, userId, academyId, createdAt) VALUES (?, ?, ?, ?)')
        .bind(teacherId, userId, academyId, now)
        .run();
      
      // If classId provided, assign teacher to class
      if (classId) {
        await c.env.DB
          .prepare('UPDATE Class SET teacherId = ? WHERE id = ? AND academyId = ?')
          .bind(userId, classId, academyId)
          .run();
      }
    }

    const user = await c.env.DB
      .prepare('SELECT id, email, firstName, lastName, role FROM User WHERE id = ?')
      .bind(userId)
      .first();

    return c.json(successResponse(user), 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Create Teacher] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// DELETE /users/teacher/:id - Delete teacher account (Academy only)
users.delete('/teacher/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ACADEMY') {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const teacherId = c.req.param('id');

    // Verify teacher belongs to this academy
    const teacher: any = await c.env.DB
      .prepare(`
        SELECT t.id, t.userId, t.academyId, a.ownerId, u.firstName, u.lastName
        FROM Teacher t
        JOIN Academy a ON t.academyId = a.id
        JOIN User u ON t.userId = u.id
        WHERE u.id = ?
      `)
      .bind(teacherId)
      .first();

    if (!teacher) {
      return c.json(errorResponse('Teacher not found'), 404);
    }

    if (teacher.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized to delete this teacher'), 403);
    }

    // Atomic batch: unassign from classes, clean up LoginEvent (FK RESTRICT, no cascade),
    // delete Teacher record, then delete User account.
    // Note: LiveStream.teacherId has no FK constraint — historical records are kept.
    // Note: Assignment records cascade-delete via FK ON DELETE CASCADE on User.
    // Note: ArchivedVideo.uploadedById has no ON DELETE — orphaned reference kept (content preserved).
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE Class SET teacherId = NULL WHERE teacherId = ?').bind(teacherId),
      c.env.DB.prepare('DELETE FROM LoginEvent WHERE userId = ?').bind(teacherId),
      c.env.DB.prepare('DELETE FROM Teacher WHERE userId = ?').bind(teacherId),
      c.env.DB.prepare('DELETE FROM User WHERE id = ?').bind(teacherId),
    ]);

    return c.json(successResponse({ message: 'Teacher deleted successfully' }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Delete Teacher] Error:', error);
    return c.json(errorResponse('Failed to delete teacher'), 500);
  }
});

// PATCH /users/teacher/:id - Update teacher info (Academy only)
users.patch('/teacher/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ACADEMY') {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const teacherId = c.req.param('id');
    const { fullName, email, classIds } = await c.req.json();

    // Verify teacher belongs to this academy
    const teacher: any = await c.env.DB
      .prepare(`
        SELECT t.id, t.userId, t.academyId, a.ownerId
        FROM Teacher t
        JOIN Academy a ON t.academyId = a.id
        WHERE t.userId = ?
      `)
      .bind(teacherId)
      .first();

    if (!teacher) {
      return c.json(errorResponse('Teacher not found'), 404);
    }

    if (teacher.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized to update this teacher'), 403);
    }

    // Split fullName into firstName and lastName
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    // Update user info
    await c.env.DB
      .prepare('UPDATE User SET firstName = ?, lastName = ?, email = ? WHERE id = ?')
      .bind(firstName, lastName, email.toLowerCase(), teacherId)
      .run();

    // Update class assignments if provided
    if (classIds !== undefined) {
      // Unassign from all classes in this academy first
      await c.env.DB
        .prepare('UPDATE Class SET teacherId = NULL WHERE teacherId = ? AND academyId = ?')
        .bind(teacherId, teacher.academyId)
        .run();
      // Assign to each selected class
      if (Array.isArray(classIds)) {
        for (const cId of classIds) {
          await c.env.DB
            .prepare('UPDATE Class SET teacherId = ? WHERE id = ? AND academyId = ?')
            .bind(teacherId, cId, teacher.academyId)
            .run();
        }
      }
    }

    return c.json(successResponse({ message: 'Teacher updated successfully' }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Update Teacher] Error:', error);
    return c.json(errorResponse('Failed to update teacher'), 500);
  }
});

// DELETE /users/delete-account - Delete user account
users.delete('/delete-account', async (c) => {
  try {
    const session = await requireAuth(c);
    const userId = session.id;

    // Perform different cleanup based on role
    if (session.role === 'STUDENT') {
      // Delete student enrollments and ratings (atomic)
      await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM ClassEnrollment WHERE userId = ?').bind(userId),
        c.env.DB.prepare('DELETE FROM LessonRating WHERE studentId = ?').bind(userId),
        c.env.DB.prepare('DELETE FROM VideoPlayState WHERE studentId = ?').bind(userId),
      ]);
      
    } else if (session.role === 'TEACHER') {
      // Unassign from classes and delete teacher records (atomic)
      await c.env.DB.batch([
        c.env.DB.prepare('UPDATE Class SET teacherId = NULL WHERE teacherId = ?').bind(userId),
        c.env.DB.prepare('DELETE FROM Teacher WHERE userId = ?').bind(userId),
        c.env.DB.prepare('DELETE FROM LiveStream WHERE teacherId = ?').bind(userId),
      ]);
      
    } else if (session.role === 'ACADEMY') {
      // Delete academy and all related data using batch subquery DELETEs (no N+1)
      const academy: any = await c.env.DB.prepare('SELECT id FROM Academy WHERE ownerId = ?').bind(userId).first();
      
      if (academy) {
        const academyId = academy.id;
        
        await c.env.DB.batch([
          // Delete leaf entities first
          c.env.DB.prepare('DELETE FROM Video WHERE lessonId IN (SELECT id FROM Lesson WHERE classId IN (SELECT id FROM Class WHERE academyId = ?))').bind(academyId),
          c.env.DB.prepare('DELETE FROM Document WHERE lessonId IN (SELECT id FROM Lesson WHERE classId IN (SELECT id FROM Class WHERE academyId = ?))').bind(academyId),
          c.env.DB.prepare('DELETE FROM LessonRating WHERE lessonId IN (SELECT id FROM Lesson WHERE classId IN (SELECT id FROM Class WHERE academyId = ?))').bind(academyId),
          c.env.DB.prepare('DELETE FROM VideoPlayState WHERE videoId IN (SELECT v.id FROM Video v JOIN Lesson l ON v.lessonId = l.id JOIN Class c ON l.classId = c.id WHERE c.academyId = ?)').bind(academyId),
          // Delete mid-level entities
          c.env.DB.prepare('DELETE FROM Lesson WHERE classId IN (SELECT id FROM Class WHERE academyId = ?)').bind(academyId),
          c.env.DB.prepare('DELETE FROM ClassEnrollment WHERE classId IN (SELECT id FROM Class WHERE academyId = ?)').bind(academyId),
          c.env.DB.prepare('DELETE FROM LiveStream WHERE classId IN (SELECT id FROM Class WHERE academyId = ?)').bind(academyId),
          c.env.DB.prepare('DELETE FROM Payment WHERE classId IN (SELECT id FROM Class WHERE academyId = ?)').bind(academyId),
          // Delete classes, teachers, and the academy
          c.env.DB.prepare('DELETE FROM Class WHERE academyId = ?').bind(academyId),
          c.env.DB.prepare('DELETE FROM Teacher WHERE academyId = ?').bind(academyId),
          c.env.DB.prepare('DELETE FROM Academy WHERE id = ?').bind(academyId),
        ]);
      }
    }

    // Delete the user account
    await c.env.DB.prepare('DELETE FROM User WHERE id = ?').bind(userId).run();
    
    return c.json(successResponse({ message: 'Account deleted successfully' }));
    
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Delete Account] Error:', error);
    return c.json(errorResponse('Failed to delete account'), 500);
  }
});

export default users;
