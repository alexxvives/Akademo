import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const classes = new Hono<{ Bindings: Bindings }>();

// GET /classes - Get user's classes
classes.get('/', async (c) => {
  try {
    const session = await requireAuth(c);

    let query = '';
    let params: any[] = [];

    if (session.role === 'STUDENT') {
      // Get enrolled classes
      query = `
        SELECT 
          c.*,
          a.name as academyName,
          ce.status as enrollmentStatus,
          ce.documentSigned
        FROM ClassEnrollment ce
        JOIN Class c ON ce.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE ce.userId = ?
        ORDER BY ce.createdAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'TEACHER') {
      // Get classes teacher is assigned to
      query = `
        SELECT 
          c.*,
          a.name as academyName
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        WHERE c.teacherId = ?
        ORDER BY c.createdAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'ACADEMY') {
      // Get classes in owned academies
      query = `
        SELECT 
          c.*,
          a.name as academyName
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        WHERE a.ownerId = ?
        ORDER BY c.createdAt DESC
      `;
      params = [session.id];
    } else {
      // Admin gets all classes
      query = `
        SELECT 
          c.*,
          a.name as academyName
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        ORDER BY c.createdAt DESC
      `;
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Classes] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default classes;
