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
      // Teachers can only access classes in their academies
      const db = await (await import('@/lib/db')).getDB();
      const membership = await db
        .prepare('SELECT id FROM AcademyMembership WHERE userId = ? AND academyId = ?')
        .bind(session.id, classData.academyId)
        .first();

      if (!membership) {
        console.log('[API /api/classes/[id]] Teacher not member of academy');
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
