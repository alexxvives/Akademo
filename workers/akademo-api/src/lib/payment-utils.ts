// Shared billing helpers used by both routes/payments.ts and routes/classes.ts

type BillingEnrollmentRow = {
  enrollmentId: string;
  studentId: string;
  classId: string;
  enrolledAt: string;
  paymentFrequency: string | null;
  paymentMethod: string | null;
  monthlyPrice: number | null;
  oneTimePrice: number | null;
  classStartDate: string | null;
  firstName: string;
  lastName: string;
  email: string;
  academyId: string;
  academyName: string;
  totalPaid: number | null;
};

type DerivedBillingState = {
  amountOwed: number;
  description: string;
  monthsOwed: number;
  nextPaymentDue: string | null;
  billingCycleEnd: string | null;
  isOverdue: boolean;
};

type BillingSyncScope = {
  userId?: string;
  academyOwnerId?: string;
};

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

function deriveBillingState(enrollment: BillingEnrollmentRow, today = new Date()): DerivedBillingState {
  const totalPaid = Number(enrollment.totalPaid) || 0;
  const isMonthly = enrollment.paymentFrequency === 'MONTHLY';
  const monthlyPrice = Number(enrollment.monthlyPrice) || 0;
  const oneTimePrice = Number(enrollment.oneTimePrice) || 0;

  let amountOwed = 0;
  let description = '';
  let monthsOwed = 0;
  let nextPaymentDue: string | null = null;
  let billingCycleEnd: string | null = null;
  let isOverdue = false;

  if (isMonthly && monthlyPrice > 0) {
    const classStart = new Date(enrollment.classStartDate || enrollment.enrolledAt);
    if (today >= classStart) {
      const elapsedCycles = countElapsedCycles(classStart, today);
      const maxCycles = oneTimePrice > 0 ? Math.ceil(oneTimePrice / monthlyPrice) : 9999;
      const cappedCycles = Math.min(elapsedCycles, maxCycles);
      const totalExpected = cappedCycles * monthlyPrice;

      amountOwed = Math.max(0, totalExpected - totalPaid);
      monthsOwed = Math.max(0, cappedCycles - Math.floor(totalPaid / monthlyPrice));

      const cycleEnd = addMonths(classStart, elapsedCycles);
      nextPaymentDue = cycleEnd.toISOString();
      billingCycleEnd = cycleEnd.toISOString();
      isOverdue = amountOwed > 0 && cycleEnd < today;

      if (monthsOwed > 1) {
        description = `Pago pendiente (${monthsOwed} meses × ${monthlyPrice}€)`;
      } else if (monthsOwed === 1) {
        description = 'Pago pendiente mensual';
      }
    }
  } else if (!isMonthly && oneTimePrice > 0) {
    if (totalPaid < oneTimePrice) {
      amountOwed = oneTimePrice - totalPaid;
      description = 'Pago único pendiente';
    }
  }

  return {
    amountOwed,
    description,
    monthsOwed,
    nextPaymentDue,
    billingCycleEnd,
    isOverdue,
  };
}

async function syncPendingPaymentForEnrollment(db: D1Database, enrollment: BillingEnrollmentRow): Promise<void> {
  const derived = deriveBillingState(enrollment);
  const existingPayment = await db
    .prepare(`
      SELECT id, metadata
      FROM Payment
      WHERE payerId = ? AND classId = ?
        AND status = 'PENDING' AND type = 'STUDENT_TO_ACADEMY'
      LIMIT 1
    `)
    .bind(enrollment.studentId, enrollment.classId)
    .first() as { id: string; metadata: string | null } | null;

  if (derived.amountOwed <= 0) {
    if (existingPayment) {
      await db.prepare('DELETE FROM Payment WHERE id = ?').bind(existingPayment.id).run();
    }
    return;
  }

  const paymentMethod = enrollment.paymentMethod || 'cash';

  if (!existingPayment) {
    const paymentId = `payment-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    await db
      .prepare(`
        INSERT INTO Payment (
          id, type, payerId, payerType, payerName, payerEmail,
          receiverId, receiverName, amount, currency, status,
          paymentMethod, classId, description, metadata, nextPaymentDue, billingCycleEnd, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        paymentId,
        'STUDENT_TO_ACADEMY',
        enrollment.studentId,
        'STUDENT',
        `${enrollment.firstName} ${enrollment.lastName}`,
        enrollment.email,
        enrollment.academyId,
        enrollment.academyName,
        derived.amountOwed,
        'EUR',
        'PENDING',
        paymentMethod,
        enrollment.classId,
        derived.description,
        JSON.stringify({
          enrollmentId: enrollment.enrollmentId,
          monthsOwed: derived.monthsOwed,
          autoCreated: true,
        }),
        derived.nextPaymentDue,
        derived.billingCycleEnd,
      )
      .run();
    return;
  }

  const prevMeta = (() => {
    try {
      return JSON.parse(existingPayment.metadata || '{}');
    } catch {
      return {};
    }
  })();

  await db
    .prepare(`
      UPDATE Payment
      SET amount = ?,
          paymentMethod = ?,
          description = ?,
          metadata = ?,
          nextPaymentDue = ?,
          billingCycleEnd = ?
      WHERE id = ?
    `)
    .bind(
      derived.amountOwed,
      paymentMethod,
      derived.description,
      JSON.stringify({
        ...prevMeta,
        enrollmentId: enrollment.enrollmentId,
        monthsOwed: derived.monthsOwed,
        autoUpdated: true,
      }),
      derived.nextPaymentDue,
      derived.billingCycleEnd,
      existingPayment.id,
    )
    .run();
}

async function syncDerivedPendingPayments(db: D1Database, scope: BillingSyncScope): Promise<void> {
  const whereClauses = [
    `ce.status = 'APPROVED'`,
    `ce.stripeSubscriptionId IS NULL`,
  ];
  const params: string[] = [];

  if (scope.userId) {
    whereClauses.push('ce.userId = ?');
    params.push(scope.userId);
  }

  if (scope.academyOwnerId) {
    whereClauses.push('a.ownerId = ?');
    params.push(scope.academyOwnerId);
  }

  const enrollments = await db
    .prepare(`
      SELECT 
        ce.id as enrollmentId,
        ce.userId as studentId,
        ce.classId,
        ce.enrolledAt,
        ce.paymentFrequency,
        ce.paymentMethod,
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
      WHERE ${whereClauses.join(' AND ')}
    `)
    .bind(...params)
    .all();

  for (const enrollment of (enrollments.results || []) as BillingEnrollmentRow[]) {
    await syncPendingPaymentForEnrollment(db, enrollment);
  }
}

/**
 * Check if a student has overdue manual payments for a class.
 * Returns true if the student should be BLOCKED from accessing content.
 * This is derived from enrollment + completed ledger state, not from scheduled jobs.
 */
export async function isPaymentOverdue(db: D1Database, userId: string, classId: string): Promise<boolean> {
  const enrollment = await db
    .prepare(`
      SELECT 
        ce.id as enrollmentId,
        ce.userId as studentId,
        ce.classId,
        ce.enrolledAt,
        ce.paymentFrequency,
        ce.paymentMethod,
        c.monthlyPrice,
        c.oneTimePrice,
        c.startDate as classStartDate,
        u.firstName,
        u.lastName,
        u.email,
        a.id as academyId,
        a.name as academyName,
        COALESCE(
          (SELECT SUM(p.amount) FROM Payment p
           WHERE p.payerId = ce.userId AND p.classId = ce.classId
             AND p.status IN ('PAID', 'COMPLETED') AND p.type = 'STUDENT_TO_ACADEMY'), 0
        ) as totalPaid
      FROM ClassEnrollment ce
      JOIN Class c ON ce.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      JOIN User u ON ce.userId = u.id
      WHERE ce.userId = ?
        AND ce.classId = ?
        AND ce.status = 'APPROVED'
        AND ce.stripeSubscriptionId IS NULL
      LIMIT 1
    `)
    .bind(userId, classId)
    .first() as BillingEnrollmentRow | null;

  if (!enrollment) {
    return false;
  }

  return deriveBillingState(enrollment).isOverdue;
}

// Auto-create or update PENDING Payment records for a student's approved enrollments.
// Call this before reading payment status so the DB reflects the current derived billing state.
export async function autoCreatePendingPayments(db: D1Database, userId: string): Promise<void> {
  await syncDerivedPendingPayments(db, { userId });
}
