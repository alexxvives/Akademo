# AKADEMO — Adversarial Backend Audit v2

**Auditor role**: Principal Backend Engineer  
**Date**: 2026-01-XX  
**Codebase snapshot**: post-audit-v1 (all 10 prior fixes applied)  
**Scope**: 6 core business flows  

---

## Executive Summary

The prior audit (v1) closed 10 high-severity findings. This second pass re-examined every flow against the patched codebase. **One critical regression was introduced by the v1 batch-transaction refactor** (duplicate INSERT in payment initiation). Several medium-severity gaps remain around access control consistency, billing edge cases, and stream security.

---

## Per-Flow Scores (0–100)

| Flow | Logical Consistency | Revenue Risk | Edge-Case Robustness | Notes |
|---|---|---|---|---|
| **1. Purchase Flow** | 55 | 40 | 50 | Critical duplicate INSERT; no rate-limit on initiate |
| **2. Subscription Lifecycle** | 82 | 78 | 75 | Good idempotency; minor first-invoice gap |
| **3. Course Access** | 78 | 80 | 70 | Overdue check solid; video metadata leak |
| **4. View Tracking** | 85 | 85 | 80 | Clamping + suspicious detection strong |
| **5. Upload Logic** | 88 | 90 | 82 | Magic bytes + size limits in place |
| **6. Live Event / Zoom** | 75 | 72 | 65 | Payment check only if `restrictStreamAccess`; Zoom token edge case |

**Weighted Overall: 72 / 100**  
(Purchase Flow drags the score down significantly due to the critical regression.)

---

## Top 10 Flaws — Ranked by Business Impact

### #1 · CRITICAL — Duplicate INSERT in `POST /payments/initiate` (new-payment path)

**File**: [payments.ts](../workers/akademo-api/src/routes/payments.ts#L193-L250)  
**Impact**: Every cash/bizum payment initiation for a student's *first* payment executes **two identical INSERTs** — a standalone `.prepare().run()` at line ~193, then the same INSERT again inside `db.batch()` at line ~218.

**Root cause**: The v1 audit added an atomic `db.batch()` wrapping the INSERT + enrollment UPDATE, but the original standalone INSERT was never removed.

**Consequence**:
- If `Payment.id` has a UNIQUE constraint → the second INSERT fails and the enrollment frequency is never updated (the batch aborts atomically).
- If `Payment.id` is NOT unique → two identical PENDING payment rows are created. The academy sees a phantom duplicate; approving one leaves a ghost PENDING row that blocks the student indefinitely.

**Fix**: Delete the standalone INSERT (lines ~193-213). Keep only the `db.batch()` block.

**Revenue Risk**: HIGH — students may be permanently locked out or double-charged.

---

### #2 · HIGH — No rate-limit on `POST /payments/initiate`

**File**: [payments.ts](../workers/akademo-api/src/routes/payments.ts#L63)  
**Impact**: A malicious student can spam this endpoint to flood the academy dashboard with hundreds of PENDING payment rows. Since `autoCreatePendingPayments()` AND cron both create PENDING rows, the dedup relies on `status = 'PENDING'` matching. But rapid parallel requests can create multiple before any dedup check reads them (classic TOCTOU).

**Fix**: Add a rate-limit middleware (e.g., `rateLimit({ prefix: 'pay-init', windowSec: 60, maxRequests: 5 })`) AND add a UNIQUE partial index: `CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_pending_unique ON Payment(payerId, classId) WHERE status = 'PENDING'`.

**Revenue Risk**: MEDIUM — dashboard pollution, potential for double payment records.

---

### #3 · HIGH — `GET /videos/:id` does NOT check `isPaymentOverdue()`

**File**: [videos.ts](../workers/akademo-api/src/routes/videos.ts#L388-L420)  
**Impact**: Students blocked from lessons (403 on `GET /lessons` and `GET /lessons/:id`) can still call `GET /videos/:id` directly. The endpoint checks enrollment status (`APPROVED`) but NOT payment overdue status. The response includes video metadata (uploadId, storagePath, bunnyGuid).

With the bunnyGuid, the student can construct `GET /bunny/video/:guid/stream` which also does NOT check overdue status — it only checks enrollment. **Result**: a payment-overdue student can still stream any video they know the GUID for.

**Fix**: Add `isPaymentOverdue()` check in both `GET /videos/:id` and `GET /bunny/video/:guid/stream` for STUDENT role.

**Revenue Risk**: HIGH — students can bypass the payment wall entirely if they cache/bookmark video IDs.

---

### #4 · HIGH — `GET /live` payment check depends on opt-in `restrictStreamAccess` flag

**File**: [live.ts](../workers/akademo-api/src/routes/live.ts#L21-L57)  
**Impact**: Live stream access for students only checks payment status when `academy.restrictStreamAccess === 1`. By default this is `0` (or NULL), meaning **all students can watch all live streams regardless of payment status**. This is an opt-in security control — most academies will never know to enable it.

**Fix**: Either (a) default `restrictStreamAccess` to `1` for all academies, or (b) always check payment status for live streams regardless of the flag, or (c) surface the setting prominently in the academy onboarding UI.

**Revenue Risk**: HIGH — free access to live content, which is often the primary value proposition.

---

### #5 · MEDIUM — CSRF bypass for `application/json` requests without Origin/Referer

**File**: [csrf.ts](../workers/akademo-api/src/lib/csrf.ts#L60-L80)  
**Impact**: The CSRF middleware only requires `X-Requested-With` for "simple" content types (`form-urlencoded`, `multipart`, `text/plain`). For `application/json`, it relies on CORS preflight. However, if **both Origin AND Referer are missing** (lines 54-60), the request is allowed through with a comment: "Mobile apps and server-to-server calls may not include either."

This means: an attacker page that strips Origin/Referer (using `Referrer-Policy: no-referrer` meta tag) AND sends `Content-Type: application/json` can bypass both CSRF layers. While browsers typically include Origin on cross-origin POST, some privacy browsers and proxy configurations strip it.

**Fix**: If both Origin and Referer are missing on a state-changing request with a session cookie present, reject it. Server-to-server calls should use API keys, not cookies.

**Revenue Risk**: LOW (requires specific browser configurations) but SECURITY RISK is MEDIUM.

---

### #6 · MEDIUM — `payments.put('/history/:id/reverse')` allows infinite toggling without audit trail

**File**: [payments.ts](../workers/akademo-api/src/routes/payments.ts#L1073-L1120)  
**Impact**: An academy owner can toggle any payment between COMPLETED ↔ PENDING indefinitely. There is no audit log of who reversed and when (only `completedAt` is updated). A malicious academy owner could:
1. Mark a student's payment as COMPLETED (student gets access).
2. Immediately reverse to PENDING (student loses access, no refund trail).
3. Claim to Stripe/platform the student never paid.

**Fix**: Record each reversal in an audit table with `reversedBy`, `reversedAt`, `previousStatus`, `newStatus`. Limit reversals (e.g., max 3 per payment). Alert admin on excessive reversals.

**Revenue Risk**: MEDIUM — potential for fraud by academy owners against students.

---

### #7 · MEDIUM — Cron payment generation uses `metadata LIKE` for idempotency

**File**: [index.ts](../workers/akademo-api/src/index.ts#L258-L268)  
**Impact**: The cron handler checks `metadata LIKE '%"monthOffset":X%'` to avoid duplicate payment creation. This is fragile:
- If `metadata` JSON structure changes → dedup breaks → duplicate PENDING rows.
- `LIKE` on a JSON text column is not indexable → O(n) scan per enrollment per month.
- The `monthOffset` integer is embedded in JSON text, so `"monthOffset":1` will also match `"monthOffset":10`, `"monthOffset":11`, etc. (substring match).

**Fix**: Add a dedicated `billingPeriod` column (e.g., `'2026-01'`) to the Payment table. Dedup with: `WHERE payerId = ? AND classId = ? AND billingPeriod = ?`. Add a unique partial index on `(payerId, classId, billingPeriod)`.

**Revenue Risk**: MEDIUM — duplicate monthly charges or missed charges.

---

### #8 · MEDIUM — `progressResetRateLimit` keys on raw cookie instead of user ID

**File**: [videos.ts](../workers/akademo-api/src/routes/videos.ts#L14-L18)  
**Impact**: The `keyFn` for the progress reset rate limiter uses `cookie.slice(0, 64)` as the key. This runs BEFORE `requireAuth()` resolves the session, so it can't use `session.id`. Problems:
- If the session cookie value changes (re-login), the rate limit resets.
- Two students sharing a device with different cookies get independent limits.
- The cookie value is not a stable user identifier.

**Fix**: Move the rate limit middleware to run AFTER auth, or use a two-phase approach: auth first, then call a rate-limit helper function with `session.id` as the key.

**Revenue Risk**: LOW — students can work around the 3/hour reset limit by re-logging in.

---

### #9 · LOW — Bunny stream URL enrollment check doesn't verify payment status

**File**: [bunny.ts](../workers/akademo-api/src/routes/bunny.ts#L244-L260)  
**Impact**: `GET /bunny/video/:guid/stream` verifies the student has an APPROVED enrollment but does NOT check `isPaymentOverdue()`. Combined with Flaw #3, this creates a complete bypass of the payment wall for video streaming.

**Fix**: Add payment overdue check alongside the enrollment check. This is the enforcement point — even if the student somehow obtains a bunnyGuid, the signed stream URL should not be issued without payment.

**Revenue Risk**: HIGH (when combined with #3, which provides the GUID).

---

### #10 · LOW — `DELETE /payments/:id` allows deletion of PENDING payments by academy owner

**File**: [payments.ts](../workers/akademo-api/src/routes/payments.ts#L1380-L1420)  
**Impact**: Academy owners can delete PENDING payment records. If a student has an auto-generated PENDING record (from `autoCreatePendingPayments` or cron), the academy can delete it. The next time the student loads `/classes` or `/my-payments`, `autoCreatePendingPayments` will recreate it — but there's a window where the student appears to have no overdue payments and can access content.

Also, deleting a PENDING payment removes evidence of what was owed. The cron will recreate it but with a new ID and fresh timestamp, losing the original creation context.

**Fix**: Instead of hard-delete, soft-delete PENDING payments (set `status = 'CANCELLED'`). Auto-creation logic should check for CANCELLED records too.

**Revenue Risk**: LOW — auto-recreation mitigates, but creates a temporary access window.

---

## Additional Observations (Not in Top 10)

### A. `invoice.payment_succeeded` doesn't update `nextPaymentDue`
When Stripe fires `invoice.payment_succeeded` for a recurring payment (non-first invoice), the handler creates a COMPLETED Payment record but does NOT update `ClassEnrollment.nextPaymentDue`. The `isPaymentOverdue()` check relies on `Payment.nextPaymentDue`, not enrollment's. However, if the auto-create logic reads `nextPaymentDue` from elsewhere, it may generate spurious PENDING rows.

### B. `autoCreatePendingPayments` runs on every `GET /classes` and `GET /my-payments`
This N+1 pattern (queries all enrollments for a student, then checks/creates payments for each) runs on every page load. For a student enrolled in 10 classes, that's 10+ DB queries on each navigation. Should be moved to a background cron or cached.

### C. Orphan R2 cleanup scans ALL objects
The `handleOrphanCleanup` function lists ALL R2 objects (500 per page) and checks each against D1. For a large bucket with 100K+ objects, this could hit D1's query limits and the Worker's CPU time limit. Should be batched with a cursor persisted in KV.

### D. No replay protection on `POST /payments/initiate`
A student can capture the payment initiation request and replay it. While the existing-payment branch (`UPDATE`) is safe (updates in place), the new-payment branch creates a fresh record each time. Combined with Flaw #1, rapid replays create multiple rows.

### E. Session token has no jti (unique token identifier)
Session tokens are HMAC-signed JSON with `{userId, iat}`. There's no unique token ID (`jti`), making individual session revocation depend on the `DeviceSession` table. If a session is created without a `deviceSessionId`, it cannot be individually revoked — only expiry works.

---

## Refactor Priority Plan

### Sprint 1 — Critical (This Week)
| # | Task | Effort | Files |
|---|---|---|---|
| 1 | **Remove duplicate INSERT** in payments.ts | 15 min | payments.ts |
| 2 | **Add payment-overdue check** to `GET /videos/:id` and `GET /bunny/video/:guid/stream` | 30 min | videos.ts, bunny.ts |
| 3 | **Add rate-limit** to `POST /payments/initiate` | 15 min | payments.ts |
| 4 | **Add UNIQUE partial index** on Payment(payerId, classId) WHERE status='PENDING' | 5 min | migration |

### Sprint 2 — High Priority (Next Week)
| # | Task | Effort | Files |
|---|---|---|---|
| 5 | Default `restrictStreamAccess = 1` or unconditional live stream payment check | 30 min | live.ts, migration |
| 6 | Add `billingPeriod` column and fix cron idempotency | 1 hr | index.ts, migration |
| 7 | Fix progress reset rate-limit key to use session.id | 30 min | videos.ts |
| 8 | Reject cookie-bearing requests missing both Origin and Referer | 30 min | csrf.ts |

### Sprint 3 — Medium Priority (This Month)
| # | Task | Effort | Files |
|---|---|---|---|
| 9 | Add payment reversal audit trail | 1 hr | payments.ts, migration |
| 10 | Soft-delete PENDING payments instead of hard-delete | 30 min | payments.ts |
| 11 | Batch `autoCreatePendingPayments` into cron instead of per-request | 2 hr | classes.ts, payments.ts, index.ts |
| 12 | Paginate orphan R2 cleanup with KV cursor | 1 hr | index.ts |

---

## Verification Checklist

After implementing fixes, verify with:

```bash
# 1. Full build (catches TypeScript errors)
npx @opennextjs/cloudflare build

# 2. API worker dry-run build
cd workers/akademo-api && npx wrangler deploy --dry-run --outdir=dist

# 3. Manual test: payment initiation (verify single INSERT)
# 4. Manual test: overdue student cannot stream videos
# 5. Manual test: live stream access without restrictStreamAccess
```

---

**Audit Status**: COMPLETE  
**Next Review**: After Sprint 1 fixes are deployed
