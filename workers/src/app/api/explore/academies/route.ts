import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/api-utils';
import { getDB } from '@/lib/db';

// GET: List all academies (for students to explore)
export async function GET(request: Request) {
  try {
    const session = await requireRole(['STUDENT', 'TEACHER', 'ADMIN', 'ACADEMY']);
    const db = await getDB();

    const { results } = await db
      .prepare(`
        SELECT 
          a.id,
          a.name,
          a.description,
          (u.firstName || ' ' || u.lastName) as ownerName,
          (SELECT COUNT(*) FROM Teacher t WHERE t.academyId = a.id) as teacherCount
        FROM Academy a
        JOIN User u ON a.ownerId = u.id
        ORDER BY a.createdAt DESC
      `)
      .all();

    return Response.json(successResponse(results || []));
  } catch (error) {
    return handleApiError(error);
  }
}
