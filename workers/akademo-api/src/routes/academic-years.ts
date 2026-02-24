import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const academicYears = new Hono<{ Bindings: Bindings }>();

// GET /academic-years - Get all academic years for the current academy
academicYears.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ACADEMY' && session.role !== 'TEACHER') {
      return c.json(errorResponse('Only academy owners and teachers can view academic years'), 403);
    }

    let academyId: string | undefined;

    if (session.role === 'ACADEMY') {
      const academy = await c.env.DB.prepare(
        'SELECT id FROM Academy WHERE ownerId = ? LIMIT 1'
      ).bind(session.id).first<{ id: string }>();
      academyId = academy?.id;
    } else {
      // TEACHER — find their associated academy
      const teacher = await c.env.DB.prepare(
        'SELECT academyId FROM Teacher WHERE userId = ? LIMIT 1'
      ).bind(session.id).first<{ academyId: string }>();
      academyId = teacher?.academyId;
    }

    if (!academyId) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    const years = await c.env.DB.prepare(
      'SELECT * FROM AcademicYear WHERE academyId = ? ORDER BY startDate DESC'
    ).bind(academyId).all();

    return c.json(successResponse(years.results || []));
  } catch (error) {
    console.error('[Academic Years GET] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /academic-years - Create a new academic year (becomes current)
academicYears.post('/', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only academy owners can manage academic years'), 403);
    }

    const academy = await c.env.DB.prepare(
      'SELECT id FROM Academy WHERE ownerId = ? LIMIT 1'
    ).bind(session.id).first<{ id: string }>();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    const body = await c.req.json<{ name: string; startDate: string; endDate?: string | null }>();

    if (!body.name?.trim() || !body.startDate) {
      return c.json(errorResponse('Name and start date are required'), 400);
    }

    // Mark all existing years as not current
    await c.env.DB.prepare(
      'UPDATE AcademicYear SET isCurrent = 0 WHERE academyId = ?'
    ).bind(academy.id).run();

    // Create the new year
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO AcademicYear (id, academyId, name, startDate, endDate, isCurrent, createdAt)
       VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`
    ).bind(id, academy.id, body.name.trim(), body.startDate, body.endDate ?? null).run();

    // Return all years for this academy
    const years = await c.env.DB.prepare(
      'SELECT * FROM AcademicYear WHERE academyId = ? ORDER BY startDate DESC'
    ).bind(academy.id).all();

    return c.json(successResponse(years.results || []));
  } catch (error) {
    console.error('[Academic Years POST] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PUT /academic-years/:id - Update name, startDate, endDate
academicYears.put('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only academy owners can manage academic years'), 403);
    }

    const yearId = c.req.param('id');

    const academy = await c.env.DB.prepare(
      'SELECT id FROM Academy WHERE ownerId = ? LIMIT 1'
    ).bind(session.id).first<{ id: string }>();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    const year = await c.env.DB.prepare(
      'SELECT id FROM AcademicYear WHERE id = ? AND academyId = ?'
    ).bind(yearId, academy.id).first<{ id: string }>();

    if (!year) {
      return c.json(errorResponse('Academic year not found'), 404);
    }

    const body = await c.req.json<{ name?: string; startDate?: string; endDate?: string | null }>();

    if (!body.name?.trim() || !body.startDate) {
      return c.json(errorResponse('Name and start date are required'), 400);
    }

    await c.env.DB.prepare(
      'UPDATE AcademicYear SET name = ?, startDate = ?, endDate = ? WHERE id = ?'
    ).bind(body.name.trim(), body.startDate, body.endDate ?? null, yearId).run();

    const years = await c.env.DB.prepare(
      'SELECT * FROM AcademicYear WHERE academyId = ? ORDER BY startDate DESC'
    ).bind(academy.id).all();

    return c.json(successResponse(years.results || []));
  } catch (error) {
    console.error('[Academic Years PUT] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PATCH /academic-years/:id - Set a year as current
academicYears.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only academy owners can manage academic years'), 403);
    }

    const yearId = c.req.param('id');

    const academy = await c.env.DB.prepare(
      'SELECT id FROM Academy WHERE ownerId = ? LIMIT 1'
    ).bind(session.id).first<{ id: string }>();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    // Ensure the year belongs to this academy
    const year = await c.env.DB.prepare(
      'SELECT id FROM AcademicYear WHERE id = ? AND academyId = ?'
    ).bind(yearId, academy.id).first<{ id: string }>();

    if (!year) {
      return c.json(errorResponse('Academic year not found'), 404);
    }

    // Mark all as not current then set this as current
    await c.env.DB.prepare(
      'UPDATE AcademicYear SET isCurrent = 0 WHERE academyId = ?'
    ).bind(academy.id).run();

    await c.env.DB.prepare(
      'UPDATE AcademicYear SET isCurrent = 1 WHERE id = ?'
    ).bind(yearId).run();

    const years = await c.env.DB.prepare(
      'SELECT * FROM AcademicYear WHERE academyId = ? ORDER BY startDate DESC'
    ).bind(academy.id).all();

    return c.json(successResponse(years.results || []));
  } catch (error) {
    console.error('[Academic Years PATCH] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default academicYears;
