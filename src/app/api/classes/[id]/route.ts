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

    const classData = await classQueries.findWithAcademyAndCounts(id) as any;

    if (!classData) {
      return errorResponse('Class not found', 404);
    }

    // Check access permissions
    if (session.role === 'TEACHER') {
      // Teachers can only access classes in their academies
      const db = await (await import('@/lib/db')).getDB();
      const membership = await db
        .prepare('SELECT id FROM AcademyMembership WHERE userId = ? AND academyId = ?')
        .bind(session.id, classData.academyId)
        .first();

      if (!membership) {
        return errorResponse('Forbidden', 403);
      }
    } else if (session.role === 'STUDENT') {
      // Students can only access classes they're enrolled in
      const enrollment = await enrollmentQueries.findByClassAndStudent(id, session.id);

      if (!enrollment) {
        return errorResponse('Forbidden - not enrolled in this class', 403);
      }
    }
    // Admins can access all classes

    // Get videos, documents, and enrollments
    const videos = await videoQueries.findByClass(id);
    const documents = await documentQueries.findByClass(id);
    const enrollments = await enrollmentQueries.findByClassWithStudent(id);

    return Response.json(successResponse({
      ...classData,
      videos,
      documents,
      enrollments,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
