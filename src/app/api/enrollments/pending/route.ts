import { enrollmentQueries, classQueries, getDB } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const session = await requireRole(['TEACHER']);
    
    // Get pending enrollments for classes this teacher can manage
    const pendingEnrollments = await enrollmentQueries.findPendingByTeacher(session.id);

    return Response.json(successResponse(pendingEnrollments));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(['TEACHER', 'ADMIN']);
    const body = await request.json();
    const { enrollmentId, action } = body;

    if (!enrollmentId || !action) {
      return errorResponse('Enrollment ID and action are required');
    }

    if (!['approve', 'reject'].includes(action)) {
      return errorResponse('Action must be "approve" or "reject"');
    }

    // Get the enrollment
    const enrollment = await enrollmentQueries.findById(enrollmentId) as any;
    if (!enrollment) {
      return errorResponse('Enrollment not found', 404);
    }

    // Check authorization
    if (session.role === 'TEACHER') {
      const classData = await classQueries.findWithAcademyAndCounts(enrollment.classId) as any;
      if (!classData) {
        return errorResponse('Class not found', 404);
      }
      
      const db = await getDB();
      const teacherCheck = await db
        .prepare('SELECT teacherId FROM Class WHERE id = ?')
        .bind(enrollment.classId)
        .first() as any;
      
      if (teacherCheck?.teacherId !== session.id) {
        return errorResponse('Not authorized to manage this class', 403);
      }
    }

    // Update status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    await enrollmentQueries.updateStatus(enrollmentId, newStatus);

    return Response.json(successResponse({
      message: action === 'approve' ? 'Estudiante aprobado' : 'Solicitud rechazada',
      status: newStatus,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
