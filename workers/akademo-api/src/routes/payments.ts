import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, requireRole } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { initiatePaymentSchema } from '../lib/validation';
import { autoCreatePendingPayments, addMonths, countElapsedCycles } from '../lib/payment-utils';
import { rateLimit } from '../lib/rate-limit';

const payments = new Hono<{ Bindings: Bindings }>();
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

function getStoredPaymentFrequency(payment: { metadata?: string | null }, fallback?: string | null): 'MONTHLY' | 'ONE_TIME' {
  try {
    const metadata = payment.metadata ? JSON.parse(payment.metadata) as { paymentFrequency?: string } : null;
    if (metadata?.paymentFrequency === 'monthly') {
      return 'MONTHLY';
    }
    if (metadata?.paymentFrequency === 'one-time') {
      return 'ONE_TIME';
    }
  } catch {
    // Ignore malformed metadata and fall back to enrollment data.
  }

  return fallback === 'MONTHLY' ? 'MONTHLY' : 'ONE_TIME';
}

// Rate limiter for payment initiation: 5 per minute per IP
const paymentInitiateRateLimit = rateLimit({
  prefix: 'pay-init',
  windowSec: 60,
  maxRequests: 5,
  keyFn: (c) => c.req.header('CF-Connecting-IP') || 'unknown',
});

// POST /payments/initiate - Student initiates a payment for a class
payments.post('/initiate', paymentInitiateRateLimit, async (c) => {
  try {
    const session = await requireAuth(c);

    // Validate body AFTER auth to avoid leaking field names to unauthenticated users
    const rawBody = await c.req.json();
    const validation = initiatePaymentSchema.safeParse(rawBody);
    if (!validation.success) {
      const errors = validation.error.errors.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return c.json({ success: false, error: 'Validation failed', details: errors }, 400);
    }
    const { classId, paymentMethod, paymentFrequency } = rawBody;

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
      .prepare('SELECT id, paymentFrequency FROM ClassEnrollment WHERE userId = ? AND classId = ?')
      .bind(session.id, classId)
      .first();

    if (!enrollment) {
      return c.json(errorResponse('You must be enrolled in this class first'), 400);
    }

    // Lock payment frequency after first completed payment.
    // If a student has already made a completed payment, they cannot switch frequency.
    const completedPayment: any = await c.env.DB
      .prepare(`SELECT id, metadata FROM Payment WHERE payerId = ? AND classId = ? AND status IN ('PAID', 'COMPLETED') LIMIT 1`)
      .bind(session.id, classId)
      .first();

    if (completedPayment && enrollment.paymentFrequency) {
      const lockedFrequency = enrollment.paymentFrequency === 'MONTHLY' ? 'monthly' : 'one-time';
      if (paymentFrequency !== lockedFrequency) {
        return c.json(errorResponse(`La frecuencia de pago ya está fijada como "${lockedFrequency}". No se puede cambiar después del primer pago.`), 400);
      }
    }

    // For one-time classes: block re-submission if the full amount is already paid
    if (paymentFrequency === 'one-time' && classData.oneTimePrice > 0) {
      const paidRow = await c.env.DB
        .prepare(`SELECT COALESCE(SUM(amount), 0) as totalPaid FROM Payment WHERE payerId = ? AND classId = ? AND status IN ('PAID', 'COMPLETED') AND type = 'STUDENT_TO_ACADEMY'`)
        .bind(session.id, classId)
        .first<{ totalPaid: number }>();
      if ((paidRow?.totalPaid ?? 0) >= classData.oneTimePrice) {
        return c.json(errorResponse('El pago único de esta clase ya ha sido completado'), 400);
      }
    }

    // Check if payment already exists
    const existingPayment: any = await c.env.DB
      .prepare('SELECT id, status, paymentMethod FROM Payment WHERE payerId = ? AND classId = ? AND status = ?')
      .bind(session.id, classId, 'PENDING')
      .first();

    if (existingPayment) {
      // Atomic batch: update payment + sync enrollment payment settings
      await c.env.DB.batch([
        c.env.DB.prepare(`
          UPDATE Payment 
          SET paymentMethod = ?,
              amount = ?,
              metadata = ?,
              nextPaymentDue = ?,
              billingCycleEnd = ?,
              createdAt = datetime('now')
          WHERE id = ?
        `).bind(
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
            note: billingCycle.missedCycles > 0 ? `Incluye ${billingCycle.missedCycles} ciclo(s) pendiente(s). Próximos pagos serán de ${price}€/mes.` : null,
            studentSubmitted: true
          }),
          billingCycle.nextPaymentDue,
          billingCycle.billingCycleEnd,
          existingPayment.id
        ),
        c.env.DB.prepare('UPDATE ClassEnrollment SET paymentFrequency = ? WHERE userId = ? AND classId = ?')
          .bind(isMonthly ? 'MONTHLY' : 'ONE_TIME', session.id, classId)
      ]);

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

    // Atomic batch: insert payment + sync enrollment payment settings
    await c.env.DB.batch([
      c.env.DB.prepare(`
        INSERT INTO Payment (
          id, type, payerId, payerType, receiverId, amount, currency, status,
          paymentMethod, classId, metadata, nextPaymentDue, billingCycleEnd, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        paymentId,
        'STUDENT_TO_ACADEMY',
        session.id,
        'STUDENT',
        classData.academyId,
        finalAmount,
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
          note: billingCycle.missedCycles > 0 ? `Incluye ${billingCycle.missedCycles} ciclo(s) pendiente(s). Próximos pagos serán de ${price}€/mes.` : null,
          studentSubmitted: true
        }),
        billingCycle.nextPaymentDue,
        billingCycle.billingCycleEnd
      ),
      c.env.DB.prepare('UPDATE ClassEnrollment SET paymentFrequency = ? WHERE userId = ? AND classId = ?')
        .bind(isMonthly ? 'MONTHLY' : 'ONE_TIME', session.id, classId)
    ]);

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
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Payment Initiate] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /payments/pending-cash - Academy/Teacher views student-submitted manual payments awaiting review
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Payments] Error fetching pending count:', error);
    return c.json(errorResponse('Failed to fetch pending payments count'), 500);
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
    const stripeKey = c.env.STRIPE_SECRET_KEY || c.env.STRIPE_SECRET_KEY_SANDBOX;
    if (!stripeKey) {
      return c.json(errorResponse('Stripe is not configured on this server'), 500);
    }

    // Create Stripe Checkout Session
    const stripe = require('stripe')(stripeKey);

    // Verify the academy's Connect account has completed onboarding and can accept charges.
    // If we skip this, Stripe throws an opaque error when creating the session and the student
    // sees a generic 500 instead of a helpful message.
    try {
      const connectAccount = await stripe.accounts.retrieve(classData.stripeAccountId);
      if (!connectAccount.charges_enabled) {
        return c.json(errorResponse('La academia aún no ha completado la configuración de pagos. Por favor, usa el método de pago en efectivo o contacta con la academia.'), 400);
      }
    } catch (stripeErr: any) {
      console.error('[Stripe Session] Failed to verify Connect account:', stripeErr.message);
      return c.json(errorResponse('No se pudo verificar la cuenta de pagos de la academia. Usa el método en efectivo o contacta con la academia.'), 400);
    }

    // Stripe doesn't support Transferencia directly — redirect to card payment
    const paymentMethods = ['card', 'link'];

    // Get enrollment ID for webhook
    const enrollment: any = await c.env.DB
      .prepare('SELECT id, stripeSubscriptionId FROM ClassEnrollment WHERE userId = ? AND classId = ?')
      .bind(session.id, classId)
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Enrollment not found'), 404);
    }

    // Guard: prevent double-subscription from multi-tab checkout.
    // If the student already has an active Stripe subscription for this class,
    // reject the request to avoid creating a duplicate subscription.
    if (enrollment.stripeSubscriptionId) {
      return c.json(errorResponse('Ya tienes una suscripción activa para esta clase. Si necesitas cambiar tu plan, cancela la suscripción actual primero.'), 409);
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

    // Build session params — direct charge on the academy's connected Stripe account
    const sessionParams: any = {
      payment_method_types: paymentMethods,
      line_items: [{
        price_data: priceData,
        quantity: 1,
      }],
      mode: isRecurring ? 'subscription' : 'payment',
      customer_email: session.email,
      success_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/student/subjects?payment=success&classId=${classId}`,
      cancel_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/student/subjects?payment=cancel`,
      metadata: {
        enrollmentId: enrollment.id,
        classId,
        userId: session.id,
        academyId: classData.academyId,
        paymentFrequency: paymentFrequency,
      },
    };

    // Direct charge: session is created on the academy's connected account so funds go straight to them
    const checkoutSession = await stripe.checkout.sessions.create(
      sessionParams,
      { stripeAccount: classData.stripeAccountId }
    );

    // Enrollment already exists, no need to update it — payment will be created by webhook
    return c.json(successResponse({ url: checkoutSession.url }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Stripe Session] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /payments/my-payments - Get student's payment history
payments.get('/my-payments', async (c) => {
  try {
    const session = await requireAuth(c);

    // AUTO-CREATE pending payments for the student's own approved enrollments
    // (shared helper also called from GET /classes so subjects page always reflects billing state)
    try {
      await autoCreatePendingPayments(c.env.DB, session.id);
    } catch (autoErr) {
      console.error('[my-payments auto-create]', autoErr);
      // Non-fatal; continue and return what's in the DB
    }

    const result = await c.env.DB
      .prepare(`
        SELECT 
          p.id as enrollmentId,
          p.status as paymentStatus,
          p.paymentMethod,
          p.amount as paymentAmount,
          COALESCE(p.completedAt, p.createdAt) as createdAt,
          COALESCE(p.nextPaymentDue, p.billingCycleEnd) as nextPaymentDue,
          p.classId,
          c.name as className,
          p.currency,
          a.name as academyName
        FROM Payment p
        JOIN Class c ON p.classId = c.id
        JOIN Academy a ON p.receiverId = a.id
        WHERE p.payerId = ? AND p.type = 'STUDENT_TO_ACADEMY'
        ORDER BY p.createdAt DESC
      `)
      .bind(session.id)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
          p.payerId,
          p.paymentMethod,
          p.metadata,
          p.nextPaymentDue,
          c.academyId,
          a.ownerId,
          ce.paymentFrequency
        FROM Payment p
        JOIN Class c ON p.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN ClassEnrollment ce ON ce.userId = p.payerId AND ce.classId = p.classId
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

    // Atomic batch: update payment + sync enrollment in one transaction
    const approvalBatch: any[] = [
      c.env.DB.prepare(`
        UPDATE Payment 
        SET status = ?,
            completedAt = datetime('now')
        WHERE id = ?
      `).bind(newStatus, paymentId)
    ];

    // Sync ClassEnrollment paymentFrequency and nextPaymentDue after manual approval
    if (approved && payment.payerId) {
      const freq = getStoredPaymentFrequency(payment, payment.paymentFrequency);
      if (freq !== 'ONE_TIME' && payment.nextPaymentDue) {
        approvalBatch.push(
          c.env.DB.prepare(`
            UPDATE ClassEnrollment
            SET nextPaymentDue = ?,
                paymentFrequency = ?
            WHERE userId = ? AND classId = ?
          `).bind(payment.nextPaymentDue, freq, payment.payerId, payment.classId)
        );
      } else {
        // ONE_TIME payments: mark frequency correctly, no recurring due date
        approvalBatch.push(
          c.env.DB.prepare(`
            UPDATE ClassEnrollment
            SET paymentFrequency = ?
            WHERE userId = ? AND classId = ?
          `).bind(freq, payment.payerId, payment.classId)
        );
      }
    }

    await c.env.DB.batch(approvalBatch);

    // Send confirmation email to student when payment is approved
    if (approved) {
      try {
        const studentInfo: any = await c.env.DB
          .prepare(`
            SELECT u.email, u.firstName, u.lastName, c.name as className, p.amount, p.currency
            FROM Payment p
            JOIN User u ON p.payerId = u.id
            JOIN Class c ON p.classId = c.id
            WHERE p.id = ?
          `)
          .bind(paymentId)
          .first();

        const resendApiKey = c.env.RESEND_API_KEY;
        if (resendApiKey && studentInfo?.email) {
          const studentName = `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim() || 'Estudiante';
          const amountDisplay = studentInfo.amount
            ? `${studentInfo.amount} ${studentInfo.currency === 'EUR' ? '€' : studentInfo.currency}`
            : '';

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'AKADEMO <noreply@akademo-edu.com>',
              to: [studentInfo.email],
              subject: `✅ Pago aprobado — ${studentInfo.className}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <img src="https://akademo-edu.com/logo/akademo-icon.png" alt="AKADEMO" style="height: 40px;" />
                  </div>
                  <h2 style="color: #111; margin-bottom: 8px;">¡Pago aprobado! 🎉</h2>
                  <p style="color: #555; margin-bottom: 24px;">Hola <strong>${studentName}</strong>, tu pago ha sido aprobado por la academia.</p>
                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px 0;"><strong>Asignatura:</strong> ${studentInfo.className}</p>
                    ${amountDisplay ? `<p style="margin: 0;"><strong>Importe:</strong> ${amountDisplay}</p>` : ''}
                  </div>
                  <p style="color: #555;">Ya puedes acceder a todo el contenido de la clase. ¡Buena suerte con tus estudios!</p>
                  <div style="margin-top: 32px; text-align: center;">
                    <a href="https://akademo-edu.com/dashboard/student/subjects" style="background: #111; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ir a mis asignaturas</a>
                  </div>
                  <p style="color: #aaa; font-size: 12px; margin-top: 32px; text-align: center;">AKADEMO · akademo-edu.com</p>
                </div>
              `,
            }),
          });
        }
      } catch (emailErr) {
        console.error('[Approve Payment] Email send failed (non-fatal):', emailErr);
      }
    }

    return c.json(successResponse({ message: approved ? 'Payment approved' : 'Payment rejected' }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
          p.payerId,
          p.stripePaymentId,
          p.paymentMethod,
          p.metadata,
          p.nextPaymentDue,
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

    // Guard: Stripe-backed payments must be refunded via Stripe Dashboard, not reversed here.
    // Reversing would create a phantom PENDING while money was already collected via Stripe.
    if (payment.stripePaymentId || payment.paymentMethod === 'stripe') {
      return c.json(errorResponse('Los pagos realizados por Stripe no se pueden revertir aquí. Usa el panel de Stripe para gestionar reembolsos.'), 400);
    }

    // Toggle status: PAID/COMPLETED → PENDING, anything else → COMPLETED
    const newStatus = (payment.status === 'COMPLETED' || payment.status === 'PAID') ? 'PENDING' : 'COMPLETED';
    const completedAtValue = newStatus === 'COMPLETED' ? new Date().toISOString() : null;

    const reverseBatch: any[] = [
      c.env.DB.prepare(`
        UPDATE Payment 
        SET status = ?,
            completedAt = ?
        WHERE id = ?
      `)
      .bind(newStatus, completedAtValue, enrollmentId)
    ];

    if (payment.payerId && payment.classId) {
      const freq = getStoredPaymentFrequency(payment);
      if (newStatus === 'COMPLETED') {
        if (freq === 'MONTHLY' && payment.nextPaymentDue) {
          reverseBatch.push(
            c.env.DB.prepare(`
              UPDATE ClassEnrollment
              SET paymentFrequency = ?,
                  nextPaymentDue = ?
              WHERE userId = ? AND classId = ?
            `).bind(freq, payment.nextPaymentDue, payment.payerId, payment.classId)
          );
        } else {
          reverseBatch.push(
            c.env.DB.prepare(`
              UPDATE ClassEnrollment
              SET paymentFrequency = ?
              WHERE userId = ? AND classId = ?
            `).bind(freq, payment.payerId, payment.classId)
          );
        }
      } else {
        reverseBatch.push(
          c.env.DB.prepare(`
            UPDATE ClassEnrollment
            SET paymentFrequency = ?
            WHERE userId = ? AND classId = ?
          `).bind(freq, payment.payerId, payment.classId)
        );
      }
    }

    await c.env.DB.batch(reverseBatch);

    return c.json(successResponse({ 
      message: `Payment status changed to ${newStatus}`,
      newStatus 
    }));

  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Reverse Payment] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /payments/stripe-connect - Create Stripe Connect account onboarding link
payments.post('/stripe-connect', async (c) => {
  try {
    const session = await requireAuth(c);
    await requireRole(c, ['ACADEMY']);

    if (!c.env.STRIPE_SECRET_KEY_SANDBOX) {
      return c.json(errorResponse('Stripe (sandbox) is not configured on this server'), 500);
    }

    // Get academy
    const academy: any = await c.env.DB
      .prepare('SELECT id, name, stripeAccountId, ownerId FROM Academy WHERE ownerId = ?')
      .bind(session.id)
      .first();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    const stripe = require('stripe')(c.env.STRIPE_SECRET_KEY_SANDBOX);
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
    // If this fails (e.g. account belongs to a different Stripe platform), create a fresh one
    let accountLink: any;
    try {
      accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/academy/profile?stripe=refresh`,
        return_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/academy/profile?stripe=complete`,
        type: 'account_onboarding',
      });
    } catch (linkErr: any) {
      // The stored account ID is invalid/belongs to another platform — create a new one
      console.warn('[Stripe Connect] accountLinks.create failed, creating fresh account:', linkErr.message);
      const freshAccount = await stripe.accounts.create({
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
      accountId = freshAccount.id;
      await c.env.DB
        .prepare('UPDATE Academy SET stripeAccountId = ? WHERE id = ?')
        .bind(accountId, academy.id)
        .run();
      accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/academy/profile?stripe=refresh`,
        return_url: `${c.env.FRONTEND_URL || 'https://akademo-edu.com'}/dashboard/academy/profile?stripe=complete`,
        type: 'account_onboarding',
      });
    }

    return c.json(successResponse({ 
      url: accountLink.url,
      accountId 
    }));

  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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

    if (!c.env.STRIPE_SECRET_KEY_SANDBOX) {
      return c.json(errorResponse('Stripe (sandbox) is not configured on this server'), 500);
    }

    const stripe = require('stripe')(c.env.STRIPE_SECRET_KEY_SANDBOX);
    const account = await stripe.accounts.retrieve(academy.stripeAccountId);

    return c.json(successResponse({
      connected: true,
      accountId: academy.stripeAccountId,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
      email: account.email,
    }));

  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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

    if (!studentId || !classId || amount === undefined || amount === null || !paymentMethod) {
      return c.json(errorResponse('All fields are required'), 400);
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return c.json(errorResponse('El importe debe ser un número mayor que 0'), 400);
    }

    const validStatuses = ['PAID', 'COMPLETED', 'PENDING'] as const;
    if (!validStatuses.includes(status)) {
      return c.json(errorResponse(`Invalid status: must be one of ${validStatuses.join(', ')}`), 400);
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
    const completedAtValue = (status === 'PAID' || status === 'COMPLETED') ? new Date().toISOString() : null;

    try {
      const result = await c.env.DB
        .prepare(`
          INSERT INTO Payment (
            id, type, payerId, receiverId, amount, currency, status, paymentMethod,
            classId, metadata, createdAt, completedAt, payerName, payerEmail, receiverName
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?)
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
          completedAtValue,
          `${student.firstName} ${student.lastName}`,
          student.email,
          classData.academyName,
        )
        .run();

      if (!result.success) {
        throw new Error('Failed to insert payment record');
      }
    } catch (insertErr: any) {
      // The unique partial index on (payerId, classId) WHERE status='PENDING' fires when the
      // academy tries to manually register a PENDING payment that already exists.
      if (insertErr?.message?.includes('UNIQUE') || insertErr?.cause?.message?.includes('UNIQUE')) {
        return c.json(errorResponse('Ya existe un pago pendiente para este alumno en esta clase. Apruébalo o elimínalo antes de registrar uno nuevo.'), 409);
      }
      throw insertErr;
    }

    return c.json(successResponse({ id: paymentId, message: 'Pago registrado exitosamente' }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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

    // Guard: only PENDING and REJECTED payments can be deleted.
    // PAID/COMPLETED records are part of the financial audit trail and must not be removed.
    if (payment.status === 'PAID' || payment.status === 'COMPLETED') {
      return c.json(errorResponse('Cannot delete a completed payment. Reverse it instead.'), 400);
    }

    // Delete the payment record
    await c.env.DB
      .prepare('DELETE FROM Payment WHERE id = ?')
      .bind(paymentId)
      .run();

    return c.json(successResponse({ message: 'Payment deleted successfully' }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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

    // Block status changes via PATCH — status must be changed through
    // dedicated approve/reject/reverse endpoints which handle enrollment sync.
    if (status !== undefined) {
      return c.json(errorResponse('No se puede cambiar el estado por esta vía. Usa los botones de aprobar, rechazar o revertir.'), 400);
    }

    // Get payment details with academy info (join via Class, not ClassEnrollment,
    // so this works even when enrollment is withdrawn or deleted)
    const payment: any = await c.env.DB
      .prepare(`
        SELECT p.*, c.academyId, a.ownerId
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
      .prepare('SELECT id, name, paymentStatus FROM Academy WHERE ownerId = ?')
      .bind(session.id)
      .first();

    if (!academy) {
      return c.json(errorResponse('Academy not found'), 404);
    }

    // Guard: don't create a new checkout session if the academy is already activated
    if ((academy as any).paymentStatus === 'PAID') {
      return c.json(errorResponse('Esta academia ya est\u00e1 activada. Si crees que esto es un error, contacta con soporte.'), 400);
    }

    const stripe = require('stripe')(c.env.STRIPE_SECRET_KEY_SANDBOX) as any;

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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Academy Activation] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default payments;
