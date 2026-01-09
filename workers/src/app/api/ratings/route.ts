import { requireRole } from '@/lib/auth';
import { getDB } from '@/lib/db';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

// Get aggregated ratings for a teacher's lessons
export async function GET(request: Request) {
  try {
    const session = await requireRole(['TEACHER', 'ADMIN']);
    
    const db = await getDB();

    // Get average rating and count for all lessons by this teacher
    const stats = await db.prepare(`
      SELECT 
        AVG(lr.rating) as averageRating,
        COUNT(lr.id) as totalRatings,
        COUNT(DISTINCT lr.lessonId) as ratedLessons
      FROM LessonRating lr
      JOIN Lesson l ON lr.lessonId = l.id
      JOIN Class c ON l.classId = c.id
      WHERE c.teacherId = ?
    `).bind(session.id).first() as any;

    // Get ratings by lesson
    const lessonRatings = await db.prepare(`
      SELECT 
        l.id as lessonId,
        l.title as lessonTitle,
        c.name as className,
        AVG(lr.rating) as averageRating,
        COUNT(lr.id) as ratingCount
      FROM Lesson l
      JOIN Class c ON l.classId = c.id
      LEFT JOIN LessonRating lr ON lr.lessonId = l.id
      WHERE c.teacherId = ?
      GROUP BY l.id
      ORDER BY averageRating DESC NULLS LAST
    `).bind(session.id).all();

    return Response.json(successResponse({
      overall: {
        averageRating: stats?.averageRating ? Math.round(stats.averageRating * 10) / 10 : null,
        totalRatings: stats?.totalRatings || 0,
        ratedLessons: stats?.ratedLessons || 0,
      },
      lessons: lessonRatings.results || [],
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
