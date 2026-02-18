import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { nanoid } from 'nanoid';

const calendarEvents = new Hono<{ Bindings: Bindings }>();

interface CalendarEventRow {
  id: string;
  academyId: string;
  createdBy: string;
  title: string;
  type: 'physicalClass' | 'scheduledStream';
  eventDate: string;
  notes: string | null;
  classId: string | null;
  createdAt: string;
}

// GET /calendar-events — list events for the user's academy
calendarEvents.get('/', async (c) => {
  try {
    const session = await requireAuth(c);

    // Resolve academyId from user role
    let academyId: string | null = null;

    if (session.role === 'ACADEMY') {
      const row = await c.env.DB.prepare('SELECT id FROM Academy WHERE ownerId = ?')
        .bind(session.id)
        .first<{ id: string }>();
      academyId = row?.id ?? null;
    } else if (session.role === 'TEACHER') {
      const row = await c.env.DB.prepare('SELECT academyId FROM Teacher WHERE userId = ?')
        .bind(session.id)
        .first<{ academyId: string }>();
      academyId = row?.academyId ?? null;
    } else if (session.role === 'STUDENT') {
      // Students see events from academies they're enrolled in
      const rows = await c.env.DB.prepare(`
        SELECT DISTINCT c.academyId
        FROM ClassEnrollment ce
        JOIN Class c ON ce.classId = c.id
        WHERE ce.userId = ? AND ce.status = 'APPROVED'
        LIMIT 1
      `).bind(session.id).first<{ academyId: string }>();
      academyId = rows?.academyId ?? null;
    } else if (session.role === 'ADMIN') {
      // Admin: return all, or filter by query param
      const filterAcademyId = c.req.query('academyId');
      if (filterAcademyId) {
        academyId = filterAcademyId;
      } else {
        const rows = await c.env.DB.prepare(
          'SELECT * FROM CalendarScheduledEvent ORDER BY eventDate DESC LIMIT 200'
        ).all<CalendarEventRow>();
        return c.json(successResponse(rows.results ?? []));
      }
    }

    if (!academyId) {
      return c.json(successResponse([]));
    }

    const rows = await c.env.DB.prepare(
      'SELECT * FROM CalendarScheduledEvent WHERE academyId = ? ORDER BY eventDate ASC'
    ).bind(academyId).all<CalendarEventRow>();

    return c.json(successResponse(rows.results ?? []));
  } catch (error) {
    console.error('[calendar-events GET]', error);
    return c.json(errorResponse('Failed to fetch calendar events'), 500);
  }
});

// POST /calendar-events — create a new scheduled event
calendarEvents.post('/', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ACADEMY', 'TEACHER', 'ADMIN'].includes(session.role)) {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const body = await c.req.json<{
      title: string;
      type: 'physicalClass' | 'scheduledStream';
      eventDate: string;
      notes?: string;
      classId?: string;
    }>();

    if (!body.title || !body.type || !body.eventDate) {
      return c.json(errorResponse('Missing required fields: title, type, eventDate'), 400);
    }

    if (!['physicalClass', 'scheduledStream'].includes(body.type)) {
      return c.json(errorResponse('Invalid type'), 400);
    }

    // Resolve academyId
    let academyId: string | null = null;

    if (session.role === 'ACADEMY') {
      const row = await c.env.DB.prepare('SELECT id FROM Academy WHERE ownerId = ?')
        .bind(session.id)
        .first<{ id: string }>();
      academyId = row?.id ?? null;
    } else if (session.role === 'TEACHER') {
      const row = await c.env.DB.prepare('SELECT academyId FROM Teacher WHERE userId = ?')
        .bind(session.id)
        .first<{ academyId: string }>();
      academyId = row?.academyId ?? null;
    } else if (session.role === 'ADMIN') {
      // Admin must provide classId; derive academyId from it
      if (body.classId) {
        const row = await c.env.DB.prepare('SELECT academyId FROM Class WHERE id = ?')
          .bind(body.classId)
          .first<{ academyId: string }>();
        academyId = row?.academyId ?? null;
      }
    }

    if (!academyId) {
      return c.json(errorResponse('Could not resolve academy'), 400);
    }

    const id = nanoid();
    await c.env.DB.prepare(
      `INSERT INTO CalendarScheduledEvent (id, academyId, createdBy, title, type, eventDate, notes, classId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(id, academyId, session.id, body.title, body.type, body.eventDate, body.notes ?? null, body.classId ?? null)
      .run();

    const event = await c.env.DB.prepare('SELECT * FROM CalendarScheduledEvent WHERE id = ?')
      .bind(id)
      .first<CalendarEventRow>();

    return c.json(successResponse(event), 201);
  } catch (error) {
    console.error('[calendar-events POST]', error);
    return c.json(errorResponse('Failed to create calendar event'), 500);
  }
});

// DELETE /calendar-events/:id
calendarEvents.delete('/:id', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ACADEMY', 'TEACHER', 'ADMIN'].includes(session.role)) {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const eventId = c.req.param('id');

    // Verify ownership: TEACHER/ACADEMY can only delete their own events, ADMIN can delete any
    const row = await c.env.DB.prepare('SELECT createdBy, academyId FROM CalendarScheduledEvent WHERE id = ?')
      .bind(eventId)
      .first<{ createdBy: string; academyId: string }>();

    if (!row) {
      return c.json(errorResponse('Event not found'), 404);
    }

    if (session.role !== 'ADMIN' && row.createdBy !== session.id) {
      return c.json(errorResponse('Forbidden'), 403);
    }

    await c.env.DB.prepare('DELETE FROM CalendarScheduledEvent WHERE id = ?').bind(eventId).run();

    return c.json(successResponse({ deleted: true }));
  } catch (error) {
    console.error('[calendar-events DELETE]', error);
    return c.json(errorResponse('Failed to delete calendar event'), 500);
  }
});

export default calendarEvents;
