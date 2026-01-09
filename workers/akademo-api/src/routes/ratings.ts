import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const ratings = new Hono<{ Bindings: Bindings }>();

// GET /ratings - Get teacher ratings summary
ratings.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    console.log('[Ratings] Session:', session.id, session.role);

    // Only Teachers and Academy owners can see their teaching stats
    if (session.role !== 'TEACHER' && session.role !== 'ACADEMY') {
      console.log('[Ratings] Forbidden - role:', session.role);
      return c.json(errorResponse('Forbidden'), 403);
    }

    let queryParams = [session.id];
    let whereClause = 'WHERE c.teacherId = ?';
    
    if (session.role === 'ACADEMY') {
        // Academy owner sees all classes in their academies
        whereClause = 'WHERE c.academyId IN (SELECT id FROM Academy WHERE ownerId = ?)';
    }

    console.log('[Ratings] Running query with params:', queryParams);

    // Get average rating and count
    const stats = await c.env.DB.prepare(`
        SELECT 
          COALESCE(AVG(lr.rating), 0) as averageRating,
          COUNT(lr.id) as totalRatings,
          COUNT(DISTINCT lr.lessonId) as ratedLessons
        FROM Class c
        LEFT JOIN Lesson l ON l.classId = c.id
        LEFT JOIN LessonRating lr ON lr.lessonId = l.id
        ${whereClause}
    `).bind(...queryParams).first();

    console.log('[Ratings] Stats:', stats);

    // Get recent ratings
    const recent = await c.env.DB.prepare(`
        SELECT 
          lr.id,
          lr.rating,
          lr.createdAt,
          l.title as lessonTitle,
          c.name as className,
          u.firstName as studentFirstName,
          u.lastName as studentLastName
        FROM Class c
        JOIN Lesson l ON l.classId = c.id
        JOIN LessonRating lr ON lr.lessonId = l.id
        JOIN User u ON lr.studentId = u.id
        ${whereClause}
        ORDER BY lr.createdAt DESC
        LIMIT 5
    `).bind(...queryParams).all();

    console.log('[Ratings] Recent ratings count:', recent.results?.length || 0);

    // Get per-lesson ratings aggregated
    const lessonRatings = await c.env.DB.prepare(`
        SELECT 
          l.id as lessonId,
          l.title as lessonTitle,
          c.name as className,
          COALESCE(AVG(lr.rating), 0) as averageRating,
          COUNT(lr.id) as ratingCount
        FROM Class c
        JOIN Lesson l ON l.classId = c.id
        LEFT JOIN LessonRating lr ON lr.lessonId = l.id
        ${whereClause}
        GROUP BY l.id, l.title, c.name
        HAVING COUNT(lr.id) > 0
        ORDER BY c.name, l.title
    `).bind(...queryParams).all();

    return c.json(successResponse({
        overall: {
            averageRating: Number(stats?.averageRating) || 0,
            totalRatings: Number(stats?.totalRatings) || 0,
            ratedLessons: Number(stats?.ratedLessons) || 0,
        },
        lessons: lessonRatings.results || [],
        recent: recent.results || []
    }));

  } catch (error: any) {
    console.error('[Ratings] Error:', error);
    console.error('[Ratings] Stack:', error.stack);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default ratings;
