import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { getDB } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await requireRole(['ACADEMY', 'ADMIN']);
    const db = await getDB();

    // Get all academies where this user is associated via Teacher table
    let academyIds: string[] = [];
    
    if (session.role === 'ACADEMY') {
      const academies = await db
        .prepare('SELECT DISTINCT academyId FROM Teacher WHERE userId = ?')
        .bind(session.id)
        .all();
      academyIds = (academies.results || []).map((a: any) => a.academyId);
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
        u.createdAt,
        (SELECT COUNT(DISTINCT e2.classId) 
         FROM ClassEnrollment e2 
         JOIN Class c2 ON e2.classId = c2.id 
         WHERE e2.userId = u.id ${session.role === 'ACADEMY' && academyIds.length > 0 ? 'AND c2.academyId IN (' + academyIds.map(() => '?').join(',') + ')' : ''}) as classCount,
        (SELECT GROUP_CONCAT(c2.name, ', ') 
         FROM ClassEnrollment e2 
         JOIN Class c2 ON e2.classId = c2.id 
         WHERE e2.userId = u.id ${session.role === 'ACADEMY' && academyIds.length > 0 ? 'AND c2.academyId IN (' + academyIds.map(() => '?').join(',') + ')' : ''}) as classes,
        (SELECT GROUP_CONCAT(DISTINCT ut.firstName || ' ' || ut.lastName, ', ') 
         FROM ClassEnrollment e2 
         JOIN Class c2 ON e2.classId = c2.id 
         JOIN User ut ON c2.teacherId = ut.id
         WHERE e2.userId = u.id ${session.role === 'ACADEMY' && academyIds.length > 0 ? 'AND c2.academyId IN (' + academyIds.map(() => '?').join(',') + ')' : ''}) as teachers
      FROM User u
      JOIN ClassEnrollment e ON u.id = e.userId
      JOIN Class c ON e.classId = c.id
      WHERE u.role = 'STUDENT'
    `;

    let params: any[] = [];
    
    if (session.role === 'ACADEMY' && academyIds.length > 0) {
      const placeholders = academyIds.map(() => '?').join(',');
      query += ` AND c.academyId IN (${placeholders})`;
      // Need academyIds 4 times: classCount subquery, classes subquery, teachers subquery, and main query
      params = [...academyIds, ...academyIds, ...academyIds, ...academyIds];
    }

    query += ' ORDER BY u.firstName, u.lastName';

    const result = await db.prepare(query).bind(...params).all();

    return Response.json({ success: true, data: result.results || [] });
  } catch (error) {
    return handleApiError(error);
  }
}
