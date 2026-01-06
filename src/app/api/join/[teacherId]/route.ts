import { userQueries, classQueries } from '@/lib/db';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(
  request: Request,
  { params }: { params: { teacherId: string } }
) {
  try {
    const teacherId = params.teacherId;

    // Get teacher info
    const teacher = await userQueries.findById(teacherId) as any;
    
    if (!teacher || teacher.role !== 'TEACHER') {
      return errorResponse('Profesor no encontrado', 404);
    }

    // Get teacher's classes (from academies they're a member of)
    const classes = await classQueries.findByTeacher(teacherId);

    return Response.json(successResponse({
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
      },
      classes: classes.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        academyName: c.academy?.name || c.academyName,
      })),
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
