import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, getSession } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const academies = new Hono<{ Bindings: Bindings }>();

// GET /academies - List academies
academies.get('/', async (c) => {
  try {
    const session = await getSession(c);
    const publicMode = c.req.query('publicMode') === 'true'; // For signup page
    console.log('[Academies] GET request, session:', session ? `${session.role} (${session.id})` : 'null', 'publicMode:', publicMode);

    let query = '';
    let params: any[] = [];

    // Force public mode for signup page, regardless of session
    if (publicMode) {
      console.log('[Academies] Using PUBLIC query (forced by publicMode parameter)');
      query = `
        SELECT 
          a.id,
          a.name,
          a.description,
          a.createdAt,
          COUNT(DISTINCT c.id) as classCount
        FROM Academy a
        LEFT JOIN Class c ON a.id = c.academyId
        WHERE a.status = 'APPROVED'
        GROUP BY a.id
        ORDER BY a.name ASC
      `;
    } else if (session && session.role === 'ADMIN') {
      // Admin sees all with counts
      console.log('[Academies] Using ADMIN query');
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
    } else if (session && (session.role === 'ACADEMY' || session.role === 'TEACHER')) {
      // Academy owners see their own
      console.log('[Academies] Using ACADEMY/TEACHER query for user:', session.id);
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
      // Public/students see only approved academies (for signup/browsing)
      console.log('[Academies] Using PUBLIC query (no session or student role)');
      query = `
        SELECT 
          a.id,
          a.name,
          a.description,
          a.createdAt,
          COUNT(DISTINCT c.id) as classCount
        FROM Academy a
        LEFT JOIN Class c ON a.id = c.academyId
        WHERE a.status = 'APPROVED'
        GROUP BY a.id
        ORDER BY a.name ASC
      `;
    }

    console.log('[Academies] Executing query:', query.substring(0, 100) + '...');
    const result = await c.env.DB.prepare(query).bind(...params).all();
    console.log('[Academies] Query result:', result.results?.length || 0, 'academies found');
    if (result.results && result.results.length > 0) {
      console.log('[Academies] First academy:', result.results[0]);
    }

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

// GET /academies/students - Get all students across academies
// IMPORTANT: This must come BEFORE /:id route to avoid being captured as an ID
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

// POST /academies/teachers - Create a new teacher
// IMPORTANT: This must come BEFORE /:id route to avoid being captured as an ID
academies.post('/teachers', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only academy owners can create teachers'), 403);
    }

    const { email, firstName, lastName, password } = await c.req.json();

    if (!email || !firstName || !lastName || !password) {
      return c.json(errorResponse('Missing required fields'), 400);
    }

    if (password.length < 6) {
      return c.json(errorResponse('Password must be at least 6 characters'), 400);
    }

    // Get academy ID
    const academyResult = await c.env.DB.prepare(
      'SELECT id FROM Academy WHERE ownerId = ?'
    ).bind(session.id).first<{ id: string }>();
    
    if (!academyResult) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    const academyId = academyResult.id;

    // Check if email already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM User WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      return c.json(errorResponse('Email already registered'), 400);
    }

    // Hash password using Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Create user
    const userId = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO User (id, email, firstName, lastName, passwordHash, role, createdAt)
       VALUES (?, ?, ?, ?, ?, 'TEACHER', datetime('now'))`
    ).bind(userId, email, firstName, lastName, passwordHash).run();

    // Create teacher record linking to academy
    await c.env.DB.prepare(
      `INSERT INTO Teacher (id, userId, academyId, createdAt)
       VALUES (?, ?, ?, datetime('now'))`
    ).bind(crypto.randomUUID(), userId, academyId).run();

    return c.json(successResponse({ 
      id: userId, 
      email, 
      firstName, 
      lastName,
      message: 'Teacher created successfully'
    }));
  } catch (error: any) {
    console.error('[Create Teacher] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /academies/teachers - Get all teachers
// IMPORTANT: This must come BEFORE /:id route to avoid being captured as an ID
academies.get('/teachers', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Get academy ID for ACADEMY role
    let academyId: string | null = null;
    if (session.role === 'ACADEMY') {
      const academyResult = await c.env.DB.prepare(
        'SELECT id FROM Academy WHERE ownerId = ?'
      ).bind(session.id).first<{ id: string }>();
      
      if (!academyResult) {
        return c.json(errorResponse('Academy not found'), 404);
      }
      academyId = academyResult.id;
    }

    // Get teachers with their class and student counts
    let teachersQuery = '';
    let params: any[] = [];

    if (session.role === 'ADMIN') {
      teachersQuery = `
        SELECT DISTINCT
          u.id, u.email, u.firstName, u.lastName, u.createdAt,
          t.academyId
        FROM User u
        LEFT JOIN Teacher t ON u.id = t.userId
        WHERE u.role = 'TEACHER'
        ORDER BY u.lastName, u.firstName
      `;
    } else {
      // Academy owners see only teachers in their academy
      teachersQuery = `
        SELECT DISTINCT
          u.id, u.email, u.firstName, u.lastName, u.createdAt
        FROM User u
        JOIN Teacher t ON u.id = t.userId
        WHERE u.role = 'TEACHER' AND t.academyId = ?
        ORDER BY u.lastName, u.firstName
      `;
      params = [academyId];
    }

    const teachersResult = await c.env.DB.prepare(teachersQuery).bind(...params).all();
    const teachers = teachersResult.results || [];

    // Get class and student counts for each teacher
    const teachersWithCounts = await Promise.all(
      teachers.map(async (teacher: any) => {
        // Count classes taught by this teacher
        const classCountResult = await c.env.DB.prepare(
          `SELECT COUNT(*) as count FROM Class WHERE teacherId = ?`
        ).bind(teacher.id).first<{ count: number }>();
        
        const classCount = classCountResult?.count || 0;

        // Count students enrolled in this teacher's classes
        const studentCountResult = await c.env.DB.prepare(
          `SELECT COUNT(DISTINCT ce.userId) as count
           FROM ClassEnrollment ce
           JOIN Class c ON ce.classId = c.id
           WHERE c.teacherId = ? AND ce.status = 'APPROVED'`
        ).bind(teacher.id).first<{ count: number }>();
        
        const studentCount = studentCountResult?.count || 0;

        return {
          id: teacher.id,
          email: teacher.email,
          name: `${teacher.firstName} ${teacher.lastName}`,
          classCount,
          studentCount,
          createdAt: teacher.createdAt,
        };
      })
    );

    return c.json(successResponse(teachersWithCounts));
  } catch (error: any) {
    console.error('[Academy Teachers] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /academies/classes - Get classes for academies
// IMPORTANT: This must come BEFORE /:id route to avoid being captured as an ID
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
          COUNT(DISTINCT ce.id) as studentCount,
          COUNT(DISTINCT l.id) as lessonCount,
          COUNT(DISTINCT v.id) as videoCount,
          COUNT(DISTINCT d.id) as documentCount,
          ROUND(AVG(lr.rating), 1) as avgRating
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN ClassEnrollment ce ON c.id = ce.classId AND ce.status = 'APPROVED'
        LEFT JOIN Lesson l ON c.id = l.classId
        LEFT JOIN Video v ON l.id = v.lessonId
        LEFT JOIN Document d ON l.id = d.lessonId
        LEFT JOIN LessonRating lr ON l.id = lr.lessonId
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
          COUNT(DISTINCT ce.id) as studentCount,
          COUNT(DISTINCT l.id) as lessonCount,
          COUNT(DISTINCT v.id) as videoCount,
          COUNT(DISTINCT d.id) as documentCount,
          ROUND(AVG(lr.rating), 1) as avgRating
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN ClassEnrollment ce ON c.id = ce.classId AND ce.status = 'APPROVED'
        LEFT JOIN Lesson l ON c.id = l.classId
        LEFT JOIN Video v ON l.id = v.lessonId
        LEFT JOIN Document d ON l.id = d.lessonId
        LEFT JOIN LessonRating lr ON l.id = lr.lessonId
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

// GET /academies/:id - Get academy details
// IMPORTANT: This must come AFTER specific routes like /students, /teachers, /classes
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

// GET /academies/:id/classes - Get classes for an academy (public for signup)
academies.get('/:id/classes', async (c) => {
  try {
    const academyId = c.req.param('id');

    // Public endpoint - no auth required for signup flow
    const classes = await c.env.DB
      .prepare(`
        SELECT 
          c.id,
          c.name,
          c.description,
          u.firstName || ' ' || u.lastName as teacherName
        FROM Class c
        LEFT JOIN User u ON c.teacherId = u.id
        WHERE c.academyId = ?
        ORDER BY c.name ASC
      `)
      .bind(academyId)
      .all();

    return c.json(successResponse(classes.results || []));
  } catch (error: any) {
    console.error('[Academy Classes List] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default academies;
