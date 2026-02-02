import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const explore = new Hono<{ Bindings: Bindings }>();

// GET /explore/academies - Browse all academies
explore.get('/academies', async (c) => {
  try {
    const result = await c.env.DB
      .prepare(`
        SELECT 
          a.*,
          COUNT(DISTINCT c.id) as classCount,
          u.firstName as ownerFirstName,
          u.lastName as ownerLastName
        FROM Academy a
        LEFT JOIN Class c ON a.id = c.academyId
        LEFT JOIN User u ON a.ownerId = u.id
        GROUP BY a.id
        ORDER BY a.createdAt DESC
      `)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Explore Academies] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /explore/academies/:id/classes - Get classes for academy
explore.get('/academies/:id/classes', async (c) => {
  try {
    const academyId = c.req.param('id');

    const result = await c.env.DB
      .prepare(`
        SELECT 
          c.id, c.name, c.slug, c.description, c.academyId, c.teacherId, c.createdAt,
          a.feedbackEnabled, c.whatsappGroupLink, c.monthlyPrice, c.oneTimePrice, c.zoomAccountId, c.maxStudents, c.startDate,
          a.name as academyName,
          u.firstName as teacherFirstName,
          u.lastName as teacherLastName,
          COUNT(DISTINCT l.id) as lessonCount
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN Lesson l ON c.id = l.classId
        WHERE c.academyId = ?
        GROUP BY c.id
        ORDER BY c.createdAt DESC
      `)
      .bind(academyId)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Explore Academy Classes] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /explore/academies/:id/teachers - Get teachers for academy
explore.get('/academies/:id/teachers', async (c) => {
  try {
    const academyId = c.req.param('id');

    const result = await c.env.DB
      .prepare(`
        SELECT 
          u.id, u.firstName, u.lastName, u.email,
          COUNT(DISTINCT c.id) as classCount
        FROM Teacher t
        JOIN User u ON t.userId = u.id
        LEFT JOIN Class c ON u.id = c.teacherId AND c.academyId = ?
        WHERE t.academyId = ?
        GROUP BY u.id
        ORDER BY u.lastName, u.firstName
      `)
      .bind(academyId, academyId)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Explore Academy Teachers] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /explore/enrolled-academies/classes - Get classes from enrolled academies
explore.get('/enrolled-academies/classes', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can access this'), 403);
    }

    // Get classes from academies where student has APPROVED enrollments
    // but exclude classes they're already enrolled in
    const result = await c.env.DB
      .prepare(`
        SELECT DISTINCT
          c.*,
          a.name as academyName,
          u.firstName as teacherFirstName,
          u.lastName as teacherLastName,
          ce2.status as enrollmentStatus
        FROM ClassEnrollment ce1
        JOIN Class c1 ON ce1.classId = c1.id
        JOIN Academy a ON c1.academyId = a.id
        JOIN Class c ON a.id = c.academyId
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN ClassEnrollment ce2 ON c.id = ce2.classId AND ce2.userId = ?
        WHERE ce1.userId = ? 
          AND ce1.status = 'APPROVED'
          AND (ce2.id IS NULL OR ce2.status != 'APPROVED')
        ORDER BY a.name, c.name
      `)
      .bind(session.id, session.id)
      .all();

    // Map results to include full teacher name
    const classes = (result.results || []).map((c: any) => ({
      ...c,
      teacherName: c.teacherFirstName && c.teacherLastName 
        ? `${c.teacherFirstName} ${c.teacherLastName}`
        : c.teacherFirstName || c.teacherLastName || 'Sin profesor asignado'
    }));

    // Get active streams for all enrolled classes
    const enrolledClasses = await c.env.DB
      .prepare(`
        SELECT classId 
        FROM ClassEnrollment 
        WHERE userId = ? AND status = 'APPROVED'
      `)
      .bind(session.id)
      .all();

    const enrolledClassIds = (enrolledClasses.results || []).map((e: any) => e.classId);

    // Fetch active live streams for enrolled classes
    if (enrolledClassIds.length > 0) {
      const placeholders = enrolledClassIds.map(() => '?').join(',');
      const activeStreams = await c.env.DB
        .prepare(`
          SELECT 
            ls.*,
            c.name as className,
            u.firstName as teacherFirstName,
            u.lastName as teacherLastName
          FROM LiveStream ls
          JOIN Class c ON ls.classId = c.id
          LEFT JOIN User u ON ls.teacherId = u.id
          WHERE ls.classId IN (${placeholders}) 
            AND ls.status IN ('scheduled', 'active', 'LIVE')
          ORDER BY ls.startedAt DESC
        `)
        .bind(...enrolledClassIds)
        .all();

      // Group streams by classId
      const streamsByClass = (activeStreams.results || []).reduce((acc: any, stream: any) => {
        if (!acc[stream.classId]) {
          acc[stream.classId] = [];
        }
        acc[stream.classId].push({
          ...stream,
          teacherName: stream.teacherFirstName && stream.teacherLastName
            ? `${stream.teacherFirstName} ${stream.teacherLastName}`
            : 'Profesor',
          status: 'LIVE'
        });
        return acc;
      }, {});

      // Add activeStreams to each class
      classes.forEach((c: any) => {
        c.activeStreams = streamsByClass[c.id] || [];
      });
    }

    return c.json(successResponse(classes));
  } catch (error: any) {
    console.error('[Enrolled Academies Classes] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /explore/my-live-streams - Get active streams for student's enrolled classes
explore.get('/my-live-streams', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can access this'), 403);
    }

    // Get active streams for all enrolled classes
    const activeStreams = await c.env.DB
      .prepare(`
        SELECT 
          ls.*,
          c.name as className,
          u.firstName as teacherFirstName,
          u.lastName as teacherLastName
        FROM LiveStream ls
        JOIN Class c ON ls.classId = c.id
        JOIN ClassEnrollment ce ON ce.classId = c.id
        LEFT JOIN User u ON ls.teacherId = u.id
        WHERE ce.userId = ?
          AND ce.status = 'APPROVED'
          AND ls.status IN ('active', 'LIVE')
        ORDER BY ls.startedAt DESC
      `)
      .bind(session.id)
      .all();

    // Format streams
    const streams = (activeStreams.results || []).map((stream: any) => ({
      ...stream,
      teacherName: stream.teacherFirstName && stream.teacherLastName
        ? `${stream.teacherFirstName} ${stream.teacherLastName}`
        : 'Profesor'
    }));

    return c.json(successResponse(streams));
  } catch (error: any) {
    console.error('[My Live Streams] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default explore;