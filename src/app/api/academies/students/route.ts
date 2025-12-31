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

    // Get students enrolled in classes of these academies
    let query = `
      SELECT DISTINCT
        u.id,
        u.email,
        (u.firstName || ' ' || u.lastName) as name,
        (SELECT COUNT(DISTINCT e2.classId) 
         FROM ClassEnrollment e2 
         JOIN Class c2 ON e2.classId = c2.id 
         WHERE e2.studentId = u.id ${session.role === 'ACADEMY' && academyIds.length > 0 ? 'AND c2.academyId IN (' + academyIds.map(() => '?').join(',') + ')' : ''}) as classCount
      FROM User u
      JOIN ClassEnrollment e ON u.id = e.studentId
      JOIN Class c ON e.classId = c.id
      WHERE u.role = 'STUDENT'
    `;

    let params: any[] = [];
    
    if (session.role === 'ACADEMY' && academyIds.length > 0) {
      const placeholders = academyIds.map(() => '?').join(',');
      query += ` AND c.academyId IN (${placeholders})`;
      params = [...academyIds, ...academyIds]; // Need twice for the subquery and main query
    }

    query += ' ORDER BY u.firstName, u.lastName';

    const result = await db.prepare(query).bind(...params).all();

    return Response.json(result.results || []);
  } catch (error) {
    return handleApiError(error);
  }
}
