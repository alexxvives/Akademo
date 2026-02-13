import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, requireRole } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { validateBody, initiatePaymentSchema } from '../lib/validation';

const payments = new Hono<{ Bindings: Bindings }>();

// Helper: add N calendar months to a date (clamps day to month end)
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  // If the day overflowed (e.g. Jan 31 + 1 month → Mar 3), clamp to last day of target month
  if (result.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    result.setDate(0); // sets to last day of previous month
  }
  return result;
}

// Count how many full calendar months have elapsed from `start` up to (and including) `today`.
// Cycle 1 = classStart → classStart + 1 month, Cycle 2 = +1 month → +2 months, etc.
// Returns 0 if class hasn't started yet.
function countElapsedCycles(classStart: Date, today: Date): number {
  if (today < classStart) return 0;
  // Calculate month difference
  let months = (today.getFullYear() - classStart.getFullYear()) * 12
             + (today.getMonth() - classStart.getMonth());
  // If today's day-of-month is before classStart's day, we haven't completed that cycle
  if (today.getDate() < classStart.getDate()) {
    months = Math.max(0, months - 1);
  }
  // +1 because the current (possibly partial) cycle still counts as owed
  return months + 1;
}

// Helper function to calculate billing cycles based on class start date
// Returns: amount to charge (including catch-up cycles) + billing cycle info + missed cycles count
function calculateBillingCycle(classStartDate: string, _enrollmentDate: string, isMonthly: boolean, monthlyPrice: number) {
  const classStart = new Date(classStartDate);
  const today = new Date();

  // For one-time payments, no next payment
  if (!isMonthly) {
    return {
      billingCycleStart: null,
      billingCycleEnd: null,
      nextPaymentDue: null,
      missedCycles: 0,
      catchUpAmount: 0,
      totalAmount: monthlyPrice // Just regular price for one-time
    };
  }

  // If class hasn't started yet (early joiner)
  if (today < classStart) {
    const cycleEnd = addMonths(classStart, 1);
    return {
      billingCycleStart: classStart.toISOString(),
      billingCycleEnd: cycleEnd.toISOString(),
      nextPaymentDue: cycleEnd.toISOString(),
      missedCycles: 0,
      catchUpAmount: 0,
      totalAmount: monthlyPrice // Just one cycle
    };
  }

  // Class has already started — charge for all elapsed cycles (calendar-month based)
  const elapsedCycles = countElapsedCycles(classStart, today);

  // Current cycle boundaries
  const currentCycleStart = addMonths(classStart, elapsedCycles - 1);
  const currentCycleEnd   = addMonths(classStart, elapsedCycles);

  const catchUpAmount = elapsedCycles * monthlyPrice;

  return {
    billingCycleStart: classStart.toISOString(),
    billingCycleEnd: currentCycleEnd.toISOString(),
    nextPaymentDue: currentCycleEnd.toISOString(),
    missedCycles: elapsedCycles,
    catchUpAmount: catchUpAmount,
    totalAmount: catchUpAmount // Total to charge NOW (all elapsed cycles)
  };
}

// POST /payments/initiate - Student initiates a payment for a class
payments.post('/initiate', validateBody(initiatePaymentSchema), async (c) => {
  try {
    const session = await requireAuth(c);
    const { classId, paymentMethod, paymentFrequency } = await c.req.json();

    // Get class details including price and startDate
    const classData: any = await c.env.DB
      .prepare('SELECT id, name, monthlyPrice, oneTimePrice, academyId, startDate FROM Class WHERE id = ?')
      .bind(classId)
      .first();

    if (!classData) {
      return c.json(errorResponse('Class not found'), 404);
    }

    // Determine price based on payment frequency
    const price = paymentFrequency === 'monthly' ? classData.monthlyPrice : classData.oneTimePrice;
    
    if (!price || price <= 0) {
      return c.json(errorResponse(`${paymentFrequency === 'monthly' ? 'Monthly' : 'One-time'} payment not available for this class`), 400);
    }

    // Calculate billing cycle for monthly payments (includes catch-up for late joiners)
    const isMonthly = paymentFrequency === 'monthly';
    const billingCycle = calculateBillingCycle(
      classData.startDate || new Date().toISOString(),
      new Date().toISOString(),
      isMonthly,
      price // Pass monthly price for catch-up calculation
    );
    
    // Use totalAmount from billing cycle (includes catch-up cycles if late joiner)
    const finalAmount = billingCycle.totalAmount;

    // Check if enrollment exists
    const enrollment: any = await c.env.DB
      .prepare('SELECT id FROM ClassEnrollment WHERE userId = ? AND classId = ?')
      .bind(session.id, classId)
      .first();

    if (!enrollment) {
      return c.json(errorResponse('You must be enrolled in this class first'), 400);
    }

    // Check if payment already exists
    const existingPayment: any = await c.env.DB
      .prepare('SELECT id, status, paymentMethod FROM Payment WHERE payerId = ? AND classId = ? AND status = ?')
      .bind(session.id, classId, 'PENDING')
      .first();

    if (existingPayment) {
      // Update existing pending payment with new payment method
      await c.env.DB
        .prepare(`
          UPDATE Payment 
          SET paymentMethod = ?,
              amount = ?,
              metadata = ?,
              nextPaymentDue = ?,
              billingCycleStart = ?,
              billingCycleEnd = ?,
              createdAt = datetime('now')
          WHERE id = ?
        `)
        .bind(
          paymentMethod,
          finalAmount, // Use total amount including catch-up
          JSON.stringify({
            payerName: `${session.firstName} ${session.lastName}`,
            payerEmail: session.email,
            className: classData.name,
            paymentFrequency: paymentFrequency,
            missedCycles: billingCycle.missedCycles,
            catchUpAmount: billingCycle.catchUpAmount,
            regularPrice: price,
            note: billingCycle.missedCycles > 0 ? `Incluye ${billingCycle.missedCycles} ciclo(s) pendiente(s). Próximos pagos serán de ${price}€/mes.` : null
          }),
          billingCycle.nextPaymentDue,
          billingCycle.billingCycleStart,
          billingCycle.billingCycleEnd,
          existingPayment.id
        )
        .run();
      
      // Update enrollment paymentFrequency
      await c.env.DB
        .prepare('UPDATE ClassEnrollment SET paymentFrequency = ? WHERE userId = ? AND classId = ?')
        .bind(isMonthly ? 'MONTHLY' : 'ONE_TIME', session.id, classId)
        .run();

      // Format next payment due date for display
      const formattedNextDue = billingCycle.nextPaymentDue 
        ? new Date(billingCycle.nextPaymentDue).toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          })
        : null;

      let message = 'Solicitud enviada. La academia confirmará la recepción del pago.';
      if (isMonthly && formattedNextDue) {
        message += ` Recuerda que el próximo pago de ${price}€ deberá ser el ${formattedNextDue}.`;
      }
      
      return c.json(successResponse({
        message,
        status: 'PENDING',
        paymentId: existingPayment.id,
        updated: true,
        missedCycles: billingCycle.missedCycles,
        catchUpAmount: billingCycle.catchUpAmount,
      }));
    }

    // Create Payment record with billing cycle info
    const paymentId = `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await c.env.DB
      .prepare(`
        INSERT INTO Payment (
          id, type, payerId, payerType, receiverId, amount, currency, status,
          paymentMethod, classId, metadata, nextPaymentDue, billingCycleStart, billingCycleEnd, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        paymentId,
        'STUDENT_TO_ACADEMY',
        session.id,
        'STUDENT',
        classData.academyId,
        finalAmount, // Total including catch-up
        'EUR',
        'PENDING',
        paymentMethod,
        classId,
        JSON.stringify({
          payerName: `${session.firstName} ${session.lastName}`,
          payerEmail: session.email,
          className: classData.name,
          paymentFrequency: paymentFrequency,
          missedCycles: billingCycle.missedCycles,
          catchUpAmount: billingCycle.catchUpAmount,
          regularPrice: price,
          note: billingCycle.missedCycles > 0 ? `Incluye ${billingCycle.missedCycles} ciclo(s) pendiente(s). Próximos pagos serán de ${price}€/mes.` : null
        }),
        billingCycle.nextPaymentDue,
        billingCycle.billingCycleStart,
        billingCycle.billingCycleEnd
      )
      .run();

    // Update enrollment paymentFrequency
    await c.env.DB
      .prepare('UPDATE ClassEnrollment SET paymentFrequency = ? WHERE userId = ? AND classId = ?')
      .bind(isMonthly ? 'MONTHLY' : 'ONE_TIME', session.id, classId)
      .run();

    // Format next payment due date for display
    const formattedNextDue = billingCycle.nextPaymentDue 
      ? new Date(billingCycle.nextPaymentDue).toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        })
      : null;

    let message = 'Solicitud enviada. La academia confirmará la recepción del pago.';
    if (isMonthly && formattedNextDue) {
      message += ` Recuerda que el próximo pago de ${price}€ deberá ser el ${formattedNextDue}.`;
    }

    return c.json(successResponse({
      message,
      status: 'PENDING',
      paymentId: paymentId,
      missedCycles: billingCycle.missedCycles,
      catchUpAmount: billingCycle.catchUpAmount,
    }));

    // For Stripe (card payment), continue to Stripe checkout
    // Note: Actual Stripe Connect integration requires STRIPE_SECRET_KEY
    return c.json(errorResponse('Stripe integration not yet configured. Please use cash or bizum payment.'), 501);
  } catch (error: any) {
    console.error('[Payment Initiate] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /payments/pending-cash - Academy/Teacher views pending cash payments
payments.get('/pending-cash', async (c) => {
  try {
    const session = await requireAuth(c);

    let query = '';
    let params: any[] = [];

    if (session.role === 'ACADEMY') {
      // Get pending payments ONLY from Payment table (no longer check ClassEnrollment)
      query = `
        SELECT 
          p.id as enrollmentId,
          p.status as paymentStatus,
          p.paymentMethod,
          p.amount as paymentAmount,
          p.createdAt as enrolledAt,
          p.payerId as studentId,
          u.firstName as studentFirstName,
          u.lastName as studentLastName,
          u.email as studentEmail,
          p.classId,
          c.name as className,
          p.currency,
          a.id as academyId,
          a.name as academyName,
          teacher.firstName || ' ' || teacher.lastName as teacherName
        FROM Payment p
        JOIN Class c ON p.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        JOIN User u ON p.payerId = u.id
        LEFT JOIN User teacher ON c.teacherId = teacher.id
        WHERE a.ownerId = ? 
        AND p.status = 'PENDING'
        AND p.type = 'STUDENT_TO_ACADEMY'
        ORDER BY p.createdAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'TEACHER') {
      // Teachers can only see payments for their own classes
      query = `
        SELECT 
          p.id as enrollmentId,
          p.status as paymentStatus,
          p.paymentMethod,
          p.amount as paymentAmount,
          p.createdAt as enrolledAt,
          p.payerId as studentId,
          u.firstName as studentFirstName,
          u.lastName as studentLastName,
          u.email as studentEmail,
          p.classId,
          c.name as className,
          p.currency,
          a.id as academyId,
          a.name as academyName
        FROM Payment p
        JOIN Class c ON p.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        JOIN User u ON p.payerId = u.id
        WHERE c.teacherId = ? 
        AND p.status = 'PENDING'
        AND p.type = 'STUDENT_TO_ACADEMY'
        ORDER BY p.createdAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'ADMIN') {
      const academyId = c.req.query('academyId');
      if (academyId) {
        query = `
          SELECT 
            p.id as enrollmentId,
            p.status as paymentStatus,
            p.paymentMethod,
            p.amount as paymentAmount,
            p.createdAt as enrolledAt,
            p.payerId as studentId,
            u.firstName as studentFirstName,
            u.lastName as studentLastName,
            u.email as studentEmail,
            p.classId,
            c.name as className,
            p.currency,
            a.id as academyId,
            a.name as academyName,
            teacher.firstName || ' ' || teacher.lastName as teacherName
          FROM Payment p
          JOIN Class c ON p.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          JOIN User u ON p.payerId = u.id
          LEFT JOIN User teacher ON c.teacherId = teacher.id
          WHERE a.id = ?
          AND p.status = 'PENDING'
          AND p.type = 'STUDENT_TO_ACADEMY'
          ORDER BY p.createdAt DESC
        `;
        params = [academyId];
      } else {
        query = `
          SELECT 
            p.id as enrollmentId,
            p.status as paymentStatus,
            p.paymentMethod,
            p.amount as paymentAmount,
            p.createdAt as enrolledAt,
            p.payerId as studentId,
            u.firstName as studentFirstName,
            u.lastName as studentLastName,
            u.email as studentEmail,
            p.classId,
            c.name as className,
            p.currency,
            a.id as academyId,
            a.name as academyName,
            teacher.firstName || ' ' || teacher.lastName as teacherName
          FROM Payment p
          JOIN Class c ON p.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          JOIN User u ON p.payerId = u.id
          LEFT JOIN User teacher ON c.teacherId = teacher.id
          WHERE p.status = 'PENDING'
          AND p.type = 'STUDENT_TO_ACADEMY'
          ORDER BY p.createdAt DESC
        `;
      }
    } else {
      return c.json(errorResponse('Only academy owners, teachers, and admins can view pending payments'), 403);
    }

    const result = await c.env.DB
      .prepare(query)
      .bind(...params)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Pending Cash Payments] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /payments/pending-count - Get count of pending payments for academy
payments.get('/pending-count', async (c) => {
  try {
    const session = await requireAuth(c);

    let count = 0;

    if (session.role === 'ACADEMY') {
      const result: any = await c.env.DB
        .prepare(`
          SELECT COUNT(*) as count
          FROM Payment p
          JOIN Class c ON p.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          WHERE a.ownerId = ? 
          AND p.status = 'PENDING'
          AND p.type = 'STUDENT_TO_ACADEMY'
        `)
        .bind(session.id)
        .first();
      count = result?.count || 0;
    } else if (session.role === 'TEACHER') {
      const result: any = await c.env.DB
        .prepare(`
          SELECT COUNT(*) as count
          FROM Payment p
          JOIN Class c ON p.classId = c.id
          WHERE c.teacherId = ?
          AND p.status = 'PENDING'
          AND p.type = 'STUDENT_TO_ACADEMY'
        `)
        .bind(session.id)
        .first();
      count = result?.count || 0;
    }

    return c.json(successResponse(count));
  } catch (error: any) {
    console.error('[Payments] Error fetching pending count:', error);
    return c.json(errorResponse('Failed to fetch pending payments count'), 500);
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
          e.status as enrollmentStatus,
          e.classId,
          c.academyId,
          c.monthlyPrice,
          c.oneTimePrice,
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

    if (enrollment.enrollmentStatus !== 'PENDING') {
      return c.json(errorResponse('Enrollment is not in pending state'), 400);
    }

    // Track who approved/denied the payment
    const approverName = `Academia: ${session.firstName} ${session.lastName}`;

    // Update ClassEnrollment status
    const newStatus = approved ? 'APPROVED' : 'REJECTED';
    await c.env.DB
      .prepare(`
        UPDATE ClassEnrollment 
        SET status = ?,
            approvedAt = CASE WHEN ? = 'APPROVED' THEN datetime('now') ELSE NULL END
        WHERE id = ?
      `)
      .bind(newStatus, newStatus, enrollmentId)
      .run();

    // If approved, create Payment record
    if (approved) {
      const enrollmentData: any = await c.env.DB
        .prepare(`
          SELECT 
            e.userId,
            e.classId,
            u.firstName,
            u.lastName,
            u.email,
            c.academyId,
            c.monthlyPrice,
            c.oneTimePrice
          FROM ClassEnrollment e
          JOIN User u ON e.userId = u.id
          JOIN Class c ON e.classId = c.id
          WHERE e.id = ?
        `)
        .bind(enrollmentId)
        .first();

      if (enrollmentData) {
        const paymentId = crypto.randomUUID();
        await c.env.DB
          .prepare(`
            INSERT INTO Payment (
              id, type, payerId, receiverId, amount, currency, status, paymentMethod,
              classId, metadata, createdAt, completedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `)
          .bind(
            paymentId,
            'STUDENT_TO_ACADEMY',
            enrollmentData.userId,
            enrollmentData.academyId,
            enrollmentData.price,
            enrollmentData.currency || 'EUR',
            'PAID',
            'cash',
            enrollmentData.classId,
            JSON.stringify({ originalEnrollmentId: enrollmentId, approvedBy: session.id, approvedAt: new Date().toISOString(), approverName: approverName })
          )
          .run();
      }
    }

    return c.json(successResponse({
      message: approved ? 'Cash payment approved' : 'Cash payment rejected',
      status: newStatus,
    }));
  } catch (error: any) {
    console.error('[Approve Cash Payment] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /payments/stripe-session - Create Stripe Checkout Session (Stripe Connect)
payments.post('/stripe-session', async (c) => {
  try {
    const session = await requireAuth(c);
    const { classId, paymentFrequency } = await c.req.json();
    if (!classId) {
      return c.json(errorResponse('classId is required'), 400);
    }

    if (!paymentFrequency || !['monthly', 'one-time'].includes(paymentFrequency)) {
      return c.json(errorResponse('Valid paymentFrequency is required (monthly or one-time)'), 400);
    }

    // Get class details
    const classData: any = await c.env.DB
      .prepare(`
        SELECT c.id, c.name, c.monthlyPrice, c.oneTimePrice, a.stripeAccountId, a.id as academyId
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        WHERE c.id = ?
      `)
      .bind(classId)
      .first();
    if (!classData) {
      console.error('[Stripe Session] Class not found:', classId);
      return c.json(errorResponse('Class not found'), 404);
    }

    if (!classData.stripeAccountId) {
      console.error('[Stripe Session] No Stripe account for academy:', classData.academyId);
      return c.json(errorResponse('Academy has not set up Stripe Connect. Please pay with cash.'), 400);
    }

    // Determine price based on payment frequency
    const price = paymentFrequency === 'monthly' ? classData.monthlyPrice : classData.oneTimePrice;
    
    if (!price || price <= 0) {
      return c.json(errorResponse(`${paymentFrequency === 'monthly' ? 'Monthly' : 'One-time'} payment not available for this class`), 400);
    }
    if (!c.env.STRIPE_SECRET_KEY) {
      return c.json(errorResponse('Stripe is not configured on this server'), 500);
    }

    // Create Stripe Checkout Session
    const stripe = require('stripe')(c.env.STRIPE_SECRET_KEY);
    
    // Stripe doesn't support Bizum directly - redirect to card payment
    const paymentMethods = ['card', 'link'];

    // Get enrollment ID for webhook
    const enrollment: any = await c.env.DB
      .prepare('SELECT id FROM ClassEnrollment WHERE userId = ? AND classId = ?')
      .bind(session.id, classId)
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Enrollment not found'), 404);
    }

    const isRecurring = paymentFrequency === 'monthly';
    const priceData: any = {
      currency: 'eur',
      product_data: { 
        name: `${classData.name} - Acceso completo`,
        description: isRecurring ? 'Suscripción mensual' : 'Pago único',
        images: ['https://akademo-edu.com/logo/akademo-icon.png'],
      },
      unit_amount: Math.round(price * 100), // Convert to cents
    };
    
    if (isRecurring) {
      priceData.recurring = { interval: 'month' };
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethods,
      line_items: [{
        price_data: priceData,
        quantity: 1,
      }],
      mode: isRecurring ? 'subscription' : 'payment',
      customer_email: session.email, // Pre-fill email field
      success_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/student/classes?payment=success&classId=${classId}`,
      cancel_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/student/classes?payment=cancel`,
      metadata: {
        enrollmentId: enrollment.id,
        classId,
        userId: session.id,
        academyId: classData.academyId,
        paymentFrequency: paymentFrequency,
      },
    });

    // Enrollment already exists, no need to update it - payment will be created by webhook

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
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /payments/my-payments - Get student's payment history
payments.get('/my-payments', async (c) => {
  try {
    const session = await requireAuth(c);

    const result = await c.env.DB
      .prepare(`
        SELECT 
          p.id as enrollmentId,
          p.status as paymentStatus,
          p.paymentMethod,
          p.amount as paymentAmount,
          p.completedAt as createdAt,
          p.classId,
          c.name as className,
          p.currency,
          a.name as academyName
        FROM Payment p
        JOIN Class c ON p.classId = c.id
        JOIN Academy a ON p.receiverId = a.id
        WHERE p.payerId = ? AND p.type = 'STUDENT_TO_ACADEMY'
        ORDER BY p.completedAt DESC
      `)
      .bind(session.id)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[My Payments] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PATCH /payments/:id/approve-payment - Approve a Payment table record (not ClassEnrollment)
payments.patch('/:id/approve-payment', async (c) => {
  try {
    const session = await requireAuth(c);
    const paymentId = c.req.param('id');
    const { approved } = await c.req.json();

    // Get payment details
    const payment: any = await c.env.DB
      .prepare(`
        SELECT 
          p.id,
          p.status,
          p.classId,
          c.academyId,
          a.ownerId
        FROM Payment p
        JOIN Class c ON p.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE p.id = ?
      `)
      .bind(paymentId)
      .first();

    if (!payment) {
      return c.json(errorResponse('Payment not found'), 404);
    }

    // Verify user owns the academy
    if (session.role !== 'ACADEMY' || payment.ownerId !== session.id) {
      return c.json(errorResponse('Only academy owners can approve payments'), 403);
    }

    if (payment.status !== 'PENDING') {
      return c.json(errorResponse('Payment is not in pending state'), 400);
    }

    // Update Payment status
    const newStatus = approved ? 'PAID' : 'REJECTED';
    await c.env.DB
      .prepare(`
        UPDATE Payment 
        SET status = ?,
            completedAt = datetime('now')
        WHERE id = ?
      `)
      .bind(newStatus, paymentId)
      .run();

    return c.json(successResponse({ message: approved ? 'Payment approved' : 'Payment rejected' }));
  } catch (error: any) {
    console.error('[Approve Payment] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /payments/history - Academy views payment history (approved/rejected)
payments.get('/history', async (c) => {
  try {
    const session = await requireAuth(c);
    let query = '';
    let params: any[] = [];

    if (session.role === 'ACADEMY') {
      // Query Payment table (migration from ClassEnrollment completed)
      query = `
        SELECT 
          p.id as paymentId,
          p.id as enrollmentId,
          p.payerId as studentId,
          p.classId,
          p.amount as paymentAmount,
          p.currency,
          p.paymentMethod,
          p.completedAt as approvedAt,
          p.status as paymentStatus,
          u.firstName as studentFirstName,
          u.lastName as studentLastName,
          u.email as studentEmail,
          c.name as className,
          teacher.firstName || ' ' || teacher.lastName as teacherName
        FROM Payment p
        JOIN Class c ON p.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        JOIN User u ON p.payerId = u.id
        LEFT JOIN User teacher ON c.teacherId = teacher.id
        WHERE a.ownerId = ? 
          AND p.status IN ('PAID', 'COMPLETED')
          AND p.type = 'STUDENT_TO_ACADEMY'
        ORDER BY p.completedAt DESC
        LIMIT 50
      `;
      params = [session.id];
    } else if (session.role === 'ADMIN') {
      const academyId = c.req.query('academyId');
      if (academyId) {
        query = `
          SELECT 
            p.id as paymentId,
            p.id as enrollmentId,
            p.payerId as studentId,
            p.classId,
            p.amount as paymentAmount,
            p.currency,
            p.paymentMethod,
            p.completedAt as approvedAt,
            p.createdAt,
            p.updatedAt,
            p.status as paymentStatus,
            u.firstName as studentFirstName,
            u.lastName as studentLastName,
            u.email as studentEmail,
            c.name as className,
            a.id as academyId,
            a.name as academyName,
            teacher.firstName || ' ' || teacher.lastName as teacherName
          FROM Payment p
          JOIN Class c ON p.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          JOIN User u ON p.payerId = u.id
          LEFT JOIN User teacher ON c.teacherId = teacher.id
          WHERE a.id = ?
            AND p.status IN ('PAID', 'COMPLETED')
            AND p.type = 'STUDENT_TO_ACADEMY'
          ORDER BY p.completedAt DESC
          LIMIT 100
        `;
        params = [academyId];
      } else {
        query = `
          SELECT 
            p.id as paymentId,
            p.id as enrollmentId,
            p.payerId as studentId,
            p.classId,
            p.amount as paymentAmount,
            p.currency,
            p.paymentMethod,
            p.completedAt as approvedAt,
            p.createdAt,
            p.updatedAt,
            p.status as paymentStatus,
            u.firstName as studentFirstName,
            u.lastName as studentLastName,
            u.email as studentEmail,
            c.name as className,
            a.id as academyId,
            a.name as academyName,
            teacher.firstName || ' ' || teacher.lastName as teacherName
          FROM Payment p
          JOIN Class c ON p.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          JOIN User u ON p.payerId = u.id
          LEFT JOIN User teacher ON c.teacherId = teacher.id
          WHERE p.status IN ('PAID', 'COMPLETED')
            AND p.type = 'STUDENT_TO_ACADEMY'
          ORDER BY p.completedAt DESC
          LIMIT 100
        `;
      }
    } else {
      return c.json(errorResponse('Only academy owners and admins can view payment history'), 403);
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();
    if (result.results && result.results.length > 0) {
    }

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Payment History] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
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

    // Get payment with academy info
    const payment: any = await c.env.DB
      .prepare(`
        SELECT 
          p.id,
          p.status,
          p.classId,
          c.academyId,
          a.ownerId
        FROM Payment p
        JOIN Class c ON p.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE p.id = ?
      `)
      .bind(enrollmentId)
      .first();

    if (!payment) {
      return c.json(errorResponse('Payment not found'), 404);
    }

    // Verify user owns the academy
    if (session.role !== 'ACADEMY' || payment.ownerId !== session.id) {
      return c.json(errorResponse('Only academy owners can reverse payments'), 403);
    }

    // Toggle status: COMPLETED <-> PENDING
    const newStatus = payment.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const completedAt = newStatus === 'COMPLETED' ? 'datetime(\'now\')' : 'NULL';

    await c.env.DB
      .prepare(`
        UPDATE Payment 
        SET status = ?,
            completedAt = ${completedAt}
        WHERE id = ?
      `)
      .bind(newStatus, enrollmentId)
      .run();

    return c.json(successResponse({ 
      message: `Payment status changed to ${newStatus}`,
      newStatus 
    }));

  } catch (error: any) {
    console.error('[Reverse Payment] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
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
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /payments/stripe-connect - Create Stripe Connect account onboarding link
payments.post('/stripe-connect', async (c) => {
  try {
    const session = await requireAuth(c);
    await requireRole(c, ['ACADEMY']);

    if (!c.env.STRIPE_SECRET_KEY) {
      return c.json(errorResponse('Stripe is not configured on this server'), 500);
    }

    // Get academy
    const academy: any = await c.env.DB
      .prepare('SELECT id, name, stripeAccountId, ownerId FROM Academy WHERE ownerId = ?')
      .bind(session.id)
      .first();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    const stripe = require('stripe')(c.env.STRIPE_SECRET_KEY);
    let accountId = academy.stripeAccountId;

    // If academy doesn't have a Stripe account, create one
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'ES',
        email: session.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        business_profile: {
          name: academy.name,
        },
      });

      accountId = account.id;

      // Save to database
      await c.env.DB
        .prepare('UPDATE Academy SET stripeAccountId = ? WHERE id = ?')
        .bind(accountId, academy.id)
        .run();
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/academy/profile?stripe=refresh`,
      return_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/academy/profile?stripe=complete`,
      type: 'account_onboarding',
    });

    return c.json(successResponse({ 
      url: accountLink.url,
      accountId 
    }));

  } catch (error: any) {
    console.error('[Stripe Connect] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /payments/stripe-status - Check if academy's Stripe account is fully onboarded
payments.get('/stripe-status', async (c) => {
  try {
    const session = await requireAuth(c);
    await requireRole(c, ['ACADEMY']);

    const academy: any = await c.env.DB
      .prepare('SELECT id, name, stripeAccountId FROM Academy WHERE ownerId = ?')
      .bind(session.id)
      .first();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    if (!academy.stripeAccountId) {
      return c.json(successResponse({ 
        connected: false,
        charges_enabled: false,
        details_submitted: false
      }));
    }

    if (!c.env.STRIPE_SECRET_KEY) {
      return c.json(errorResponse('Stripe is not configured on this server'), 500);
    }

    const stripe = require('stripe')(c.env.STRIPE_SECRET_KEY);
    const account = await stripe.accounts.retrieve(academy.stripeAccountId);

    return c.json(successResponse({
      connected: true,
      accountId: academy.stripeAccountId,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
      email: account.email,
    }));

  } catch (error: any) {
    console.error('[Stripe Status] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /payments/register-manual - Academy registers a manual payment
payments.post('/register-manual', async (c) => {
  const session = await requireAuth(c);
  try {
    if (session.role !== 'ACADEMY' && session.role !== 'ADMIN') {
      return c.json(errorResponse('Only academy owners can register payments'), 403);
    }

    const { studentId, classId, amount, paymentMethod, status = 'PAID' } = await c.req.json();

    if (!studentId || !classId || !amount || !paymentMethod) {
      return c.json(errorResponse('All fields are required'), 400);
    }

    // Verify class belongs to academy
    const classData: any = await c.env.DB
      .prepare(`
        SELECT c.id, c.name, c.academyId, a.ownerId, a.name as academyName
        FROM Class c
        JOIN Academy a ON c.academyId = a.id
        WHERE c.id = ?
      `)
      .bind(classId)
      .first();

    if (!classData || (session.role === 'ACADEMY' && classData.ownerId !== session.id)) {
      return c.json(errorResponse('Class not found or not authorized'), 404);
    }

    // Check if enrollment exists
    const enrollment: any = await c.env.DB
      .prepare('SELECT id FROM ClassEnrollment WHERE userId = ? AND classId = ?')
      .bind(studentId, classId)
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Student is not enrolled in this class'), 400);
    }

    // Get student info
    const student: any = await c.env.DB
      .prepare('SELECT firstName, lastName, email FROM User WHERE id = ?')
      .bind(studentId)
      .first();

    // Create payment record
    const paymentId = crypto.randomUUID();
    const approvedBy = `${session.firstName} ${session.lastName} (${classData.academyName})`;
    const completedAt = status === 'PAID' ? "datetime('now')" : 'NULL';
    
    const result = await c.env.DB
      .prepare(`
        INSERT INTO Payment (
          id, type, payerId, receiverId, amount, currency, status, paymentMethod,
          classId, metadata, createdAt, completedAt, payerName, payerEmail, receiverName
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ${completedAt}, ?, ?, ?)
      `)
      .bind(
        paymentId,
        'STUDENT_TO_ACADEMY',
        studentId,
        classData.academyId,
        amount,
        'EUR',
        status,
        paymentMethod,
        classId,
        JSON.stringify({ 
          registeredBy: session.id, 
          approvedBy: approvedBy,
          enrollmentId: enrollment.id 
        }),
        `${student.firstName} ${student.lastName}`,
        student.email,
        classData.academyName,
      )
      .run();

    if (!result.success) {
      throw new Error('Failed to insert payment record');
    }

    return c.json(successResponse({ id: paymentId, message: 'Pago registrado exitosamente' }));
  } catch (error: any) {
    console.error('[Payments] Error registering manual payment:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// DELETE /payments/:id - Delete a payment (reject or remove from ClassEnrollment)
payments.delete('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const paymentId = c.req.param('id');

    // Get payment details
    const payment: any = await c.env.DB
      .prepare(`
        SELECT p.*, c.academyId, a.ownerId
        FROM Payment p
        LEFT JOIN Class c ON p.classId = c.id
        LEFT JOIN Academy a ON c.academyId = a.id
        WHERE p.id = ?
      `)
      .bind(paymentId)
      .first();

    if (!payment) {
      return c.json(errorResponse('Payment not found'), 404);
    }

    // Check permissions - only academy owner or admin can delete
    const isOwner = session.role === 'ACADEMY' && payment.ownerId === session.id;
    const isAdmin = session.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return c.json(errorResponse('Not authorized to delete this payment'), 403);
    }

    // Delete the payment record
    await c.env.DB
      .prepare('DELETE FROM Payment WHERE id = ?')
      .bind(paymentId)
      .run();

    return c.json(successResponse({ message: 'Payment deleted successfully' }));
  } catch (error: any) {
    console.error('[Payments] Error deleting payment:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PATCH /payments/:id - Update a payment record
payments.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const paymentId = c.req.param('id');
    const { amount, paymentMethod, status } = await c.req.json();

    // Get payment details with enrollment and academy info
    const payment: any = await c.env.DB
      .prepare(`
        SELECT p.*, e.classId, c.academyId, a.ownerId
        FROM Payment p
        JOIN ClassEnrollment e ON p.classId = e.classId AND p.payerId = e.userId
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE p.id = ?
      `)
      .bind(paymentId)
      .first();

    if (!payment) {
      return c.json(errorResponse('Payment not found'), 404);
    }

    // Check permissions - only academy owner or admin can edit
    const isOwner = session.role === 'ACADEMY' && payment.ownerId === session.id;
    const isAdmin = session.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return c.json(errorResponse('Not authorized to edit this payment'), 403);
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (amount !== undefined) {
      updates.push('amount = ?');
      values.push(amount);
    }

    if (paymentMethod !== undefined) {
      updates.push('paymentMethod = ?');
      values.push(paymentMethod);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
      
      // Update completedAt based on status
      if (status === 'PAID') {
        updates.push('completedAt = datetime(\'now\')');
      } else {
        updates.push('completedAt = NULL');
      }
    }

    if (updates.length === 0) {
      return c.json(errorResponse('No fields to update'), 400);
    }

    values.push(paymentId);

    await c.env.DB
      .prepare(`UPDATE Payment SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await c.env.DB
      .prepare('SELECT * FROM Payment WHERE id = ?')
      .bind(paymentId)
      .first();

    return c.json(successResponse(updated));
  } catch (error: any) {
    console.error('[Payments] Error updating payment:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /payments/academy-activation-session - Create Stripe checkout for academy activation
payments.post('/academy-activation-session', async (c) => {
  try {
    const session = await requireAuth(c);

    // Verify user is ACADEMY role
    if (session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only academy owners can activate'), 403);
    }

    // Get academy ID
    const academy: any = await c.env.DB
      .prepare('SELECT id, name FROM Academy WHERE ownerId = ?')
      .bind(session.id)
      .first();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    const stripe = require('stripe')(c.env.STRIPE_SECRET_KEY) as any;

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Activación de Academia AKADEMO',
            description: 'Acceso completo a todas las funciones de AKADEMO',
            images: ['https://akademo-edu.com/logo/akademo-icon.png'],
          },
          unit_amount: 29900, // €299 activation fee
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: session.email, // Pre-fill email field
      success_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/academy?payment=success`,
      cancel_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/academy?payment=cancel`,
      metadata: {
        type: 'academy_activation',
        academyId: academy.id,
        userId: session.id,
      },
    });

    return c.json(successResponse({ url: checkoutSession.url }));
  } catch (error: any) {
    console.error('[Academy Activation] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default payments;
