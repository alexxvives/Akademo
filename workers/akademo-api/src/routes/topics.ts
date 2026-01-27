import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const topics = new Hono<{ Bindings: Bindings }>();

// GET /topics - List topics for a class
topics.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    const classId = c.req.query('classId');

    if (!classId) {
      return c.json(errorResponse('classId is required'), 400);
    }

    // Verify access to the class
    const classRecord = await c.env.DB.prepare(`
      SELECT c.*, a.ownerId as academyOwnerId
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      WHERE c.id = ?
    `).bind(classId).first();

    if (!classRecord) {
      return c.json(errorResponse(`Class ${classId} not found`), 404);
    }

    // Check permissions
    let hasAccess = false;
    if (session.role === 'ADMIN') {
      hasAccess = true;
    } else if (session.role === 'ACADEMY') {
      hasAccess = classRecord.academyOwnerId === session.id;
    } else if (session.role === 'TEACHER') {
      hasAccess = classRecord.teacherId === session.id;
    } else if (session.role === 'STUDENT') {
      const enrollment = await c.env.DB.prepare(`
        SELECT id FROM ClassEnrollment 
        WHERE userId = ? AND classId = ? AND status = 'APPROVED'
      `).bind(session.id, classId).first();
      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      return c.json(errorResponse(`No access to class ${classId}`), 403);
    }

    // Get topics with lesson count
    const topicsResult = await c.env.DB.prepare(`
      SELECT 
        t.*,
        (SELECT COUNT(*) FROM Lesson l WHERE l.topicId = t.id) as lessonCount
      FROM Topic t
      WHERE t.classId = ?
      ORDER BY t.orderIndex ASC, t.createdAt ASC
    `).bind(classId).all();

    return c.json(successResponse(topicsResult.results || []));
  } catch (error: any) {
    console.error('[List Topics] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /topics - Create a new topic
topics.post('/', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { classId, name } = await c.req.json();

    if (!classId || !name) {
      return c.json(errorResponse('classId and name are required'), 400);
    }

    // Verify access to the class
    const classRecord = await c.env.DB.prepare(`
      SELECT c.*, a.ownerId as academyOwnerId
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      WHERE c.id = ?
    `).bind(classId).first();

    if (!classRecord) {
      return c.json(errorResponse(`Class ${classId} not found`), 404);
    }

    // Check permissions
    if (session.role === 'TEACHER' && classRecord.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    if (session.role === 'ACADEMY' && classRecord.academyOwnerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Get the next order index
    const maxOrder = await c.env.DB.prepare(`
      SELECT MAX(orderIndex) as maxOrder FROM Topic WHERE classId = ?
    `).bind(classId).first() as any;

    const orderIndex = (maxOrder?.maxOrder || 0) + 1;

    // Create topic
    const topicId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO Topic (id, name, classId, orderIndex)
      VALUES (?, ?, ?, ?)
    `).bind(topicId, name, classId, orderIndex).run();

    const newTopic = await c.env.DB.prepare(`
      SELECT * FROM Topic WHERE id = ?
    `).bind(topicId).first();

    return c.json(successResponse(newTopic));
  } catch (error: any) {
    console.error('[Create Topic] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PUT /topics/:id - Update a topic
topics.put('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const topicId = c.req.param('id');
    
    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { name, orderIndex } = await c.req.json();

    // Get topic and verify access
    const topic = await c.env.DB.prepare(`
      SELECT t.*, c.teacherId, a.ownerId as academyOwnerId
      FROM Topic t
      JOIN Class c ON t.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE t.id = ?
    `).bind(topicId).first();

    if (!topic) {
      return c.json(errorResponse('Topic not found'), 404);
    }

    // Check permissions
    if (session.role === 'TEACHER' && topic.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    if (session.role === 'ACADEMY' && topic.academyOwnerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Update topic
    await c.env.DB.prepare(`
      UPDATE Topic 
      SET name = COALESCE(?, name), 
          orderIndex = COALESCE(?, orderIndex)
      WHERE id = ?
    `).bind(name || null, orderIndex ?? null, topicId).run();

    const updated = await c.env.DB.prepare(`
      SELECT * FROM Topic WHERE id = ?
    `).bind(topicId).first();

    return c.json(successResponse(updated));
  } catch (error: any) {
    console.error('[Update Topic] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// DELETE /topics/:id - Delete a topic (moves lessons to "Sin tema")
topics.delete('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const topicId = c.req.param('id');
    
    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Get topic and verify access
    const topic = await c.env.DB.prepare(`
      SELECT t.*, c.teacherId, a.ownerId as academyOwnerId
      FROM Topic t
      JOIN Class c ON t.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE t.id = ?
    `).bind(topicId).first();

    if (!topic) {
      return c.json(errorResponse('Topic not found'), 404);
    }

    // Check permissions
    if (session.role === 'TEACHER' && topic.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    if (session.role === 'ACADEMY' && topic.academyOwnerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Move all lessons in this topic to "Sin tema" (topicId = null)
    await c.env.DB.prepare(`
      UPDATE Lesson SET topicId = NULL WHERE topicId = ?
    `).bind(topicId).run();

    // Delete topic
    await c.env.DB.prepare(`
      DELETE FROM Topic WHERE id = ?
    `).bind(topicId).run();

    return c.json(successResponse({ message: 'Topic deleted' }));
  } catch (error: any) {
    console.error('[Delete Topic] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PUT /topics/:id/reorder - Reorder topics
topics.put('/:id/reorder', async (c) => {
  try {
    const session = await requireAuth(c);
    const topicId = c.req.param('id');
    
    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { newOrderIndex } = await c.req.json();

    if (newOrderIndex === undefined) {
      return c.json(errorResponse('newOrderIndex is required'), 400);
    }

    // Get topic and verify access
    const topic = await c.env.DB.prepare(`
      SELECT t.*, c.teacherId, a.ownerId as academyOwnerId
      FROM Topic t
      JOIN Class c ON t.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE t.id = ?
    `).bind(topicId).first() as any;

    if (!topic) {
      return c.json(errorResponse('Topic not found'), 404);
    }

    // Check permissions
    if (session.role === 'TEACHER' && topic.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    if (session.role === 'ACADEMY' && topic.academyOwnerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Update order indices
    const oldOrderIndex = topic.orderIndex;
    
    if (newOrderIndex > oldOrderIndex) {
      // Moving down: decrease orderIndex for topics between old and new position
      await c.env.DB.prepare(`
        UPDATE Topic 
        SET orderIndex = orderIndex - 1 
        WHERE classId = ? AND orderIndex > ? AND orderIndex <= ?
      `).bind(topic.classId, oldOrderIndex, newOrderIndex).run();
    } else if (newOrderIndex < oldOrderIndex) {
      // Moving up: increase orderIndex for topics between new and old position
      await c.env.DB.prepare(`
        UPDATE Topic 
        SET orderIndex = orderIndex + 1 
        WHERE classId = ? AND orderIndex >= ? AND orderIndex < ?
      `).bind(topic.classId, newOrderIndex, oldOrderIndex).run();
    }

    // Update the moved topic's orderIndex
    await c.env.DB.prepare(`
      UPDATE Topic SET orderIndex = ? WHERE id = ?
    `).bind(newOrderIndex, topicId).run();

    return c.json(successResponse({ message: 'Topic reordered' }));
  } catch (error: any) {
    console.error('[Reorder Topic] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default topics;
