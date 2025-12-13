import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { getDB } from '@/lib/db';
import { z } from 'zod';

const requestSchema = z.object({
  academyId: z.string(),
  teacherId: z.string(),
  message: z.string().optional(),
});

// POST: Student requests to join a teacher
export async function POST(request: Request) {
  try {
    const session = await requireRole(['STUDENT']);
    const body = await request.json();
    const data = requestSchema.parse(body);
    const db = await getDB();

    // Get a class from the teacher to enroll in (or create a dummy enrollment request)
    const teacherClass = await db
      .prepare(`
        SELECT id FROM Class 
        WHERE teacherId = ? AND academyId = ? 
        LIMIT 1
      `)
      .bind(data.teacherId, data.academyId)
      .first<{ id: string }>();

    if (!teacherClass) {
      return Response.json(
        { error: 'Teacher has no classes in this academy' },
        { status: 400 }
      );
    }

    // Create enrollment request
    const enrollmentId = `enr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db
      .prepare(`
        INSERT INTO ClassEnrollment (id, userId, classId, status, requestedAt, createdAt, updatedAt)
        VALUES (?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      .bind(enrollmentId, session.id, teacherClass.id)
      .run();

    return Response.json({ 
      success: true, 
      message: 'Request sent to teacher',
      enrollmentId 
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
