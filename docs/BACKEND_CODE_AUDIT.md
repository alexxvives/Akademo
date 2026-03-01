# Backend Code Audit Report — AKADEMO API

**Date**: 2025-01-XX  
**Scope**: All 28 route files in `workers/akademo-api/src/routes/` and 8 lib files in `workers/akademo-api/src/lib/`  
**Total Lines Reviewed**: ~15,000  
**Focus**: Auth checks, SQL injection, missing validation, N+1 queries, error handling, unused code, missing role checks

---

## Summary

| Severity | Count |
|----------|-------|
| **CRITICAL** | 12 |
| **MEDIUM** | 28 |
| **LOW** | 18 |

---

## CRITICAL Findings

### C-01: Legacy Unsigned Session Tokens Accepted as Valid
**File**: `workers/akademo-api/src/lib/auth.ts` lines 84-91  
**Impact**: Authentication bypass  

The `verifyToken()` function accepts legacy unsigned tokens (plain base64-encoded userId). Any attacker who knows a user's UUID can craft a valid session token by simply base64-encoding it — no cryptographic secret needed.

```typescript
// Legacy unsigned token (base64-only) — accept during migration but log warning
try {
  const decoded = atob(token);
  if (decoded && decoded.length > 0) {
    console.warn('[Auth] Legacy unsigned session token detected...');
    return decoded; // ← ACCEPTS ANY base64 string as a valid userId
  }
} catch { /* invalid */ }
```

**Recommendation**: Remove legacy token acceptance. Force re-login for any remaining legacy sessions.

---

### C-02: SHA-256 Used for Password Hashing Instead of bcrypt
**File**: `workers/akademo-api/src/routes/academies.ts` ~line 185  
**Impact**: Insecure password storage; broken login for teachers

When an academy owner creates a teacher, the password is hashed with `SHA-256` (no salt, no work factor). Meanwhile `lib/auth.ts` uses `bcrypt.hash(password, 12)` and `bcrypt.compare()` for login. Teachers created via this endpoint:
1. Have insecure, unsalted password hashes
2. **Cannot log in** because `bcrypt.compare()` will always fail against a SHA-256 hash

```typescript
// academies.ts — WRONG
const encoder = new TextEncoder();
const data = encoder.encode(tempPassword);
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
```

**Recommendation**: Replace with `await hashPassword(tempPassword)` from `lib/auth.ts`.

---

### C-03: No Webhook Signature Verification (Zoom)
**File**: `workers/akademo-api/src/routes/webhooks.ts` POST /zoom  
**Impact**: Webhook forgery — attackers can manipulate livestream state, trigger fake recordings, remove participants

The Zoom webhook endpoint performs no HMAC signature verification. Any HTTP client can send forged payloads.

**Recommendation**: Implement Zoom webhook signature verification using `ZOOM_WEBHOOK_SECRET` and the `x-zm-signature` header.

---

### C-04: No Webhook Authentication (Bunny)
**File**: `workers/akademo-api/src/routes/webhooks.ts` POST /bunny  
**Impact**: Attackers can mark arbitrary videos as ready/failed, manipulate lesson-video associations

Zero authentication on the Bunny webhook endpoint.

**Recommendation**: Verify requests originate from Bunny IPs, or use a shared secret in the webhook URL.

---

### C-05: Stripe Webhook Verification Silently Skipped
**File**: `workers/akademo-api/src/routes/webhooks.ts` POST /stripe  
**Impact**: If `STRIPE_WEBHOOK_SECRET` is unset, the endpoint processes all payloads without signature verification

```typescript
if (!stripeWebhookSecret) {
  console.warn('[Stripe Webhook] No webhook secret - skipping verification');
  // ↑ Continues processing the forged payload
}
```

**Recommendation**: Return 500 immediately if webhook secret is not configured.

---

### C-06: No Ownership Check on LiveStream Details
**File**: `workers/akademo-api/src/routes/live.ts` GET /:id ~line 344  
**Impact**: Any authenticated user can retrieve livestream details including `zoomStartUrl` (host link) and `zoomPassword`

No verification that the requestor is the teacher, academy owner, or enrolled student. The `zoomStartUrl` allows anyone to start/control the Zoom meeting as host.

**Recommendation**: Add ownership/enrollment verification before returning sensitive fields.

---

### C-07: Broken approve-cash Endpoint Reads Undefined Fields
**File**: `workers/akademo-api/src/routes/payments.ts` PATCH /:enrollmentId/approve-cash ~line 605  
**Impact**: Payments created with `undefined` amount and currency

The SELECT query does not include `price` or `currency`, but the code reads `enrollmentData.price` and `enrollmentData.currency` — both `undefined`.

**Recommendation**: Add `c.monthlyPrice, c.oneTimePrice, c.currency` to the SELECT, or determine the amount from the enrollment's `paymentFrequency`.

---

### C-08: SQL Injection Pattern in Payment Reversal
**File**: `workers/akademo-api/src/routes/payments.ts` PUT /history/:id/reverse ~line 1208  
**Impact**: Potential SQL injection (currently low-exploitability since values are controlled)

```typescript
const completedAt = reverseAction === 'unreverse' ? `datetime('now')` : 'NULL';
// Later:
`SET completedAt = ${completedAt}` // ← String interpolation in SQL
```

While the value is controlled by a ternary, this is the **only** non-parameterized SQL in the entire codebase and sets a dangerous precedent.

**Recommendation**: Use parameterized query with `?.bind()`.

---

### C-09: Insecure Bunny Stream Token Generation
**File**: `workers/akademo-api/src/routes/bunny.ts` GET /video/:guid/stream  
**Impact**: Anyone who knows the token key pattern can forge stream access tokens

The route uses `btoa(guid-expires-tokenKey)` (base64 encoding) instead of the proper SHA-256 token generation in `lib/bunny-stream.ts`. Base64 is reversible — not a signature.

```typescript
// bunny.ts route — WRONG (base64, not cryptographic)
const token = btoa(`${guid}-${expires}-${tokenKey}`);

// lib/bunny-stream.ts — CORRECT (SHA-256 hash)
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
```

**Recommendation**: Use `generateBunnyStreamToken()` from `lib/bunny-stream.ts`.

---

### C-10: Unauthenticated File Serving from R2
**File**: `workers/akademo-api/src/routes/storage.ts` GET /serve/*  
**Impact**: Any person who knows an R2 object path can download any file — assignment submissions, signed documents, avatars

No authentication middleware on the serve endpoint.

**Recommendation**: Add `requireAuth()` and verify the requestor has access to the resource.

---

### C-11: Monoacademy Registration Creates Duplicate Email
**File**: `workers/akademo-api/src/routes/auth.ts` ~line 162  
**Impact**: Database constraint violation or broken email lookups

Monoacademy registration creates a Teacher User with the **same email** as the Academy User. If the User table has a unique email constraint, this fails silently. If not, email lookups become ambiguous.

**Recommendation**: Use a single User record with a role-switching mechanism, or use a distinct email for the teacher account.

---

### C-12: Documents Endpoint Has No Authorization
**File**: `workers/akademo-api/src/routes/documents.ts` GET /  
**Impact**: Any authenticated user can retrieve documents for any class/lesson by providing the ID

No check that the user is enrolled in the class, teaches the class, or owns the academy.

**Recommendation**: Add class ownership/enrollment verification.

---

## MEDIUM Findings

### M-01: Duplicated Billing Cycle Auto-Creation Logic
**File**: `workers/akademo-api/src/routes/payments.ts` ~lines 270 and 830  
**Impact**: Maintenance burden; divergent behavior if only one copy is updated  
~100 lines of billing cycle calculation duplicated between `pending-cash` and `my-payments` endpoints.

### M-02: N+1 Query in Enrollment Payment Status
**File**: `workers/akademo-api/src/routes/enrollments.ts` GET /payment-status  
**Impact**: O(n) database queries for n enrollments; slow for classes with many students.

### M-03: N+1 Query in Lesson Video Transcoding Check
**File**: `workers/akademo-api/src/routes/lessons.ts` GET / (when `checkTranscoding=true`)  
**Impact**: Individual Bunny API call per video; slow for lessons with many videos.

### M-04: N+1 Query in Academy Teacher Revenue
**File**: `workers/akademo-api/src/routes/academies.ts` GET /teachers  
**Impact**: Per-teacher queries for classes and revenue; slow for academies with many teachers.

### M-05: N+1+1 Cascade in Admin User Deletion
**File**: `workers/akademo-api/src/routes/admin.ts` DELETE /users/:id  
**Impact**: Loops academies → classes → lessons with individual DELETE queries. Could be extremely slow.

### M-06: Duplicate DELETE /:id Route Handler (LiveStream)
**File**: `workers/akademo-api/src/routes/live.ts` ~lines 640 and 990  
**Impact**: Second handler shadows first; confusing behavior.

### M-07: Duplicate GET /video/:videoGuid Route Handler
**File**: `workers/akademo-api/src/routes/bunny.ts` ~lines 160 and 240  
**Impact**: Second handler shadows first.

### M-08: Unreachable Code After Return Statements
**File**: `workers/akademo-api/src/routes/payments.ts` ~lines 270 and 830  
**Impact**: Dead code; maintenance confusion.

### M-09: Check-Email Endpoint Enables User Enumeration
**File**: `workers/akademo-api/src/routes/auth.ts` POST /check-email  
**Impact**: Attacker can determine if an email is registered on the platform.

### M-10: No Pagination on Multiple List Endpoints
**Files**: `classes.ts` GET /, `admin.ts` (all 8 list endpoints), `explore.ts` (browse endpoints), `assignments.ts` (all lists), `students.ts` GET /progress  
**Impact**: Unbounded result sets; D1 timeout risk (30s limit) and high memory usage.

### M-11: Public Endpoints Expose Sensitive Data
**File**: `workers/akademo-api/src/routes/explore.ts`  
**Impact**: Teacher email addresses, class prices, and full academy details available without authentication.  
- `GET /academies` — returns `a.*` (all academy columns)
- `GET /academies/:id/teachers` — returns teacher emails
- `GET /academies/:id/classes` — returns pricing details

### M-12: Unauthenticated Upload Metadata Endpoint
**File**: `workers/akademo-api/src/routes/storage.ts` GET /upload/:id  
**Impact**: Anyone can look up upload details by ID.

### M-13: Student Calendar Events Limited to One Academy
**File**: `workers/akademo-api/src/routes/calendar-events.ts` GET /  
**Impact**: Students enrolled in multiple academies only see events from one (LIMIT 1 on academy lookup).

### M-14: Incomplete Cascade on Account Deletion
**File**: `workers/akademo-api/src/routes/users.ts` DELETE /delete-account  
**Impact**: Orphaned records in Bunny CDN, Assignment, AssignmentSubmission, CalendarEvent, Payment, Notification, DeviceSession tables.

### M-15: ADMIN Role Excluded from Enrollment Operations
**File**: `workers/akademo-api/src/routes/enrollments.ts`  
**Impact**: ADMIN cannot approve/reject enrollments (PUT /pending returns 403) or view enrollment history (GET /history returns 403).

### M-16: Duplicate Variable Declaration
**File**: `workers/akademo-api/src/routes/assignments.ts` PATCH /submissions/:submissionId/grade ~line 560/574  
**Impact**: Outer `submissionId` variable shadowed and unused.

### M-17: Public Lead Submission with No Rate Limiting
**File**: `workers/akademo-api/src/routes/leads.ts` POST /  
**Impact**: Can be abused for spam/DDoS against the Resend email service.

### M-18: CommonJS `require('stripe')` in Workers Environment
**File**: `workers/akademo-api/src/routes/payments.ts` (4 occurrences)  
**Impact**: `require()` may fail in Cloudflare Workers ESM bundles depending on build config.

### M-19: N+1 Query in Notification Creation
**File**: `workers/akademo-api/src/routes/notifications.ts` POST /  
**Impact**: Individual INSERT per student. For a class of 100 students, that's 100 sequential DB writes.  
**Recommendation**: Use `db.batch()`.

### M-20: No Authorization on Notification Send Target
**File**: `workers/akademo-api/src/routes/notifications.ts` POST /  
**Impact**: Any TEACHER/ACADEMY/ADMIN can send notifications to students in ANY class, not just their own.

### M-21: `classRecord.price` References Non-Existent Field
**File**: `workers/akademo-api/src/routes/requests.ts` POST /student ~line 87  
**Impact**: `classPrice` is always `0` (undefined || 0), so `requiresPayment` in the response is always `false`. The SELECT returns `monthlyPrice` and `oneTimePrice`, not `price`.

### M-22: Auto-Approval of Previously Rejected Students
**File**: `workers/akademo-api/src/routes/requests.ts` POST /student ~line 69  
**Impact**: Students who were explicitly REJECTED can re-enroll with automatic APPROVED status, bypassing the academy's rejection decision.

### M-23: Inconsistent API Response Format
**File**: `workers/akademo-api/src/routes/requests.ts` GET /teacher  
**Impact**: Returns raw array instead of `successResponse()` wrapper. Frontend may break if it expects the standard `{ success: true, data: [] }` format.

### M-24: Student Warning Has No Ownership Verification
**File**: `workers/akademo-api/src/routes/students.ts` PATCH /:id/warn  
**Impact**: Any ACADEMY user can warn any student on the platform, not just students in their academy.

### M-25: Massive Duplicated SQL (3 copies)
**File**: `workers/akademo-api/src/routes/students.ts` GET /progress  
**Impact**: Three near-identical 30-line SQL queries (ADMIN/TEACHER/ACADEMY) that differ only in JOIN conditions. Maintenance nightmare — a bug fix must be applied three times.

### M-26: Zoom SDK Role Parameter Not Validated
**File**: `workers/akademo-api/src/routes/zoom.ts` POST /signature  
**Impact**: User-supplied `role` parameter (0=attendee, 1=host) passed directly. Any authenticated user can request a host-role signature, potentially gaining host privileges.

### M-27: Weak Fallback Session Signing Key
**File**: `workers/akademo-api/src/lib/auth.ts` lines 51-53  
**Impact**: If `SESSION_SECRET` env var is not set, the signing key falls back to the deterministic string `'akademo-session-key-prod'` which an attacker could guess.

### M-28: Duplicate Zoom Recording Functions
**File**: `workers/akademo-api/src/lib/zoom.ts` lines 209 and 332  
**Impact**: `getZoomMeetingRecordings()` and `getZoomRecording()` do the same thing. Maintenance confusion.

---

## LOW Findings

### L-01: Mixed Language in Error Messages
**Files**: All route files  
**Impact**: Inconsistent UX; some errors in English, others in Spanish.  
Examples: "Internal server error" vs "No hay estudiantes aprobados en esta clase"

### L-02: Excessive `as any` Type Assertions
**Files**: Most route files  
**Impact**: TypeScript safety bypassed; runtime errors possible.

### L-03: Payment ID Uses Date.now()-Random Instead of UUID
**File**: `workers/akademo-api/src/routes/payments.ts`  
**Impact**: Non-standard ID format; potential collisions under high concurrency.

### L-04: Hardcoded Demo Lesson Data
**File**: `workers/akademo-api/src/routes/lessons.ts` GET /:id  
**Impact**: Demo data in production code.

### L-05: Test Endpoint Left in Production
**File**: `workers/akademo-api/src/routes/student-payments.ts` GET /test  
**Impact**: Exposes debugging information.

### L-06: Duplicated `calculateBillingCycle` Utility
**Files**: `payments.ts` and `webhooks.ts`  
**Impact**: Logic divergence if only one copy is updated.

### L-07: No ADMIN Role Support in Academic Years
**File**: `workers/akademo-api/src/routes/academic-years.ts`  
**Impact**: Admin cannot manage academic years.

### L-08: Plain-Text Password in Onboarding Email
**File**: `workers/akademo-api/src/routes/academies.ts` POST /teachers  
**Impact**: Password visible in email if intercepted. Combined with C-02 (SHA-256), this is doubly concerning.

### L-09: Per-Isolate Rate Limiting Not Distributed
**File**: `workers/akademo-api/src/lib/rate-limit.ts`  
**Impact**: Rate limits reset on cold starts and don't sync across edge locations. Can be bypassed by hitting different PoPs.

### L-10: Password Validation Inconsistency
**File**: `workers/akademo-api/src/lib/validation.ts`  
**Impact**: `registerSchema` requires 8+ chars but `loginSchema` only requires 6+ chars.  
A user could register with 8-char password but the login form would also accept 6-char attempts.

### L-11: Bunny Stream URL Fallback on Token Failure
**File**: `workers/akademo-api/src/lib/bunny-stream.ts` line 226  
**Impact**: If token generation fails, falls back to unsigned URL — potential auth bypass for video content.

### L-12: Zoom Access Token Appended as Query Parameter
**File**: `workers/akademo-api/src/lib/zoom.ts` `getZoomRecordingDownloadUrl`  
**Impact**: Access token may appear in server logs, browser history, or CDN logs.

### L-13: Several Zoom Functions Call `getAccessToken()` Without Config
**File**: `workers/akademo-api/src/lib/zoom.ts`  
**Impact**: `getZoomMeeting()`, `endZoomMeeting()`, `getZoomMeetingParticipants()`, `getZoomMeetingRecordings()` rely on a cached token from a previous call. If no token is cached, they throw.

### L-14: Notification Type Hardcoded
**File**: `workers/akademo-api/src/routes/notifications.ts` POST /  
**Impact**: Always inserts type='LIVE_STREAM' and title='Clase en vivo' regardless of the notification's actual purpose.

### L-15: Approvals Don't Set `approvedAt` Timestamp
**File**: `workers/akademo-api/src/routes/approvals.ts` POST /academy, POST /teacher  
**Impact**: `approvedAt` remains NULL after approval.

### L-16: Approval Routes Duplicate Logic
**File**: `workers/akademo-api/src/routes/approvals.ts`  
**Impact**: Academy and teacher approval handlers are near-identical. Could be refactored into a single handler with role-based ownership check.

### L-17: Validation Schemas Defined but Not Applied
**File**: `workers/akademo-api/src/lib/validation.ts`  
**Impact**: Many POST/PATCH endpoints parse `c.req.json()` directly without using `validateBody()` middleware. The schemas exist but are unused on many routes.

### L-18: `mapStreamStatus` Returns `as any` for Unknown String Input
**File**: `workers/akademo-api/src/lib/bunny-stream.ts` line 408  
**Impact**: TypeScript safety bypassed.

---

## Prioritized Remediation Plan

### Phase 1 — Immediate (Security Critical)
1. **C-01**: Remove legacy unsigned token acceptance in `lib/auth.ts`
2. **C-02**: Replace SHA-256 with `hashPassword()` in `academies.ts` teacher creation
3. **C-03/C-04**: Add webhook signature verification for Zoom and Bunny
4. **C-05**: Fail closed when Stripe webhook secret is missing
5. **C-06**: Add ownership check to `live.ts` GET /:id
6. **C-09**: Use `lib/bunny-stream.ts` token generation in `bunny.ts` route
7. **C-10**: Add auth to storage serve endpoint
8. **C-12**: Add authorization to documents endpoint
9. **M-27**: Require `SESSION_SECRET` env var (no fallback)

### Phase 2 — High Priority (Data Integrity)
1. **C-07**: Fix approve-cash SELECT to include price/currency fields
2. **C-08**: Convert SQL interpolation to parameterized query
3. **C-11**: Fix monoacademy duplicate email issue
4. **M-21**: Fix `classRecord.price` → use `monthlyPrice`/`oneTimePrice`
5. **M-22**: Require manual approval for re-enrollment after rejection
6. **M-24**: Verify student belongs to academy before warning
7. **M-26**: Validate Zoom SDK role parameter against user's actual role

### Phase 3 — Performance
1. **M-02/M-03/M-04/M-05**: Replace N+1 queries with JOINs or batch operations
2. **M-10**: Add pagination to all list endpoints
3. **M-19**: Batch notification INSERTs
4. **M-25**: Refactor triplicated student progress SQL

### Phase 4 — Code Quality
1. **M-06/M-07**: Remove duplicate route handlers
2. **M-08**: Remove unreachable code
3. **M-01/L-06**: Extract shared billing logic to lib
4. **M-28**: Remove duplicate Zoom recording function
5. **L-01**: Standardize error message language
6. **L-02**: Replace `as any` with proper types
7. **L-05**: Remove test endpoints
8. **L-17**: Apply existing Zod validation schemas to all endpoints
