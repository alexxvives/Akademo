# Audit v3 — Post-v2 Adversarial Security Review

**Date**: 2026-03-04  
**Scope**: 6 core flows — Purchase, Subscription Lifecycle, Course Access, View Tracking, Upload Logic, Live Event/Zoom Access  
**Baseline**: Post audit-v2 codebase (all v2 fixes deployed & validated)

---

## Weighted Scores (Before Fixes)

| Dimension             | Score |
|-----------------------|-------|
| Logical Consistency   | 66/100 |
| Revenue Risk          | 68/100 |
| Edge-Case Robustness  | 63/100 |

---

## Findings

### #1 — CRITICAL — live.ts payment wall disabled for Stripe users
**File**: `workers/akademo-api/src/routes/live.ts` (lines 37-41)  
**Problem**: The v2 fix removed the `restrictStreamAccess` gate but still reads `enrollment.nextPaymentDue` from `ClassEnrollment`. Stripe webhook handlers never populate this column — only the manual `PATCH /:id/approve-payment` sets it. Result: ALL Stripe-paying students have `nextPaymentDue = NULL`, so the overdue check evaluates to `false`, and the payment wall is **silently disabled**.  
**Fix**: Replace the entire `ClassEnrollment.nextPaymentDue` check with `isPaymentOverdue()` querying the `Payment` table directly (same pattern used in `lessons.ts`, `videos.ts`, `bunny.ts`).

### #2 — CRITICAL — Multi-tab Stripe double-subscription
**File**: `workers/akademo-api/src/routes/payments.ts` (POST `/stripe-session`)  
**Problem**: Two concurrent browser tabs can POST `/stripe-session` and each receive a different Checkout Session URL. Both complete checkout, both pass the dedup check (different `stripeCheckoutSessionId`), resulting in two COMPLETED payments and two active Stripe subscriptions. The student is double-billed monthly.  
**Fix**: Before creating a Stripe session, check if the enrollment already has an active `stripeSubscriptionId`. If so, return an error.

### #3 — HIGH — Batch failure orphans stripeSubscriptionId
**File**: `workers/akademo-api/src/routes/webhooks.ts` (`checkout.session.completed`)  
**Problem**: If `db.batch()` fails after Stripe has already created the subscription, `ClassEnrollment.stripeSubscriptionId` is never set. Future `invoice.payment_succeeded` events can't find the enrollment → recurring charges go unrecorded.  
**Note**: This is a low-probability edge case. Mitigated by webhook retry, but a log alert is warranted.

### #4 — HIGH — Zoom recording.completed has no idempotency
**File**: `workers/akademo-api/src/routes/webhooks.ts` (`recording.completed`)  
**Problem**: Zoom may retry `recording.completed` if the first response is slow. No check for `stream.recordingId` before processing → duplicate videos uploaded to Bunny.  
**Fix**: If `stream.recordingId` is already set, return early with `{ received: true }`.

### #5 — MEDIUM — POST /videos/progress missing overdue check
**File**: `workers/akademo-api/src/routes/videos.ts` (POST `/progress`)  
**Problem**: GET `/videos/:id` blocks overdue students, but POST `/progress` does not. An overdue student with an open tab continues accumulating watch time via heartbeat.  
**Fix**: Add `isPaymentOverdue()` check after enrollment verification.

### #6 — MEDIUM — Non-atomic totalWatchTimeSeconds
**File**: `workers/akademo-api/src/routes/videos.ts` (POST `/progress`)  
**Problem**: Watch time uses read-modify-write pattern (`existing.totalWatchTimeSeconds + clampedWatchTime`). Two tabs watching the same video create a race condition that undercounts time.  
**Fix**: Use atomic SQL `SET totalWatchTimeSeconds = totalWatchTimeSeconds + ?` instead of reading the existing value and adding in app code.

### #7 — MEDIUM — zoomStartUrl exposed to students
**File**: `workers/akademo-api/src/routes/live.ts` (GET `/live`)  
**Problem**: The SQL query selects `ls.zoomStartUrl` (the host URL) and returns it in the response to ALL roles, including students. A student could use this URL to gain host privileges in the Zoom meeting.  
**Fix**: Strip `zoomStartUrl` from the response for STUDENT role.

### #8 — MEDIUM — Participant count uses non-atomic increment
**File**: `workers/akademo-api/src/routes/webhooks.ts` (participant_joined / participant_left)  
**Problem**: `currentCount` and `participantCount` are read from D1, incremented in JS, then written back. Concurrent join events race the same way as the watch time counter.  
**Fix**: Use atomic SQL `SET currentCount = currentCount + 1` / `MAX(0, currentCount - 1)`.

### #9 — LOW — studentsAccessed inflated by 0-second views
**File**: Analytics queries  
**Problem**: `studentsAccessed` counts all `VideoPlayState` rows, including those with `totalWatchTimeSeconds = 0`. These represent students who opened a video but never actually watched.  
**Fix**: Filter `WHERE totalWatchTimeSeconds > 0`.

### #10 — LOW — autoCreatePendingPayments runs on every GET
**File**: `workers/akademo-api/src/lib/payment-utils.ts`  
**Problem**: `autoCreatePendingPayments` is called on every student page load (GET `/classes`, GET `/my-payments`). This causes N+1 mutation writes on read-only endpoints.  
**Note**: Low risk but wasteful. Consider cron-based approach or cooldown check.

---

## Observations (Non-Bugs)

| ID | Issue | Severity |
|----|-------|----------|
| A  | `calculateBillingCycle` duplicated in payments.ts & webhooks.ts | Drift risk |
| B  | Email send in `approve-payment` blocks response | UX latency |
| C  | `zoomStartUrl` (host URL) exposed in GET /live response | Fixed in #7 |

---

## Fix Status

| # | Severity | Description | Status |
|---|----------|-------------|--------|
| 1 | CRITICAL | live.ts: replace nextPaymentDue with isPaymentOverdue() | ✅ Fixed |
| 2 | CRITICAL | payments.ts: guard against double Stripe subscription | ✅ Fixed |
| 3 | HIGH     | webhooks.ts: log alert for batch failure (low probability) | ⚠️ Deferred |
| 4 | HIGH     | webhooks.ts: recording.completed idempotency | ✅ Fixed |
| 5 | MEDIUM   | videos.ts: add overdue check to POST /progress | ✅ Fixed |
| 6 | MEDIUM   | videos.ts: atomic totalWatchTimeSeconds | ✅ Fixed |
| 7 | MEDIUM   | live.ts: strip zoomStartUrl for students | ✅ Fixed |
| 8 | MEDIUM   | webhooks.ts: atomic participant count | ✅ Fixed |
| 9 | LOW      | Analytics: filter 0-second views | ⚠️ Deferred (needs frontend audit) |
| 10| LOW      | payment-utils: autoCreate on every GET | ⚠️ Deferred (optimize later) |

---

## Post-Fix Scores (Target)

| Dimension             | Before | After |
|-----------------------|--------|-------|
| Logical Consistency   | 66     | 82    |
| Revenue Risk          | 68     | 88    |
| Edge-Case Robustness  | 63     | 78    |
