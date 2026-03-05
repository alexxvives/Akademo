# AKADEMO — System Constitution

**Version**: 1.0  
**Date**: March 4, 2026  
**Status**: RATIFIED (owner-confirmed)  
**Purpose**: Ground truth invariants for all audits, code reviews, and system changes.

---

## Table of Contents

1. [Non-Negotiable Truths](#1-non-negotiable-truths)
2. [Domain 1: Identity & Auth](#2-domain-1-identity--auth)
3. [Domain 2: Academy Management](#3-domain-2-academy-management)
4. [Domain 3: Class Management](#4-domain-3-class-management)
5. [Domain 4: Enrollment](#5-domain-4-enrollment)
6. [Domain 5: Payments](#6-domain-5-payments)
7. [Domain 6: Content Delivery](#7-domain-6-content-delivery)
8. [Domain 7: Assignments](#8-domain-7-assignments)
9. [Domain 8: Live Streaming](#9-domain-8-live-streaming)
10. [Domain 9: Ratings & Feedback](#10-domain-9-ratings--feedback)
11. [Domain 10: Analytics & Anti-Piracy](#11-domain-10-analytics--anti-piracy)
12. [Domain 11: Leads](#12-domain-11-leads)
13. [Domain 12: Platform Admin](#13-domain-12-platform-admin)
14. [Cross-Domain Interactions](#14-cross-domain-interactions)
15. [State Machines (Complete)](#15-state-machines-complete)
16. [Idempotency Rules (Complete)](#16-idempotency-rules-complete)
17. [Source-of-Truth Declarations](#17-source-of-truth-declarations)

---

## 1. Non-Negotiable Truths

These are absolute rules that must NEVER be violated under any circumstances.

| # | Truth |
|---|-------|
| NT-1 | **Three-gate access**: A student can access class content ONLY IF `enrollment.status = 'APPROVED'` AND `enrollment.documentSigned = 1` AND `isPaymentOverdue() = false`. Missing ANY gate = ZERO access. |
| NT-2 | **One role per user, immutable**: Every user has exactly one role from {ADMIN, ACADEMY, TEACHER, STUDENT}. It never changes after creation. |
| NT-3 | **Single student session**: At most ONE active DeviceSession per STUDENT. New login kills previous sessions. |
| NT-4 | **Payment is the key**: No free classes exist. Every class requires payment. The enrollment status does not control access — payment does. |
| NT-5 | **No late submissions**: Assignments cannot be submitted after dueDate. |
| NT-6 | **One stream per class**: At most one LIVE stream per class at any time. |
| NT-7 | **Stripe is authoritative**: For Stripe payments, the webhook is the ONLY source of truth for status changes. Academy cannot manually edit Stripe payment status. |
| NT-8 | **One enrollment per student per class**: (classId, userId) is UNIQUE. |
| NT-9 | **Content is class-bound**: Lessons, videos, documents, and assignments are permanently bound to their class. |
| NT-10 | **No grace period**: When a monthly payment lapses, access is blocked immediately. No grace period. |
| NT-11 | **Cascade on academy delete**: Deleting an academy deletes ALL its classes, enrollments, content, and payments. |
| NT-12 | **Exactly one admin**: There is exactly one ADMIN user in the system. |

---

## 2. Domain 1: Identity & Auth

### Entities
- **User**: Central identity table. All roles.
- **DeviceSession**: Active sessions per user/device.
- **LoginEvent**: Audit log of login attempts with geolocation.
- **VerificationCode**: Email verification and password reset codes.

### Invariants

| ID | Invariant |
|----|-----------|
| INV-1.1 | Every User has exactly ONE role from {ADMIN, ACADEMY, TEACHER, STUDENT} |
| INV-1.2 | User.role is IMMUTABLE after creation |
| INV-1.3 | User.password is ALWAYS bcrypt-hashed (never stored plaintext) |
| INV-1.4 | User.email is UNIQUE across all users (case-insensitive) |
| INV-1.5 | At most ONE active DeviceSession per STUDENT at any time |
| INV-1.6 | TEACHER/ACADEMY/ADMIN have no concurrent session limit |
| INV-1.7 | Session token TTL = 7 days; expired tokens grant ZERO access |
| INV-1.8 | New STUDENT login kills ALL previous active sessions for that user |
| INV-1.9 | Exactly ONE user with role=ADMIN exists |
| INV-1.10 | Session cookies are HMAC-SHA256 signed; unsigned/tampered cookies rejected |
| INV-1.11 | VerificationCode has an expiry time and max attempt tracking |
| INV-1.12 | VerificationCode is deleted after successful use |

### Illegal States
- User with `role = NULL` or role not in {ADMIN, ACADEMY, TEACHER, STUDENT}
- Two active DeviceSessions for the same STUDENT user
- Session token accepted after TTL expiry
- User with empty or plaintext password
- Two users with the same email

### State Machine: User
```
Created → Active  (only state — users are never soft-deleted)
```

### State Machine: DeviceSession
```
Active → Inactive  (killed by new login or explicit logout)
```

---

## 3. Domain 2: Academy Management

### Entities
- **Academy**: Educational institution, owned by one ACADEMY user.
- **Teacher**: Links TEACHER-role users to ONE academy.

### Invariants

| ID | Invariant |
|----|-----------|
| INV-2.1 | Every Academy has exactly ONE ownerId → User(role=ACADEMY) |
| INV-2.2 | Every ACADEMY user owns exactly ONE Academy (1:1) |
| INV-2.3 | Every Teacher row links ONE User(role=TEACHER) to ONE Academy |
| INV-2.4 | A TEACHER belongs to at most ONE academy |
| INV-2.5 | A TEACHER can exist without being assigned to any class |
| INV-2.6 | Only ADMIN can delete an Academy |
| INV-2.7 | Deleting an Academy cascades: all Classes, Enrollments, Content, Payments deleted |
| INV-2.8 | Teacher MUST be unlinked from classes before removal from academy |
| INV-2.9 | NEVER use Teacher table to identify academy owners (use Academy.ownerId) |

### Illegal States
- Academy without an ownerId
- Academy.ownerId → User where role ≠ ACADEMY
- Teacher.userId → User where role ≠ TEACHER
- Teacher belonging to a non-existent Academy
- Two Teacher rows for the same userId (teacher in 2 academies)
- ACADEMY user with 0 or 2+ Academy rows

### State Machine: Academy
```
Created → Active → Deleted(by admin, cascade, permanent)
```

---

## 4. Domain 3: Class Management

### Entities
- **Class**: A course/subject within an academy.
- **AcademicYear**: Informational only — no business logic.
- **Topic**: Organizational folder for lessons — no authorization rules.

### Invariants

| ID | Invariant |
|----|-----------|
| INV-3.1 | Every Class belongs to exactly ONE Academy |
| INV-3.2 | Class.teacherId is OPTIONAL (can be NULL) |
| INV-3.3 | Class.slug is UNIQUE across the entire platform |
| INV-3.4 | Reassigning a class to a new teacher preserves ALL content |
| INV-3.5 | Content (lessons, videos, documents, assignments) is permanently bound to its class |
| INV-3.6 | Academy owners and admins can delete classes |
| INV-3.7 | AcademicYear is display-only — no business logic impact |
| INV-3.8 | Topics are organizational folders — no authorization rules |
| INV-3.9 | Lessons with releaseDate in the future are INVISIBLE to students |
| INV-3.10 | Academy CANNOT change monthlyPrice or oneTimePrice on an active class with enrollments |
| INV-3.11 | Pricing: academy sets totalPrice + numberOfInstallments → monthlyPrice = total / installments |
| INV-3.12 | maxCycles (max installments) = ceil(oneTimePrice / monthlyPrice) — derived, not stored |

### Illegal States
- Class without an academyId
- Class with a slug that exists on another class
- Student seeing a lesson before its releaseDate
- Class with negative or zero price (when payment-enabled)

### State Machine: Lesson
```
Active → Hidden  (invisible to students, visible to teacher/academy)
Active → Deleted
Hidden → Active
```

---

## 5. Domain 4: Enrollment

### Entity: ClassEnrollment

### Invariants

| ID | Invariant |
|----|-----------|
| INV-4.1 | (classId, userId) is UNIQUE — one enrollment per student per class |
| INV-4.2 | Enrollment auto-created when student signs up via academy/teacher link |
| INV-4.3 | **THREE-GATE ACCESS** — content access requires ALL THREE: enrollment(APPROVED) + documentSigned(1) + !isPaymentOverdue() |
| INV-4.4 | Missing ANY gate = ZERO access to lessons, videos, assignments, live streams, files |
| INV-4.5 | Enrollment can transition REJECTED → APPROVED (by paying) |
| INV-4.6 | paymentFrequency is locked after first completed payment (cannot switch monthly↔one-time) |
| INV-4.7 | maxCycles = ceil(oneTimePrice / monthlyPrice) — derived formula |
| INV-4.8 | Late joiners must pay ALL elapsed months on first payment (catch-up) |
| INV-4.9 | After all monthly installments paid (totalPaid ≥ oneTimePrice) → lifetime access |
| INV-4.10 | ONE_TIME payment → immediate lifetime access |
| INV-4.11 | Monthly payment lapse → access blocked. Enrollment stays APPROVED. Blocked by isPaymentOverdue() only. |
| INV-4.12 | No grace period for late payments — access blocked immediately |
| INV-4.13 | documentSigned is a boolean flag on ClassEnrollment (0 or 1) |

### Illegal States
- Two enrollments for the same (classId, userId)
- Student with content access but enrollment status ≠ APPROVED
- Student with content access but documentSigned = 0
- Student with content access but isPaymentOverdue = true
- Student accessing content in a class they're not enrolled in
- paymentFrequency changed after first completed payment

### State Machine: ClassEnrollment
```
PENDING → APPROVED  (on signup via academy link, or after payment)
PENDING → REJECTED  (academy/admin rejects)
REJECTED → APPROVED (student pays / academy re-approves)
APPROVED stays APPROVED (access gated by payment + document, not status)
```

### Access Decision Flowchart
```
Request for class content
  │
  ├─ enrollment exists? NO → 403
  ├─ enrollment.status = 'APPROVED'? NO → 403
  ├─ enrollment.documentSigned = 1? NO → 403 (must sign first)
  ├─ isPaymentOverdue(db, userId, classId)? YES → 403 (must pay)
  │
  └─ ✅ GRANT ACCESS
```

---

## 6. Domain 5: Payments

### Entity: Payment

### Invariants

| ID | Invariant |
|----|-----------|
| INV-5.1 | Every Payment links to exactly ONE classId |
| INV-5.2 | Payment.amount MUST be a positive number (> 0) |
| INV-5.3 | Valid payment methods: cash, bizum, stripe. Academy configures which methods are available. |
| INV-5.4 | PayPal is NOT supported — no code should reference it |
| INV-5.5 | COMPLETED and PAID should be unified to a single status (PAID) |
| INV-5.6 | **Cash/Bizum** (manual): PENDING → PAID (academy confirms). PAID → PENDING (academy reverts mistake). Fully editable by academy/admin. |
| INV-5.7 | **Stripe** (automated): Status controlled ONLY by Stripe webhooks. Academy CANNOT manually edit Stripe payment status. |
| INV-5.8 | Only ONE PENDING payment per (payerId, classId) at a time (unique index) |
| INV-5.9 | stripeCheckoutSessionId is UNIQUE when present (prevents duplicate processing) |
| INV-5.10 | Deleting a payment revokes student access (isPaymentOverdue becomes true) |
| INV-5.11 | ACADEMY_TO_PLATFORM payment type is unnecessary (billing is external) |
| INV-5.12 | Stripe checkout.session.completed = ultimate authority for Stripe payments |

### Illegal States
- Payment with amount ≤ 0
- Payment with paymentMethod = 'paypal'
- Two PENDING payments for same (payerId, classId)
- Stripe payment without stripeCheckoutSessionId or stripePaymentId
- Cash/bizum payment WITH stripeCheckoutSessionId
- Academy editing Stripe payment status

### State Machine: Payment (Cash/Bizum)
```
PENDING → PAID    (academy confirms receipt)
PAID → PENDING    (academy reverts mistake)
PENDING → FAILED  (academy rejects — rare)
```

### State Machine: Payment (Stripe)
```
PENDING → PAID     (checkout.session.completed webhook)
PENDING → FAILED   (payment_intent.payment_failed webhook)
PAID → REFUNDED    (charge.refunded webhook)
No manual transitions allowed.
```

### Monthly Payment Lifecycle
```
1. Class created with oneTimePrice=500€, monthlyPrice=50€
   → maxCycles = ceil(500/50) = 10 installments

2. Student enrolls month 3 (late joiner)
   → Owes: 3 × 50€ = 150€ catch-up on first payment
   → Remaining: 7 more monthly payments

3. Student pays month 3, misses month 4
   → Access blocked immediately (no grace)
   → Owes: 50€ (month 4) on next payment attempt

4. After all 10 payments (totalPaid ≥ 500€)
   → Lifetime access (same as one-time)
```

---

## 7. Domain 6: Content Delivery

### Entities
- **Lesson**: Content unit within a class.
- **Video**: Video content within a lesson (Bunny Stream).
- **Document**: File content within a lesson (R2).
- **Upload**: File metadata (R2 key or Bunny GUID).
- **VideoPlayState**: Student watch progress and anti-piracy tracking.

### Invariants

| ID | Invariant |
|----|-----------|
| INV-6.1 | ALL student-facing content endpoints enforce the three-gate check |
| INV-6.2 | Videos stored in Bunny Stream; documents/files in Cloudflare R2 |
| INV-6.3 | Video streaming URLs are HMAC-signed with time expiry |
| INV-6.4 | Teacher, Academy, Admin can CRUD content within their scope |
| INV-6.5 | Student watch time capped at: videoDuration × maxWatchTimeMultiplier (default 2.0) |
| INV-6.6 | Exceeding watch cap → VideoPlayState.status = BLOCKED |
| INV-6.7 | BLOCKED status CAN be unblocked by teacher/academy/admin |
| INV-6.8 | Every 3 suspicious completions → +1 suspicionCount on User |
| INV-6.9 | Watermark (student name) displayed at configurable intervals |
| INV-6.10 | Bunny transcoding failure (status=5) = manual intervention required |
| INV-6.11 | Bunny accepts videos only; documents go to R2 |

### Illegal States
- Student watching video with totalWatchTime > cap AND status ≠ BLOCKED
- Student accessing content without passing all 3 gates
- Video stored in R2 (should be Bunny)
- Document stored in Bunny (should be R2)
- Unsigned/expired video streaming URL granting access

### State Machine: VideoPlayState
```
ACTIVE → COMPLETED   (finished watching)
ACTIVE → BLOCKED     (exceeded watch time cap)
BLOCKED → ACTIVE     (admin/teacher/academy unblocks)
```

### Anti-Piracy Suspicious Detection
```
Video completion reported with ALL FOUR flags true:
  1. watchedFull = true
  2. noPause = true
  3. noTabSwitch = true
  4. realtimeWatch = true
→ Marked as suspicious completion

Every 3rd suspicious completion for the same student:
  → User.suspicionCount += 1
```

---

## 8. Domain 7: Assignments

### Entities
- **Assignment**: Homework/task for a class.
- **AssignmentSubmission**: Student's submitted work (versioned).
- **AssignmentAttachment**: File attachments for assignments.

### Invariants

| ID | Invariant |
|----|-----------|
| INV-7.1 | Assignments belong to exactly ONE class |
| INV-7.2 | Only the assigned teacher, academy owner, or admin can create assignments |
| INV-7.3 | Students must pass three-gate check to view or submit |
| INV-7.4 | NO submissions after dueDate |
| INV-7.5 | Maximum 5 submission versions per (student, assignment) |
| INV-7.6 | Grades CAN be changed after being given |
| INV-7.7 | Assignments do NOT affect enrollment status |
| INV-7.8 | Students can delete their own submission |

### Illegal States
- Submission from unenrolled student
- Submission after dueDate
- 6th submission version for same (student, assignment)
- Student viewing assignment from non-enrolled class

---

## 9. Domain 8: Live Streaming

### Entities
- **LiveStream**: A Zoom live class session.
- **ZoomAccount**: OAuth credentials for Zoom integration.
- **CalendarScheduledEvent**: Pre-scheduled stream with optional physical location.

### Invariants

| ID | Invariant |
|----|-----------|
| INV-8.1 | Zoom is the only streaming provider |
| INV-8.2 | Each class has at most ONE ZoomAccount assigned |
| INV-8.3 | At most ONE active (LIVE) stream per class at any time |
| INV-8.4 | LiveStream statuses: PENDING → LIVE → ENDED (one-way, no reversal) |
| INV-8.5 | Teacher, academy owner, admin can start streams (within their scope) |
| INV-8.6 | Meetings auto-recorded and uploaded to Bunny via Zoom webhook |
| INV-8.7 | Recordings can be linked to lessons; deletable by teacher/academy/admin |
| INV-8.8 | Students with overdue payment CANNOT access live streams or recordings |
| INV-8.9 | Multiple ZoomAccounts per academy allowed (one per class) |
| INV-8.10 | ZoomAccounts created unassigned, then assigned to a class |
| INV-8.11 | CalendarScheduledEvent creates a LiveStream entry when triggered |

### Illegal States
- Two LIVE streams in the same class simultaneously
- LiveStream transitioning from ENDED back to LIVE
- Class with 2+ ZoomAccounts assigned

### State Machine: LiveStream
```
PENDING → LIVE   (meeting.started webhook)
LIVE → ENDED     (meeting.ended webhook)
No reverse transitions.
```

---

## 10. Domain 9: Ratings & Feedback

### Entity: LessonRating

### Invariants

| ID | Invariant |
|----|-----------|
| INV-9.1 | One rating per (studentId, lessonId) — updatable |
| INV-9.2 | Class.feedbackEnabled flag controls whether ratings are available |
| INV-9.3 | Ratings visible to teacher/academy/admin (not other students) |
| INV-9.4 | Rating value: 1-5 integer |

---

## 11. Domain 10: Analytics & Anti-Piracy

### Entities
- **VideoPlayState**: Watch tracking (see Domain 6).
- **LoginEvent**: Geolocation-based login audit.
- **DeviceSession**: Session enforcement (see Domain 1).

### Invariants

| ID | Invariant |
|----|-----------|
| INV-10.1 | suspicionCount stored on User table (NOT enrollment) |
| INV-10.2 | Every 3 suspicious video completions → +1 suspicionCount |
| INV-10.3 | Impossible travel (≥300 km/h between logins) → +1 suspicionCount |
| INV-10.4 | suspicionCount is informational only — no automatic blocking |
| INV-10.5 | LoginEvent is append-only audit log |

---

## 12. Domain 11: Leads

### Entity: Lead

### Invariants

| ID | Invariant |
|----|-----------|
| INV-11.1 | Lead = interested academy from pricing page |
| INV-11.2 | Leads managed externally; admin updates status via leads page |
| INV-11.3 | No automated lead → student/academy conversion |

---

## 13. Domain 12: Platform Admin

### Entities
- **AuditLog**: Admin action tracking.
- **RateLimit**: D1-backed rate limiting tokens.

### Invariants

| ID | Invariant |
|----|-----------|
| INV-12.1 | Exactly ONE admin user exists in the system |
| INV-12.2 | Admin has unrestricted access to all data and operations |
| INV-12.3 | Admin can do anything an academy owner can do (and more) |
| INV-12.4 | AuditLog is append-only (never deleted or edited) |

---

## 14. Cross-Domain Interactions

### 14.1 Payment ↔ Enrollment ↔ Access Control

**Event Flow:**
```
1. Student signs up via academy link
   → User created + ClassEnrollment created

2. Student signs document
   → ClassEnrollment.documentSigned = 1

3. Student initiates payment
   → Payment row created (PENDING)

4. Payment confirmed (manual or webhook)
   → Payment.status = PAID

5. On every content request:
   → enrollment(APPROVED) + documentSigned(1) + !isPaymentOverdue()
```

**Failure Handling:**
- Payment fails (stripe): Payment.status = FAILED, student has no access
- Student never signs document: access blocked even if paid
- Monthly payment lapses: access blocked until next payment

**Atomicity:**
- Payment creation + enrollment update → use `db.batch()` for atomicity
- If payment row created but enrollment update fails → orphan payment (should be cleaned)

**Rollback:**
- Deleting a payment → student loses access (isPaymentOverdue becomes true)
- No automatic rollback of document signing

### 14.2 Stripe Webhook ↔ Database

**Event Order:**
```
1. Student clicks 'Pay with Stripe'
   → Checkout session created + Payment row (PENDING, stripeCheckoutSessionId set)

2. Student completes payment on Stripe

3. checkout.session.completed webhook fires
   → Payment.status = PAID
   → ClassEnrollment updated

4. For monthly: Stripe subscription created
   → invoice.paid fires monthly → new Payment row (PAID)

5. subscription.deleted webhook
   → Creates instantly-overdue PENDING payment
```

**Idempotency:**
- `checkout.session.completed`: skip if Payment with that stripeCheckoutSessionId already PAID
- `invoice.paid`: skip if Payment with that stripePaymentId already exists
- First invoice (`billing_reason = 'subscription_create'`): SKIPPED (handled by checkout)

**Failure Handling:**
- Webhook arrives, DB update fails → Stripe retries (up to 3 times)
- Invalid webhook signature (HMAC) → reject 400, log attempt
- Unknown checkout session → log, return 200 (don't block Stripe retry queue)

**Eventual Consistency:**
- Brief window (seconds) between Stripe charge and webhook arrival is acceptable
- Student may see "payment pending" during this window

### 14.3 Zoom Webhook ↔ LiveStream ↔ Bunny

**Event Flow:**
```
1. Teacher starts meeting → LiveStream created (PENDING)
2. meeting.started webhook → LiveStream.status = LIVE
3. meeting.ended webhook → LiveStream.status = ENDED + participant count
4. recording.completed webhook → Recording downloaded + uploaded to Bunny
5. LiveStream.recordingId = Bunny video GUID
```

**Failure Handling:**
- Zoom signature invalid → reject 400
- Recording upload to Bunny fails → recordingId stays NULL, manual intervention
- meeting.ended before meeting.started → still update to ENDED

**Idempotency:**
- Recording: skip if recordingId already set
- Participant count: skip if participantsFetchedAt already set

### 14.4 Video Watch Tracking ↔ Anti-Sharing

**Event Flow:**
```
1. Student starts watching → VideoPlayState created/resumed
2. Progress reported periodically → totalWatchTimeSeconds updated
3. totalWatchTime > duration × multiplier → status = BLOCKED
4. Completion: check suspicious (noPause + noTabSwitch + watchedFull + realtimeWatch)
5. Suspicious + every 3rd occurrence → User.suspicionCount++
```

---

## 15. State Machines (Complete)

### User
```
[Created] → [Active]
(No other states. No soft-delete.)
```

### DeviceSession
```
[Active] → [Inactive]
(Killed by new login or explicit logout)
```

### Academy
```
[Active] → [Deleted]
(Admin-only. Cascade permanent.)
```

### ClassEnrollment
```
[PENDING] → [APPROVED]   (signup via academy link / payment)
[PENDING] → [REJECTED]   (academy/admin rejects)
[REJECTED] → [APPROVED]  (student pays)
[APPROVED] stays [APPROVED] — access gated by payment+document
```

### Payment (Cash/Bizum)
```
[PENDING] → [PAID]       (academy confirms)
[PAID] → [PENDING]       (academy reverts mistake)
[PENDING] → [FAILED]     (academy rejects)
```

### Payment (Stripe)
```
[PENDING] → [PAID]       (checkout.session.completed)
[PENDING] → [FAILED]     (payment_intent.payment_failed)
[PAID] → [REFUNDED]      (charge.refunded)
No manual transitions.
```

### LiveStream
```
[PENDING] → [LIVE]       (meeting.started webhook)
[LIVE] → [ENDED]         (meeting.ended webhook)
No reverse transitions.
```

### VideoPlayState
```
[ACTIVE] → [COMPLETED]   (finished watching)
[ACTIVE] → [BLOCKED]     (exceeded watch cap)
[BLOCKED] → [ACTIVE]     (admin/teacher/academy unblock)
```

### Lesson
```
[Active] → [Hidden]
[Active] → [Deleted]
[Hidden] → [Active]
```

---

## 16. Idempotency Rules (Complete)

| Context | Deduplication Key | Action on Duplicate |
|---------|-------------------|---------------------|
| Stripe checkout.session.completed | stripeCheckoutSessionId | Skip if Payment already PAID |
| Stripe invoice.paid | stripePaymentId | Skip if Payment already exists |
| Stripe first invoice | billing_reason = 'subscription_create' | Skip entirely (handled by checkout) |
| Cron auto-create pending payments | metadata LIKE '%monthOffset:N%' | Skip if row with matching monthOffset exists |
| Zoom recording webhook | LiveStream.recordingId | Skip if already set (not NULL) |
| Zoom participant count | participantsFetchedAt | Skip if already set |
| Student login (same device) | DeviceSession.deviceFingerprint | Reuse existing session |
| PENDING payment creation | UNIQUE INDEX (payerId, classId) WHERE status='PENDING' | DB rejects duplicate |
| ClassEnrollment creation | UNIQUE (classId, userId) | DB rejects duplicate |

---

## 17. Source-of-Truth Declarations

| Data Point | Source of Truth | NEVER Use |
|------------|----------------|-----------|
| User identity | User table | — |
| Session validity | DeviceSession table + HMAC-signed cookie | Client-side storage |
| Academy ownership | Academy.ownerId | Teacher table |
| Class pricing | Class.monthlyPrice + Class.oneTimePrice | Payment amounts |
| Enrollment status | ClassEnrollment.status | — |
| Document signing | ClassEnrollment.documentSigned | — |
| Payment authority (Stripe) | Stripe webhook events | Manual edits |
| Payment authority (Cash/Bizum) | Payment table (manual) | — |
| Is student paid up? | isPaymentOverdue() query on Payment table | Cached/derived flags |
| Video watch state | VideoPlayState table | Client-reported totals |
| Live stream status | Zoom webhooks → LiveStream table | Client-side state |
| Suspicion level | User.suspicionCount | — |
| File storage location | Upload.storageType ('r2' or 'bunny') | — |

---

*End of System Constitution.*
