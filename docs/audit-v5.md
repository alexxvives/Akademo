# Audit v5 — Post-Fix Verification & Fresh Scan

**Date**: 2025-01-XX  
**Auditor**: Principal Backend Engineer (adversarial)  
**Scope**: All 6 core flows — Payment lifecycle, Content access, Cron billing, Webhook processing, Storage security, Auth & session management  
**Baseline**: Commit c592668 (all v4 fixes deployed)

---

## Executive Summary

All 8 v4 fixes verified in code. The cron `nextPaymentDue` gap (CRITICAL), storage payment wall, backward-compat fallback, PATCH status block, Stripe reversal guard, shared `isPaymentOverdue`, and amount validation are all properly implemented. The backend's payment wall is now **consistent across lessons, videos, live streams, Bunny CDN, and R2 storage**.

One remaining **HIGH-severity gap** exists: **assignments.ts** was never instrumented with a payment wall. Students with overdue payments can still view, submit, and interact with assignments. Additionally, the student GET path for assignments with a `classId` param doesn't verify enrollment — any authenticated student can list any class's assignments.

---

## v4 Fix Verification ✅

| # | Fix | Status | Verified In |
|---|-----|--------|-------------|
| 1 | Cron INSERT includes `nextPaymentDue` | ✅ | `index.ts` L262 — binds `dueDate.toISOString()` |
| 2 | Storage `/serve/*` checks `isPaymentOverdue` for students | ✅ | `storage.ts` L460-462 |
| 3 | Storage backward-compat fallback removed | ✅ | `storage.ts` L472-474 — explicit 403 |
| 4 | PATCH `/payments/:id` rejects status changes | ✅ | `payments.ts` L1390-1394 |
| 5 | Reversal guards Stripe-backed payments | ✅ | `payments.ts` L1073-1076 — checks `stripePaymentId \|\| paymentMethod === 'stripe'` |
| 6 | `isPaymentOverdue` shared in `lib/payment-utils.ts` | ✅ | Imported by live.ts, videos.ts, lessons.ts, bunny.ts, storage.ts |
| 7 | register-manual validates `amount > 0` | ✅ | `payments.ts` L1260-1261 — `typeof amount !== 'number' \|\| amount <= 0` |
| 8 | Cron idempotency check present | ✅ | `index.ts` L236-240 — `metadata LIKE` match |

---

## Scores

| Metric | v4 Score | v5 Score | Delta |
|--------|----------|----------|-------|
| Logical Consistency | 72 | **83** | +11 |
| Revenue Risk | 71 | **81** | +10 |
| Edge-Case Robustness | 68 | **79** | +11 |

**Why not higher**: Assignments gap (#1 below) creates a content-adjacent paywall bypass. The cron LIKE-based idempotency (#3) is structurally fragile. autoCreatePendingPayments running on every GET (#4) is an architectural smell.

---

## Top 10 Findings

### #1 — assignments.ts has no payment wall [HIGH — Revenue]

**File**: `workers/akademo-api/src/routes/assignments.ts`  
**Impact**: Students with overdue payments can view assignments, submit homework, view grades, and interact fully with the assignment system.

`isPaymentOverdue` is not imported or referenced anywhere in assignments.ts. The affected endpoints:
- `GET /` (student, no classId) — lists all assignments across enrolled classes
- `GET /?classId=X` (student) — lists assignments for a specific class
- `GET /:id` (student) — views assignment details + own submission
- `POST /:id/submit` — submits homework
- `GET /new-grades-count` — counts recent grades

**Fix**: Import `isPaymentOverdue` and add a check on student-facing endpoints. At minimum, block `POST /:id/submit` (prevents overdue students from submitting work) and `GET /` / `GET /:id` (prevents viewing assignment content).

**Priority**: P1 — aligns with existing payment wall enforcement across lessons/videos/live/bunny/storage

---

### #2 — assignments.ts GET /?classId=X doesn't verify enrollment [HIGH — AuthZ]

**File**: `workers/akademo-api/src/routes/assignments.ts` L189-206  
**Impact**: Any authenticated STUDENT can list all assignments for any class by providing an arbitrary `classId`, even if they're not enrolled.

The student query at line 189 uses `WHERE a.classId = ?` without joining on `ClassEnrollment`. Compare this to the no-classId path (line 113) which correctly joins on `ClassEnrollment e ON c.id = e.classId ... WHERE e.userId = ? AND e.status = 'APPROVED'`.

**Fix**: Add `JOIN ClassEnrollment e ON c.id = e.classId AND e.userId = ? AND e.status = 'APPROVED'` to the student classId query.

**Priority**: P1

---

### #3 — assignments.ts GET /:id doesn't verify enrollment for students [MEDIUM — AuthZ]

**File**: `workers/akademo-api/src/routes/assignments.ts` L453-467  
**Impact**: Any student can view any assignment's details (title, description, due date, teacher file path) by knowing/guessing the assignment ID.

The student path at line 453 performs `SELECT ... FROM Assignment ... WHERE a.id = ?` and returns the assignment plus the student's own submission. It never checks if the student is enrolled in the class that owns the assignment.

**Fix**: Add enrollment verification before returning assignment data to students.

**Priority**: P2

---

### #4 — Cron idempotency relies on LIKE pattern in JSON metadata [LOW — Robustness]

**File**: `workers/akademo-api/src/index.ts` L236-240  
**Impact**: The cron handler prevents duplicate payment creation by checking `metadata LIKE '%"monthOffset":${monthOffset}%'`. This string pattern match on JSON is fragile:
- If the JSON key is renamed, idempotency silently breaks
- If `monthOffset` appears elsewhere in metadata, false positives can occur
- Pattern doesn't handle whitespace variations in JSON serialization

**Fix**: Add a dedicated `billingPeriod` column (e.g., `"2025-06"`) to the Payment table and use `WHERE billingPeriod = ?` for idempotency. Alternatively, use a composite unique index on `(payerId, classId, billingPeriod)`.

**Priority**: P3 — works today but is a maintenance risk

---

### #5 — autoCreatePendingPayments runs on every GET [LOW — Performance]

**File**: `workers/akademo-api/src/lib/payment-utils.ts` (called from `payments.ts` GET /my-payments and GET /pending-cash)  
**Impact**: Every time a student views their payments or an academy views pending payments, the system runs a full enrollment scan + payment reconciliation. For an academy with 200 enrollments, this is 200+ DB queries per page view.

**Mitigation**: The cron already creates PENDINGs on schedule. The autoCreate on GET is redundant defense-in-depth. Consider caching the result or running it at most once per hour per user (tracked via a `lastBillingCheck` timestamp).

**Priority**: P3 — not a correctness issue, purely performance

---

### #6 — Bunny webhook title-based recording match is fuzzy [LOW — Data]

**File**: `workers/akademo-api/src/routes/webhooks.ts` L446-470  
**Impact**: When a Bunny video upload completes, the webhook tries to match it to a LiveStream by title (exact match first, then `INCLUDES` fallback). If two streams have similar titles, the recording could be linked to the wrong one.

The primary recording path (Zoom `recording.completed` webhook) handles this correctly via `zoomMeetingId`. The Bunny webhook is a secondary/fallback path and is rarely hit.

**Priority**: P4 — low probability, Zoom webhook is the primary path

---

### #7 — customer.subscription.deleted creates instantly-overdue PENDING [INFO — Design]

**File**: `workers/akademo-api/src/routes/webhooks.ts` L900  
**Impact**: When a Stripe subscription is cancelled, the handler inserts a PENDING payment with `nextPaymentDue = datetime('now')`. Since `isPaymentOverdue()` checks `nextPaymentDue < datetime('now')`, this payment becomes overdue within seconds. The student is immediately blocked from all content.

**Assessment**: This is correct behavior (revoke access when subscription ends). However, it creates a "flash block" — the student is locked out before they have any chance to see a payment prompt. Consider using `datetime('now', '+1 day')` to give a 24-hour grace period.

**Priority**: P4 — intentional behavior, small UX improvement possible

---

### #8 — check-email endpoint reveals email existence [INFO — Recon]

**File**: `workers/akademo-api/src/routes/auth.ts` (POST /check-email)  
**Impact**: Returns different responses for registered vs unregistered emails. Rate-limited (10/min/IP) but still allows enumeration at scale.

**Assessment**: This is a common pattern for UX-friendly registration flows. The forgot-password endpoint correctly uses a generic response. The risk is low given rate limiting.

**Priority**: P4

---

### #9 — GET /me and POST /session/check lack rate limiting [INFO]

**File**: `workers/akademo-api/src/routes/auth.ts`  
**Impact**: Could be called rapidly to probe session validity. Both only return data for valid sessions, so the attack value is limited. Adding rate limiting would add latency to every page load.

**Priority**: P5

---

### #10 — CSRF allows missing Origin + Referer [INFO — Design]

**File**: `workers/akademo-api/src/lib/csrf.ts` L57-60  
**Impact**: When both `Origin` and `Referer` headers are absent, the request is allowed through. This is by design (mobile apps, server-to-server calls). The second CSRF layer (X-Requested-With on form-like content types) + CORS provides compensating controls.

**Priority**: P5 — accepted design trade-off

---

## Refactor Priority Plan

### Sprint 1 (P1 — Immediate)
1. **Fix #1**: Add `isPaymentOverdue()` check to student paths in `assignments.ts`
2. **Fix #2**: Add enrollment verification to `GET /assignments?classId=X` student query

### Sprint 2 (P2 — This Week)
3. **Fix #3**: Add enrollment check to `GET /assignments/:id` for students

### Sprint 3 (P3 — Next Iteration)
4. **Fix #4**: Replace cron LIKE-based idempotency with a `billingPeriod` column
5. **Fix #5**: Add rate-limiting or caching to autoCreatePendingPayments

### Deferred (P4-P5)
6. Fix #7: Subscription-deleted grace period (optional UX)
7. Fix #8-10: Informational items — no action required

---

## Files Audited

| File | Lines | Status |
|------|-------|--------|
| `index.ts` | 335 | ✅ Clean — cron fix verified |
| `payments.ts` | 1517 | ✅ Clean — all v4 fixes verified |
| `storage.ts` | 561 | ✅ Clean — payment wall + no fallback |
| `webhooks.ts` | 936 | ✅ Clean — all v3 fixes intact |
| `live.ts` | 1418 | ✅ Clean — shared isPaymentOverdue |
| `videos.ts` | 460 | ✅ Clean — shared isPaymentOverdue |
| `lessons.ts` | 1540 | ✅ Clean — shared isPaymentOverdue |
| `bunny.ts` | 349 | ✅ Clean — shared isPaymentOverdue |
| `payment-utils.ts` | 160 | ✅ Clean — shared functions |
| `auth.ts` (lib) | 233 | ✅ Clean — HMAC sessions, expiry |
| `csrf.ts` | 94 | ✅ Clean — dual-layer CSRF |
| `rate-limit.ts` | 172 | ✅ Clean — D1-backed + mem cache |
| `auth.ts` (routes) | 799 | ✅ Clean — rate-limited, travel detection |
| `enrollments.ts` | 801 | ✅ Clean — admin-facing |
| `classes.ts` | 699 | ✅ Clean — by design (explore) |
| **assignments.ts** | **887** | **⚠️ Needs fixes #1, #2, #3** |

---

## Conclusion

The v4 fixes brought payment wall enforcement to production quality across **all content routes** (lessons, videos, live, bunny, storage). The remaining actionable gap is **assignments.ts** — the only student-facing content route without payment wall enforcement or proper enrollment verification. Fixing this one file closes the last HIGH-severity finding.

Overall platform security posture: **Good** (83/100). One more sprint closes the remaining gaps.
