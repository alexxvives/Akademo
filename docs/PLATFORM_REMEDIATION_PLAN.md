# AKADEMO Platform Remediation Plan

**Created:** 2026-02-28  
**Completed:** 2026-02-28  
**Status:** ✅ COMPLETE  
**Score Before:** 40.6/100  

---

## Phase 1 — Emergency Security Fixes (P0) ✅

### FIX-001: Remove Legacy Unsigned Session Tokens ✅
- **File:** `workers/akademo-api/src/lib/auth.ts`
- **Severity:** CRITICAL
- **Fix:** Removed legacy unsigned token fallback from `verifyToken()`. Only properly HMAC-signed tokens accepted.

### FIX-002: Remove Hardcoded Signing Key Fallback ✅
- **File:** `workers/akademo-api/src/lib/auth.ts`
- **Severity:** CRITICAL
- **Fix:** `getSigningKey()` now throws error if `SESSION_SECRET` is not set. No fallback.

### FIX-003: Verify Zoom Webhook Signatures on All Events ✅
- **File:** `workers/akademo-api/src/routes/webhooks.ts`
- **Severity:** CRITICAL
- **Fix:** Added HMAC-SHA256 verification of `x-zm-signature` + `x-zm-request-timestamp` headers before processing any event.

### FIX-004: Add Authentication to Bunny Webhook ✅
- **File:** `workers/akademo-api/src/routes/webhooks.ts`
- **Severity:** CRITICAL
- **Fix:** Added shared secret query parameter validation (`?secret=BUNNY_WEBHOOK_SECRET`).

### FIX-005: Stripe Webhook Fail-Closed ✅
- **File:** `workers/akademo-api/src/routes/webhooks.ts`
- **Severity:** HIGH
- **Fix:** Returns 500 error if `STRIPE_WEBHOOK_SECRET` is not configured.

### FIX-006: Add Auth to R2 File Serving ✅
- **File:** `workers/akademo-api/src/routes/storage.ts`
- **Severity:** CRITICAL
- **Fix:** Added session/signed-URL auth. Public assets use signed URLs (24h), private files require session cookie. Added `/storage/signed-url` endpoint.

---

## Phase 2 — Critical Business Logic (P0) ✅

### FIX-007: Fix Teacher Creation to Use bcrypt ✅
- **File:** `workers/akademo-api/src/routes/academies.ts`
- **Severity:** CRITICAL
- **Fix:** Replaced SHA-256 with centralized `hashPassword()` (bcrypt cost 12).

### FIX-008: Standardize Password Policy ✅
- **File:** `workers/akademo-api/src/lib/validation.ts` + `auth.ts` + `academies.ts`
- **Severity:** MEDIUM
- **Fix:** Standardized to 8 characters minimum everywhere (login, register, change, teacher creation).

---

## Phase 3 — Security Hardening (P1) ✅

### FIX-009: Fix Bunny Stream Token Signing ✅
- **File:** `workers/akademo-api/src/routes/bunny.ts`
- **Fix:** Replaced reversible `btoa()` encoding with HMAC-SHA256 signing.

### FIX-010: Remove SVG from Allowed Upload Types ✅
- **File:** `workers/akademo-api/src/routes/storage.ts`
- **Fix:** Removed `image/svg+xml` from `ALLOWED_MIME_TYPES`.

### FIX-011: Rate-Limit Verification Code Endpoint ✅
- **File:** `workers/akademo-api/src/routes/auth.ts`
- **Fix:** Added `emailVerificationRateLimit` middleware + attempt counter (5 max, then code invalidated).
- **Migration:** `0078_verification_attempts_column.sql` — adds `attempts` column to VerificationCode.

### FIX-012: Remove Teacher Email from Public Endpoint ✅
- **File:** `workers/akademo-api/src/routes/auth.ts`
- **Fix:** Removed `email` field from `/auth/join/:teacherId` response.

### FIX-013: HTML-Encode Lead Notification Emails ✅
- **File:** `workers/akademo-api/src/routes/leads.ts`
- **Fix:** Added `escapeHtml()` function and applied to all interpolated values in email templates.

### FIX-014: Standardize bcrypt Cost Factor ✅
- **Files:** `auth.ts`, `users.ts`
- **Fix:** Replaced all inline `bcrypt.hash(password, 10)` with centralized `hashPassword()` (cost 12).

### FIX-015: Remove Dangerous db:migrate from package.json ✅
- **File:** `package.json`
- **Fix:** Removed `db:migrate` and `db:migrate:local` scripts.

---

## Phase 4 — Database Integrity (P0) ✅

### FIX-018: Restore All Destroyed Indexes ✅
- **Migration:** `0079_restore_all_indexes.sql`
- **Severity:** CRITICAL
- **Issue:** Migration 0027 destroyed 22+ indexes via table rebuilds. Several subsequent migrations also destroyed indexes.
- **Fix:** Comprehensive migration restoring all 35 indexes:
  - 15 destroyed indexes restored (User.email, Academy.ownerId, Class.academyId, etc.)
  - 7 new indexes added from query pattern analysis (Payment.stripeCheckoutSessionId, LiveStream.zoomMeetingId, etc.)
  - 13 existing indexes confirmed safe (via `CREATE INDEX IF NOT EXISTS`)

### Pre-existing TypeScript Error Fixed ✅
- **File:** `workers/akademo-api/src/routes/classes.ts:343`
- **Fix:** Added `as string` cast to `enrollment.nextPaymentDue` in `new Date()` constructor.

---

## Phase 5 — Code Quality (P2) ✅

### FIX-016: Remove Dead Code ✅
- **Deleted:** 5 unused files (318+ lines):
  - `src/hooks/useClass.ts`
  - `src/hooks/useLessons.ts`
  - `src/components/ui/EmptyState.tsx`
  - `src/components/ui/PageLoader.tsx`
  - `src/components/ui/LoadingSpinner.tsx`
- **Updated:** Barrel exports in `src/hooks/index.ts` and `src/components/ui/index.ts`.

### FIX-017: Fix HTML lang Attribute ✅
- **File:** `src/app/layout.tsx`
- **Fix:** Changed `lang="en"` to `lang="es"`.

---

## Phase 6 — Performance Fixes ✅

### FIX-019: Eliminate Triple-Nested N+1 Cascade Deletes ✅
- **Files:** `admin.ts`, `users.ts`
- **Issue:** Academy deletion used 3 nested loops (200+ sequential DB calls).
- **Fix:** Replaced with `c.env.DB.batch([])` containing subquery DELETEs. Now 1 batch call = 11 statements.

### FIX-020: Batch Notification Inserts ✅
- **Files:** `notifications.ts`, `live.ts` (3 locations)
- **Issue:** N+1 INSERT loops (50+ sequential inserts for large classes).
- **Fix:** Replaced all `for` loops with `c.env.DB.batch()` calls.

### FIX-021: Eliminate S×V Student Times N+1 ✅
- **File:** `lessons.ts` (GET `/lessons/:id/student-times`)
- **Issue:** Double-nested N+1: for each student × each video = 150+ queries.
- **Fix:** Single batch query for all play states + in-memory Map lookup (O(1) per access).

### FIX-022: Add LIMIT to Unbounded Queries ✅
- **Files:** `explore.ts`, `admin.ts` (4 endpoints), `live.ts`
- **Issue:** Public and admin endpoints returned unlimited results.
- **Fix:** Added LIMIT clauses:
  - `GET /explore/academies` — LIMIT 50 with pagination (limit/offset params)
  - `GET /admin/academies` — LIMIT 200
  - `GET /admin/payments` — LIMIT 500
  - `GET /admin/classes` — LIMIT 500
  - `GET /admin/lessons` — LIMIT 500
  - `GET /live/history` — LIMIT 100

---

## Phase 7 — Documentation Fixes ✅

### FIX-023: Fix Broken README Links ✅
- **File:** `README.md`
- Removed 4 references to nonexistent files (INSTALL.md, GETTING_STARTED.md, SETUP.md, PROJECT_SUMMARY.md)
- Fixed 3 links to archived files
- Updated table count from "14" to "~25"
- Updated Documentation Index to reference actual existing files

### FIX-024: Remove Dangerous Migration Commands ✅
- **Files:** `README.md`, `PROJECT_DOCUMENTATION.md`
- Replaced `npx wrangler d1 migrations apply` with warnings and safe `d1 execute --file=` examples.

### FIX-025: Fix PROJECT_DOCUMENTATION.md Accuracy ✅
- Updated table count from 14 to ~25
- Updated route count from 17 to 29
- Fixed broken doc links to use actual file paths
- Updated status date

---

## Progress Tracker

| Fix | Status | TSC Validated |
|-----|--------|---------------|
| FIX-001 | ✅ Applied | ✅ |
| FIX-002 | ✅ Applied | ✅ |
| FIX-003 | ✅ Applied | ✅ |
| FIX-004 | ✅ Applied | ✅ |
| FIX-005 | ✅ Applied | ✅ |
| FIX-006 | ✅ Applied | ✅ |
| FIX-007 | ✅ Applied | ✅ |
| FIX-008 | ✅ Applied | ✅ |
| FIX-009 | ✅ Applied | ✅ |
| FIX-010 | ✅ Applied | ✅ |
| FIX-011 | ✅ Applied | ✅ |
| FIX-012 | ✅ Applied | ✅ |
| FIX-013 | ✅ Applied | ✅ |
| FIX-014 | ✅ Applied | ✅ |
| FIX-015 | ✅ Applied | ✅ |
| FIX-016 | ✅ Applied | ✅ |
| FIX-017 | ✅ Applied | ✅ |
| FIX-018 | ✅ Migration Created | ⬜ Apply to DB |
| FIX-019 | ✅ Applied | ✅ |
| FIX-020 | ✅ Applied | ✅ |
| FIX-021 | ✅ Applied | ✅ |
| FIX-022 | ✅ Applied | ✅ |
| FIX-023 | ✅ Applied | N/A (docs) |
| FIX-024 | ✅ Applied | N/A (docs) |
| FIX-025 | ✅ Applied | N/A (docs) |

---

## New Environment Variables Required

| Variable | Worker | Purpose |
|----------|--------|---------|
| `SESSION_SECRET` | akademo-api | **REQUIRED** — No longer has fallback. Used for session signing + signed URLs. |
| `BUNNY_WEBHOOK_SECRET` | akademo-api | Shared secret for Bunny CDN webhook authentication. |

**To set:**
```bash
npx wrangler secret put SESSION_SECRET --name akademo-api
npx wrangler secret put BUNNY_WEBHOOK_SECRET --name akademo-api
```

---

## Pending Database Migrations

Apply in order after deployment:
```bash
npx wrangler d1 execute akademo-db --remote --file=migrations/0078_verification_attempts_column.sql
npx wrangler d1 execute akademo-db --remote --file=migrations/0079_restore_all_indexes.sql
```

---

## Files Modified Summary

### API Worker Files (workers/akademo-api/src/)
| File | Fixes Applied |
|------|--------------|
| `lib/auth.ts` | FIX-001, FIX-002, FIX-014 |
| `lib/validation.ts` | FIX-008 |
| `routes/webhooks.ts` | FIX-003, FIX-004, FIX-005 |
| `routes/storage.ts` | FIX-006, FIX-010 |
| `routes/academies.ts` | FIX-007, FIX-008 |
| `routes/auth.ts` | FIX-011, FIX-012, FIX-014 |
| `routes/bunny.ts` | FIX-009 |
| `routes/users.ts` | FIX-014, FIX-019 |
| `routes/leads.ts` | FIX-013 |
| `routes/admin.ts` | FIX-019, FIX-022 |
| `routes/notifications.ts` | FIX-020 |
| `routes/live.ts` | FIX-020, FIX-022 |
| `routes/lessons.ts` | FIX-021 |
| `routes/classes.ts` | Pre-existing TS error fix |
| `routes/explore.ts` | FIX-022 |

### Frontend Files (src/)
| File | Fixes Applied |
|------|--------------|
| `app/layout.tsx` | FIX-017 |
| `hooks/index.ts` | FIX-016 (barrel cleanup) |
| `components/ui/index.ts` | FIX-016 (barrel cleanup) |
| 5 files deleted | FIX-016 (dead code removal) |

### Root Files
| File | Fixes Applied |
|------|--------------|
| `package.json` | FIX-015 |
| `README.md` | FIX-023, FIX-024 |
| `PROJECT_DOCUMENTATION.md` | FIX-024, FIX-025 |

### New Migrations
| File | Purpose |
|------|---------|
| `migrations/0078_verification_attempts_column.sql` | FIX-011 |
| `migrations/0079_restore_all_indexes.sql` | FIX-018 (35 indexes) |
