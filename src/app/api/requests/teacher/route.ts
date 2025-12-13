import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { getDB } from '@/lib/db';
import { z } from 'zod';

const requestSchema = z.object({
  academyId: z.string(),
  message: z.string().optional(),
});

// POST: Teacher requests to join an academy
export async function POST(request: Request) {
  try {
    const session = await requireRole(['TEACHER']);
    const body = await request.json();
    const data = requestSchema.parse(body);
    const db = await getDB();

    // Check if already requested
    const existing = await db
      .prepare(`
        SELECT id FROM AcademyMembership 
        WHERE userId = ? AND academyId = ?
      `)
      .bind(session.id, data.academyId)
      .first<{ id: string }>();

    if (existing) {
      return Response.json(
        { error: 'Already requested or member of this academy' },
        { status: 400 }
      );
    }

    // Create membership request
    const membershipId = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db
      .prepare(`
        INSERT INTO AcademyMembership (id, userId, academyId, status, requestedAt, createdAt, updatedAt)
        VALUES (?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      .bind(membershipId, session.id, data.academyId)
      .run();

    return Response.json({ 
      success: true, 
      message: 'Request sent to academy',
      membershipId 
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET: Get teacher's pending requests
export async function GET(request: Request) {
  try {
    const session = await requireRole(['TEACHER']);
    const db = await getDB();

    const requests = await db
      .prepare(`
        SELECT 
          m.id,
          m.status,
          m.requestedAt,
          a.name as academyName,
          a.description as academyDescription
        FROM AcademyMembership m
        JOIN Academy a ON m.academyId = a.id
        WHERE m.userId = ?
        ORDER BY m.requestedAt DESC
      `)
      .bind(session.id)
      .all();

    return Response.json(requests.results || []);
  } catch (error) {
    return handleApiError(error);
  }
}
