import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { getDB } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await requireRole(['ACADEMY', 'ADMIN']);
    const db = await getDB();

    // Get all academies where this user is the owner (ACADEMY role) or via Teacher table (ADMIN sees all)
    let academyIds: string[] = [];
    
    if (session.role === 'ACADEMY') {
      // Get academies owned by this user
      const ownedAcademies = await db
        .prepare('SELECT id FROM Academy WHERE ownerId = ?')
        .bind(session.id)
        .all();
      academyIds = (ownedAcademies.results || []).map((a: any) => a.id);
      
      if (academyIds.length === 0) {
        return Response.json({ success: true, data: [] });
      }
    }

    // Get students enrolled in classes of these academies
    let query: string;
    let params: any[] = [];
    
    if (session.role === 'ACADEMY' && academyIds.length > 0) {
      // Build query with proper placeholders for ACADEMY role
      const placeholders = academyIds.map(() => '?').join(',');
      query = `
        SELECT DISTINCT
          u.id,
          u.email,
          (u.firstName || ' ' || u.lastName) as name,
          u.createdAt,
          (SELECT COUNT(DISTINCT e2.classId) 
           FROM ClassEnrollment e2 
           JOIN Class c2 ON e2.classId = c2.id 
           WHERE e2.userId = u.id AND c2.academyId IN (${placeholders})) as classCount,
          (SELECT GROUP_CONCAT(c2.name, ', ') 
           FROM ClassEnrollment e2 
           JOIN Class c2 ON e2.classId = c2.id 
           WHERE e2.userId = u.id AND c2.academyId IN (${placeholders})) as classes,
          (SELECT GROUP_CONCAT(DISTINCT ut.firstName || ' ' || ut.lastName, ', ') 
           FROM ClassEnrollment e2 
           JOIN Class c2 ON e2.classId = c2.id 
           JOIN User ut ON c2.teacherId = ut.id
           WHERE e2.userId = u.id AND c2.academyId IN (${placeholders})) as teachers
        FROM User u
        JOIN ClassEnrollment e ON u.id = e.userId
        JOIN Class c ON e.classId = c.id
        WHERE u.role = 'STUDENT' AND c.academyId IN (${placeholders})
        ORDER BY u.firstName, u.lastName
      `;
      // Need academyIds 4 times: classCount subquery, classes subquery, teachers subquery, and main WHERE clause
      params = [...academyIds, ...academyIds, ...academyIds, ...academyIds];
    } else {
      // ADMIN sees all students
      query = `
        SELECT DISTINCT
          u.id,
          u.email,
          (u.firstName || ' ' || u.lastName) as name,
          u.createdAt,
          (SELECT COUNT(DISTINCT e2.classId) 
           FROM ClassEnrollment e2 
           WHERE e2.userId = u.id) as classCount,
          (SELECT GROUP_CONCAT(c2.name, ', ') 
           FROM ClassEnrollment e2 
           JOIN Class c2 ON e2.classId = c2.id 
           WHERE e2.userId = u.id) as classes,
          (SELECT GROUP_CONCAT(DISTINCT ut.firstName || ' ' || ut.lastName, ', ') 
           FROM ClassEnrollment e2 
           JOIN Class c2 ON e2.classId = c2.id 
           JOIN User ut ON c2.teacherId = ut.id
           WHERE e2.userId = u.id) as teachers
        FROM User u
        JOIN ClassEnrollment e ON u.id = e.userId
        JOIN Class c ON e.classId = c.id
        WHERE u.role = 'STUDENT'
        ORDER BY u.firstName, u.lastName
      `;
    }

    const result = await db.prepare(query).bind(...params).all();

    return Response.json({ success: true, data: result.results || [] });
  } catch (error) {
    return handleApiError(error);
  }
}
