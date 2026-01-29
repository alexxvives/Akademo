import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const studentPayments = new Hono<{ Bindings: Bindings }>();

// GET /student-payments/:studentId/class/:classId - Get student payment history for a class
studentPayments.get('/:studentId/class/:classId', requireAuth, async (c) => {
  const session = c.get('session');
  const { studentId, classId } = c.req.param();

  try {
    // Verify the requesting user has permission (must be academy owner or teacher of the class)
    const classData = await c.env.DB
      .prepare(`
        SELECT c.*, a.ownerId, c.teacherId
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        WHERE c.id = ?
      `)
      .bind(classId)
      .first() as any;

    if (!classData) {
      return c.json(errorResponse('Class not found'), 404);
    }

    // Check permissions
    const isOwner = session.role === 'ACADEMY' && classData.ownerId === session.id;
    const isTeacher = session.role === 'TEACHER' && classData.teacherId === session.id;
    const isAdmin = session.role === 'ADMIN';
    const isStudent = session.role === 'STUDENT' && studentId === session.id;

    if (!isOwner && !isTeacher && !isAdmin && !isStudent) {
      return c.json(errorResponse('Not authorized to view this student payment history'), 403);
    }

    // Get enrollment details
    const enrollment = await c.env.DB
      .prepare(`
        SELECT 
          e.*,
          c.name as className,
          c.monthlyPrice,
          c.oneTimePrice,
          c.allowMonthly
        FROM ClassEnrollment e
        JOIN Class c ON e.classId = c.id
        WHERE e.userId = ? AND e.classId = ?
      `)
      .bind(studentId, classId)
      .first() as any;

    if (!enrollment) {
      return c.json(errorResponse('Enrollment not found'), 404);
    }

    // Get all payments for this student in this class
    const payments = await c.env.DB
      .prepare(`
        SELECT 
          p.*,
          u.firstName as approverFirstName,
          u.lastName as approverLastName
        FROM Payment p
        LEFT JOIN User u ON p.metadata LIKE '%approvedBy%' AND u.id = p.payerId
        WHERE p.payerId = ? 
        AND p.classId = ?
        ORDER BY p.createdAt DESC
      `)
      .bind(studentId, classId)
      .all();

    // Calculate totals
    const completedPayments = (payments.results || []).filter((p: any) => 
      p.status === 'COMPLETED' || p.status === 'PAID'
    );
    const totalPaid = completedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    // Determine total due based on payment frequency
    const paymentFrequency = enrollment.paymentFrequency || 'ONE_TIME';
    const totalDue = paymentFrequency === 'MONTHLY' 
      ? (enrollment.monthlyPrice || 0)
      : (enrollment.oneTimePrice || enrollment.paymentAmount || 0);

    // Format payments for frontend
    const formattedPayments = (payments.results || []).map((payment: any, index: number) => {
      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
      const dueDate = metadata.dueDate || payment.createdAt;
      const paymentDate = payment.completedAt || payment.createdAt;
      
      // Determine if payment was late
      const isLate = payment.completedAt && new Date(payment.completedAt) > new Date(dueDate);

      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency || 'EUR',
        paymentMethod: payment.paymentMethod || 'cash',
        status: payment.status,
        paymentDate: paymentDate,
        dueDate: dueDate,
        isLate: isLate,
        approvedBy: metadata.approvedBy || (payment.approverFirstName ? `${payment.approverFirstName} ${payment.approverLastName}` : null),
        monthNumber: paymentFrequency === 'MONTHLY' ? (payments.results.length - index) : null,
      };
    });

    return c.json(successResponse({
      totalPaid,
      totalDue,
      paymentFrequency,
      enrollmentDate: enrollment.enrolledAt || enrollment.createdAt,
      payments: formattedPayments,
    }));
  } catch (error: any) {
    console.error('[Student Payments] Error fetching payment history:', error);
    return c.json(errorResponse(`Failed to fetch payment history: ${error.message}`), 500);
  }
});

export default studentPayments;
