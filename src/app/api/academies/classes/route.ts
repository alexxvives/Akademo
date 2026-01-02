import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { getDB, generateId } from '@/lib/db';
import { z } from 'zod';

const createClassSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  teacherId: z.string().min(1, 'You must assign a teacher to the class'),
});

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

    console.log('[API /api/academies/classes] GET request by user:', session.id, 'role:', session.role);
    console.log('[API /api/academies/classes] Academy IDs:', academyIds);

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
        (SELECT COUNT(*) FROM Lesson l WHERE l.classId = c.id) as lessonCount,
        (SELECT COUNT(*) FROM Video v 
         JOIN Lesson l ON v.lessonId = l.id 
         WHERE l.classId = c.id) as videoCount,
        (SELECT COUNT(*) FROM Document d 
         JOIN Lesson l ON d.lessonId = l.id 
         WHERE l.classId = c.id) as documentCount
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      LEFT JOIN User u ON c.teacherId = u.id
    `;

    let params: any[] = [];
    
    if (session.role === 'ACADEMY' && academyIds.length > 0) {
      const placeholders = academyIds.map(() => '?').join(',');
      query += ` WHERE c.academyId IN (${placeholders})`;
      params = academyIds;
    }

    query += ' ORDER BY c.name';

    console.log('[API /api/academies/classes] Executing query...');
    const result = await db.prepare(query).bind(...params).all();
    console.log('[API /api/academies/classes] Found', result.results?.length || 0, 'classes');
    return Response.json(result.results || []);
  } catch (error) {
    console.error('[API /api/academies/classes] Error:', error);
    return handleApiError(error);
  }
}

// POST: Academy creates a new class with assigned teacher
export async function POST(request: Request) {
  try {
    const session = await requireRole(['ACADEMY']);
    const body = await request.json();
    const data = createClassSchema.parse(body);
    const db = await getDB();

    // Get the academy ID for this academy owner
    const academyResult = await db
      .prepare('SELECT DISTINCT academyId FROM Teacher WHERE userId = ?')
      .bind(session.id)
      .first<{ academyId: string }>();

    if (!academyResult) {
      return errorResponse('No academy found for this user', 404);
    }

    const academyId = academyResult.academyId;

    // Verify the teacher belongs to this academy
    const teacher = await db
      .prepare('SELECT * FROM Teacher WHERE userId = ? AND academyId = ?')
      .bind(data.teacherId, academyId)
      .first();

    if (!teacher) {
      return errorResponse('This teacher does not belong to your academy', 400);
    }

    // Create the class
    const classId = generateId();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO Class (id, name, description, academyId, teacherId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(classId, data.name, data.description || null, academyId, data.teacherId, now, now).run();

    // Get the created class with teacher info
    const createdClass = await db.prepare(`
      SELECT c.*, (u.firstName || ' ' || u.lastName) as teacherName, u.email as teacherEmail
      FROM Class c
      LEFT JOIN User u ON c.teacherId = u.id
      WHERE c.id = ?
    `).bind(classId).first();

    return Response.json(successResponse(createdClass), { status: 201 });
  } catch (error) {
    console.error('[API /api/academies/classes] POST Error:', error);
    return handleApiError(error);
  }
}
