import { requireRole } from '@/lib/auth';
import { handleApiError, errorResponse } from '@/lib/api-utils';
import { getDB } from '@/lib/db';
import { z } from 'zod';

const approvalSchema = z.object({
  requestId: z.string(),
  action: z.enum(['approve', 'reject']),
});

// POST: Academy approves/rejects teacher membership request
// NOTE: This endpoint is deprecated since teachers are now added directly via the Teacher table
export async function POST(request: Request) {
  try {
    await requireRole(['ACADEMY', 'ADMIN']);
    return errorResponse('This endpoint is deprecated. Teachers are now added directly without an approval workflow.', 400);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET: Get pending teacher requests for academy
// NOTE: This returns empty since teachers are now added directly without approval
export async function GET(request: Request) {
  try {
    await requireRole(['ACADEMY', 'ADMIN']);
    // No pending requests since teachers are now added directly
    return Response.json([]);
  } catch (error) {
    return handleApiError(error);
  }
}
