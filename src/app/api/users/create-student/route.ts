import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { getDB } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const createStudentSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  classId: z.string().optional(), // Optional: auto-enroll in a specific class
});

// POST: Teacher creates a student user
export async function POST(request: Request) {
  try {
    const session = await requireRole(['TEACHER', 'ADMIN']);
    const body = await request.json();
    const data = createStudentSchema.parse(body);
    const db = await getDB();

    // Check if email already exists
    const existing = await db
      .prepare('SELECT id FROM User WHERE email = ?')
      .bind(data.email)
      .first<{ id: string }>();

    if (existing) {
      return Response.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Use "password" as the password for all students
    const hashedPassword = await hashPassword('password');

    // Create student user
    const studentId = `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db
      .prepare(`
        INSERT INTO User (id, email, password, firstName, lastName, role, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      .bind(studentId, data.email, hashedPassword, data.firstName, data.lastName)
      .run();

    // If classId provided, create approved enrollment automatically
    if (data.classId) {
      // Verify teacher owns this class
      const classCheck = await db
        .prepare(`
          SELECT c.id FROM Class c
          JOIN Academy a ON c.academyId = a.id
          JOIN AcademyMembership m ON a.id = m.academyId
          WHERE c.id = ? AND m.userId = ? AND m.status = 'APPROVED'
        `)
        .bind(data.classId, session.id)
        .first<{ id: string }>();

      if (classCheck) {
        const enrollmentId = `enroll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await db
          .prepare(`
            INSERT INTO ClassEnrollment (id, classId, studentId, status, requestedAt, approvedAt, enrolledAt, createdAt, updatedAt)
            VALUES (?, ?, ?, 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `)
          .bind(enrollmentId, data.classId, studentId)
          .run();
      }
    }

    return Response.json({
      success: true,
      message: 'Student created successfully',
      user: {
        id: studentId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'STUDENT',
      },
      // Password is always "password" for students
      note: 'Student password is: password',
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
