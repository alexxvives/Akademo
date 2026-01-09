import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const academies = new Hono<{ Bindings: Bindings }>();

// GET /academies - List academies
academies.get('/', async (c) => {
  try {
    const session = await requireAuth(c);

    let query = '';
    let params: any[] = [];

    if (session.role === 'ADMIN') {
      // Admin sees all with counts
      query = `
        SELECT 
          a.*,
          COUNT(DISTINCT c.id) as classCount,
          COUNT(DISTINCT t.id) as teacherCount
        FROM Academy a
        LEFT JOIN Class c ON a.id = c.academyId
        LEFT JOIN Teacher t ON a.id = t.academyId
        GROUP BY a.id
        ORDER BY a.createdAt DESC
      `;
    } else if (session.role === 'ACADEMY' || session.role === 'TEACHER') {
      // Academy owners see their own
      query = `
        SELECT 
          a.*,
          COUNT(DISTINCT c.id) as classCount,
          COUNT(DISTINCT t.id) as teacherCount
        FROM Academy a
        LEFT JOIN Class c ON a.id = c.academyId
        LEFT JOIN Teacher t ON a.id = t.academyId
        WHERE a.ownerId = ?
        GROUP BY a.id
        ORDER BY a.createdAt DESC
      `;
      params = [session.id];
    } else {
      // Students see all (for browsing)
      query = `
        SELECT 
          a.*,
          COUNT(DISTINCT c.id) as classCount
        FROM Academy a
        LEFT JOIN Class c ON a.id = c.academyId
        GROUP BY a.id
        ORDER BY a.createdAt DESC
      `;
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[List Academies] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /academies - Create academy
academies.post('/', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['TEACHER', 'ADMIN', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { name, description } = await c.req.json();

    if (!name) {
      return c.json(errorResponse('Name is required'), 400);
    }

    const academyId = crypto.randomUUID();
    await c.env.DB
      .prepare('INSERT INTO Academy (id, name, description, ownerId) VALUES (?, ?, ?, ?)')
      .bind(academyId, name, description || null, session.id)
      .run();

    const academy = await c.env.DB
      .prepare('SELECT * FROM Academy WHERE id = ?')
      .bind(academyId)
      .first();

    return c.json(successResponse(academy), 201);
  } catch (error: any) {
    console.error('[Create Academy] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /academies/:id - Get academy details
academies.get('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const academyId = c.req.param('id');

    const academy = await c.env.DB
      .prepare('SELECT * FROM Academy WHERE id = ?')
      .bind(academyId)
      .first();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    // Get class count
    const classCount = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM Class WHERE academyId = ?')
      .bind(academyId)
      .first();

    // Get teacher count
    const teacherCount = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM Teacher WHERE academyId = ?')
      .bind(academyId)
      .first();

    return c.json(successResponse({
      ...academy,
      classCount: classCount?.count || 0,
      teacherCount: teacherCount?.count || 0,
    }));
  } catch (error: any) {
    console.error('[Get Academy] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PATCH /academies/:id - Update academy
academies.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const academyId = c.req.param('id');
    const { name, description } = await c.req.json();

    // Check ownership
    const academy = await c.env.DB
      .prepare('SELECT * FROM Academy WHERE id = ?')
      .bind(academyId)
      .first();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    if (session.role !== 'ADMIN' && academy.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    await c.env.DB
      .prepare('UPDATE Academy SET name = ?, description = ? WHERE id = ?')
      .bind(name, description || null, academyId)
      .run();

    const updated = await c.env.DB
      .prepare('SELECT * FROM Academy WHERE id = ?')
      .bind(academyId)
      .first();

    return c.json(successResponse(updated));
  } catch (error: any) {
    console.error('[Update Academy] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /academies/students - Get all students across academies
academies.get('/students', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    let query = '';
    let params: any[] = [];

    if (session.role === 'ADMIN') {
      query = `
        SELECT DISTINCT
          u.id, u.email, u.firstName, u.lastName,
          a.id as academyId, a.name as academyName,
          c.id as classId, c.name as className,
          ce.status as enrollmentStatus
        FROM User u
        JOIN ClassEnrollment ce ON u.id = ce.userId
        JOIN Class c ON ce.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE u.role = 'STUDENT'
        ORDER BY u.lastName, u.firstName
      `;
    } else {
      // Academy owners see students in their academies
      query = `
        SELECT DISTINCT
          u.id, u.email, u.firstName, u.lastName,
          a.id as academyId, a.name as academyName,
          c.id as classId, c.name as className,
          ce.status as enrollmentStatus
        FROM User u
        JOIN ClassEnrollment ce ON u.id = ce.userId
        JOIN Class c ON ce.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE u.role = 'STUDENT' AND a.ownerId = ?
        ORDER BY u.lastName, u.firstName
      `;
      params = [session.id];
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Academy Students] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /academies/teachers - Get all teachers
academies.get('/teachers', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    let query = '';
    let params: any[] = [];

    if (session.role === 'ADMIN') {
      query = `
        SELECT DISTINCT
          u.id, u.email, u.firstName, u.lastName,
          a.id as academyId, a.name as academyName
        FROM User u
        LEFT JOIN Teacher t ON u.id = t.userId
        LEFT JOIN Academy a ON t.academyId = a.id
        WHERE u.role = 'TEACHER'
        ORDER BY u.lastName, u.firstName
      `;
    } else {
      // Academy owners see teachers in their academies
      query = `
        SELECT DISTINCT
          u.id, u.email, u.firstName, u.lastName,
          a.id as academyId, a.name as academyName
        FROM User u
        JOIN Teacher t ON u.id = t.userId
        JOIN Academy a ON t.academyId = a.id
        WHERE u.role = 'TEACHER' AND a.ownerId = ?
        ORDER BY u.lastName, u.firstName
      `;
      params = [session.id];
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Academy Teachers] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /academies/classes - Get classes for academies
academies.get('/classes', async (c) => {
  try {
    const session = await requireAuth(c);

    let query = '';
    let params: any[] = [];

    if (session.role === 'ADMIN') {
      query = `
        SELECT 
          c.*,
          a.name as academyName,
          u.firstName as teacherFirstName,
          u.lastName as teacherLastName,
          COUNT(DISTINCT ce.id) as studentCount
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN ClassEnrollment ce ON c.id = ce.classId AND ce.status = 'APPROVED'
        GROUP BY c.id
        ORDER BY c.createdAt DESC
      `;
    } else if (session.role === 'ACADEMY') {
      query = `
        SELECT 
          c.*,
          a.name as academyName,
          u.firstName as teacherFirstName,
          u.lastName as teacherLastName,
          COUNT(DISTINCT ce.id) as studentCount
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN ClassEnrollment ce ON c.id = ce.classId AND ce.status = 'APPROVED'
        WHERE a.ownerId = ?
        GROUP BY c.id
        ORDER BY c.createdAt DESC
      `;
      params = [session.id];
    } else {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Academy Classes] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default academies;
