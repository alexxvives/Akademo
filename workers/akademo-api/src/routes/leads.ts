import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const leads = new Hono<{ Bindings: Bindings }>();

// POST /leads - Public endpoint to submit a new lead from pricing page
leads.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, phone, academyName, monthlyEnrollments, teacherCount, subjectCount, message } = body;

    if (!name || !email) {
      return c.json(errorResponse('Name and email are required'), 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json(errorResponse('Invalid email address'), 400);
    }

    const id = crypto.randomUUID().replace(/-/g, '');

    await c.env.DB.prepare(`
      INSERT INTO Lead (id, name, email, phone, academyName, monthlyEnrollments, teacherCount, subjectCount, message, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'), datetime('now'))
    `).bind(
      id,
      name.trim(),
      email.trim().toLowerCase(),
      phone?.trim() || null,
      academyName?.trim() || null,
      monthlyEnrollments?.toString() || null,
      teacherCount?.toString() || null,
      subjectCount?.toString() || null,
      message?.trim() || null
    ).run();

    return c.json(successResponse({ id }), 201);
  } catch (error: unknown) {
    console.error('[Leads] Create error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /leads - Get all leads (admin only)
leads.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const status = c.req.query('status');

    let query = 'SELECT * FROM Lead';
    const params: string[] = [];

    if (status && status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY createdAt DESC';

    const stmt = c.env.DB.prepare(query);
    const result = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    return c.json(successResponse(result.results || []));
  } catch (error: unknown) {
    console.error('[Leads] List error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PATCH /leads/:id - Update lead status/notes (admin only)
leads.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const { id } = c.req.param();
    const body = await c.req.json();
    const { status, notes } = body;

    const validStatuses = ['new', 'discard', 'follow_up', 'onboarding', 'accepted'];
    if (status && !validStatuses.includes(status)) {
      return c.json(errorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`), 400);
    }

    // Build dynamic update
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return c.json(errorResponse('No fields to update'), 400);
    }

    updates.push("updatedAt = datetime('now')");
    values.push(id);

    await c.env.DB.prepare(
      `UPDATE Lead SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    // Return updated lead
    const updated = await c.env.DB.prepare('SELECT * FROM Lead WHERE id = ?').bind(id).first();
    if (!updated) {
      return c.json(errorResponse('Lead not found'), 404);
    }

    return c.json(successResponse(updated));
  } catch (error: unknown) {
    console.error('[Leads] Update error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// DELETE /leads/:id - Delete a lead (admin only)
leads.delete('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const { id } = c.req.param();

    const existing = await c.env.DB.prepare('SELECT id FROM Lead WHERE id = ?').bind(id).first();
    if (!existing) {
      return c.json(errorResponse('Lead not found'), 404);
    }

    await c.env.DB.prepare('DELETE FROM Lead WHERE id = ?').bind(id).run();

    return c.json(successResponse({ deleted: true }));
  } catch (error: unknown) {
    console.error('[Leads] Delete error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default leads;
