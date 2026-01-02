import { classQueries, videoQueries, documentQueries, enrollmentQueries } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    console.log('[API /api/classes/[id]] GET request for class:', id, 'by user:', session.id, 'role:', session.role);

    // Try to find by ID first, then by slug
    let classData = await classQueries.findWithAcademyAndCounts(id) as any;
    
    if (!classData) {
      // Try finding by slug
      const db = await (await import('@/lib/db')).getDB();
      const classRow = await db
        .prepare('SELECT id FROM Class WHERE slug = ?')
        .bind(id)
        .first() as any;
      
      if (classRow) {
        classData = await classQueries.findWithAcademyAndCounts(classRow.id) as any;
      }
    }

    if (!classData) {
      console.log('[API /api/classes/[id]] Class not found:', id);
      return errorResponse('Class not found', 404);
    }

    console.log('[API /api/classes/[id]] Class found:', classData.name);

    // Check access permissions
    if (session.role === 'TEACHER') {
      // Teachers can only access classes in their academies (via Teacher table)
      const db = await (await import('@/lib/db')).getDB();
      const teacher = await db
        .prepare('SELECT id FROM Teacher WHERE userId = ? AND academyId = ?')
        .bind(session.id, classData.academyId)
        .first();

      if (!teacher) {
        console.log('[API /api/classes/[id]] Teacher not member of academy');
        return errorResponse('Forbidden', 403);
      }
    } else if (session.role === 'ACADEMY') {
      // Academy owners can only access classes in their academies
      const db = await (await import('@/lib/db')).getDB();
      const ownsAcademy = await db
        .prepare('SELECT 1 FROM Teacher WHERE userId = ? AND academyId = ?')
        .bind(session.id, classData.academyId)
        .first();

      if (!ownsAcademy) {
        console.log('[API /api/classes/[id]] Academy does not own this class');
        return errorResponse('Forbidden', 403);
      }
    } else if (session.role === 'STUDENT') {
      // Students can only access classes they're enrolled in
      const enrollment = await enrollmentQueries.findByClassAndStudent(classData.id, session.id) as any;

      if (!enrollment) {
        console.log('[API /api/classes/[id]] Student not enrolled in class');
        return errorResponse('Forbidden - not enrolled in this class', 403);
      }
      
      // Add enrollment status to class data for frontend
      classData.enrollmentStatus = enrollment.status;
    }
    // Admins can access all classes

    // Get videos, documents, and enrollments via lessons (not direct classId)
    console.log('[API /api/classes/[id]] Fetching videos and documents...');
    let videos = [];
    let documents = [];
    try {
      videos = await videoQueries.findByClass(classData.id);
      console.log('[API /api/classes/[id]] Found', videos.length, 'videos');
    } catch (err) {
      console.error('[API /api/classes/[id]] Error fetching videos:', err);
    }
    
    try {
      documents = await documentQueries.findByClass(classData.id);
      console.log('[API /api/classes/[id]] Found', documents.length, 'documents');
    } catch (err) {
      console.error('[API /api/classes/[id]] Error fetching documents:', err);
    }
    
    const enrollments = await enrollmentQueries.findByClassWithStudent(classData.id);
    console.log('[API /api/classes/[id]] Found', enrollments.length, 'enrollments');

    console.log('[API /api/classes/[id]] Returning successful response');
    return Response.json(successResponse({
      ...classData,
      videos,
      documents,
      enrollments,
    }));
  } catch (error) {
    console.error('[API /api/classes/[id]] Error:', error);
    return handleApiError(error);
  }
}

// PUT: Academy can update class (change teacher assignment, name, description)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    
    // Only ACADEMY role can update classes
    if (session.role !== 'ACADEMY' && session.role !== 'ADMIN') {
      return errorResponse('Only academies can update classes', 403);
    }

    const db = await (await import('@/lib/db')).getDB();
    
    // Get the class
    const classData = await classQueries.findById(id) as any;
    if (!classData) {
      return errorResponse('Class not found', 404);
    }

    // Verify the academy owns this class (via Teacher table)
    if (session.role === 'ACADEMY') {
      const ownsAcademy = await db
        .prepare('SELECT 1 FROM Teacher WHERE userId = ? AND academyId = ?')
        .bind(session.id, classData.academyId)
        .first();

      if (!ownsAcademy) {
        return errorResponse('You do not own this academy', 403);
      }
    }

    // If changing teacher, verify the new teacher belongs to this academy
    if (body.teacherId) {
      const teacher = await db
        .prepare('SELECT * FROM Teacher WHERE userId = ? AND academyId = ?')
        .bind(body.teacherId, classData.academyId)
        .first();

      if (!teacher) {
        return errorResponse('This teacher does not belong to your academy', 400);
      }
    }

    // Update the class
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    if (body.teacherId !== undefined) {
      updates.push('teacherId = ?');
      values.push(body.teacherId);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(new Date().toISOString());
      values.push(id);

      await db.prepare(`
        UPDATE Class SET ${updates.join(', ')} WHERE id = ?
      `).bind(...values).run();
    }

    // Return updated class with teacher info
    const updatedClass = await db.prepare(`
      SELECT c.*, (u.firstName || ' ' || u.lastName) as teacherName, u.email as teacherEmail
      FROM Class c
      LEFT JOIN User u ON c.teacherId = u.id
      WHERE c.id = ?
    `).bind(id).first();

    return Response.json(successResponse(updatedClass));
  } catch (error) {
    console.error('[API /api/classes/[id]] PUT Error:', error);
    return handleApiError(error);
  }
}
