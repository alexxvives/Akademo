// Shared billing helpers used by both routes/payments.ts and routes/classes.ts

/**
 * Parse a date string that may be DD/MM/YYYY, YYYY-MM-DD, or ISO format.
 * DD/MM/YYYY is the format used in CSV imports (Spanish locale).
 */
export function parseDateString(str: string): Date {
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Convert DD/MM/YYYY → YYYY-MM-DD for storage. Passes through other formats.
 */
export function normalizeDateForStorage(str: string): string {
  const s = String(str || '');
  const ddmmyyyy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return s;
}

export type BillingEnrollmentRow = {
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
  cuotas?: number | null;
};

export type DerivedBillingState = {
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

export function deriveBillingState(enrollment: BillingEnrollmentRow, today = new Date()): DerivedBillingState {
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
    const classStart = parseDateString(enrollment.classStartDate || enrollment.enrolledAt);
    if (today >= classStart) {
      const elapsedCycles = countElapsedCycles(classStart, today);
      const cuotasCount = Number(enrollment.cuotas) || 0;
      const maxCycles = cuotasCount > 0 ? cuotasCount : (oneTimePrice > 0 ? Math.ceil(oneTimePrice / monthlyPrice) : 9999);
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
    const classStart = parseDateString(enrollment.classStartDate || enrollment.enrolledAt);
    if (today >= classStart && totalPaid < oneTimePrice) {
      amountOwed = oneTimePrice - totalPaid;
      description = 'Pago único pendiente';
      isOverdue = true;
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

  const paymentMethod = (enrollment.paymentMethod && enrollment.paymentMethod !== 'stripe') ? enrollment.paymentMethod : 'cash';

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
  const enrollWhere = [
    `ce.status = 'APPROVED'`,
    `ce.stripeSubscriptionId IS NULL`,
    `(c.monthlyPrice > 0 OR c.oneTimePrice > 0)`,
  ];
  const enrollParams: string[] = [];

  // Build the payment scoping clause so all three batch queries use the same filter
  // without dynamic IN clauses (avoids D1's 100-bind-param limit for large academies).
  let paymentScopeJoin = '';
  let paymentScopeWhere = '';
  const paymentParams: string[] = [];

  if (scope.userId) {
    enrollWhere.push('ce.userId = ?');
    enrollParams.push(scope.userId);
    paymentScopeWhere = 'p.payerId = ?';
    paymentParams.push(scope.userId);
  }

  if (scope.academyOwnerId) {
    enrollWhere.push('a.ownerId = ?');
    enrollParams.push(scope.academyOwnerId);
    paymentScopeJoin = 'JOIN Class pc ON p.classId = pc.id JOIN Academy pa ON pc.academyId = pa.id';
    paymentScopeWhere = 'pa.ownerId = ?';
    paymentParams.push(scope.academyOwnerId);
  }

  // 1. Load all enrollments — correlated subqueries removed, fetched in batch below
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
        c.cuotas,
        u.firstName,
        u.lastName,
        u.email,
        a.id as academyId,
        a.name as academyName
      FROM ClassEnrollment ce
      JOIN Class c ON ce.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      JOIN User u ON ce.userId = u.id
      WHERE ${enrollWhere.join(' AND ')}
    `)
    .bind(...enrollParams)
    .all();

  const rows = (enrollments.results || []) as Omit<BillingEnrollmentRow, 'totalPaid' | 'paymentMethod'>[];
  if (rows.length === 0) return;

  // 2. Batch load all existing PENDING payments (replaces N individual SELECT queries)
  type PendingRow = { id: string; payerId: string; classId: string; amount: number; description: string | null; metadata: string | null };
  const pendingPayments = await db
    .prepare(`
      SELECT p.id, p.payerId, p.classId, p.amount, p.description, p.metadata
      FROM Payment p ${paymentScopeJoin}
      WHERE p.status = 'PENDING' AND p.type = 'STUDENT_TO_ACADEMY'
        AND ${paymentScopeWhere}
    `)
    .bind(...paymentParams)
    .all();

  // 3. Batch load total paid per (payerId, classId) — replaces N correlated SUM subqueries
  const paidTotals = await db
    .prepare(`
      SELECT p.payerId, p.classId, SUM(p.amount) as totalPaid
      FROM Payment p ${paymentScopeJoin}
      WHERE p.status IN ('PAID', 'COMPLETED') AND p.type = 'STUDENT_TO_ACADEMY'
        AND ${paymentScopeWhere}
      GROUP BY p.payerId, p.classId
    `)
    .bind(...paymentParams)
    .all();

  // 4. Batch load last payment method per (payerId, classId) — replaces N correlated subqueries
  const lastMethods = await db
    .prepare(`
      SELECT p.payerId, p.classId, p.paymentMethod
      FROM Payment p ${paymentScopeJoin}
      WHERE p.type = 'STUDENT_TO_ACADEMY'
        AND ${paymentScopeWhere}
      ORDER BY p.createdAt DESC
    `)
    .bind(...paymentParams)
    .all();

  // Build O(1) lookup maps
  const ek = (payerId: string, classId: string) => `${payerId}::${classId}`;

  const pendingMap = new Map<string, PendingRow>();
  for (const p of (pendingPayments.results || []) as PendingRow[]) {
    pendingMap.set(ek(p.payerId, p.classId), p);
  }

  const totalPaidMap = new Map<string, number>();
  for (const p of (paidTotals.results || []) as { payerId: string; classId: string; totalPaid: number }[]) {
    totalPaidMap.set(ek(p.payerId, p.classId), Number(p.totalPaid) || 0);
  }

  const methodMap = new Map<string, string>();
  for (const p of (lastMethods.results || []) as { payerId: string; classId: string; paymentMethod: string }[]) {
    const key = ek(p.payerId, p.classId);
    if (!methodMap.has(key)) { // ORDER BY createdAt DESC — first entry wins
      methodMap.set(key, p.paymentMethod);
    }
  }

  // 5. Process each enrollment using in-memory lookups (no per-enrollment DB queries)
  for (const enrollment of rows) {
    const key = ek(enrollment.studentId, enrollment.classId);
    const fullEnrollment: BillingEnrollmentRow = {
      ...enrollment,
      totalPaid: totalPaidMap.get(key) ?? 0,
      paymentMethod: methodMap.get(key) ?? null,
    };
    const derived = deriveBillingState(fullEnrollment);
    const existingPayment = pendingMap.get(key) ?? null;

    if (derived.amountOwed <= 0) {
      if (existingPayment) {
        await db.prepare('DELETE FROM Payment WHERE id = ?').bind(existingPayment.id).run();
      }
      continue;
    }

    const method = (fullEnrollment.paymentMethod && fullEnrollment.paymentMethod !== 'stripe')
      ? fullEnrollment.paymentMethod
      : 'cash';

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
          method,
          enrollment.classId,
          derived.description,
          JSON.stringify({ enrollmentId: enrollment.enrollmentId, monthsOwed: derived.monthsOwed, autoCreated: true }),
          derived.nextPaymentDue,
          derived.billingCycleEnd,
        )
        .run();
      continue;
    }

    // Skip write if amount and description are unchanged (avoids unnecessary D1 writes)
    if (existingPayment.amount === derived.amountOwed && existingPayment.description === derived.description) {
      continue;
    }

    const prevMeta = (() => { try { return JSON.parse(existingPayment.metadata || '{}'); } catch { return {}; } })();
    await db
      .prepare(`
        UPDATE Payment
        SET amount = ?, paymentMethod = ?, description = ?, metadata = ?,
            nextPaymentDue = ?, billingCycleEnd = ?
        WHERE id = ?
      `)
      .bind(
        derived.amountOwed,
        method,
        derived.description,
        JSON.stringify({ ...prevMeta, enrollmentId: enrollment.enrollmentId, monthsOwed: derived.monthsOwed, autoUpdated: true }),
        derived.nextPaymentDue,
        derived.billingCycleEnd,
        existingPayment.id,
      )
      .run();
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
        (SELECT p3.paymentMethod FROM Payment p3
         WHERE p3.payerId = ce.userId AND p3.classId = ce.classId AND p3.type = 'STUDENT_TO_ACADEMY'
         ORDER BY p3.createdAt DESC LIMIT 1) as paymentMethod,
        c.monthlyPrice,
        c.oneTimePrice,
        c.startDate as classStartDate,
        c.cuotas,
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

/**
 * Check if a student should be BLOCKED from accessing class content.
 * Combines documentSigned + payment overdue checks (three-gate model).
 * Returns true if access should be DENIED.
 */
export async function isAccessBlocked(db: D1Database, userId: string, classId: string): Promise<boolean> {
  // Check documentSigned flag on enrollment
  const enrollment = await db
    .prepare(`
      SELECT documentSigned, status, stripeSubscriptionId
      FROM ClassEnrollment
      WHERE userId = ? AND classId = ? AND status = 'APPROVED'
      LIMIT 1
    `)
    .bind(userId, classId)
    .first<{ documentSigned: number | null; status: string; stripeSubscriptionId: string | null }>();

  if (!enrollment) {
    return true; // Not enrolled or not approved → blocked
  }

  // Gate 1: Document must be signed
  if (!enrollment.documentSigned) {
    return true;
  }

  // Gate 2: Payment must not be overdue (skip for Stripe-managed subscriptions)
  if (!enrollment.stripeSubscriptionId) {
    return await isPaymentOverdue(db, userId, classId);
  }

  return false;
}

// Auto-create or update PENDING Payment records for a student's approved enrollments.
// Call this before reading payment status so the DB reflects the current derived billing state.
export async function autoCreatePendingPayments(db: D1Database, userId: string): Promise<void> {
  await syncDerivedPendingPayments(db, { userId });
}

// Auto-create or update PENDING Payment records for all students enrolled in an academy's classes.
// Call this before the academy reads pending-cash so price changes are reflected immediately.
export async function syncAcademyPendingPayments(db: D1Database, academyOwnerId: string): Promise<void> {
  await syncDerivedPendingPayments(db, { academyOwnerId });
}
