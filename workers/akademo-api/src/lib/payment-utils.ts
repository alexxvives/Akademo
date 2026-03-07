// Shared billing helpers used by both routes/payments.ts and routes/classes.ts

/**
 * Check if a student has overdue payments for a class.
 * Returns true if the student should be BLOCKED from accessing content.
 * A student is blocked if there is a PENDING payment whose nextPaymentDue is in the past.
 */
export async function isPaymentOverdue(db: D1Database, userId: string, classId: string): Promise<boolean> {
  const overdue = await db
    .prepare(`
      SELECT p.id FROM Payment p
      WHERE p.payerId = ? AND p.classId = ? AND p.status = 'PENDING'
        AND p.nextPaymentDue IS NOT NULL AND p.nextPaymentDue < datetime('now')
      LIMIT 1
    `)
    .bind(userId, classId)
    .first();
  return !!overdue;
}

// Helper: add N calendar months to a date (clamps day to month end)
export function addMonths(date: Date, months: number): Date {
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
export function countElapsedCycles(classStart: Date, today: Date): number {
  if (today < classStart) return 0;
  let months = (today.getFullYear() - classStart.getFullYear()) * 12
             + (today.getMonth() - classStart.getMonth());
  if (today.getDate() < classStart.getDate()) {
    months = Math.max(0, months - 1);
  }
  return months + 1;
}

// Auto-create or update PENDING Payment records for a student's approved enrollments.
// Call this before reading payment status so the DB always reflects the current billing cycle.
export async function autoCreatePendingPayments(db: D1Database, userId: string): Promise<void> {
  const enrollments = await db
    .prepare(`
      SELECT 
        ce.id as enrollmentId,
        ce.userId as studentId,
        ce.classId,
        ce.enrolledAt,
        ce.paymentFrequency,
        c.monthlyPrice,
        c.oneTimePrice,
        c.startDate as classStartDate,
        u.firstName,
        u.lastName,
        u.email,
        a.id as academyId,
        a.name as academyName,
        COALESCE(
          (SELECT SUM(p2.amount) FROM Payment p2 
           WHERE p2.payerId = ce.userId AND p2.classId = ce.classId 
           AND p2.status IN ('PAID', 'COMPLETED') AND p2.type = 'STUDENT_TO_ACADEMY'), 0
        ) as totalPaid
      FROM ClassEnrollment ce
      JOIN Class c ON ce.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      JOIN User u ON ce.userId = u.id
      WHERE ce.userId = ? AND ce.status = 'APPROVED'
            AND ce.stripeSubscriptionId IS NULL  -- Stripe handles billing for these; skip manual pending creation
    `)
    .bind(userId)
    .all();

  for (const enrollment of (enrollments.results || []) as any[]) {
    const totalPaid = enrollment.totalPaid || 0;
    const isMonthly = enrollment.paymentFrequency === 'MONTHLY';
    const monthlyPrice = enrollment.monthlyPrice;
    const oneTimePrice = enrollment.oneTimePrice;

    let amountOwed = 0;
    let description = '';
    let monthsOwed = 0;
    let nextPaymentDue: string | null = null;
    let billingCycleEnd: string | null = null;

    if (isMonthly && monthlyPrice > 0) {
      const classStart = new Date(enrollment.classStartDate || enrollment.enrolledAt);
      const today = new Date();
      if (today >= classStart) {
        const elapsedCycles = countElapsedCycles(classStart, today);
        const maxCycles = (oneTimePrice && monthlyPrice > 0) ? Math.ceil(oneTimePrice / monthlyPrice) : 9999;
        const cappedCycles = Math.min(elapsedCycles, maxCycles);
        const totalExpected = cappedCycles * monthlyPrice;
        amountOwed = Math.max(0, totalExpected - totalPaid);
        monthsOwed = Math.max(0, cappedCycles - Math.floor(totalPaid / monthlyPrice));
        const cycleEnd = addMonths(classStart, elapsedCycles);
        nextPaymentDue = cycleEnd.toISOString();
        billingCycleEnd = cycleEnd.toISOString();
        if (monthsOwed > 1) description = `Pago pendiente (${monthsOwed} meses × ${monthlyPrice}€)`;
        else if (monthsOwed === 1) description = 'Pago pendiente mensual';
        // Note: we deliberately do NOT pre-create PENDING rows for future cycles here.
        // Doing so caused students to appear blocked immediately after their payment was approved.
        // The pending-cash UI loop handles showing upcoming payments for the academy view without
        // creating DB rows.
      }
    } else if (!isMonthly && oneTimePrice > 0) {
      if (totalPaid < oneTimePrice) {
        amountOwed = oneTimePrice - totalPaid;
        description = 'Pago único pendiente';
      }
    }

    if (amountOwed > 0) {
      const existingPayment = await db
        .prepare(`SELECT id, amount FROM Payment WHERE payerId = ? AND classId = ? AND status = 'PENDING' AND type = 'STUDENT_TO_ACADEMY' LIMIT 1`)
        .bind(enrollment.studentId, enrollment.classId)
        .first() as { id: string; amount: number } | null;
      if (!existingPayment) {
        const paymentId = `payment-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await db
          .prepare(`INSERT INTO Payment (id, type, payerId, payerType, payerName, payerEmail, receiverId, receiverName, amount, currency, status, paymentMethod, classId, description, metadata, nextPaymentDue, billingCycleEnd, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
          .bind(paymentId, 'STUDENT_TO_ACADEMY', enrollment.studentId, 'STUDENT', `${enrollment.firstName} ${enrollment.lastName}`, enrollment.email, enrollment.academyId, enrollment.academyName, amountOwed, 'EUR', 'PENDING', 'cash', enrollment.classId, description, JSON.stringify({ enrollmentId: enrollment.enrollmentId, monthsOwed, autoCreated: true }), nextPaymentDue, billingCycleEnd)
          .run();
      } else {
        await db
          .prepare(`UPDATE Payment SET amount = ?, description = ?, metadata = ?, nextPaymentDue = ?, billingCycleEnd = ? WHERE id = ?`)
          .bind(amountOwed, description, JSON.stringify({ enrollmentId: enrollment.enrollmentId, monthsOwed, autoUpdated: true }), nextPaymentDue, billingCycleEnd, existingPayment.id)
          .run();
      }
    }
  }
}
