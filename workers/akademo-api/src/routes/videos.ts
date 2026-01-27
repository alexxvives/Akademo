import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const videos = new Hono<{ Bindings: Bindings }>();

// POST /videos/progress - Update video watch progress
videos.post('/progress', async (c) => {
  try {
    const session = await requireAuth(c);
    const { videoId, studentId, currentPositionSeconds, watchTimeElapsed } = await c.req.json();

    console.log('[VideoProgress] Request received:', {
      sessionId: session.id,
      sessionRole: session.role,
      videoId,
      studentId,
      currentPositionSeconds,
      watchTimeElapsed
    });

    if (session.role !== 'STUDENT') {
      console.log('[VideoProgress] Rejected - not a student role:', session.role);
      return c.json(errorResponse('Only students can track progress'), 403);
    }

    if (!videoId || watchTimeElapsed === undefined) {
      console.log('[VideoProgress] Rejected - missing required fields');
      return c.json(errorResponse('videoId and watchTimeElapsed required'), 400);
    }

    // Get video details to check duration and max watch time
    const video = await c.env.DB
      .prepare(`
        SELECT v.durationSeconds, l.maxWatchTimeMultiplier, l.classId
        FROM Video v
        JOIN Lesson l ON v.lessonId = l.id
        WHERE v.id = ?
      `)
      .bind(videoId)
      .first();

    if (!video) {
      return c.json(errorResponse('Video not found'), 404);
    }

    // Verify student is enrolled
    const enrollment = await c.env.DB
      .prepare('SELECT * FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = ?')
      .bind(session.id, video.classId, 'APPROVED')
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Not enrolled in this class'), 403);
    }

    // Check if play state exists
    const existing = await c.env.DB
      .prepare('SELECT * FROM VideoPlayState WHERE videoId = ? AND studentId = ?')
      .bind(videoId, session.id)
      .first() as any;

    const maxWatchTime = (video.durationSeconds || 0) * (video.maxWatchTimeMultiplier || 2);
    const now = new Date().toISOString();

    if (existing) {
      // Calculate new total watch time
      const newTotalWatchTime = (existing.totalWatchTimeSeconds || 0) + watchTimeElapsed;
      
      // Check if exceeding max watch time
      const status = newTotalWatchTime >= maxWatchTime ? 'BLOCKED' : (existing.status || 'ACTIVE');

      // Update existing
      await c.env.DB
        .prepare(`
          UPDATE VideoPlayState 
          SET totalWatchTimeSeconds = ?,
              lastPositionSeconds = ?,
              lastWatchedAt = ?,
              updatedAt = ?,
              status = ?
          WHERE id = ?
        `)
        .bind(
          newTotalWatchTime,
          currentPositionSeconds || 0,
          now,
          now,
          status,
          existing.id
        )
        .run();

      const updatedPlayState = {
        totalWatchTimeSeconds: newTotalWatchTime,
        lastPositionSeconds: currentPositionSeconds || 0,
        sessionStartTime: existing.sessionStartTime,
        status
      };

      return c.json(successResponse({
        message: 'Progress saved',
        playState: updatedPlayState
      }));
    } else {
      // Create new play state
      const playStateId = crypto.randomUUID();
      const status = watchTimeElapsed >= maxWatchTime ? 'BLOCKED' : 'ACTIVE';

      await c.env.DB
        .prepare(`
          INSERT INTO VideoPlayState (
            id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds,
            sessionStartTime, lastWatchedAt, createdAt, updatedAt, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          playStateId,
          videoId,
          session.id,
          watchTimeElapsed,
          currentPositionSeconds || 0,
          now,
          now,
          now,
          now,
          status
        )
        .run();

      const newPlayState = {
        totalWatchTimeSeconds: watchTimeElapsed,
        lastPositionSeconds: currentPositionSeconds || 0,
        sessionStartTime: now,
        status
      };

      return c.json(successResponse({
        message: 'Progress saved',
        playState: newPlayState
      }));
    }
  } catch (error: any) {
    console.error('[Video Progress] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /videos/progress/reset - Reset video progress
videos.post('/progress/reset', async (c) => {
  try {
    const session = await requireAuth(c);
    const { videoId } = await c.req.json();

    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can reset progress'), 403);
    }

    if (!videoId) {
      return c.json(errorResponse('videoId required'), 400);
    }

    await c.env.DB
      .prepare('DELETE FROM VideoPlayState WHERE videoId = ? AND studentId = ?')
      .bind(videoId, session.id)
      .run();

    return c.json(successResponse({ message: 'Progress reset' }));
  } catch (error: any) {
    console.error('[Reset Progress] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /videos/progress/admin-update - Admin/teacher endpoint to update student video time
videos.post('/progress/admin-update', async (c) => {
  try {
    const session = await requireAuth(c);
    const { studentId, videoId, totalWatchTimeSeconds } = await c.req.json();

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    if (!studentId || !videoId || totalWatchTimeSeconds === undefined) {
      return c.json(errorResponse('studentId, videoId, and totalWatchTimeSeconds required'), 400);
    }

    // Get video and lesson details to check authorization
    const video = await c.env.DB
      .prepare(`
        SELECT v.id, v.title, v.lessonId, v.uploadId, v.durationSeconds, v.createdAt, 
               l.classId, l.maxWatchTimeMultiplier, c.teacherId, a.ownerId
        FROM Video v
        JOIN Lesson l ON v.lessonId = l.id
        JOIN Class c ON l.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE v.id = ?
      `)
      .bind(videoId)
      .first() as any;

    if (!video) {
      return c.json(errorResponse('Video not found'), 404);
    }

    // Check authorization
    if (session.role === 'TEACHER' && video.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    if (session.role === 'ACADEMY' && video.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Check if play state exists
    const existing = await c.env.DB
      .prepare('SELECT * FROM VideoPlayState WHERE videoId = ? AND studentId = ?')
      .bind(videoId, studentId)
      .first() as any;

    const maxWatchTime = (video.durationSeconds || 0) * (video.maxWatchTimeMultiplier || 2);
    const newStatus = totalWatchTimeSeconds >= maxWatchTime ? 'BLOCKED' : 'ACTIVE';
    const now = new Date().toISOString();

    if (existing) {
      // Update existing
      await c.env.DB
        .prepare(`
          UPDATE VideoPlayState 
          SET totalWatchTimeSeconds = ?,
              status = ?,
              updatedAt = ?
          WHERE id = ?
        `)
        .bind(totalWatchTimeSeconds, newStatus, now, existing.id)
        .run();
    } else {
      // Create new play state
      const playStateId = crypto.randomUUID();
      await c.env.DB
        .prepare(`
          INSERT INTO VideoPlayState (
            id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds,
            sessionStartTime, lastWatchedAt, createdAt, updatedAt, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          playStateId,
          videoId,
          studentId,
          totalWatchTimeSeconds,
          0,
          now,
          now,
          now,
          now,
          newStatus
        )
        .run();
    }

    return c.json(successResponse({ message: 'Time updated successfully' }));
  } catch (error: any) {
    console.error('[Admin Update Time] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /videos/:id - Get video details
videos.get('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const videoId = c.req.param('id');

    const video = await c.env.DB
      .prepare(`
        SELECT 
          v.*,
          u.fileName, u.fileSize, u.mimeType, u.storagePath,
          l.classId,
          c.teacherId,
          a.ownerId
        FROM Video v
        LEFT JOIN Upload u ON v.uploadId = u.id
        JOIN Lesson l ON v.lessonId = l.id
        JOIN Class c ON l.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE v.id = ?
      `)
      .bind(videoId)
      .first();

    if (!video) {
      return c.json(errorResponse('Video not found'), 404);
    }

    // Check access
    if (session.role === 'STUDENT') {
      const enrollment = await c.env.DB
        .prepare('SELECT * FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = ?')
        .bind(session.id, video.classId, 'APPROVED')
        .first();

      if (!enrollment) {
        return c.json(errorResponse('Not enrolled'), 403);
      }

      // Get play state
      const playState = await c.env.DB
        .prepare('SELECT * FROM VideoPlayState WHERE videoId = ? AND studentId = ?')
        .bind(videoId, session.id)
        .first();

      return c.json(successResponse({ ...video, playState }));
    } else if (session.role === 'TEACHER') {
      if (video.teacherId !== session.id) {
        return c.json(errorResponse('Not authorized'), 403);
      }
    } else if (session.role === 'ACADEMY') {
      if (video.ownerId !== session.id) {
        return c.json(errorResponse('Not authorized'), 403);
      }
    }

    return c.json(successResponse(video));
  } catch (error: any) {
    console.error('[Get Video] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default videos;
