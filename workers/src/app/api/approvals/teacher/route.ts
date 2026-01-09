import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { getDB } from '@/lib/db';
import { z } from 'zod';

const approvalSchema = z.object({
  enrollmentId: z.string(),
  action: z.enum(['approve', 'reject']),
});

// POST: Teacher approves/rejects student enrollment request
export async function POST(request: Request) {
  try {
    const session = await requireRole(['TEACHER', 'ADMIN']);
    const body = await request.json();
    const data = approvalSchema.parse(body);
    const db = await getDB();

    const newStatus = data.action === 'approve' ? 'APPROVED' : 'REJECTED';

    await db
      .prepare(`
        UPDATE ClassEnrollment 
        SET status = ?, approvedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(newStatus, data.enrollmentId)
      .run();

    return Response.json({ 
      success: true, 
      message: `Student ${data.action}d` 
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET: Get pending student requests for teacher's classes
export async function GET(request: Request) {
  try {
    const session = await requireRole(['TEACHER', 'ADMIN']);
    // Since we removed the approval system and Class table doesn't have teacherId,
    // just return empty array for now
    return Response.json([]);
  } catch (error) {
    return handleApiError(error);
  }
}
