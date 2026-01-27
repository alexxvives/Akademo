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

export default users;
