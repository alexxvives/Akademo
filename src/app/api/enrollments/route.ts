import { enrollmentQueries, classQueries } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { z } from 'zod';

const enrollSchema = z.object({
  classId: z.string(),
  studentId: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole(['TEACHER', 'ADMIN']);
    const body = await request.json();
    const data = enrollSchema.parse(body);

    // Verify class ownership (unless admin)
    if (session.role !== 'ADMIN') {
      const classRecord = await classQueries.findWithAcademyAndCounts(data.classId) as any;

      if (!classRecord || classRecord.academy.ownerId !== session.id) {
        return errorResponse('Forbidden', 403);
      }
    }

    // Check if already enrolled
    const existing = await enrollmentQueries.findByClassAndStudent(data.classId, data.studentId);

    if (existing) {
      return errorResponse('Student already enrolled');
    }

    // Create enrollment
    const enrollment = await enrollmentQueries.create({
      classId: data.classId,
      studentId: data.studentId,
    });

    return Response.json(successResponse(enrollment), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return errorResponse('Class ID required');
    }

    // Teachers can view enrollments from classes in their academy
    if (session.role === 'TEACHER') {
      const classRecord = await classQueries.findWithAcademyAndCounts(classId) as any;
      
      if (!classRecord) {
        return errorResponse('Class not found', 404);
      }

      // Verify teacher is member of the class's academy
      const db = await (await import('@/lib/db')).getDB();
      const membership = await db
        .prepare('SELECT id FROM AcademyMembership WHERE userId = ? AND academyId = ?')
        .bind(session.id, classRecord.academyId)
        .first();

      if (!membership) {
        return errorResponse('Forbidden', 403);
      }
    }

    const enrollments = await enrollmentQueries.findByClassWithStudent(classId);

    return Response.json(successResponse(enrollments));
  } catch (error) {
    return handleApiError(error);
  }
}
