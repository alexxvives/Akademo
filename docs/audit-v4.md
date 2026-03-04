# AKADEMO Backend Audit v4 — Post-v3 Adversarial Review

**Date**: 2025-01-27  
**Auditor**: Principal Backend Engineer (adversarial)  
**Scope**: 6 core flows × edge-case analysis  
**Baseline**: Post audit-v3 (commit 601e188)

---

## EXECUTIVE SUMMARY

Audit v3 fixed 7 critical issues (payment-wall bypass via broken ClassEnrollment query, double Stripe subscription, recording idempotency, atomic counters, zoomStartUrl leak). This v4 audit reveals **a severe disconnect between two billing paths**: the cron handler creates PENDING payments that bypass the payment wall entirely, a critical revenue leak.

---

## PER-FLOW ANALYSIS

### Flow 1 — Purchase Flow (Initiate → Approve → Access)

| Aspect | Status |
|--------|--------|
| Cash/bizum rate-limit (5/min/IP) | ✅ Enforced |
| Stripe session guard (double-sub) | ✅ v3 fix working |
| PENDING dedup (unique partial index) | ✅ Migration 0090 |
| Approval flow → email + enrollment sync | ✅ Correct |

**NEW FINDINGS:**
- `POST /payments/register-manual` does NOT validate `amount > 0`. Academy can register €0 or negative payments.
- `PATCH /payments/:id` allows setting `status = 'COMPLETED'` directly, bypassing the approval flow (no enrollment sync, no email, no audit trail).

### Flow 2 — Subscription Lifecycle (Stripe Recurring)

| Aspect | Status |
|--------|--------|
| checkout.session.completed → batch (Payment + APPROVED + delete PENDING) | ✅ Atomic |
| invoice.payment_succeeded → skip first + dedup | ✅ Correct |
| invoice.payment_failed → upsert PENDING | ✅ Correct |
| subscription.deleted → clear sub + create PENDING | ✅ Correct |

**NEW FINDINGS:**
- `PUT /history/:id/reverse` can toggle a Stripe-backed COMPLETED payment to PENDING. The academy accidentally reverses a Stripe payment → student appears overdue → blocked from content → but money was already collected via Stripe. No guard against this.

### Flow 3 — Course Access (Lessons, Videos, Documents)

| Aspect | Status |
|--------|--------|
| lessons.ts → enrollment + isPaymentOverdue | ✅ |
| bunny.ts → enrollment + isPaymentOverdue | ✅ |
| videos.ts → isPaymentOverdue on progress | ✅ v3 fix |
| storage.ts /serve/* → **NO payment check** | ❌ **BYPASS** |

**NEW FINDINGS:**
- **Storage /serve/* does NOT call `isPaymentOverdue()`**. An overdue student blocked from lessons/videos can still download documents via direct storage keys. The endpoint only checks enrollment status = APPROVED, not payment status.
- **Backward-compat fallback**: If no Upload record exists for a private key, the code allows access with any valid session. Any authenticated user can access orphan files.

### Flow 4 — View Tracking (VideoPlayState)

| Aspect | Status |
|--------|--------|
| Atomic watch-time increment | ✅ v3 fix |
| Heartbeat clamped to 35s | ✅ |
| Suspicion scoring | ✅ |
| studentsAccessed counts 0s views | ⚠️ Deferred from v3 |

No new issues found.

### Flow 5 — Upload Logic (R2 + Bunny)

| Aspect | Status |
|--------|--------|
| Simple upload magic byte validation | ✅ |
| Multipart init MIME check | ✅ |
| Multipart parts — no magic byte check | ⚠️ Deferred from v3 |
| Role-based path restrictions | ✅ |

No new issues found beyond the deferred multipart item.

### Flow 6 — Live Event / Zoom Access

| Aspect | Status |
|--------|--------|
| isPaymentOverdue on GET /live | ✅ v3 fix |
| zoomStartUrl stripped for students | ✅ v3 fix |
| Zoom webhook signature verification | ✅ |
| Recording idempotency | ✅ v3 fix |

No new issues found.

---

## TOP 10 LOGIC FLAWS (Ranked by Business Impact)

### #1 — CRITICAL: Cron PENDINGs Missing `nextPaymentDue` → Payment Wall Bypass
**File**: `index.ts` lines 198-265 (`handleScheduled`)  
**Impact**: 10/10 revenue risk

The cron handler creates PENDING payments WITHOUT setting `nextPaymentDue`:

```sql
INSERT INTO Payment (
  id, type, payerId, payerType, payerName, payerEmail,
  receiverId, amount, currency, status, paymentMethod,
  classId, description, metadata, createdAt, updatedAt
) VALUES (...)
```

Meanwhile, `isPaymentOverdue()` in all route files requires:
```sql
WHERE p.status = 'PENDING'
  AND p.nextPaymentDue IS NOT NULL
  AND p.nextPaymentDue < datetime('now')
```

Since cron PENDINGs have `nextPaymentDue = NULL`, they **NEVER** trigger the payment wall. Students with overdue cron-generated payments access all content indefinitely.

**Fix**: Add `nextPaymentDue` to the cron INSERT using the computed `dueDate`.

---

### #2 — HIGH: Storage /serve/* Bypasses Payment Wall
**File**: `storage.ts` lines 412-520 (serve handler)  
**Impact**: 7/10

The file-serving endpoint checks enrollment existence (`status = 'APPROVED'`) but does NOT check `isPaymentOverdue()`. An overdue student blocked from lessons and videos can still download documents by navigating to the storage URL directly.

**Fix**: Add `isPaymentOverdue()` check for STUDENT role in the /serve/* handler when serving assignment/document files.

---

### #3 — HIGH: Storage Backward-Compat Fallback — Any User Accesses Orphan Files
**File**: `storage.ts` lines 499-502  
**Impact**: 7/10

```typescript
// If no Upload record found, allow access with valid session (backward compat)
```

If no Upload record exists for a private key (assignment/, document/ paths), any authenticated user with a valid session can access the file. This allows cross-academy data access.

**Fix**: Remove the backward-compat fallback. If no Upload record → return 403.

---

### #4 — HIGH: PATCH /payments/:id Allows Arbitrary Status Changes
**File**: `payments.ts` lines 1373-1440  
**Impact**: 6/10

The generic PATCH endpoint lets academy owners set `status = 'COMPLETED'` or `status = 'PAID'` directly. This bypasses the proper approval flow which:
- Syncs `ClassEnrollment.paymentFrequency` and `nextPaymentDue`
- Sends confirmation email to the student
- Has role and ownership validation

An academy could PATCH a PENDING to COMPLETED without the student being properly synced.

**Fix**: Disallow status changes via PATCH. Status transitions should only happen through dedicated approve/reject/reverse endpoints.

---

### #5 — HIGH: Payment Reversal Doesn't Guard Stripe-Backed Payments
**File**: `payments.ts` lines 1130-1175 (reverse handler)  
**Impact**: 6/10

`PUT /history/:id/reverse` toggles COMPLETED → PENDING without checking if the payment was made through Stripe. Reversing a Stripe payment:
1. Creates a phantom PENDING for a student who already paid
2. Blocks the student from content via `isPaymentOverdue()`
3. Money was already collected — the reversal doesn't refund via Stripe

**Fix**: Check if `payment.stripePaymentId` or `payment.paymentMethod === 'stripe'` exists. If so, reject the reversal with a message to use Stripe Dashboard for refunds.

---

### #6 — MEDIUM: Cron vs autoCreatePendingPayments — Conflicting Billing Logic
**File**: `index.ts` handleScheduled vs `payment-utils.ts` autoCreatePendingPayments  
**Impact**: 5/10

Two independent systems create PENDINGs with different algorithms:

| Aspect | Cron (handleScheduled) | autoCreate (payment-utils) |
|--------|----------------------|---------------------------|
| Month calculation | `getFullYear()*12 + getMonth()` diff | `countElapsedCycles` (calendar-month with day comparison) |
| Creates multiple PENDINGs | Yes (one per overdue month) | No (one per elapsed billing cycle) |
| Sets nextPaymentDue | ❌ No | ✅ Yes |
| Idempotency | `metadata LIKE` pattern | DB unique index |
| Filters | `paymentMethod IN ('cash','bizum')` | Non-Stripe enrollments only |

They can disagree on how many months are owed, leading to duplicate PENDINGs from the cron path (which bypasses the unique index because it creates multiple rows for different months with different metadata).

**Fix**: Unify into a single billing calculation function. The cron should call `autoCreatePendingPayments` instead of reimplementing the logic.

---

### #7 — MEDIUM: `isPaymentOverdue()` Duplicated Across 4 Files
**Files**: `live.ts`, `lessons.ts`, `bunny.ts`, `videos.ts`  
**Impact**: 4/10 (maintainability risk → eventual access-control drift)

Identical function copy-pasted across 4 route files. Any fix to one copy must be manually replicated to all four. If one copy drifts (different SQL, different logic), some routes will block overdue students while others won't.

**Fix**: Extract to `lib/payment-utils.ts` alongside the existing shared helpers.

---

### #8 — MEDIUM: register-manual Accepts Zero/Negative Amounts
**File**: `payments.ts` lines 1289-1330  
**Impact**: 4/10

`POST /payments/register-manual` validates that `amount` is provided but not that `amount > 0`:
```typescript
if (!studentId || !classId || !amount || !paymentMethod) {
  return c.json(errorResponse('All fields are required'), 400);
}
```

Note: `!amount` is falsy for `0` but truthy for negative numbers like `-50`. An academy could register a negative payment, creating nonsensical financial records.

**Fix**: Add explicit validation: `if (typeof amount !== 'number' || amount <= 0)`.

---

### #9 — LOW: Cron Idempotency Uses Fragile `metadata LIKE` Pattern
**File**: `index.ts` line 250  
**Impact**: 2/10

```typescript
.bind(enrollment.userId, enrollment.classId, `%"monthOffset":${monthOffset}%`)
```

This LIKE pattern:
1. Full-table scan on metadata column (no index)
2. Could match unintended JSON structures (e.g., `"monthOffset":10` matches `"monthOffset":100`)
3. String interpolation of `monthOffset` (integer, so no injection risk here, but bad pattern)

**Fix**: When unifying with autoCreate (#6), remove the LIKE-based check entirely. Use the DB unique partial index for idempotency.

---

### #10 — LOW: `autoCreatePendingPayments` Runs on Every Student Page Load
**File**: `payment-utils.ts` called from `classes.ts` GET / + `payments.ts` GET /my-payments  
**Impact**: 2/10 (performance, not correctness)

Every time a student loads their subjects page, `autoCreatePendingPayments` runs an N+1 query pattern:
1. Fetch all enrollments
2. For each enrollment, count completed payments + check pending

With a D1 30s execution limit, this could time out for students enrolled in many classes.

**Fix**: Move to cron-only execution (since the cron already handles this). Use a last-run timestamp to skip if recently executed.

---

## SCORING

| Metric | v3 Score | v4 Score | Delta |
|--------|----------|----------|-------|
| Logical Consistency | 66 | **72** | +6 |
| Revenue Risk | 68 | **71** | +3 |
| Edge-Case Robustness | 63 | **68** | +5 |

**Why not higher**: The cron → payment-wall disconnect (#1) is a critical revenue leak that undermines the v3 payment-wall fixes. Storage bypass (#2, #3) creates a secondary content-access hole.

---

## REFACTOR PRIORITY PLAN

| Priority | Fix | Files | Effort |
|----------|-----|-------|--------|
| **P0** | #1 — Add `nextPaymentDue` to cron PENDINGs | `index.ts` | 15 min |
| **P0** | #2 — Add `isPaymentOverdue()` to storage /serve/* | `storage.ts` | 20 min |
| **P1** | #3 — Remove backward-compat fallback in storage | `storage.ts` | 5 min |
| **P1** | #5 — Guard reversal against Stripe payments | `payments.ts` | 10 min |
| **P1** | #4 — Block status changes via PATCH endpoint | `payments.ts` | 10 min |
| **P1** | #8 — Validate amount > 0 on register-manual | `payments.ts` | 5 min |
| **P2** | #7 — Extract `isPaymentOverdue()` to shared lib | 5 files | 30 min |
| **P2** | #6 — Unify cron + autoCreate billing logic | `index.ts`, `payment-utils.ts` | 45 min |
| **P3** | #9 — Fix cron idempotency check | `index.ts` | 15 min |
| **P3** | #10 — Move autoCreate to cron-only | `payment-utils.ts`, `classes.ts` | 30 min |

---

## ITEMS CARRIED FROM v3 (Still Deferred)

| # | Item | Reason |
|---|------|--------|
| v3-#3 | Batch failure logging | Low probability — D1 batch atomicity sufficient |
| v3-#9 | studentsAccessed counts 0s views | Needs frontend audit — not a security issue |
| v3-#10 | autoCreate optimization | Subsumed by v4 #10 |
| v3-multipart | Multipart parts lack magic bytes | Role-restricted — teacher/academy only |

---

**Target Post-Fix Scores**: Logical Consistency 82+, Revenue Risk 85+, Edge-Case Robustness 78+
