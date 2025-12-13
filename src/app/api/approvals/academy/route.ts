import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { getDB } from '@/lib/db';
import { z } from 'zod';

const approvalSchema = z.object({
  requestId: z.string(),
  action: z.enum(['approve', 'reject']),
});

// POST: Academy approves/rejects teacher membership request
export async function POST(request: Request) {
  try {
    const session = await requireRole(['ACADEMY', 'ADMIN']);
    const body = await request.json();
    const data = approvalSchema.parse(body);
    const db = await getDB();

    const newStatus = data.action === 'approve' ? 'APPROVED' : 'REJECTED';

    await db
      .prepare(`
        UPDATE AcademyMembership 
        SET status = ?, approvedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(newStatus, data.requestId)
      .run();

    return Response.json({ 
      success: true, 
      message: `Teacher ${data.action}d` 
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET: Get pending teacher requests for academy
export async function GET(request: Request) {
  try {
    const session = await requireRole(['ACADEMY', 'ADMIN']);
    const db = await getDB();

    // Get academies owned by this user
    const academies = await db
      .prepare(`SELECT id FROM Academy WHERE ownerId = ?`)
      .bind(session.id)
      .all();

    if (!academies.results || academies.results.length === 0) {
      return Response.json([]);
    }

    const academyIds = academies.results.map((a: any) => a.id);
    const placeholders = academyIds.map(() => '?').join(',');

    const requests = await db
      .prepare(`
        SELECT 
          m.id,
          m.status,
          m.requestedAt,
          (u.firstName || ' ' || u.lastName) as teacherName,
          u.email as teacherEmail,
          a.name as academyName
        FROM AcademyMembership m
        JOIN users u ON m.userId = u.id
        JOIN Academy a ON m.academyId = a.id
        WHERE m.academyId IN (${placeholders}) AND m.status = 'PENDING'
        ORDER BY m.requestedAt DESC
      `)
      .bind(...academyIds)
      .all();

    return Response.json(requests.results || []);
  } catch (error) {
    return handleApiError(error);
  }
}
