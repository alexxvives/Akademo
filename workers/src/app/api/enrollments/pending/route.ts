import { enrollmentQueries, classQueries, getDB } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const session = await requireRole(['TEACHER', 'ACADEMY']);
    
    // Get pending enrollments for classes this teacher/academy can manage
    if (session.role === 'ACADEMY') {
      // For academy owners, get all pending enrollments for classes in their academies
      const db = await getDB();
      const academies = await db
        .prepare('SELECT id FROM Academy WHERE ownerId = ?')
        .bind(session.id)
        .all();
      
      const academyIds = (academies.results || []).map((a: any) => a.id);
      
      if (academyIds.length === 0) {
        return Response.json(successResponse([]));
      }
      
      const query = `
        SELECT 
          e.id,
          e.userId,
          e.classId,
          e.status,
          e.enrolledAt,
          u.firstName,
          u.lastName,
          u.email,
          c.name as className,
          c.teacherId,
          t.firstName as teacherFirstName,
          t.lastName as teacherLastName
        FROM ClassEnrollment e
        JOIN User u ON e.userId = u.id
        JOIN Class c ON e.classId = c.id
        LEFT JOIN User t ON c.teacherId = t.id
        WHERE e.status = 'PENDING'
          AND c.academyId IN (${academyIds.map(() => '?').join(',')})
        ORDER BY e.enrolledAt DESC
      `;
      
      const result = await db.prepare(query).bind(...academyIds).all();
      const rows = result.results || [];
      
      const formatted = rows.map((row: any) => ({
        id: row.id,
        student: {
          id: row.userId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email
        },
        class: {
          id: row.classId,
          name: row.className,
          teacherId: row.teacherId,
          teacherName: row.teacherFirstName && row.teacherLastName 
            ? `${row.teacherFirstName} ${row.teacherLastName}` 
            : 'Sin asignar'
        },
        enrolledAt: row.enrolledAt,
        createdAt: row.enrolledAt
      }));
      
      return Response.json(successResponse(formatted));
    }
    
    // For teachers
    const pendingEnrollments = await enrollmentQueries.findPendingByTeacher(session.id);

    return Response.json(successResponse(pendingEnrollments));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(['TEACHER', 'ADMIN', 'ACADEMY']);
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
    } else if (session.role === 'ACADEMY') {
      // Check if academy owns the class
      const classData = await classQueries.findWithAcademyAndCounts(enrollment.classId) as any;
      if (!classData) {
        return errorResponse('Class not found', 404);
      }
      
      const db = await getDB();
      const academyCheck = await db
        .prepare('SELECT academyId FROM Class WHERE id = ?')
        .bind(enrollment.classId)
        .first() as any;
      
      if (!academyCheck?.academyId) {
        return errorResponse('Class not found in any academy', 404);
      }
      
      const ownerCheck = await db
        .prepare('SELECT ownerId FROM Academy WHERE id = ?')
        .bind(academyCheck.academyId)
        .first() as any;
      
      if (ownerCheck?.ownerId !== session.id) {
        return errorResponse('Not authorized to manage this academy', 403);
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
