import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { getDB } from '@/lib/db';

// GET: List teachers for a specific academy
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(['STUDENT', 'ADMIN', 'ACADEMY']);
    const db = await getDB();
    const { id: academyId } = params;

    const teachers = await db
      .prepare(`
        SELECT 
          u.id,
          (u.firstName || ' ' || u.lastName) as name,
          u.email,
          m.status,
          (SELECT COUNT(*) FROM Class c WHERE c.teacherId = u.id AND c.academyId = ?) as classCount
        FROM users u
        JOIN AcademyMembership m ON u.id = m.userId
        WHERE m.academyId = ? AND m.status = 'APPROVED'
        ORDER BY u.firstName
      `)
      .bind(academyId, academyId)
      .all();

    return Response.json(teachers.results || []);
  } catch (error) {
    return handleApiError(error);
  }
}
