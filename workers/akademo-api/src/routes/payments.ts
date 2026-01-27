import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, requireRole } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const payments = new Hono<{ Bindings: Bindings }>();

// POST /payments/initiate - Student initiates a payment for a class
payments.post('/initiate', async (c) => {
  try {
    console.log('[Payments] Initiate payment request received');
    console.log('[Payments] Headers:', Object.fromEntries(c.req.raw.headers));
    
    const session = await requireAuth(c);
    console.log('[Payments] Session authenticated:', session.id, session.email);
    
    const { classId, paymentMethod } = await c.req.json();

    if (!classId || !paymentMethod) {
      return c.json(errorResponse('classId and paymentMethod are required'), 400);
    }

    if (!['cash', 'stripe', 'bizum'].includes(paymentMethod)) {
      return c.json(errorResponse('Invalid payment method. Must be: cash, stripe, or bizum'), 400);
    }

    // Get class details including price
    const classData: any = await c.env.DB
      .prepare('SELECT id, name, price, currency, academyId FROM Class WHERE id = ?')
      .bind(classId)
      .first();

    if (!classData) {
      return c.json(errorResponse('Class not found'), 404);
    }

    // Check if enrollment exists
    const enrollment: any = await c.env.DB
      .prepare('SELECT id, paymentStatus FROM ClassEnrollment WHERE userId = ? AND classId = ?')
      .bind(session.id, classId)
      .first();

    if (!enrollment) {
      return c.json(errorResponse('You must be enrolled in this class first'), 400);
    }

    if (enrollment.paymentStatus === 'PAID') {
      return c.json(errorResponse('Payment already completed for this class'), 400);
    }

    // Handle cash payment - just mark as CASH_PENDING
    if (paymentMethod === 'cash') {
      await c.env.DB
        .prepare(`
          UPDATE ClassEnrollment 
          SET paymentStatus = 'CASH_PENDING', 
              paymentMethod = 'cash',
              paymentAmount = ?
          WHERE id = ?
        `)
        .bind(classData.price, enrollment.id)
        .run();

      return c.json(successResponse({
        message: 'Cash payment registered. Waiting for academy approval.',
        status: 'CASH_PENDING',
      }));
    }

    // For Stripe/Bizum, create Payment record and return session URL
    // Note: Actual Stripe Connect integration requires STRIPE_SECRET_KEY
    return c.json(errorResponse('Stripe/Bizum integration not yet configured. Please use cash payment.'), 501);
  } catch (error: any) {
    console.error('[Payment Initiate] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /payments/pending-cash - Academy/Teacher views pending cash payments
payments.get('/pending-cash', async (c) => {
  try {
    const session = await requireAuth(c);

    let query = '';
    let params: any[] = [];

    if (session.role === 'ACADEMY') {
      // Get pending cash payments for owned academies
      query = `
        SELECT 
          e.id as enrollmentId,
          e.paymentStatus,
          e.paymentMethod,
          e.paymentAmount,
          e.enrolledAt,
          u.id as studentId,
          u.firstName as studentFirstName,
          u.lastName as studentLastName,
          u.email as studentEmail,
          c.id as classId,
          c.name as className,
          c.currency,
          a.id as academyId,
          a.name as academyName,
          teacher.firstName || ' ' || teacher.lastName as teacherName
        FROM ClassEnrollment e
        JOIN User u ON e.userId = u.id
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User teacher ON c.teacherId = teacher.id
        WHERE a.ownerId = ? 
        AND e.paymentStatus = 'CASH_PENDING'
        ORDER BY e.enrolledAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'TEACHER') {
      // Teachers can only see their own classes
      query = `
        SELECT 
          e.id as enrollmentId,
          e.paymentStatus,
          e.paymentMethod,
          e.paymentAmount,
          e.enrolledAt,
          u.id as studentId,
          u.firstName as studentFirstName,
          u.lastName as studentLastName,
          u.email as studentEmail,
          c.id as classId,
          c.name as className,
          c.currency,
          a.id as academyId,
          a.name as academyName
        FROM ClassEnrollment e
        JOIN User u ON e.userId = u.id
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE c.teacherId = ? 
        AND e.paymentStatus = 'CASH_PENDING'
        ORDER BY e.enrolledAt DESC
      `;
      params = [session.id];
    } else {
      return c.json(errorResponse('Only academy owners and teachers can view pending payments'), 403);
    }

    const result = await c.env.DB
      .prepare(query)
      .bind(...params)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Pending Cash Payments] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PATCH /payments/:enrollmentId/approve-cash - Academy approves cash payment
payments.patch('/:enrollmentId/approve-cash', async (c) => {
  try {
    const session = await requireAuth(c);
    const enrollmentId = c.req.param('enrollmentId');
    const { approved } = await c.req.json(); // true = approve, false = reject

    if (typeof approved !== 'boolean') {
      return c.json(errorResponse('approved field is required (true/false)'), 400);
    }

    // Get enrollment with academy info
    const enrollment: any = await c.env.DB
      .prepare(`
        SELECT 
          e.id,
          e.paymentStatus,
          e.classId,
          c.academyId,
          a.ownerId
        FROM ClassEnrollment e
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE e.id = ?
      `)
      .bind(enrollmentId)
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Enrollment not found'), 404);
    }

    // Verify user owns the academy
    if (session.role !== 'ACADEMY' || enrollment.ownerId !== session.id) {
      return c.json(errorResponse('Only academy owners can approve payments'), 403);
    }

    if (enrollment.paymentStatus !== 'CASH_PENDING') {
      return c.json(errorResponse('Payment is not in pending state'), 400);
    }

    // Track who approved/denied the payment
    const approverName = `Academia: ${session.firstName} ${session.lastName}`;

    // Update payment status
    const newStatus = approved ? 'PAID' : 'PENDING';
    await c.env.DB
      .prepare(`
        UPDATE ClassEnrollment 
        SET paymentStatus = ?,
            approvedBy = ?,
            approvedByName = ?
        WHERE id = ?
      `)
      .bind(newStatus, session.id, approverName, enrollmentId)
      .run();

    return c.json(successResponse({
      message: approved ? 'Cash payment approved' : 'Cash payment rejected',
      status: newStatus,
    }));
  } catch (error: any) {
    console.error('[Approve Cash Payment] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /payments/stripe-session - Create Stripe Checkout Session (Stripe Connect)
payments.post('/stripe-session', async (c) => {
  try {
    console.log('[Stripe Session] Request received');
    const session = await requireAuth(c);
    console.log('[Stripe Session] User authenticated:', session.id);
    
    const { classId, method } = await c.req.json();
    console.log('[Stripe Session] Request data:', { classId, method });

    if (!classId) {
      return c.json(errorResponse('classId is required'), 400);
    }

    // Get class details
    const classData: any = await c.env.DB
      .prepare(`
        SELECT c.id, c.name, c.price, c.currency, a.stripeAccountId, a.id as academyId
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        WHERE c.id = ?
      `)
      .bind(classId)
      .first();

    console.log('[Stripe Session] Class data:', classData);

    if (!classData) {
      console.error('[Stripe Session] Class not found:', classId);
      return c.json(errorResponse('Class not found'), 404);
    }

    if (!classData.stripeAccountId) {
      console.error('[Stripe Session] No Stripe account for academy:', classData.academyId);
      return c.json(errorResponse('Academy has not set up Stripe Connect. Please pay with cash.'), 400);
    }

    if (!c.env.STRIPE_SECRET_KEY) {
      return c.json(errorResponse('Stripe is not configured on this server'), 500);
    }

    // Create Stripe Checkout Session
    const stripe = require('stripe')(c.env.STRIPE_SECRET_KEY);
    
    // Calculate platform fee (5%)
    const platformFeeAmount = Math.round(classData.price * 100 * 0.05);
    
    const paymentMethods = method === 'bizum' 
      ? ['card', 'link'] // Bizum through Stripe Link
      : ['card', 'link', 'bank_transfer'];

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethods,
      line_items: [{
        price_data: {
          currency: classData.currency || 'eur',
          product_data: { 
            name: `${classData.name} - Acceso completo`,
            description: 'Acceso al contenido de la clase',
          },
          unit_amount: Math.round(classData.price * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/student/classes?payment=success&classId=${classId}`,
      cancel_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/student/payment?classId=${classId}&payment=cancel`,
      metadata: {
        classId,
        userId: session.id,
        academyId: classData.academyId,
      },
      payment_intent_data: {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: classData.stripeAccountId,
        },
      },
    });

    // Save pending payment record
    await c.env.DB
      .prepare(`
        UPDATE ClassEnrollment 
        SET paymentStatus = 'PENDING',
            paymentMethod = ?
        WHERE userId = ? AND classId = ?
      `)
      .bind(method, session.id, classId)
      .run();

    return c.json(successResponse({ url: checkoutSession.url }));
    //     classId,
    //     userId: session.id,
    //     enrollmentId: enrollment.id,
    //   },
    //   payment_intent_data: {
    //     application_fee_amount: Math.round(classData.price * 100 * 0.05), // 5% platform fee
    //     transfer_data: {
    //       destination: classData.stripeAccountId, // Academy's Stripe Connect account
    //     },
    //   },
    // });

    return c.json(errorResponse('Stripe Connect not yet configured. Please use cash payment.'), 501);
  } catch (error: any) {
    console.error('[Stripe Session] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /payments/my-payments - Get student's payment history
payments.get('/my-payments', async (c) => {
  try {
    const session = await requireAuth(c);

    const result = await c.env.DB
      .prepare(`
        SELECT 
          e.id as enrollmentId,
          e.paymentStatus,
          e.paymentMethod,
          e.paymentAmount,
          e.createdAt,
          c.id as classId,
          c.name as className,
          c.currency,
          a.name as academyName
        FROM ClassEnrollment e
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE e.userId = ?
        ORDER BY e.createdAt DESC
      `)
      .bind(session.id)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[My Payments] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /payments/history - Academy views payment history (approved/rejected)
payments.get('/history', async (c) => {
  try {
    const session = await requireAuth(c);

    let query = '';
    let params: any[] = [];

    if (session.role === 'ACADEMY') {
      // Get payment history for owned academies (PAID or explicitly set to PENDING after rejection)
      query = `
        SELECT 
          e.id as enrollmentId,
          e.paymentStatus,
          e.paymentAmount,
          c.currency,
          e.paymentMethod,
          e.approvedAt,
          e.approvedByName,
          u.firstName as studentFirstName,
          u.lastName as studentLastName,
          u.email as studentEmail,
          c.name as className,
          teacher.firstName || ' ' || teacher.lastName as teacherName
        FROM ClassEnrollment e
        JOIN User u ON e.userId = u.id
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User teacher ON c.teacherId = teacher.id
        WHERE a.ownerId = ? 
          AND e.paymentAmount > 0
          AND e.paymentStatus IN ('PAID', 'PENDING', 'CASH_PENDING')
        ORDER BY e.approvedAt DESC
        LIMIT 50
      `;
      params = [session.id];
    } else {
      return c.json(errorResponse('Only academy owners can view payment history'), 403);
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Payment History] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PUT /payments/history/:id/reverse - Reverse payment approval/rejection
payments.put('/history/:id/reverse', async (c) => {
  try {
    const session = await requireAuth(c);
    const enrollmentId = c.req.param('id');

    if (!enrollmentId) {
      return c.json(errorResponse('enrollmentId required'), 400);
    }

    // Get enrollment with academy info
    const enrollment: any = await c.env.DB
      .prepare(`
        SELECT 
          e.id,
          e.paymentStatus,
          e.classId,
          c.academyId,
          a.ownerId
        FROM ClassEnrollment e
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE e.id = ?
      `)
      .bind(enrollmentId)
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Enrollment not found'), 404);
    }

    // Verify user owns the academy
    if (session.role !== 'ACADEMY' || enrollment.ownerId !== session.id) {
      return c.json(errorResponse('Only academy owners can reverse payments'), 403);
    }

    // Toggle status: PAID <-> PENDING
    const newStatus = enrollment.paymentStatus === 'PAID' ? 'PENDING' : 'PAID';
    
    // Track who reversed the decision
    const approverName = `Academia: ${session.firstName} ${session.lastName}`;

    await c.env.DB
      .prepare(`
        UPDATE ClassEnrollment 
        SET paymentStatus = ?,
            approvedBy = ?,
            approvedByName = ?
        WHERE id = ?
      `)\n      .bind(newStatus, session.id, approverName, enrollmentId)
      .run();

    return c.json(successResponse({ 
      message: `Payment status changed to ${newStatus}`,
      newStatus 
    }));

  } catch (error: any) {
    console.error('[Reverse Payment] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /payments/academy-activation - Create Stripe Checkout Session for academy activation
payments.post('/academy-activation', async (c) => {
  try {
    const session = await requireAuth(c);
    await requireRole(c, ['ACADEMY']);

    // Get academy info
    const academy: any = await c.env.DB
      .prepare('SELECT id, name, ownerId FROM Academy WHERE ownerId = ?')
      .bind(session.id)
      .first();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    // For now, use the existing Payment Link but return it in JSON
    // TODO: Replace with actual Stripe API integration when STRIPE_SECRET_KEY is configured
    const paymentLinkUrl = 'https://buy.stripe.com/test_aFa14m20ndS212ReGr77O01';
    
    return c.json(successResponse({ 
      checkoutUrl: paymentLinkUrl,
      message: 'Redirect to Stripe checkout. Note: Webhook metadata must be configured in Stripe Dashboard.'
    }));
  } catch (error: any) {
    console.error('[Academy Activation Payment] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default payments;
