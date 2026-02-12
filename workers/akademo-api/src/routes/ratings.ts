import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { validateBody, createRatingSchema } from '../lib/validation';

const ratings = new Hono<{ Bindings: Bindings }>();

// GET /ratings/teacher - Get hierarchical ratings for teacher's classes (Class > Topic > Lesson)
ratings.get('/teacher', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER' && session.role !== 'ACADEMY' && session.role !== 'ADMIN') {
      return c.json(errorResponse('Not authorized'), 403);
    }

    let query = '';
    let params: any[] = [];

    // Get all ratings for classes owned/taught by user
    if (session.role === 'TEACHER') {
      query = `
        SELECT 
          r.id, r.rating, r.comment, r.createdAt, r.isRead,
          l.id as lessonId, l.title as lessonTitle,
          t.id as topicId, t.name as topicName,
          c.id as classId, c.name as className, c.academyId,
          a.name as academyName,
          u.firstName as studentFirstName, u.lastName as studentLastName
        FROM LessonRating r
        JOIN Lesson l ON r.lessonId = l.id
        LEFT JOIN Topic t ON l.topicId = t.id
        JOIN Class c ON l.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        JOIN User u ON r.studentId = u.id
        WHERE c.teacherId = ?
        ORDER BY c.name, t.name, l.title, r.createdAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'ACADEMY') {
      // Academy owner - see all ratings for their academy's classes
      query = `
        SELECT 
          r.id, r.rating, r.comment, r.createdAt, r.isRead,
          l.id as lessonId, l.title as lessonTitle,
          t.id as topicId, t.name as topicName,
          c.id as classId, c.name as className, c.academyId,
          a.name as academyName,
          u.firstName as studentFirstName, u.lastName as studentLastName,
          tu.firstName as teacherFirstName, tu.lastName as teacherLastName
        FROM LessonRating r
        JOIN Lesson l ON r.lessonId = l.id
        LEFT JOIN Topic t ON l.topicId = t.id
        JOIN Class c ON l.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        JOIN User u ON r.studentId = u.id
        LEFT JOIN User tu ON c.teacherId = tu.id
        WHERE a.ownerId = ?
        ORDER BY c.name, t.name, l.title, r.createdAt DESC
      `;
      params = [session.id];
    } else {
      // Admin - see all ratings across platform
      query = `
        SELECT 
          r.id, r.rating, r.comment, r.createdAt, r.isRead,
          l.id as lessonId, l.title as lessonTitle,
          t.id as topicId, t.name as topicName,
          c.id as classId, c.name as className, c.academyId,
          a.name as academyName,
          u.firstName as studentFirstName, u.lastName as studentLastName,
          tu.firstName as teacherFirstName, tu.lastName as teacherLastName
        FROM LessonRating r
        JOIN Lesson l ON r.lessonId = l.id
        LEFT JOIN Topic t ON l.topicId = t.id
        JOIN Class c ON l.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        JOIN User u ON r.studentId = u.id
        LEFT JOIN User tu ON c.teacherId = tu.id
        ORDER BY c.name, t.name, l.title, r.createdAt DESC
      `;
      params = [];
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();
    const rawRatings = result.results || [];

    // Build hierarchical structure: Class > Topic > Lesson
    const classesMap: Record<string, any> = {};

    for (const r of rawRatings) {
      const classId = r.classId as string;
      const topicId = (r.topicId as string) || `${classId}-no-topic`;
      const lessonId = r.lessonId as string;

      // Initialize class
      if (!classesMap[classId]) {
        classesMap[classId] = {
          id: classId,
          name: r.className,
          academyId: r.academyId,
          academyName: r.academyName,
          teacherName: r.teacherFirstName && r.teacherLastName 
            ? `${r.teacherFirstName} ${r.teacherLastName}`
            : undefined,
          totalRatings: 0,
          sumRatings: 0,
          averageRating: 0,
          topics: {}
        };
      }

      // Initialize topic within class
      if (!classesMap[classId].topics[topicId]) {
        classesMap[classId].topics[topicId] = {
          id: topicId,
          name: (r.topicName as string) || 'Sin tema',
          totalRatings: 0,
          sumRatings: 0,
          averageRating: 0,
          lessons: {}
        };
      }

      // Initialize lesson within topic
      if (!classesMap[classId].topics[topicId].lessons[lessonId]) {
        classesMap[classId].topics[topicId].lessons[lessonId] = {
          id: lessonId,
          title: r.lessonTitle,
          totalRatings: 0,
          sumRatings: 0,
          averageRating: 0,
          ratings: []
        };
      }

      // Add rating to lesson
      const rating = {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        studentName: `${r.studentFirstName} ${r.studentLastName}`,
        isRead: r.isRead === 1
      };

      classesMap[classId].topics[topicId].lessons[lessonId].ratings.push(rating);
      classesMap[classId].topics[topicId].lessons[lessonId].totalRatings++;
      classesMap[classId].topics[topicId].lessons[lessonId].sumRatings += (r.rating as number);

      classesMap[classId].topics[topicId].totalRatings++;
      classesMap[classId].topics[topicId].sumRatings += (r.rating as number);

      classesMap[classId].totalRatings++;
      classesMap[classId].sumRatings += (r.rating as number);
    }

    // Calculate averages and convert to arrays
    const classes = Object.values(classesMap).map(cls => {
      const topics = Object.values(cls.topics).map((topic: any) => {
        const lessons = Object.values(topic.lessons).map((lesson: any) => ({
          ...lesson,
          averageRating: lesson.totalRatings > 0 
            ? Number((lesson.sumRatings / lesson.totalRatings).toFixed(1)) 
            : 0,
          sumRatings: undefined
        }));

        // Sort lessons by average rating descending
        lessons.sort((a, b) => b.averageRating - a.averageRating);

        return {
          ...topic,
          lessons,
          averageRating: topic.totalRatings > 0 
            ? Number((topic.sumRatings / topic.totalRatings).toFixed(1)) 
            : 0,
          sumRatings: undefined
        };
      });

      // Sort topics by average rating descending
      topics.sort((a, b) => b.averageRating - a.averageRating);

      return {
        ...cls,
        topics,
        averageRating: cls.totalRatings > 0 
          ? Number((cls.sumRatings / cls.totalRatings).toFixed(1)) 
          : 0,
        sumRatings: undefined
      };
    });

    // Sort classes by average rating descending
    classes.sort((a, b) => b.averageRating - a.averageRating);

    return c.json(successResponse(classes));

  } catch (error: any) {
    console.error('[Get Teacher Ratings] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /ratings - Get teacher ratings summary OR student's own rating for a lesson
ratings.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.query('lessonId');
    const classId = c.req.query('classId');
    // If lessonId is provided, return student's own rating for that lesson
    if (lessonId && session.role === 'STUDENT') {
      const rating = await c.env.DB.prepare(`
        SELECT rating, comment, createdAt
        FROM LessonRating
        WHERE lessonId = ? AND studentId = ?
      `).bind(lessonId, session.id).first();

      return c.json(successResponse(rating || null));
    }

    // Only Teachers, Academy owners, and Admins can see teaching stats
    if (session.role !== 'TEACHER' && session.role !== 'ACADEMY' && session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    let queryParams: any[] = [];
    let whereClause = '';
    
    if (session.role === 'ADMIN') {
        // Admin sees all ratings across platform
        whereClause = 'WHERE 1=1';
    } else if (session.role === 'ACADEMY') {
        // Academy owner sees all classes in their academies
        whereClause = 'WHERE c.academyId IN (SELECT id FROM Academy WHERE ownerId = ?)';
        queryParams = [session.id];
    } else {
        // Teacher sees their own classes
        whereClause = 'WHERE c.teacherId = ?';
        queryParams = [session.id];
    }

    if (classId) {
        whereClause += ' AND c.id = ?';
        queryParams.push(classId);
    }
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
    // Get recent ratings
    const recent = await c.env.DB.prepare(`
        SELECT 
          lr.id,
          lr.rating,
          lr.comment,
          lr.createdAt,
          l.title as lessonTitle,
          t.name as topicName,
          c.name as className,
          u.firstName as studentFirstName,
          u.lastName as studentLastName
        FROM Class c
        JOIN Lesson l ON l.classId = c.id
        LEFT JOIN Topic t ON l.topicId = t.id
        JOIN LessonRating lr ON lr.lessonId = l.id
        JOIN User u ON lr.studentId = u.id
        ${whereClause}
        ORDER BY lr.createdAt DESC
        LIMIT 50
    `).bind(...queryParams).all();
    // Get per-lesson ratings aggregated
    const lessonRatings = await c.env.DB.prepare(`
        SELECT 
          l.id as lessonId,
          l.title as lessonTitle,
          c.id as classId,
          c.name as className,
          c.academyId,
          COALESCE(AVG(lr.rating), 0) as averageRating,
          COUNT(lr.id) as ratingCount
        FROM Class c
        JOIN Lesson l ON l.classId = c.id
        LEFT JOIN LessonRating lr ON lr.lessonId = l.id
        ${whereClause}
        GROUP BY l.id, l.title, c.id, c.name, c.academyId
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
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /ratings - Submit or update lesson rating and feedback
ratings.post('/', validateBody(createRatingSchema), async (c) => {
  try {
    const session = await requireAuth(c);
    const { lessonId, rating, feedback } = await c.req.json();

    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can rate lessons'), 403);
    }

    // Verify student is enrolled in the class
    const lesson = await c.env.DB.prepare(`
      SELECT l.id, l.title, l.description, l.classId, l.maxWatchTimeMultiplier, 
             l.watermarkIntervalMins, l.createdAt, l.releaseDate, l.topicId, 
             c.id as classId
      FROM Lesson l
      JOIN Class c ON l.classId = c.id
      WHERE l.id = ?
    `).bind(lessonId).first();

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    const enrollment = await c.env.DB.prepare(
      'SELECT * FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = ?'
    ).bind(session.id, lesson.classId, 'APPROVED').first();

    if (!enrollment) {
      return c.json(errorResponse('Not enrolled in this class'), 403);
    }

    // Check if rating already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM LessonRating WHERE lessonId = ? AND studentId = ?'
    ).bind(lessonId, session.id).first();

    const now = new Date().toISOString();

    if (existing) {
      // Update existing rating and mark as unread so teacher/academy sees the edit
      await c.env.DB.prepare(`
        UPDATE LessonRating
        SET rating = ?, comment = ?, isRead = 0
        WHERE id = ?
      `).bind(rating, feedback || null, existing.id).run();
    } else {
      // Create new rating
      const ratingId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO LessonRating (id, lessonId, studentId, rating, comment, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(ratingId, lessonId, session.id, rating, feedback || null, now).run();
    }

    return c.json(successResponse({
      message: 'Rating saved successfully',
      rating,
      feedback
    }));

  } catch (error: any) {
    console.error('[Submit Rating] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default ratings;
