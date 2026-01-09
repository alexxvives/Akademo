import { academyQueries } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { z } from 'zod';

const createAcademySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole(['TEACHER', 'ADMIN']);
    const body = await request.json();
    const data = createAcademySchema.parse(body);

    const academy = await academyQueries.create({
      name: data.name,
      description: data.description,
      ownerId: session.id,
    });

    return Response.json(successResponse(academy), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'ACADEMY', 'STUDENT']);

    let academies;

    if (session.role === 'ADMIN') {
      // Admin sees all academies with counts
      academies = await academyQueries.findAllWithCounts();
    } else if (session.role === 'TEACHER') {
      // Teachers see their own academies
      const rawAcademies = await academyQueries.findByOwner(session.id);
      academies = rawAcademies;
    } else if (session.role === 'ACADEMY') {
      // Academy owners see their own academies
      const rawAcademies = await academyQueries.findByOwner(session.id);
      academies = rawAcademies;
    } else {
      // Students see all academies (to request membership)
      academies = await academyQueries.findAllWithCounts();
    }

    return Response.json(successResponse(academies));
  } catch (error) {
    return handleApiError(error);
  }
}
