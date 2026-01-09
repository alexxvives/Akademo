import { academyQueries, membershipQueries, classQueries } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const academy = await academyQueries.findWithOwner(id);

    if (!academy) {
      return errorResponse('Academy not found', 404);
    }

    // Get memberships and classes
    const memberships = await membershipQueries.findByAcademyWithUser(id);
    const classes = await classQueries.findByAcademy(id);

    return Response.json(successResponse({
      ...academy,
      memberships,
      classes,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
