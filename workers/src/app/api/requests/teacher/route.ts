import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { getDB } from '@/lib/db';
import { z } from 'zod';

const requestSchema = z.object({
  academyId: z.string(),
  message: z.string().optional(),
});

// POST: Teacher joins an academy (no longer approval-based, direct join)
export async function POST(request: Request) {
  try {
    const session = await requireRole(['TEACHER']);
    const body = await request.json();
    const data = requestSchema.parse(body);
    const db = await getDB();

    // Check if already a teacher in this academy
    const existing = await db
      .prepare(`
        SELECT id FROM Teacher 
        WHERE userId = ? AND academyId = ?
      `)
      .bind(session.id, data.academyId)
      .first<{ id: string }>();

    if (existing) {
      return Response.json(
        { error: 'Already a teacher in this academy' },
        { status: 400 }
      );
    }

    // Create teacher record (direct join, no approval needed)
    const teacherId = `teacher-${session.id}-${data.academyId}`;
    const now = new Date().toISOString();
    await db
      .prepare(`
        INSERT INTO Teacher (id, userId, academyId, defaultMaxWatchTimeMultiplier, createdAt, updatedAt)
        VALUES (?, ?, ?, 2.0, ?, ?)
      `)
      .bind(teacherId, session.id, data.academyId, now, now)
      .run();

    return Response.json({ 
      success: true, 
      message: 'Joined academy successfully',
      teacherId 
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET: Get teacher's academies
export async function GET(request: Request) {
  try {
    const session = await requireRole(['TEACHER']);
    const db = await getDB();

    const academies = await db
      .prepare(`
        SELECT 
          t.id,
          'APPROVED' as status,
          t.createdAt as requestedAt,
          a.name as academyName,
          NULL as academyDescription
        FROM Teacher t
        JOIN Academy a ON t.academyId = a.id
        WHERE t.userId = ?
        ORDER BY t.createdAt DESC
      `)
      .bind(session.id)
      .all();

    return Response.json(academies.results || []);
  } catch (error) {
    return handleApiError(error);
  }
}
