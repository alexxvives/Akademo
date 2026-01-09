import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { enrollmentQueries, classQueries } from '@/lib/db';

// POST: Student requests to join a class
export async function POST(request: Request) {
  try {
    console.log('[Student Request] Starting enrollment request');
    const session = await requireAuth();
    
    // Only students can request enrollment
    if (session.role !== 'STUDENT') {
      return errorResponse('Only students can request class enrollment', 403);
    }
    
    console.log('[Student Request] Session validated:', { userId: session.id, role: session.role });
    
    const body = await request.json();
    const { classId } = body;
    console.log('[Student Request] Received classId:', classId);

    if (!classId) {
      return errorResponse('Class ID is required');
    }

    // Check if class exists
    const classData = await classQueries.findById(classId);
    if (!classData) {
      return errorResponse('Class not found', 404);
    }

    // Check if student already has an enrollment (pending or approved)
    const existingEnrollment = await enrollmentQueries.findByClassAndStudent(classId, session.id);
    if (existingEnrollment) {
      const status = (existingEnrollment as any).status;
      if (status === 'APPROVED') {
        return errorResponse('Ya tienes acceso a esta clase');
      } else if (status === 'PENDING') {
        return errorResponse('Ya tienes una solicitud pendiente para esta clase');
      }
    }

    // Create enrollment request with PENDING status
    console.log('[Student Request] Creating enrollment:', { classId, studentId: session.id });
    const enrollment = await enrollmentQueries.create({
      classId,
      studentId: session.id,
      status: 'PENDING',
    });
    console.log('[Student Request] Enrollment created successfully:', enrollment);

    return Response.json(successResponse({
      message: 'Solicitud enviada correctamente',
      enrollment,
    }), { status: 201 });
  } catch (error) {
    console.error('[Student Request] Error occurred:', error);
    return handleApiError(error);
  }
}

// GET: Get student's enrollment requests
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    
    // Only students can view their enrollment requests
    if (session.role !== 'STUDENT') {
      return errorResponse('Only students can view enrollment requests', 403);
    }
    
    const { getDB } = await import('@/lib/db');
    const db = await getDB();
    
    const result = await db.prepare(`
      SELECT e.*, c.name as className, a.name as academyName
      FROM ClassEnrollment e
      JOIN Class c ON e.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE e.userId = ?
      ORDER BY e.createdAt DESC
    `).bind(session.id).all();

    return Response.json(successResponse(result.results || []));
  } catch (error) {
    return handleApiError(error);
  }
}
