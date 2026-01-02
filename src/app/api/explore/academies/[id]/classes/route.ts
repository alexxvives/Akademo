import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { getDB } from '@/lib/db';

// GET: List classes for a specific academy (for students to explore)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['STUDENT', 'TEACHER', 'ADMIN', 'ACADEMY']);
    const db = await getDB();
    const academyId = params.id;

    // Get all classes from this academy with teacher information
    const classes = await db
      .prepare(`
        SELECT 
          c.id,
          c.name,
          c.description,
          c.slug,
          a.name as academyName,
          (u.firstName || ' ' || u.lastName) as teacherName,
          u.id as teacherId,
          u.email as teacherEmail,
          (SELECT COUNT(*) FROM Enrollment e WHERE e.classId = c.id AND e.status = 'APPROVED') as studentCount
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        JOIN User u ON c.teacherId = u.id
        WHERE c.academyId = ?
        ORDER BY c.createdAt DESC
      `)
      .bind(academyId)
      .all();

    return Response.json({ success: true, data: classes.results || [] });
  } catch (error) {
    return handleApiError(error);
  }
}
