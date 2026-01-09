import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const live = new Hono<{ Bindings: Bindings }>();

// GET /live - Get live streams for a class
live.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    const { classId } = c.req.query();

    if (!classId) {
      return c.json(errorResponse('classId required'), 400);
    }

    const result = await c.env.DB
      .prepare(`
        SELECT ls.*, u.firstName, u.lastName
        FROM LiveStream ls
        JOIN User u ON ls.teacherId = u.id
        WHERE ls.classId = ? AND ls.status IN ('active', 'scheduled')
        ORDER BY ls.createdAt DESC
      `)
      .bind(classId)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Get Live Streams] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /live - Create live stream (placeholder - Zoom integration needs env setup)
live.post('/', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { classId, title } = await c.req.json();

    if (!classId || !title) {
      return c.json(errorResponse('classId and title required'), 400);
    }

    // Get class info
    const classInfo = await c.env.DB
      .prepare('SELECT c.name, u.firstName, u.lastName FROM Class c JOIN User u ON c.teacherId = u.id WHERE c.id = ?')
      .bind(classId)
      .first();

    if (!classInfo) {
      return c.json(errorResponse('Class not found'), 404);
    }

    // Create livestream record
    const streamId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB
      .prepare('INSERT INTO LiveStream (id, classId, teacherId, title, status, zoomLink, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(streamId, classId, session.id, title, 'scheduled', '', now)
      .run();

    const stream = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    return c.json(successResponse(stream), 201);
  } catch (error: any) {
    console.error('[Create Live Stream] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /live/history - Get stream history
live.get('/history', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    let query = '';
    let params: any[] = [];

    if (session.role === 'ACADEMY') {
      query = `
        SELECT 
          ls.*,
          c.name as className,
          u.firstName || ' ' || u.lastName as teacherName
        FROM LiveStream ls
        JOIN Class c ON ls.classId = c.id
        JOIN User u ON ls.teacherId = u.id
        JOIN Academy a ON c.academyId = a.id
        WHERE a.ownerId = ?
        ORDER BY ls.createdAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'TEACHER') {
      query = `
        SELECT 
          ls.*,
          c.name as className
        FROM LiveStream ls
        JOIN Class c ON ls.classId = c.id
        WHERE ls.teacherId = ?
        ORDER BY ls.createdAt DESC
      `;
      params = [session.id];
    } else {
      query = `
        SELECT 
          ls.*,
          c.name as className,
          u.firstName || ' ' || u.lastName as teacherName
        FROM LiveStream ls
        JOIN Class c ON ls.classId = c.id
        JOIN User u ON ls.teacherId = u.id
        ORDER BY ls.createdAt DESC
      `;
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Live History] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /live/active - Get active streams for student
live.get('/active', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can access this'), 403);
    }

    const result = await c.env.DB
      .prepare(`
        SELECT 
          ls.*,
          c.name as className,
          u.firstName || ' ' || u.lastName as teacherName
        FROM LiveStream ls
        JOIN Class c ON ls.classId = c.id
        JOIN User u ON ls.teacherId = u.id
        JOIN ClassEnrollment ce ON ce.classId = c.id
        WHERE ce.userId = ? 
          AND ce.status = 'APPROVED'
          AND ls.status = 'active'
        ORDER BY ls.createdAt DESC
      `)
      .bind(session.id)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Active Streams] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /live/:id - Get stream details
live.get('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');

    const stream = await c.env.DB
      .prepare(`
        SELECT ls.*, u.firstName, u.lastName, c.name as className
        FROM LiveStream ls
        JOIN User u ON ls.teacherId = u.id
        JOIN Class c ON ls.classId = c.id
        WHERE ls.id = ?
      `)
      .bind(streamId)
      .first();

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    return c.json(successResponse(stream));
  } catch (error: any) {
    console.error('[Get Stream] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PATCH /live/:id - Update stream
live.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');
    const { status, title } = await c.req.json();

    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Verify ownership
    const stream = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    if (session.role === 'TEACHER' && stream.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const now = new Date().toISOString();
    let query = 'UPDATE LiveStream SET ';
    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'active') {
        updates.push('startedAt = ?');
        params.push(now);
      } else if (status === 'ended') {
        updates.push('endedAt = ?');
        params.push(now);
      }
    }

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }

    if (updates.length === 0) {
      return c.json(errorResponse('No updates provided'), 400);
    }

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(streamId);

    await c.env.DB.prepare(query).bind(...params).run();

    const updated = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    return c.json(successResponse(updated));
  } catch (error: any) {
    console.error('[Update Stream] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// DELETE /live/:id - End stream
live.delete('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');

    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Verify ownership
    const stream = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    if (session.role === 'TEACHER' && stream.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Mark as ended instead of deleting
    const now = new Date().toISOString();
    await c.env.DB
      .prepare('UPDATE LiveStream SET status = ?, endedAt = ? WHERE id = ?')
      .bind('ended', now, streamId)
      .run();

    return c.json(successResponse({ message: 'Stream ended' }));
  } catch (error: any) {
    console.error('[Delete Stream] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default live;
