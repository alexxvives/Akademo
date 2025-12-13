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

    // Get classes for these academies
    let query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.academyId,
        c.teacherId,
        a.name as academyName,
        (u.firstName || ' ' || u.lastName) as teacherName,
        u.email as teacherEmail,
        (SELECT COUNT(*) FROM ClassEnrollment e WHERE e.classId = c.id) as studentCount,
        (SELECT COUNT(*) FROM Video v WHERE v.classId = c.id) as videoCount
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      LEFT JOIN users u ON c.teacherId = u.id
    `;

    let params: any[] = [];
    
    if (session.role === 'ACADEMY' && academyIds.length > 0) {
      const placeholders = academyIds.map(() => '?').join(',');
      query += ` WHERE c.academyId IN (${placeholders})`;
      params = academyIds;
    }

    query += ' ORDER BY c.name';

    const result = await db.prepare(query).bind(...params).all();

    return Response.json(result.results || []);
  } catch (error) {
    return handleApiError(error);
  }
}
