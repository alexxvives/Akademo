import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse, teacherCanAccessClass } from '../lib/utils';
import { validateBody, videoProgressSchema } from '../lib/validation';
import { rateLimit } from '../lib/rate-limit';
import { isAccessBlocked } from '../lib/payment-utils';

// Rate limiter for progress resets: 3 resets per hour per student
const progressResetRateLimit = rateLimit({
  prefix: 'progress-reset',
  windowSec: 3600,       // 1 hour
  maxRequests: 3,        // Max 3 resets per hour
  // Uses default keyFn (CF-Connecting-IP) — runs before auth
});

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
        SELECT v.durationSeconds, l.maxWatchTimeMultiplier, l.classId, l.availableFrom, l.availableUntil
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

    // Block students without signed document or with overdue payments
    if (await isAccessBlocked(c.env.DB, session.id, video.classId as string)) {
      return c.json(errorResponse('Acceso bloqueado. Firma el documento y regulariza tu situación de pago.'), 403);
    }

    // Check if play state exists
    const existing = await c.env.DB
      .prepare('SELECT * FROM VideoPlayState WHERE videoId = ? AND studentId = ?')
      .bind(videoId, session.id)
      .first() as any;

    // Window expiry: if past availableUntil, block this student immediately
    if ((video as any).availableUntil) {
      const windowEnd = new Date((video as any).availableUntil as string).getTime();
      if (Date.now() > windowEnd) {
        if (existing && existing.status !== 'BLOCKED') {
          await c.env.DB
            .prepare("UPDATE VideoPlayState SET status = 'BLOCKED', updatedAt = ? WHERE id = ?")
            .bind(new Date().toISOString(), existing.id)
            .run();
        }
        return c.json(errorResponse('El período de acceso ha finalizado'), 403);
      }
    }

    // Window fresh-start: if a new window has started since the student last watched,
    // reset their watch time so they get a full slate for the new period.
    if (existing && (video as any).availableFrom) {
      const windowStart = new Date((video as any).availableFrom as string).getTime();
      const lastWatched = existing.lastWatchedAt ? new Date(existing.lastWatchedAt).getTime() : 0;
      if (lastWatched < windowStart) {
        await c.env.DB
          .prepare("UPDATE VideoPlayState SET totalWatchTimeSeconds = 0, status = 'ACTIVE', updatedAt = ? WHERE id = ?")
          .bind(new Date().toISOString(), existing.id)
          .run();
        existing.totalWatchTimeSeconds = 0;
        existing.status = 'ACTIVE';
      }
    }

    // Check for active time extensions for this student
    const nowExtCheck = new Date().toISOString();
    const extRow = await c.env.DB
      .prepare(`SELECT COALESCE(SUM(extraSeconds), 0) as total FROM VideoPlayExtension WHERE videoId = ? AND studentId = ? AND validFrom <= ? AND validUntil >= ?`)
      .bind(videoId, session.id, nowExtCheck, nowExtCheck)
      .first() as any;
    const extensionSeconds = Number(extRow?.total) || 0;
    const maxWatchTime = (((video as any).durationSeconds as number) || 0) * (((video as any).maxWatchTimeMultiplier as number) || 2) + extensionSeconds;
    const now = new Date().toISOString();

    // Server-side clamp: cap watchTimeElapsed to a reasonable interval.
    // Typical heartbeat = 30s. Allow max 35s per report (30s + 5s jitter).
    // This prevents both zero-reporting (watching forever) and inflation attacks.
    const MAX_HEARTBEAT_SECONDS = 35;
    let clampedWatchTime = Math.min(Math.max(watchTimeElapsed, 0), MAX_HEARTBEAT_SECONDS);

    // Additional validation: if we have a previous record, clamp against real elapsed time
    if (existing && existing.lastWatchedAt) {
      const lastUpdate = new Date(existing.lastWatchedAt).getTime();
      const realElapsed = Math.max(0, (Date.now() - lastUpdate) / 1000);
      // Allow up to realElapsed + 5s buffer (clock skew)
      clampedWatchTime = Math.min(clampedWatchTime, realElapsed + 5);
    }

    if (existing) {
      // Atomic update: use SQL addition to avoid read-modify-write race condition
      // when multiple tabs send heartbeats concurrently for the same video.
      await c.env.DB
        .prepare(`
          UPDATE VideoPlayState 
          SET totalWatchTimeSeconds = totalWatchTimeSeconds + ?,
              lastPositionSeconds = ?,
              lastWatchedAt = ?,
              updatedAt = ?,
              status = CASE WHEN (totalWatchTimeSeconds + ?) >= ? THEN 'BLOCKED' ELSE status END
          WHERE id = ?
        `)
        .bind(
          clampedWatchTime,
          currentPositionSeconds || 0,
          now,
          now,
          clampedWatchTime,
          maxWatchTime,
          existing.id
        )
        .run();

      // Re-read to get the updated values for the response
      const updated = await c.env.DB
        .prepare('SELECT totalWatchTimeSeconds, lastPositionSeconds, sessionStartTime, status FROM VideoPlayState WHERE id = ?')
        .bind(existing.id)
        .first() as any;

      return c.json(successResponse({
        message: 'Progress saved',
        playState: {
          totalWatchTimeSeconds: updated?.totalWatchTimeSeconds ?? 0,
          lastPositionSeconds: updated?.lastPositionSeconds ?? 0,
          sessionStartTime: updated?.sessionStartTime ?? existing.sessionStartTime,
          status: updated?.status ?? 'ACTIVE'
        }
      }));
    } else {
      // Create new play state
      const playStateId = crypto.randomUUID();
      const status = clampedWatchTime >= maxWatchTime ? 'BLOCKED' : 'ACTIVE';

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
          clampedWatchTime,
          currentPositionSeconds || 0,
          now,
          now,
          now,
          now,
          status
        )
        .run();

      const newPlayState = {
        totalWatchTimeSeconds: clampedWatchTime,
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Video Progress] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /videos/progress/reset - Reset video progress (rate-limited: 3/hour)
videos.post('/progress/reset', progressResetRateLimit, async (c) => {
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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

    // Allow negative values so admins can grant extra time beyond the normal limit.
    // Negative totalWatchTimeSeconds means the student has a "credit" of extra viewing time.
    const safeTotalWatchTime = Number(totalWatchTimeSeconds);
    if (!Number.isFinite(safeTotalWatchTime)) {
      return c.json(errorResponse('Invalid totalWatchTimeSeconds value'), 400);
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
    if (session.role === 'TEACHER' && !(await teacherCanAccessClass(c.env.DB, session.id, video.classId as string))) {
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

    const nowExtAdm = new Date().toISOString();
    const extRowAdm = await c.env.DB
      .prepare(`SELECT COALESCE(SUM(extraSeconds), 0) as total FROM VideoPlayExtension WHERE videoId = ? AND studentId = ? AND validFrom <= ? AND validUntil >= ?`)
      .bind(videoId, studentId, nowExtAdm, nowExtAdm)
      .first() as any;
    const extSecondsAdm = Number(extRowAdm?.total) || 0;
    const maxWatchTime = (video.durationSeconds || 0) * (video.maxWatchTimeMultiplier || 2) + extSecondsAdm;
    const newStatus = safeTotalWatchTime >= maxWatchTime ? 'BLOCKED' : 'ACTIVE';
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
        .bind(safeTotalWatchTime, newStatus, now, existing.id)
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
          safeTotalWatchTime,
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Admin Update Time] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /videos/extensions - Grant extra watch time to a student within a time window
videos.post('/extensions', async (c) => {
  try {
    const session = await requireAuth(c);
    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    const { videoId, studentId, extraMinutes, validFrom, validUntil } = await c.req.json();
    if (!videoId || !studentId || !extraMinutes || !validFrom || !validUntil) {
      return c.json(errorResponse('videoId, studentId, extraMinutes, validFrom, validUntil required'), 400);
    }
    const extraSeconds = Math.round(Number(extraMinutes) * 60);
    if (!Number.isFinite(extraSeconds) || extraSeconds <= 0) {
      return c.json(errorResponse('extraMinutes must be a positive number'), 400);
    }
    if (new Date(validFrom) >= new Date(validUntil)) {
      return c.json(errorResponse('validFrom must be before validUntil'), 400);
    }
    const video = await c.env.DB
      .prepare(`SELECT v.id, l.classId, c.teacherId, a.ownerId FROM Video v JOIN Lesson l ON v.lessonId = l.id JOIN Class c ON l.classId = c.id JOIN Academy a ON c.academyId = a.id WHERE v.id = ?`)
      .bind(videoId).first() as any;
    if (!video) return c.json(errorResponse('Video not found'), 404);
    if (session.role === 'TEACHER' && !(await teacherCanAccessClass(c.env.DB, session.id, video.classId as string))) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    if (session.role === 'ACADEMY' && video.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await c.env.DB
      .prepare(`INSERT INTO VideoPlayExtension (id, videoId, studentId, extraSeconds, validFrom, validUntil, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, videoId, studentId, extraSeconds, validFrom, validUntil, now)
      .run();
    // If student is currently BLOCKED but is now within extension window, unblock them
    const nowCheck = new Date().toISOString();
    if (validFrom <= nowCheck && validUntil >= nowCheck) {
      const playState = await c.env.DB
        .prepare(`SELECT id, totalWatchTimeSeconds, status FROM VideoPlayState WHERE videoId = ? AND studentId = ?`)
        .bind(videoId, studentId).first() as any;
      if (playState && playState.status === 'BLOCKED') {
        const videoInfo = await c.env.DB
          .prepare(`SELECT v.durationSeconds, l.maxWatchTimeMultiplier FROM Video v JOIN Lesson l ON v.lessonId = l.id WHERE v.id = ?`)
          .bind(videoId).first() as any;
        const baseMax = (videoInfo?.durationSeconds || 0) * (videoInfo?.maxWatchTimeMultiplier || 2);
        const allExtRow = await c.env.DB
          .prepare(`SELECT COALESCE(SUM(extraSeconds), 0) as total FROM VideoPlayExtension WHERE videoId = ? AND studentId = ? AND validFrom <= ? AND validUntil >= ?`)
          .bind(videoId, studentId, nowCheck, nowCheck).first() as any;
        const effectiveMax = baseMax + (Number(allExtRow?.total) || 0);
        if (playState.totalWatchTimeSeconds < effectiveMax) {
          await c.env.DB
            .prepare(`UPDATE VideoPlayState SET status = 'ACTIVE', updatedAt = ? WHERE id = ?`)
            .bind(nowCheck, playState.id).run();
        }
      }
    }
    return c.json(successResponse({ id, extraSeconds, validFrom, validUntil }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Extensions] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// DELETE /videos/extensions/:id - Remove an extension
videos.delete('/extensions/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    const extId = c.req.param('id');
    const ext = await c.env.DB
      .prepare(`SELECT vpe.id, vpe.videoId, vpe.studentId, l.classId, a.ownerId FROM VideoPlayExtension vpe JOIN Video v ON vpe.videoId = v.id JOIN Lesson l ON v.lessonId = l.id JOIN Class c ON l.classId = c.id JOIN Academy a ON c.academyId = a.id WHERE vpe.id = ?`)
      .bind(extId).first() as any;
    if (!ext) return c.json(errorResponse('Extension not found'), 404);
    if (session.role === 'TEACHER' && !(await teacherCanAccessClass(c.env.DB, session.id, ext.classId as string))) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    if (session.role === 'ACADEMY' && ext.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    await c.env.DB.prepare(`DELETE FROM VideoPlayExtension WHERE id = ?`).bind(extId).run();
    return c.json(successResponse({ message: 'Extension deleted' }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Extensions Delete] Error:', error);
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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

      // Block students without signed document or with overdue payments
      if (await isAccessBlocked(c.env.DB, session.id, video.classId as string)) {
        return c.json(errorResponse('Acceso bloqueado. Firma el documento y regulariza tu situación de pago.'), 403);
      }

      // Get play state
      const playState = await c.env.DB
        .prepare('SELECT * FROM VideoPlayState WHERE videoId = ? AND studentId = ?')
        .bind(videoId, session.id)
        .first();

      return c.json(successResponse({ ...video, playState }));
    } else if (session.role === 'TEACHER') {
      if (!(await teacherCanAccessClass(c.env.DB, session.id, video.classId as string))) {
        return c.json(errorResponse('Not authorized'), 403);
      }
    } else if (session.role === 'ACADEMY') {
      if (video.ownerId !== session.id) {
        return c.json(errorResponse('Not authorized'), 403);
      }
    }

    return c.json(successResponse(video));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Get Video] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default videos;
