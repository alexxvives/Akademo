import { membershipQueries, academyQueries } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { z } from 'zod';

const updateMembershipSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['TEACHER', 'ADMIN']);
    const { id } = await params;
    const body = await request.json();
    const data = updateMembershipSchema.parse(body);

    // Get membership
    const membership = await membershipQueries.findById(id) as any;

    if (!membership) {
      return errorResponse('Membership not found', 404);
    }

    // Get academy
    const academy = await academyQueries.findById(membership.academyId) as any;

    // Check if user owns the academy (unless admin)
    if (session.role !== 'ADMIN' && academy.ownerId !== session.id) {
      return errorResponse('Forbidden', 403);
    }

    // Update membership status
    await membershipQueries.updateStatus(id, data.status);

    // Get updated membership
    const updated = await membershipQueries.findById(id) as Record<string, unknown>;

    return Response.json(successResponse({ ...updated, academy }));
  } catch (error) {
    return handleApiError(error);
  }
}
