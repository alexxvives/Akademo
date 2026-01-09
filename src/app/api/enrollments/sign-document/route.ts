import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';

// Mark enrollment document as signed
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    if (session.role !== 'STUDENT') {
      return errorResponse('Only students can sign enrollment documents', 403);
    }

    const { classId } = await request.json();

    if (!classId) {
      return errorResponse('classId is required', 400);
    }

    const db = await getDB();

    // Get enrollment record
    const enrollment = await db
      .prepare('SELECT * FROM ClassEnrollment WHERE classId = ? AND userId = ?')
      .bind(classId, session.id)
      .first() as any;

    if (!enrollment) {
      return errorResponse('Enrollment not found', 404);
    }

    // Mark document as signed
    await db
      .prepare('UPDATE ClassEnrollment SET documentSigned = 1, updatedAt = datetime("now") WHERE classId = ? AND userId = ?')
      .bind(classId, session.id)
      .run();

    return Response.json(successResponse({
      message: 'Document signed successfully',
      documentSigned: true,
      status: enrollment.status,
    }));
  } catch (error: any) {
    console.error('Error signing document:', error);
    return errorResponse(error.message || 'Failed to sign document', 500);
  }
}
