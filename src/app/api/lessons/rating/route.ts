import { requireRole } from '@/lib/auth';
import { getDB, generateId } from '@/lib/db';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

// Get rating for a lesson by current student
export async function GET(request: Request) {
  try {
    const session = await requireRole(['STUDENT']);
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return errorResponse('Lesson ID required');
    }

    const db = await getDB();

    const rating = await db.prepare(`
      SELECT rating FROM LessonRating 
      WHERE lessonId = ? AND studentId = ?
    `).bind(lessonId, session.id).first();

    return Response.json(successResponse({
      rating: rating ? (rating as any).rating : null,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

// Submit or update a rating
export async function POST(request: Request) {
  try {
    const session = await requireRole(['STUDENT']);
    const { lessonId, rating } = await request.json();

    if (!lessonId || !rating) {
      return errorResponse('Lesson ID and rating required');
    }

    if (rating < 1 || rating > 5) {
      return errorResponse('Rating must be between 1 and 5');
    }

    const db = await getDB();

    // Check if student has access to this lesson (enrolled in the class)
    const hasAccess = await db.prepare(`
      SELECT 1 FROM Lesson l
      JOIN ClassEnrollment ce ON ce.classId = l.classId
      WHERE l.id = ? AND ce.userId = ? AND ce.status = 'APPROVED'
    `).bind(lessonId, session.id).first();

    if (!hasAccess) {
      return errorResponse('Not authorized to rate this lesson', 403);
    }

    // Check if rating exists
    const existing = await db.prepare(`
      SELECT id FROM LessonRating WHERE lessonId = ? AND studentId = ?
    `).bind(lessonId, session.id).first();

    const now = new Date().toISOString();

    if (existing) {
      // Update existing rating
      await db.prepare(`
        UPDATE LessonRating SET rating = ?, updatedAt = ? WHERE id = ?
      `).bind(rating, now, (existing as any).id).run();
    } else {
      // Create new rating
      const id = generateId();
      await db.prepare(`
        INSERT INTO LessonRating (id, lessonId, studentId, rating, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, lessonId, session.id, rating, now, now).run();
    }

    return Response.json(successResponse({ rating }));
  } catch (error) {
    return handleApiError(error);
  }
}
