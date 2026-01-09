import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/api-utils';
import { getDB } from '@/lib/db';

// GET /api/explore/enrolled-academies/classes - Get classes from academies student is already enrolled in
export async function GET(request: Request) {
  try {
    const session = await requireRole(['STUDENT']);
    const db = await getDB();

    // Get all unique academy IDs where the student has approved enrollments
    const enrolledAcademiesResult = await db.prepare(`
      SELECT DISTINCT c.academyId, a.name as academyName
      FROM ClassEnrollment ce
      JOIN Class c ON ce.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE ce.userId = ? AND ce.status = 'APPROVED'
    `).bind(session.id).all();

    if (!enrolledAcademiesResult.results || enrolledAcademiesResult.results.length === 0) {
      return Response.json(successResponse([]));
    }

    const academyIds = (enrolledAcademiesResult.results as any[]).map(r => r.academyId);

    // Get all classes from these academies with enrollment status
    const placeholders = academyIds.map(() => '?').join(',');
    const classesResult = await db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.slug,
        c.academyId,
        a.name as academyName,
        u.id as teacherId,
        (u.firstName || ' ' || u.lastName) as teacherName,
        u.email as teacherEmail,
        (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id AND status = 'APPROVED') as studentCount,
        (SELECT ce2.status FROM ClassEnrollment ce2 WHERE ce2.classId = c.id AND ce2.userId = ?) as enrollmentStatus
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      LEFT JOIN User u ON c.teacherId = u.id
      WHERE c.academyId IN (${placeholders})
      ORDER BY a.name, c.name
    `).bind(session.id, ...academyIds).all();

    return Response.json(successResponse(classesResult.results || []));
  } catch (error) {
    return handleApiError(error);
  }
}
