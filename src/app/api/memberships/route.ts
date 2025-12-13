import { membershipQueries, academyQueries } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { z } from 'zod';

const membershipRequestSchema = z.object({
  academyId: z.string(),
});

const updateMembershipSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = membershipRequestSchema.parse(body);

    // Check if academy exists
    const academy = await academyQueries.findById(data.academyId);

    if (!academy) {
      return errorResponse('Academy not found', 404);
    }

    // Check if membership already exists
    const existing = await membershipQueries.findByUserAndAcademy(session.id, data.academyId);

    if (existing) {
      return errorResponse('Membership request already exists');
    }

    // Create membership request
    const membership = await membershipQueries.create({
      userId: session.id,
      academyId: data.academyId,
      status: 'PENDING',
    });

    return Response.json(successResponse({ ...membership, academy }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId');
    const status = searchParams.get('status');

    if (session.role === 'TEACHER' && academyId) {
      // Teachers can see membership requests for their academies
      const academy = await academyQueries.findById(academyId) as any;

      if (!academy || academy.ownerId !== session.id) {
        return errorResponse('Forbidden', 403);
      }

      const memberships = await membershipQueries.findByAcademyWithUser(academyId);
      // Filter by status if provided
      const filtered = status 
        ? memberships.filter((m: any) => m.status === status)
        : memberships;

      return Response.json(successResponse(filtered));
    }

    // Students see their own memberships
    const memberships = await membershipQueries.findByUser(session.id);

    return Response.json(successResponse(memberships));
  } catch (error) {
    return handleApiError(error);
  }
}
