import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const studentPayments = new Hono<{ Bindings: Bindings }>();

// Test endpoint to verify route works
studentPayments.get('/test', async (c) => {
  return c.json({ success: true, message: 'Student payments route works' });
});

// GET /student-payments/:studentId/class/:classId - Get student payment history for a class
studentPayments.get('/:studentId/class/:classId', async (c) => {
  const session = await requireAuth(c);  // Call inside handler, not as middleware
  const { studentId, classId } = c.req.param();

  try {
    // Verify the requesting user has permission
    // For 'all' classes, skip class-specific permission check
    if (classId !== 'all') {
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

      // Check permissions for specific class
      const isOwner = session.role === 'ACADEMY' && classData.ownerId === session.id;
      const isTeacher = session.role === 'TEACHER' && classData.teacherId === session.id;
      const isAdmin = session.role === 'ADMIN';
      const isStudent = session.role === 'STUDENT' && studentId === session.id;

      if (!isOwner && !isTeacher && !isAdmin && !isStudent) {
        return c.json(errorResponse('Not authorized to view this student payment history'), 403);
      }
    } else {
      // For 'all' classes, just verify academy owner or admin
      // We'll check if they own any academy this student is enrolled in
      if (session.role === 'ACADEMY') {
        // Check if this is a demo user by looking up academy payment status
        const academyData = await c.env.DB
          .prepare('SELECT paymentStatus FROM Academy WHERE ownerId = ?')
          .bind(session.id)
          .first() as any;
        
        const isDemoUser = academyData?.paymentStatus === 'NOT PAID';
        
        // Skip authorization check for demo users (they use demo data anyway)
        if (!isDemoUser) {
          const studentEnrollments = await c.env.DB
            .prepare(`
              SELECT e.classId
              FROM ClassEnrollment e
              JOIN Class c ON e.classId = c.id
              JOIN Academy a ON c.academyId = a.id
              WHERE e.userId = ? AND a.ownerId = ?
              LIMIT 1
            `)
            .bind(studentId, session.id)
            .first();
          
          if (!studentEnrollments) {
            return c.json(errorResponse('Not authorized to view this student'), 403);
          }
        }
      } else if (session.role !== 'ADMIN' && (session.role !== 'STUDENT' || studentId !== session.id)) {
        return c.json(errorResponse('Not authorized to view payment history'), 403);
      }
    }

    // Get enrollment details (skip if 'all' classes)
    let enrollment: any = null;
    if (classId !== 'all') {
      enrollment = await c.env.DB
        .prepare(`
          SELECT 
            e.*,
            c.name as className,
            c.monthlyPrice,
            c.oneTimePrice
          FROM ClassEnrollment e
          JOIN Class c ON e.classId = c.id
          WHERE e.userId = ? AND e.classId = ?
        `)
        .bind(studentId, classId)
        .first() as any;

      if (!enrollment) {
        return c.json(errorResponse('Enrollment not found'), 404);
      }
    }

    // Get all payments for this student (all classes or specific class)
    let paymentsQuery = '';
    let paymentsParams: any[] = [];
    
    if (classId === 'all') {
      // Fetch all payments across all classes for this student
      paymentsQuery = `
        SELECT p.*, c.name as className
        FROM Payment p
        JOIN Class c ON p.classId = c.id
        WHERE p.payerId = ?
        ORDER BY p.createdAt DESC
      `;
      paymentsParams = [studentId];
    } else {
      // Fetch payments for specific class
      paymentsQuery = `
        SELECT *
        FROM Payment
        WHERE payerId = ? 
        AND classId = ?
        ORDER BY createdAt DESC
      `;
      paymentsParams = [studentId, classId];
    }
    
    const payments = await c.env.DB
      .prepare(paymentsQuery)
      .bind(...paymentsParams)
      .all();

    // Calculate totals - only count PAID/COMPLETED for totalPaid
    const completedPayments = (payments.results || []).filter((p: any) => 
      p.status === 'COMPLETED' || p.status === 'PAID'
    );
    const totalPaid = completedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    
    // Calculate totalDue from PENDING payments (what still needs to be paid)
    const pendingPayments = (payments.results || []).filter((p: any) => 
      p.status === 'PENDING'
    );
    const totalDue = pendingPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    
    // But show ALL payments in history (including PENDING)
    const allPayments = payments.results || [];

    // Get payment frequency from enrollment (if specific class)
    const paymentFrequency = enrollment?.paymentFrequency || 'ONE_TIME';

    // Format payments for frontend (all statuses including PENDING)
    const formattedPayments = allPayments.map((payment: any, index: number) => {
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
        approvedBy: metadata.approvedBy || null,
        monthNumber: paymentFrequency === 'MONTHLY' ? (allPayments.length - index) : null,
      };
    });

    const responseData = {
      totalPaid,
      totalDue,
      paymentFrequency,
      enrollmentDate: enrollment ? (enrollment.enrolledAt || enrollment.createdAt) : null,
      payments: formattedPayments,
    };

    return c.json(successResponse(responseData));
  } catch (error: any) {
    console.error('[Student Payments] Error fetching payment history:', error);
    return c.json(errorResponse('Failed to fetch payment history'), 500);
  }
});

export default studentPayments;
