import { classQueries, teacherQueries } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { z } from 'zod';
import { getDB } from '@/lib/db';

const createClassSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  academyId: z.string(),
});

export async function POST(request: Request) {
  try {
    // Only ACADEMY role can create classes (teachers cannot)
    const session = await requireRole(['ACADEMY', 'ADMIN']);
    const body = await request.json();
    const data = createClassSchema.parse(body);

    // For ACADEMY role, verify they own this academy
    if (session.role === 'ACADEMY') {
      const db = await getDB();
      const ownsAcademy = await db
        .prepare('SELECT 1 FROM Academy WHERE ownerId = ? AND id = ?')
        .bind(session.id, data.academyId)
        .first();

      if (!ownsAcademy) {
        return errorResponse('You do not own this academy', 403);
      }
    }

    // teacherId must be provided by the academy
    const classRecord = await classQueries.create({
      name: data.name,
      description: data.description,
      academyId: data.academyId,
      teacherId: body.teacherId || null, // Academy must specify the teacher
    });

    const db = await getDB();
    const academy = await db.prepare('SELECT * FROM Academy WHERE id = ?').bind(data.academyId).first();
    return Response.json(successResponse({ ...classRecord, academy }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'STUDENT', 'ACADEMY']);
    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId');

    console.log('[API /api/classes] GET request by user:', session.id, 'role:', session.role, 'academyId:', academyId);

    let classes;

    if (session.role === 'STUDENT') {
      // Students see only enrolled classes
      console.log('[API /api/classes] Fetching classes for student...');
      classes = await classQueries.findByStudentEnrollment(session.id);
    } else if (session.role === 'TEACHER') {
      // Teachers see classes in their academies
      console.log('[API /api/classes] Fetching classes for teacher...');
      classes = await classQueries.findByTeacher(session.id, academyId || undefined);
    } else if (session.role === 'ACADEMY') {
      // Academy owners see all classes in their academies
      console.log('[API /api/classes] Fetching classes for academy owner...');
      classes = await classQueries.findByAcademyOwner(session.id);
    } else {
      // Admin sees all classes
      console.log('[API /api/classes] Fetching classes for admin...');
      classes = await classQueries.findByTeacher(session.id, academyId || undefined);
    }

    console.log('[API /api/classes] Found', classes?.length || 0, 'classes');
    return Response.json(successResponse(classes));
  } catch (error) {
    console.error('[API /api/classes] Error:', error);
    return handleApiError(error);
  }
}
