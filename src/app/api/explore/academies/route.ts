import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { getDB } from '@/lib/db';

// GET: List all academies (for students to explore)
export async function GET(request: Request) {
  try {
    const session = await requireRole(['STUDENT', 'TEACHER', 'ADMIN', 'ACADEMY']);
    const db = await getDB();

    const academies = await db
      .prepare(`
        SELECT 
          a.id,
          a.name,
          a.description,
          (u.firstName || ' ' || u.lastName) as ownerName,
          (SELECT COUNT(*) FROM AcademyMembership m WHERE m.academyId = a.id AND m.status = 'APPROVED') as teacherCount
        FROM Academy a
        JOIN User u ON a.ownerId = u.id
        ORDER BY a.createdAt DESC
      `)
      .all();

    return Response.json(academies.results || []);
  } catch (error) {
    return handleApiError(error);
  }
}
