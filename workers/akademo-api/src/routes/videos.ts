import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { validateBody, videoProgressSchema } from '../lib/validation';

const videos = new Hono<{ Bindings: Bindings }>();

// POST /videos/progress - Update video watch progress
videos.post('/progress', validateBody(videoProgressSchema), async (c) => {
  try {
    const session = await requireAuth(c);
    const { videoId, studentId, currentPositionSeconds, watchTimeElapsed } = await c.req.json();

    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can track progress'), 403);
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

    const maxWatchTime = (((video as any).durationSeconds as number) || 0) * (((video as any).maxWatchTimeMultiplier as number) || 2);
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
    return c.json(errorResponse('Internal server error'), 500);
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
    return c.json(errorResponse('Internal server error'), 500);
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
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /videos/completion - Report video completion signals for screen-recording detection
// Called by frontend when a video ends naturally.
// Tracks 4 signals: watchedFull, noPause, noTabSwitch, realtimeWatch.
// If all 4 fire, completion is marked "suspicious". Every 3 suspicious completions → +1 suspicionCount.
videos.post('/completion', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'STUDENT') {
      return c.json(successResponse({ flagged: false })); // silent for non-students
    }

    const body = await c.req.json();
    const { videoId, watchedFull, noPause, noTabSwitch, realtimeWatch } = body;

    if (!videoId) {
      return c.json(errorResponse('videoId required'), 400);
    }

    // Verify enrollment
    const video = await c.env.DB
      .prepare(`
        SELECT v.durationSeconds, l.classId
        FROM Video v
        JOIN Lesson l ON v.lessonId = l.id
        WHERE v.id = ?
      `)
      .bind(videoId)
      .first() as any;

    if (!video) {
      return c.json(errorResponse('Video not found'), 404);
    }

    const enrollment = await c.env.DB
      .prepare('SELECT id FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = ?')
      .bind(session.id, (video as any).classId, 'APPROVED')
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Not enrolled'), 403);
    }

    // Evaluate: are ALL 4 signals true?
    const isSuspicious = watchedFull === true && noPause === true && noTabSwitch === true && realtimeWatch === true;
    const now = new Date().toISOString();

    // Read existing play state to know previous suspicion status
    const existing = await c.env.DB
      .prepare('SELECT id, suspiciousCompletion FROM VideoPlayState WHERE videoId = ? AND studentId = ?')
      .bind(videoId, session.id)
      .first() as any;

    const wasSuspiciousBefore = existing?.suspiciousCompletion === 1;

    if (existing) {
      await c.env.DB
        .prepare('UPDATE VideoPlayState SET suspiciousCompletion = ?, completedAt = ? WHERE id = ?')
        .bind(isSuspicious ? 1 : 0, now, existing.id)
        .run();
    } else {
      // No play state yet (e.g. unlimited user who just watches) — create minimal record
      await c.env.DB
        .prepare(`
          INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, sessionStartTime, lastWatchedAt, createdAt, updatedAt, status, suspiciousCompletion, completedAt)
          VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?, 'ACTIVE', ?, ?)
        `)
        .bind(crypto.randomUUID(), videoId, session.id, now, now, now, now, isSuspicious ? 1 : 0, now)
        .run();
    }

    // Only evaluate the threshold if this is a NEW suspicious completion
    // (avoids re-triggering if student re-watches the same video)
    let suspicionTriggered = false;
    if (isSuspicious && !wasSuspiciousBefore) {
      const countRow = await c.env.DB
        .prepare('SELECT COUNT(*) as cnt FROM VideoPlayState WHERE studentId = ? AND suspiciousCompletion = 1')
        .bind(session.id)
        .first() as any;

      const totalSuspicious: number = countRow?.cnt || 0;

      // Every 3 suspicious completions triggers +1 suspicionCount
      if (totalSuspicious > 0 && totalSuspicious % 3 === 0) {
        await c.env.DB
          .prepare('UPDATE User SET suspicionCount = suspicionCount + 1 WHERE id = ?')
          .bind(session.id)
          .run();
        suspicionTriggered = true;
        console.log(`[SuspicionCounter] Student ${session.id} hit ${totalSuspicious} suspicious completions → suspicionCount +1`);
      }
    }

    return c.json(successResponse({ flagged: isSuspicious, suspicionTriggered }));
  } catch (error: any) {
    console.error('[Video Completion] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
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
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default videos;
