import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const classes = new Hono<{ Bindings: Bindings }>();

// GET /classes - Get user's classes
classes.get('/', async (c) => {
  try {
    const session = await requireAuth(c);

    let query = '';
    let params: any[] = [];

    if (session.role === 'STUDENT') {
      // Get enrolled classes with counts
      query = `
        SELECT 
          c.*,
          a.name as academyName,
          ce.status as enrollmentStatus,
          ce.documentSigned,
          (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id AND status = 'APPROVED') as studentCount,
          (SELECT COUNT(*) FROM Lesson WHERE classId = c.id) as lessonCount,
          (SELECT COUNT(*) FROM Video v JOIN Lesson l ON v.lessonId = l.id WHERE l.classId = c.id) as videoCount,
          (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId = l.id WHERE l.classId = c.id) as documentCount
        FROM ClassEnrollment ce
        JOIN Class c ON ce.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE ce.userId = ?
        ORDER BY ce.createdAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'TEACHER') {
      // Get classes teacher is assigned to
      query = `
        SELECT 
          c.*,
          a.name as academyName,
          (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id AND status = 'APPROVED') as studentCount,
          (SELECT COUNT(*) FROM Lesson WHERE classId = c.id) as lessonCount,
          (SELECT COUNT(*) FROM Video v JOIN Lesson l ON v.lessonId = l.id WHERE l.classId = c.id) as videoCount,
          (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId = l.id WHERE l.classId = c.id) as documentCount,
          (SELECT ROUND(AVG(lr.rating), 1) FROM LessonRating lr JOIN Lesson l ON lr.lessonId = l.id WHERE l.classId = c.id) as avgRating
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        WHERE c.teacherId = ?
        ORDER BY c.createdAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'ACADEMY') {
      // Get classes in owned academies
      query = `
        SELECT 
          c.*,
          a.name as academyName,
          u.firstName as teacherFirstName,
          u.lastName as teacherLastName,
          (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id AND status = 'APPROVED') as studentCount,
          (SELECT COUNT(*) FROM Lesson WHERE classId = c.id) as lessonCount,
          (SELECT COUNT(*) FROM Video v JOIN Lesson l ON v.lessonId = l.id WHERE l.classId = c.id) as videoCount,
          (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId = l.id WHERE l.classId = c.id) as documentCount,
          (SELECT ROUND(AVG(lr.rating), 1) FROM LessonRating lr JOIN Lesson l ON lr.lessonId = l.id WHERE l.classId = c.id) as avgRating
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User u ON c.teacherId = u.id
        WHERE a.ownerId = ?
        ORDER BY c.createdAt DESC
      `;
      params = [session.id];
    } else {
      // Admin gets all classes
      query = `
        SELECT 
          c.*,
          a.name as academyName
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        ORDER BY c.createdAt DESC
      `;
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Classes] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// Helper function to generate a slug from a name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// POST /classes - Create a new class
classes.post('/', async (c) => {
  try {
    const session = await requireAuth(c);
    const body = await c.req.json();

    const { name, description, academyId, teacherId } = body;

    if (!name || !academyId) {
      return c.json(errorResponse('Name and academyId are required'), 400);
    }

    // Check if user has permission to create class in this academy
    let hasPermission = false;
    
    if (session.role === 'ADMIN') {
      hasPermission = true;
    } else if (session.role === 'ACADEMY') {
      // Check if user owns the academy
      const academy = await c.env.DB.prepare(
        'SELECT id FROM Academy WHERE id = ? AND ownerId = ?'
      ).bind(academyId, session.id).first();
      hasPermission = !!academy;
    } else if (session.role === 'TEACHER') {
      // Teachers can create classes in academies they belong to
      const teacher = await c.env.DB.prepare(
        'SELECT id FROM Teacher WHERE academyId = ? AND userId = ?'
      ).bind(academyId, session.id).first();
      hasPermission = !!teacher;
    }

    if (!hasPermission) {
      return c.json(errorResponse(`User ${session.id} cannot create classes in academy ${academyId}`), 403);
    }

    // Generate a unique slug
    let baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Keep checking until we find a unique slug
    while (true) {
      const existing = await c.env.DB.prepare(
        'SELECT id FROM Class WHERE slug = ?'
      ).bind(slug).first();
      
      if (!existing) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the class
    const classId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO Class (id, name, slug, description, academyId, teacherId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      classId,
      name,
      slug,
      description || null,
      academyId,
      teacherId || session.id, // Default to creator if no teacher specified
      now,
      now
    ).run();

    // Return the created class
    const created = await c.env.DB.prepare(`
      SELECT c.*, a.name as academyName
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      WHERE c.id = ?
    `).bind(classId).first();

    return c.json(successResponse(created));
  } catch (error: any) {
    console.error('[Classes POST] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /classes/:id - Get single class details
classes.get('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const classIdOrSlug = c.req.param('id');

    // Query to get class details with academy name
    const query = `
      SELECT 
        c.*,
        a.name as academyName,
        a.ownerId as academyOwnerId,
        (u.firstName || ' ' || u.lastName) as teacherName,
        u.email as teacherEmail
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      LEFT JOIN User u ON c.teacherId = u.id
      WHERE c.id = ? OR c.slug = ?
      LIMIT 1
    `;

    const classRecord = await c.env.DB.prepare(query)
      .bind(classIdOrSlug, classIdOrSlug)
      .first();

    if (!classRecord) {
      return c.json(errorResponse(`Class ${classIdOrSlug} not found`), 404);
    }

    // Check permissions
    let hasAccess = false;
    if (session.role === 'ADMIN') {
      hasAccess = true;
    } else if (session.role === 'ACADEMY') {
      // Academy owner can access their own classes
      hasAccess = classRecord.academyOwnerId === session.id;
    } else if (session.role === 'TEACHER') {
      // Teacher can access classes they teach
      hasAccess = classRecord.teacherId === session.id;
    } else if (session.role === 'STUDENT') {
      // Check if student is enrolled
      try {
        const enrollment = await c.env.DB.prepare(`
          SELECT id FROM ClassEnrollment 
          WHERE userId = ? AND classId = ? AND status = 'APPROVED'
        `).bind(session.id, classRecord.id).first();
        hasAccess = !!enrollment;
      } catch (enrollError: any) {
        console.error('[Classes/:id] Enrollment check error:', enrollError);
        return c.json(errorResponse(`Failed to verify enrollment: ${enrollError.message}`), 500);
      }
    }

    if (!hasAccess) {
      return c.json(errorResponse(`You don't have access to class ${classIdOrSlug}`), 403);
    }

    // If student, add enrollment info
    if (session.role === 'STUDENT') {
      try {
        const enrollment = await c.env.DB.prepare(`
          SELECT status, documentSigned, createdAt
          FROM ClassEnrollment 
          WHERE userId = ? AND classId = ?
        `).bind(session.id, classRecord.id).first();
        
        if (enrollment) {
          (classRecord as any).enrollmentStatus = enrollment.status;
          (classRecord as any).documentSigned = enrollment.documentSigned;
        }
      } catch (enrollError: any) {
        console.error('[Classes/:id] Enrollment info fetch error:', enrollError);
        // Don't fail here, just log and continue without enrollment info
      }
    }

    // For TEACHER and ACADEMY roles, add enrollments list
    if (session.role === 'TEACHER' || session.role === 'ACADEMY' || session.role === 'ADMIN') {
      try {
        const enrollmentsResult = await c.env.DB.prepare(`
          SELECT 
            ce.id, ce.status, ce.enrolledAt, ce.createdAt,
            u.id as studentId, u.firstName, u.lastName, u.email
          FROM ClassEnrollment ce
          JOIN User u ON ce.userId = u.id
          WHERE ce.classId = ?
          ORDER BY ce.createdAt DESC
        `).bind(classRecord.id).all();
        
        // Transform to expected format with nested student object
        (classRecord as any).enrollments = (enrollmentsResult.results || []).map((e: any) => ({
          id: e.id,
          status: e.status,
          enrolledAt: e.enrolledAt || e.createdAt,
          student: {
            id: e.studentId,
            firstName: e.firstName,
            lastName: e.lastName,
            email: e.email
          }
        }));
      } catch (enrollError: any) {
        console.error('[Classes/:id] Enrollments fetch error:', enrollError);
        // Don't fail, just set empty array
        (classRecord as any).enrollments = [];
      }
    }

    return c.json(successResponse(classRecord));
  } catch (error: any) {
    console.error('[Classes/:id] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PATCH /classes/:id - Update class details
classes.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const classId = c.req.param('id');
    const body = await c.req.json();

    // Get class to check permissions
    const classRecord = await c.env.DB.prepare(`
      SELECT c.*, a.ownerId 
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      WHERE c.id = ?
    `).bind(classId).first();

    if (!classRecord) {
      return c.json(errorResponse(`Class ${classId} not found`), 404);
    }

    // Only ACADEMY owner or ADMIN can update
    if (session.role !== 'ADMIN' && !(session.role === 'ACADEMY' && classRecord.ownerId === session.id)) {
      return c.json(errorResponse('Only academy owners can update class details'), 403);
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      params.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      params.push(body.description);
    }
    if (body.teacherId !== undefined) {
      updates.push('teacherId = ?');
      params.push(body.teacherId);
    }
    if (body.slug !== undefined) {
      updates.push('slug = ?');
      params.push(body.slug);
    }

    if (updates.length === 0) {
      return c.json(errorResponse('No fields to update'), 400);
    }

    params.push(classId);
    const query = `UPDATE Class SET ${updates.join(', ')} WHERE id = ?`;
    
    await c.env.DB.prepare(query).bind(...params).run();

    // Return updated class
    const updated = await c.env.DB.prepare(`
      SELECT c.*, a.name as academyName
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      WHERE c.id = ?
    `).bind(classId).first();

    return c.json(successResponse(updated));
  } catch (error: any) {
    console.error('[Classes/:id PATCH] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default classes;
