import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { nanoid } from 'nanoid';
import { createZoomMeeting } from '../lib/zoom';

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
  location: string | null;
  startTime: string | null;
  zoomLink: string | null;
  createdAt: string;
}

// POST /calendar-events/create-zoom — auto-create a scheduled Zoom meeting for a class event
calendarEvents.post('/create-zoom', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ACADEMY', 'TEACHER', 'ADMIN'].includes(session.role)) {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const body = await c.req.json<{
      classId: string;
      title: string;
      eventDate?: string;
      startTime?: string;
    }>();

    if (!body.classId) {
      return c.json(errorResponse('classId requerido. Selecciona una asignatura primero.'), 400);
    }
    if (!body.title?.trim()) {
      return c.json(errorResponse('Escribe un título primero.'), 400);
    }

    // Look up class Zoom account
    const classInfo = await c.env.DB.prepare(
      'SELECT zoomAccountId, name FROM Class WHERE id = ?'
    ).bind(body.classId).first<{ zoomAccountId: string | null; name: string }>();

    if (!classInfo) {
      return c.json(errorResponse('Clase no encontrada.'), 404);
    }
    if (!classInfo.zoomAccountId) {
      return c.json(errorResponse('Esta clase no tiene una cuenta de Zoom asignada.'), 400);
    }

    // Get / refresh Zoom token
    const zoomAccount = await c.env.DB
      .prepare('SELECT accessToken, refreshToken, expiresAt FROM ZoomAccount WHERE id = ?')
      .bind(classInfo.zoomAccountId)
      .first() as { accessToken: string; refreshToken: string; expiresAt: string } | null;

    if (!zoomAccount) {
      return c.json(errorResponse('Cuenta Zoom no encontrada.'), 404);
    }

    let accessToken = zoomAccount.accessToken;
    const expiresAt = new Date(zoomAccount.expiresAt);
    if (expiresAt <= new Date(Date.now() + 5 * 60 * 1000)) {
      const { refreshZoomToken } = await import('./zoom-accounts');
      const newToken = await refreshZoomToken(c, classInfo.zoomAccountId);
      if (!newToken) {
        return c.json(errorResponse('Error al renovar el token de Zoom.'), 500);
      }
      accessToken = newToken;
    }

    const meeting = await createZoomMeeting({
      topic: `${body.title.trim()} - ${classInfo.name}`,
      duration: 120,
      waitingRoom: false,
      config: { accessToken },
    });

    return c.json(successResponse({ joinUrl: meeting.join_url, startUrl: meeting.start_url, meetingId: String(meeting.id) }), 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[calendar-events create-zoom]', msg);
    if (msg === 'Unauthorized') return c.json(errorResponse('Unauthorized'), 401);
    return c.json(errorResponse('Error al crear reunión Zoom'), 500);
  }
});

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
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[calendar-events GET]', msg);
    if (msg === 'Unauthorized') return c.json(errorResponse('Unauthorized'), 401);
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
      location?: string;
      startTime?: string;
      zoomLink?: string;
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
      `INSERT INTO CalendarScheduledEvent (id, academyId, createdBy, title, type, eventDate, notes, classId, location, startTime, zoomLink, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(id, academyId, session.id, body.title, body.type, body.eventDate, body.notes ?? null, body.classId ?? null, body.location ?? null, body.startTime ?? null, body.zoomLink ?? null)
      .run();

    const event = await c.env.DB.prepare('SELECT * FROM CalendarScheduledEvent WHERE id = ?')
      .bind(id)
      .first<CalendarEventRow>();

    // Also create a corresponding LiveStream record with status='scheduled'
    if (body.classId) {
      try {
        const cls = await c.env.DB
          .prepare('SELECT teacherId FROM Class WHERE id = ?')
          .bind(body.classId)
          .first<{ teacherId: string | null }>();
        // Use class teacherId, or fall back to the current user (academy owner creating the event)
        const resolvedTeacherId = cls?.teacherId ?? session.id;
        const streamId = nanoid();
        const scheduledAt = body.startTime
          ? `${body.eventDate}T${body.startTime}:00`
          : body.eventDate;
        await c.env.DB
          .prepare(`INSERT INTO LiveStream (id, classId, teacherId, title, status, zoomLink, scheduledAt, calendarEventId, createdAt) VALUES (?,?,?,?,?,?,?,?,datetime('now'))`)
          .bind(streamId, body.classId, resolvedTeacherId, body.title, 'scheduled', body.zoomLink ?? null, scheduledAt, id)
          .run();
      } catch (streamErr) {
        // Non-fatal — log but don't fail the calendar event creation
        console.error('[calendar-events POST] LiveStream insert failed:', streamErr);
      }
    }

    return c.json(successResponse(event), 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[calendar-events POST]', msg);
    if (msg === 'Unauthorized') return c.json(errorResponse('Unauthorized'), 401);
    if (msg === 'Forbidden') return c.json(errorResponse('Forbidden'), 403);
    return c.json(errorResponse('Failed to create calendar event'), 500);
  }
});

// PATCH /calendar-events/:id — update event (title, eventDate, notes, classId, location)
calendarEvents.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ACADEMY', 'TEACHER', 'ADMIN'].includes(session.role)) {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const eventId = c.req.param('id');

    const row = await c.env.DB.prepare('SELECT createdBy FROM CalendarScheduledEvent WHERE id = ?')
      .bind(eventId)
      .first<{ createdBy: string }>();

    if (!row) {
      return c.json(errorResponse('Event not found'), 404);
    }

    if (session.role !== 'ADMIN' && row.createdBy !== session.id) {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const body = await c.req.json();
    const { title, eventDate, notes, classId, location, type, startTime } = body;

    const updateFields: string[] = [];
    const bindings: unknown[] = [];

    if (title !== undefined) { updateFields.push('title = ?'); bindings.push(title); }
    if (eventDate !== undefined) { updateFields.push('eventDate = ?'); bindings.push(eventDate); }
    if (notes !== undefined) { updateFields.push('notes = ?'); bindings.push(notes ?? null); }
    if (classId !== undefined) { updateFields.push('classId = ?'); bindings.push(classId ?? null); }
    if (location !== undefined) { updateFields.push('location = ?'); bindings.push(location ?? null); }
    if (type !== undefined) { updateFields.push('type = ?'); bindings.push(type); }
    if (startTime !== undefined) { updateFields.push('startTime = ?'); bindings.push(startTime ?? null); }
    const { zoomLink } = body;
    if (zoomLink !== undefined) { updateFields.push('zoomLink = ?'); bindings.push(zoomLink ?? null); }

    if (updateFields.length === 0) {
      return c.json(errorResponse('No fields to update'), 400);
    }

    bindings.push(eventId);
    await c.env.DB.prepare(`UPDATE CalendarScheduledEvent SET ${updateFields.join(', ')} WHERE id = ?`)
      .bind(...bindings)
      .run();

    const updated = await c.env.DB.prepare('SELECT * FROM CalendarScheduledEvent WHERE id = ?')
      .bind(eventId)
      .first<CalendarEventRow>();

    return c.json(successResponse(updated));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[calendar-events PATCH]', msg);
    if (msg === 'Unauthorized') return c.json(errorResponse('Unauthorized'), 401);
    if (msg === 'Forbidden') return c.json(errorResponse('Forbidden'), 403);
    return c.json(errorResponse('Failed to update calendar event'), 500);
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
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[calendar-events DELETE]', msg);
    if (msg === 'Unauthorized') return c.json(errorResponse('Unauthorized'), 401);
    if (msg === 'Forbidden') return c.json(errorResponse('Forbidden'), 403);
    return c.json(errorResponse('Failed to delete calendar event'), 500);
  }
});

export default calendarEvents;
