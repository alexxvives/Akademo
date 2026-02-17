import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { validateBody, createClassSchema, updateClassSchema } from '../lib/validation';

const classes = new Hono<{ Bindings: Bindings }>();

// GET /classes - Get user's classes
classes.get('/', async (c) => {
  try {
    const academyIdParam = c.req.query('academyId'); // For public/signup filtering
    
    // If academyId is provided, return classes for that academy (public access for signup)
    if (academyIdParam) {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.academyId,
          u.firstName || ' ' || u.lastName as teacherName,
          (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id AND STATUS = 'APPROVED') as studentCount,
          (SELECT COUNT(*) FROM Lesson WHERE classId = c.id) as lessonCount
        FROM Class c
        LEFT JOIN User u ON c.teacherId = u.id
        WHERE c.academyId = ?
        ORDER BY c.name ASC
      `;
      const result = await c.env.DB.prepare(query).bind(academyIdParam).all();
      return c.json(successResponse(result.results || []));
    }

    const session = await requireAuth(c);

    let query = '';
    let params: any[] = [];

    if (session.role === 'STUDENT') {
      // Get enrolled classes with counts and payment status (latest payment only)
      query = `
        SELECT 
          c.id, c.name, c.slug, c.description, c.academyId, c.teacherId, c.createdAt, 
          a.feedbackEnabled, c.whatsappGroupLink, c.monthlyPrice, c.oneTimePrice, c.zoomAccountId, c.maxStudents, c.startDate,
          c.university, c.carrera,
          a.name as academyName,
          u.firstName as teacherFirstName,
          u.lastName as teacherLastName,
          ce.status as enrollmentStatus,
          ce.documentSigned,
          p.status as paymentStatus,
          p.paymentMethod,
          (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id AND STATUS = 'APPROVED') as studentCount,
          (SELECT COUNT(*) FROM Lesson WHERE classId = c.id) as lessonCount,
          (SELECT COUNT(*) FROM Video v JOIN Lesson l ON v.lessonId = l.id WHERE l.classId = c.id) as videoCount,
          (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId = l.id WHERE l.classId = c.id) as documentCount
        FROM ClassEnrollment ce
        JOIN Class c ON ce.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN Payment p ON p.id = (
          SELECT id FROM Payment 
          WHERE payerId = ce.userId AND classId = c.id 
          ORDER BY createdAt DESC 
          LIMIT 1
        )
        WHERE ce.userId = ? AND ce.status != 'WITHDRAWN'
        ORDER BY ce.enrolledAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'TEACHER') {
      // Get classes teacher is assigned to
      query = `
        SELECT 
          c.id, c.name, c.slug, c.description, c.academyId, c.teacherId, c.createdAt, 
          a.feedbackEnabled, c.whatsappGroupLink, c.monthlyPrice, c.oneTimePrice, c.zoomAccountId, c.maxStudents, c.startDate,
          c.university, c.carrera,
          a.name as academyName,
          za.accountName as zoomAccountName,
          (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id AND status = 'APPROVED') as studentCount,
          (SELECT COUNT(*) FROM Lesson WHERE classId = c.id) as lessonCount,
          (SELECT COUNT(*) FROM Video v JOIN Lesson l ON v.lessonId = l.id WHERE l.classId = c.id) as videoCount,
          (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId = l.id WHERE l.classId = c.id) as documentCount,
          (SELECT ROUND(AVG(lr.rating), 1) FROM LessonRating lr JOIN Lesson l ON lr.lessonId = l.id WHERE l.classId = c.id) as avgRating
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN ZoomAccount za ON c.zoomAccountId = za.id
        WHERE c.teacherId = ?
        ORDER BY c.createdAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'ACADEMY') {
      // Get classes in owned academies
      query = `
        SELECT 
          c.id, c.name, c.slug, c.description, c.academyId, c.teacherId, c.createdAt, 
          a.feedbackEnabled, c.whatsappGroupLink, c.monthlyPrice, c.oneTimePrice, c.zoomAccountId, c.maxStudents, c.startDate,
          c.university, c.carrera,
          a.name as academyName,
          u.firstName as teacherFirstName,
          u.lastName as teacherLastName,
          za.accountName as zoomAccountName,
          (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id AND status = 'APPROVED') as studentCount,
          (SELECT COUNT(*) FROM Lesson WHERE classId = c.id) as lessonCount,
          (SELECT COUNT(*) FROM Video v JOIN Lesson l ON v.lessonId = l.id WHERE l.classId = c.id) as videoCount,
          (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId = l.id WHERE l.classId = c.id) as documentCount,
          (SELECT ROUND(AVG(lr.rating), 1) FROM LessonRating lr JOIN Lesson l ON lr.lessonId = l.id WHERE l.classId = c.id) as avgRating
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN ZoomAccount za ON c.zoomAccountId = za.id
        WHERE a.ownerId = ?
        ORDER BY c.createdAt DESC
      `;
      params = [session.id];
    } else {
      // Admin gets all classes
      query = `
        SELECT 
          c.id, c.name, c.slug, c.description, c.academyId, c.teacherId, c.createdAt, 
          a.feedbackEnabled, c.whatsappGroupLink, c.monthlyPrice, c.oneTimePrice, c.zoomAccountId, c.maxStudents, c.startDate,
          c.university, c.carrera,
          a.name as academyName
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        ORDER BY c.createdAt DESC
      `;
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();
    let classes = result.results || [];

    // For students: calculate firstPaymentAmount for classes with monthly pricing
    if (session.role === 'STUDENT') {
      classes = classes.map((classData: any) => {
        // Calculate for classes that aren't fully paid and have monthly pricing
        const needsBillingCalc = classData.paymentStatus !== 'PAID' 
                                && classData.paymentStatus !== 'COMPLETED'
                                && classData.monthlyPrice 
                                && classData.startDate;
        
        if (needsBillingCalc) {
          const classStart = new Date(classData.startDate);
          const today = new Date();
          
          // Calculate elapsed cycles (same logic as in payments.ts)
          let months = (today.getFullYear() - classStart.getFullYear()) * 12
                     + (today.getMonth() - classStart.getMonth());
          if (today.getDate() < classStart.getDate()) {
            months = Math.max(0, months - 1);
          }
          const elapsedCycles = Math.max(1, months + 1); // At least 1 cycle
          
          // First payment includes catch-up for all elapsed cycles
          const firstPaymentAmount = elapsedCycles * classData.monthlyPrice;
          
          return {
            ...classData,
            firstPaymentAmount,
            missedCycles: elapsedCycles
          };
        }
        return classData;
      });
    }

    return c.json(successResponse(classes));
  } catch (error: any) {
    console.error('[Classes GET] Error:', error);
    console.error('[Classes GET] Error message:', error.message);
    console.error('[Classes GET] Error stack:', error.stack);
    return c.json(errorResponse('Internal server error'), 500);
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
classes.post('/', validateBody(createClassSchema), async (c) => {
  try {
    const session = await requireAuth(c);
    const body = await c.req.json();
    const { name, description, academyId, teacherId, whatsappGroupLink, university, carrera } = body;

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
      INSERT INTO Class (id, name, slug, description, academyId, teacherId, whatsappGroupLink, zoomAccountId, 
                         monthlyPrice, oneTimePrice, createdAt, university, carrera)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      classId,
      name,
      slug,
      description || null,
      academyId,
      teacherId || session.id, // Default to creator if no teacher specified
      whatsappGroupLink || null,
      body.zoomAccountId || null,
      body.monthlyPrice || null,
      body.oneTimePrice || null,
      now,
      university || null,
      carrera || null
    ).run();

    // Return the created class
    const created = await c.env.DB.prepare(`
      SELECT 
        c.id, c.name, c.slug, c.description, c.academyId, c.teacherId, c.createdAt, 
        a.feedbackEnabled, c.whatsappGroupLink, c.monthlyPrice, c.oneTimePrice, c.zoomAccountId, c.maxStudents, c.startDate,
        c.university, c.carrera,
        a.name as academyName
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      WHERE c.id = ?
    `).bind(classId).first();

    return c.json(successResponse(created));
  } catch (error: any) {
    console.error('[Classes POST] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
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
        c.id, c.name, c.slug, c.description, c.academyId, c.teacherId, c.createdAt, 
        a.feedbackEnabled, c.whatsappGroupLink, c.monthlyPrice, c.oneTimePrice, c.zoomAccountId, c.maxStudents, c.startDate,
        c.university, c.carrera,
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
      // Students can view basic class details (for enrollment/payment)
      // But check if they're enrolled to return enrollment-specific info
      hasAccess = true; // Allow students to see class details
      try {
        const enrollment = await c.env.DB.prepare(`
          SELECT id, status, documentSigned, enrolledAt
          FROM ClassEnrollment 
          WHERE userId = ? AND classId = ?
        `).bind(session.id, classRecord.id).first();
        
        if (enrollment) {
          // Student is enrolled - add enrollment status
          (classRecord as any).isEnrolled = true;
          (classRecord as any).enrollmentStatus = enrollment.status;
          (classRecord as any).documentSigned = enrollment.documentSigned;
        } else {
          // Student is not enrolled - mark as such
          (classRecord as any).isEnrolled = false;
        }
      } catch (enrollError: unknown) {
        console.error('[Classes/:id] Enrollment check error:', enrollError);
        return c.json(errorResponse('Failed to verify enrollment'), 500);
      }
    }

    if (!hasAccess) {
      return c.json(errorResponse(`You don't have access to class ${classIdOrSlug}`), 403);
    }

    // Students already have enrollment info added above
    
    // For TEACHER and ACADEMY roles, add enrollments list
    if (session.role === 'TEACHER' || session.role === 'ACADEMY' || session.role === 'ADMIN') {
      try {
        const enrollmentsResult = await c.env.DB.prepare(`
          SELECT 
            ce.id, ce.status, ce.enrolledAt,
            u.id as studentId, u.firstName, u.lastName, u.email, u.lastLoginAt
          FROM ClassEnrollment ce
          JOIN User u ON ce.userId = u.id
          WHERE ce.classId = ?
          ORDER BY ce.enrolledAt DESC
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
            email: e.email,
            lastLoginAt: e.lastLoginAt
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
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PATCH /classes/:id - Update class details
classes.patch('/:id', validateBody(updateClassSchema), async (c) => {
  try {
    const session = await requireAuth(c);
    const classId = c.req.param('id');
    const body = await c.req.json();

    // Get class to check permissions
    const classRecord = await c.env.DB.prepare(`
      SELECT 
        c.id, c.name, c.slug, c.description, c.academyId, c.teacherId, c.createdAt, 
        a.feedbackEnabled, c.whatsappGroupLink, c.monthlyPrice, c.oneTimePrice, c.zoomAccountId, c.maxStudents, c.startDate,
        a.ownerId 
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
    if (body.whatsappGroupLink !== undefined) {
      updates.push('whatsappGroupLink = ?');
      params.push(body.whatsappGroupLink);
    }
    if (body.zoomAccountId !== undefined) {
      updates.push('zoomAccountId = ?');
      params.push(body.zoomAccountId);
    }
    if (body.monthlyPrice !== undefined) {
      updates.push('monthlyPrice = ?');
      params.push(body.monthlyPrice || null);
    }
    if (body.oneTimePrice !== undefined) {
      updates.push('oneTimePrice = ?');
      params.push(body.oneTimePrice || null);
    }
    if (body.maxStudents !== undefined) {
      updates.push('maxStudents = ?');
      params.push(body.maxStudents === '' || body.maxStudents === null ? null : body.maxStudents);
    }
    if (body.startDate !== undefined) {
      updates.push('startDate = ?');
      params.push(body.startDate || null);
    }
    if (body.university !== undefined) {
      updates.push('university = ?');
      params.push(body.university || null);
    }
    if (body.carrera !== undefined) {
      updates.push('carrera = ?');
      params.push(body.carrera || null);
    }

    if (updates.length === 0) {
      return c.json(errorResponse('No fields to update'), 400);
    }

    params.push(classId);
    const query = `UPDATE Class SET ${updates.join(', ')} WHERE id = ?`;
    
    await c.env.DB.prepare(query).bind(...params).run();

    // Return updated class
    const updated = await c.env.DB.prepare(`
      SELECT 
        c.id, c.name, c.slug, c.description, c.academyId, c.teacherId, c.createdAt, 
        a.feedbackEnabled, c.whatsappGroupLink, c.zoomAccountId, c.maxStudents, c.startDate,
        c.monthlyPrice, c.oneTimePrice,
        c.university, c.carrera,
        a.name as academyName
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      WHERE c.id = ?
    `).bind(classId).first();

    return c.json(successResponse(updated));
  } catch (error: any) {
    console.error('[Classes/:id PATCH] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// DELETE /classes/:id - Delete a class (ACADEMY owner or ADMIN only)
classes.delete('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const classId = c.req.param('id');

    // Get class to check permissions
    const classRecord = await c.env.DB.prepare(`
      SELECT c.id, c.name, a.ownerId 
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      WHERE c.id = ?
    `).bind(classId).first() as any;

    if (!classRecord) {
      return c.json(errorResponse(`Class ${classId} not found`), 404);
    }

    // Only ACADEMY owner or ADMIN can delete
    if (session.role !== 'ADMIN' && !(session.role === 'ACADEMY' && classRecord.ownerId === session.id)) {
      return c.json(errorResponse('Only academy owners can delete classes'), 403);
    }

    // 0. Fetch all video bunnyGuids before deleting from DB (to clean Bunny CDN)
    const videosToDelete = await c.env.DB.prepare(`
      SELECT u.bunnyGuid
      FROM Video v
      JOIN Upload u ON v.uploadId = u.id
      JOIN Lesson l ON v.lessonId = l.id
      WHERE l.classId = ? AND u.bunnyGuid IS NOT NULL
    `).bind(classId).all();

    // Delete videos from Bunny CDN
    const apiKey = c.env.BUNNY_STREAM_API_KEY;
    const libraryId = c.env.BUNNY_STREAM_LIBRARY_ID;
    if (apiKey && libraryId) {
      for (const row of (videosToDelete.results || [])) {
        const bunnyGuid = (row as any).bunnyGuid;
        if (bunnyGuid) {
          try {
            const resp = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${bunnyGuid}`, {
              method: 'DELETE',
              headers: { 'AccessKey': apiKey },
            });
            if (!resp.ok) {
              console.error(`[Delete Class] Failed to delete Bunny video ${bunnyGuid}:`, await resp.text());
            }
          } catch (err) {
            console.error(`[Delete Class] Error deleting Bunny video ${bunnyGuid}:`, err);
          }
        }
      }
    }

    // Delete related data in order (foreign key constraints)
    // 1. Delete video play states
    await c.env.DB.prepare(`
      DELETE FROM VideoPlayState WHERE videoId IN (
        SELECT v.id FROM Video v 
        JOIN Lesson l ON v.lessonId = l.id 
        WHERE l.classId = ?
      )
    `).bind(classId).run();

    // 2. Delete videos from DB
    await c.env.DB.prepare(`
      DELETE FROM Video WHERE lessonId IN (
        SELECT id FROM Lesson WHERE classId = ?
      )
    `).bind(classId).run();

    // 3. Delete documents
    await c.env.DB.prepare(`
      DELETE FROM Document WHERE lessonId IN (
        SELECT id FROM Lesson WHERE classId = ?
      )
    `).bind(classId).run();

    // 4. Delete lesson ratings
    await c.env.DB.prepare(`
      DELETE FROM LessonRating WHERE lessonId IN (
        SELECT id FROM Lesson WHERE classId = ?
      )
    `).bind(classId).run();

    // 5. Delete assignment submissions (Assignment uses classId, not lessonId)
    await c.env.DB.prepare(`
      DELETE FROM AssignmentSubmission WHERE assignmentId IN (
        SELECT id FROM Assignment WHERE classId = ?
      )
    `).bind(classId).run();

    // 6. Delete assignment attachments
    await c.env.DB.prepare(`
      DELETE FROM AssignmentAttachment WHERE assignmentId IN (
        SELECT id FROM Assignment WHERE classId = ?
      )
    `).bind(classId).run();

    // 7. Delete assignments
    await c.env.DB.prepare('DELETE FROM Assignment WHERE classId = ?').bind(classId).run();

    // 8. Delete topics
    await c.env.DB.prepare('DELETE FROM Topic WHERE classId = ?').bind(classId).run();

    // 9. Delete lessons
    await c.env.DB.prepare('DELETE FROM Lesson WHERE classId = ?').bind(classId).run();

    // 10. Delete enrollments
    await c.env.DB.prepare('DELETE FROM ClassEnrollment WHERE classId = ?').bind(classId).run();

    // 11. Delete notifications (data is JSON, filter by classId inside)
    try {
      await c.env.DB.prepare(`DELETE FROM Notification WHERE json_extract(data, '$.classId') = ?`).bind(classId).run();
    } catch { /* Notification cleanup is best-effort */ }

    // 12. Delete payments for this class
    try {
      await c.env.DB.prepare('DELETE FROM Payment WHERE classId = ?').bind(classId).run();
    } catch { /* Payment cleanup is best-effort */ }

    // 13. Delete live streams
    await c.env.DB.prepare('DELETE FROM LiveStream WHERE classId = ?').bind(classId).run();

    // 14. Finally delete the class itself
    await c.env.DB.prepare('DELETE FROM Class WHERE id = ?').bind(classId).run();

    return c.json(successResponse({ deleted: true, className: classRecord.name }));
  } catch (error: any) {
    console.error('[Classes/:id DELETE] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default classes;
