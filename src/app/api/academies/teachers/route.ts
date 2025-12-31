import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { getDB } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await requireRole(['ACADEMY', 'ADMIN']);
    const db = await getDB();

    // Get all academies owned by this user
    let academyIds: string[] = [];
    
    if (session.role === 'ACADEMY') {
      const academies = await db
        .prepare('SELECT id FROM Academy WHERE ownerId = ?')
        .bind(session.id)
        .all();
      academyIds = (academies.results || []).map((a: any) => a.id);
    }

    if (academyIds.length === 0 && session.role !== 'ADMIN') {
      return Response.json([]);
    }

    // Get teachers for these academies
    let query = `
      SELECT 
        u.id,
        u.email,
        (u.firstName || ' ' || u.lastName) as name,
        m.academyId,
        a.name as academyName,
        (SELECT COUNT(*) FROM Class c WHERE c.teacherId = u.id AND c.academyId = m.academyId) as classCount,
        (SELECT COUNT(DISTINCT e.studentId) 
         FROM Class c2 
         JOIN ClassEnrollment e ON c2.id = e.classId 
         WHERE c2.teacherId = u.id AND c2.academyId = m.academyId) as studentCount
      FROM User u
      JOIN AcademyMembership m ON u.id = m.userId
      JOIN Academy a ON m.academyId = a.id
      WHERE u.role = 'TEACHER'
    `;

    let params: any[] = [];
    
    if (session.role === 'ACADEMY' && academyIds.length > 0) {
      const placeholders = academyIds.map(() => '?').join(',');
      query += ` AND m.academyId IN (${placeholders})`;
      params = academyIds;
    }

    query += ' ORDER BY u.firstName, u.lastName';

    const result = await db.prepare(query).bind(...params).all();

    return Response.json(result.results || []);
  } catch (error) {
    return handleApiError(error);
  }
}
