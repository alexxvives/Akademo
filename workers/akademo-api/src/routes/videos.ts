import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const videos = new Hono<{ Bindings: Bindings }>();

// POST /videos/progress - Update video watch progress
videos.post('/progress', async (c) => {
  try {
    const session = await requireAuth(c);
    const { videoId, currentTime, durationSeconds, completed } = await c.req.json();

    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can track progress'), 403);
    }

    if (!videoId || currentTime === undefined) {
      return c.json(errorResponse('videoId and currentTime required'), 400);
    }

    // Check if play state exists
    const existing = await c.env.DB
      .prepare('SELECT id FROM VideoPlayState WHERE videoId = ? AND studentId = ?')
      .bind(videoId, session.id)
      .first();

    if (existing) {
      // Update existing
      await c.env.DB
        .prepare('UPDATE VideoPlayState SET currentTime = ?, lastWatched = ?, completed = ? WHERE id = ?')
        .bind(currentTime, new Date().toISOString(), completed ? 1 : 0, existing.id)
        .run();
    } else {
      // Create new
      const playStateId = crypto.randomUUID();
      await c.env.DB
        .prepare('INSERT INTO VideoPlayState (id, videoId, studentId, currentTime, lastWatched, completed) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(playStateId, videoId, session.id, currentTime, new Date().toISOString(), completed ? 1 : 0)
        .run();
    }

    return c.json(successResponse({ message: 'Progress saved' }));
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
