import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, requireRole } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const payments = new Hono<{ Bindings: Bindings }>();

// POST /payments/initiate - Student initiates a payment for a class
payments.post('/initiate', async (c) => {
  try {
    const session = await requireAuth(c);
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
              paymentAmount = ?,
              updatedAt = datetime('now')
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
          e.createdAt,
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
        WHERE a.ownerId = ? 
        AND e.paymentStatus = 'CASH_PENDING'
        ORDER BY e.createdAt DESC
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
          e.createdAt,
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
        ORDER BY e.createdAt DESC
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

    // Update payment status
    const newStatus = approved ? 'PAID' : 'PENDING';
    await c.env.DB
      .prepare(`
        UPDATE ClassEnrollment 
        SET paymentStatus = ?,
            updatedAt = datetime('now')
        WHERE id = ?
      `)
      .bind(newStatus, enrollmentId)
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
    const session = await requireAuth(c);
    const { classId, method } = await c.req.json();

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

    if (!classData) {
      return c.json(errorResponse('Class not found'), 404);
    }

    if (!classData.stripeAccountId) {
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
            paymentMethod = ?,
            updatedAt = datetime('now')
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

export default payments;
