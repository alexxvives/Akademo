import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { getDB } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const createTeacherSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6),
});

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// POST: Academy creates a teacher user
export async function POST(request: Request) {
  try {
    const session = await requireRole(['ACADEMY', 'ADMIN']);
    const body = await request.json();
    const data = createTeacherSchema.parse(body);
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

    // Hash the provided password
    const hashedPassword = await hashPassword(data.password);

    // Get academy ID if session is ACADEMY role (via Teacher table)
    let academyId: string | null = null;
    if (session.role === 'ACADEMY') {
      const academyResult = await db
        .prepare('SELECT DISTINCT academyId FROM Teacher WHERE userId = ?')
        .bind(session.id)
        .first<{ academyId: string }>();
      academyId = academyResult?.academyId || null;
    }

    // Create teacher user
    const teacherId = `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db
      .prepare(`
        INSERT INTO User (id, email, password, firstName, lastName, role, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 'TEACHER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      .bind(teacherId, data.email, hashedPassword, data.firstName, data.lastName)
      .run();

    // If academy, create Teacher record to link to academy
    if (academyId) {
      const teacherRecordId = `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await db
        .prepare(`
          INSERT INTO Teacher (id, userId, academyId, defaultMaxWatchTimeMultiplier, createdAt, updatedAt)
          VALUES (?, ?, ?, 2.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `)
        .bind(teacherRecordId, teacherId, academyId)
        .run();
    }

    return Response.json({
      success: true,
      message: 'Teacher created successfully',
      user: {
        id: teacherId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'TEACHER',
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
