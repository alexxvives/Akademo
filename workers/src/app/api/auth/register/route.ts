import { userQueries, academyQueries } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['STUDENT', 'TEACHER']).default('STUDENT'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Check if user already exists
    const existing = await userQueries.findByEmail(data.email);

    if (existing) {
      return errorResponse('Email already registered');
    }

    // Create user
    const hashedPassword = await hashPassword(data.password);
    const user = await userQueries.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    });

    // Auto-create academy for teachers
    if (data.role === 'TEACHER') {
      await academyQueries.create({
        name: `${data.firstName} ${data.lastName}'s Academy`,
        description: `Welcome to ${data.firstName}'s teaching space`,
        ownerId: user.id,
      });
    }

    // Create session to log the user in
    await createSession(user.id);

    return Response.json(successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
