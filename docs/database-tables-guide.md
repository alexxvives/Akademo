# AKADEMO Database Tables — Purpose & Usage Guide

**Database**: Cloudflare D1 (SQLite)  
**Name**: `akademo-db`  
**Last Audit**: June 2026  
**Active Tables**: 26 (+ 4 dropped)

This document explains what each table does, why it exists, and how it connects to the rest of the system.

---

## 1. `User`

**What it is**: The single source of truth for every person using the platform.

**Why it exists**: All four roles (admin, academy owner, teacher, student) share the same login system and same table. Role is a discriminator column that determines what they can do.

**How it's used**:
- Every login creates/checks a row here
- `role` decides which dashboard they see (`/dashboard/academy`, `/dashboard/teacher`, etc.)
- `lastLoginAt` is updated on every successful login
- Referenced by virtually every other table as `userId`, `ownerId`, `teacherId`, etc.

**Important**: A user with `role = 'ACADEMY'` is linked to the `Academy` table via `Academy.ownerId`. A user with `role = 'TEACHER'` is linked via the `Teacher` join table. These are two different things.

---

## 2. `Academy`

**What it is**: An educational institution on the platform.

**Why it exists**: AKADEMO is multi-tenant — multiple academies can exist. Each academy has its own classes, teachers, and students.

**How it's used**:
- Created when an academy owner signs up
- `ownerId` points to the User with `role = 'ACADEMY'` who manages it
- `status` (PENDING / APPROVED / REJECTED) controls whether admin has approved the academy to be active on the platform
- Every `Class`, `Teacher`, and `Payment` links back to an `Academy`

**Key relationship**: `Academy.ownerId → User.id`

---

## 3. `Teacher`

**What it is**: A join table connecting a TEACHER-role user to an academy.

**Why it exists**: Teachers don't own academies — they work *within* one. This table records that relationship. A teacher can theoretically work in multiple academies (one row per academy).

**How it's used**:
- Created when a teacher account logs in for the first time via an invite link
- `academyId` tells the backend which academy's data to show the teacher
- `defaultMaxWatchTimeMultiplier` (default 2.0) sets how much watch time a student is allowed per video in this teacher's classes (anti-piracy: can watch up to `2× video duration`)
- `monoacademy` flag indicates the teacher only belongs to one academy

**`status` column** — see "Known Issues" section below.

---

## 4. `Class`

**What it is**: A course or subject within an academy (e.g., "Matemáticas 2º Bachillerato").

**Why it exists**: An academy has multiple classes. Each class has its own students, lessons, and Zoom account.

**How it's used**:
- Created by academy owners or teachers
- `teacherId` assigns a specific teacher as responsible for this class
- `slug` is used in shareable invite URLs (`/join/[slug]`)
- `zoomAccountId` assigns one of the academy's Zoom accounts to this class (so concurrent classes use different Zoom hosts)
- Students enroll in a class via `ClassEnrollment`
- Lessons, live streams, and assignments all belong to a class

---

## 5. `ClassEnrollment`

**What it is**: Records which students are enrolled in which classes, and whether the enrollment is approved.

**Why it exists**: Enrollment isn't automatic — a student requests to join, and the academy/teacher approves or rejects it. This table tracks that state machine.

**How it's used**:
- Created when a student clicks an invite link or joins via explore
- `status` goes PENDING → APPROVED or REJECTED
- `paymentFrequency` (ONE_TIME or MONTHLY) determines billing behavior
- `nextPaymentDue` is set for monthly enrollments to know when to expect the next payment
- Used in nearly every query to gate what content a student can see (`... AND e.status = 'APPROVED'`)

**UNIQUE constraint**: `(classId, userId)` — a student can only enroll once per class.

---

## 6. `Lesson`

**What it is**: A unit of content within a class (e.g., "Tema 3: Derivadas").

**Why it exists**: Classes are organized into lessons. Each lesson groups together videos, documents, and a rating.

**How it's used**:
- Created by teachers inside a class
- `releaseDate` controls when the lesson becomes visible to students (scheduled release)
- `maxWatchTimeMultiplier` (default 2.0) is per-lesson override of watch-time limit
- `watermarkIntervalMins` (default 5) controls how often the anti-piracy watermark with the student's name appears
- Students can rate lessons (→ `LessonRating`)

---

## 7. `Video`

**What it is**: A video file linked to a lesson.

**Why it exists**: A lesson can have multiple videos. This table links the lesson to the actual file metadata stored in `Upload`.

**How it's used**:
- Created when a teacher uploads a video to a lesson
- `uploadId` → `Upload.id` which contains the Bunny Stream GUID and storage path
- `durationSeconds` is fetched from Bunny after transcoding completes
- Watch progress is tracked per student via `VideoPlayState`

---

## 8. `Document`

**What it is**: A non-video file (PDF, slides, etc.) linked to a lesson.

**Why it exists**: Teachers attach documents to lessons alongside videos (e.g., lecture slides, problem sets).

**How it's used**:
- Created when a teacher uploads a document to a lesson
- `uploadId` → `Upload.id` — stored in Cloudflare R2 (not Bunny)
- No watch-time tracking (documents are not protected the same way as videos)

---

## 9. `Upload`

**What it is**: Metadata for every uploaded file, regardless of whether it's a video or document.

**Why it exists**: Videos and documents are stored in different places (Bunny Stream for videos, R2 for documents). This table is the single abstraction layer over both storage systems.

**How it's used**:
- Every video and document has one row here
- `storageType` = `'bunny'` for videos, `'r2'` for documents
- `bunnyGuid` stores the Bunny Stream video ID (used for playback and management)
- `bunnyStatus` tracks transcoding progress (0=Queued → 3=Finished → 5=Failed)
- `storagePath` is the R2 key for documents, or Bunny's internal path for videos
- When a student watches a video, the player calls Bunny APIs using `bunnyGuid`

---

## 10. `LiveStream`

**What it is**: A record of a live class session (Zoom meeting).

**Why it exists**: Every time a teacher starts a Zoom class, it needs to be recorded in the DB so students know it's happening, so it can be notified, and so the recording can be saved afterward.

**How it's used**:
- Created when a teacher starts a class from the AKADEMO platform (either via manual start or calendar event)
- `status` goes PENDING → LIVE → ENDED
- `zoomMeetingId`, `zoomLink`, `zoomStartUrl` are set when the Zoom meeting is created via the Zoom API
- When the meeting ends, the `recording.completed` webhook fires and sets `recordingId` to the Bunny Stream GUID
- `participantCount` and `participantsData` are populated from the Zoom API after the meeting ends
- Students see live streams in their `/dashboard/student/live` page

---

## 11. `LessonRating`

**What it is**: A student's 1–5 star rating for a lesson.

**Why it exists**: Teachers and academy owners use ratings to understand which lessons are working well and which need improvement.

**How it's used**:
- One row per (student, lesson) pair — UNIQUE constraint
- Ratings aggregate to an average shown on the teacher dashboard
- Optional `comment` field allows students to leave written feedback
- Only APPROVED enrolled students can rate lessons they've watched

---

## 12. `VideoPlayState`

**What it is**: Tracks how much of each video each student has watched.

**Why it exists**: Two reasons — (1) anti-piracy: block a student from watching a video more than `maxWatchTimeMultiplier × duration` (prevents screen recording loops), and (2) resume: students can pick up where they left off.

**How it's used**:
- Created/updated every few seconds while a student watches a video
- `totalWatchTimeSeconds` accumulates — when it exceeds `maxWatchTimeMultiplier × durationSeconds`, the video is blocked
- `lastPositionSeconds` is sent back to the player as a resume point
- `status` = ACTIVE (watching), COMPLETED (finished), BLOCKED (exceeded limit)
- `suspiciousCompletionCount` (migration 0083) counts times the video was completed faster than real-time, flagging potential screen recording

---

## 13. `DeviceSession`

**What it is**: Tracks active login sessions per device.

**Why it exists**: Anti-piracy. Students should not be able to share their accounts. The platform enforces single-device-at-a-time logins.

**How it's used**:
- Created when a user logs in
- `deviceFingerprint` is a hash of browser/OS/screen characteristics
- If a user logs in from a second device, the first `DeviceSession` is marked `isActive = 0` (kicked out)
- `lastActiveAt` is updated periodically to detect stale sessions
- `ipHash` and `browser`/`os` are stored for audit purposes but not used for enforcement

---

## 14. `Payment`

**What it is**: A record of every financial transaction on the platform.

**Why it exists**: Academies need to track what students have paid, and the platform needs to track what academies have paid for their subscription. This is the single source of truth for all money movement.

**How it's used**:
- `STUDENT_TO_ACADEMY`: created when a student pays an enrollment fee (cash, Stripe, Bizum, PayPal)
- `ACADEMY_TO_PLATFORM`: created when an academy pays their monthly platform fee (future use)
- `stripePaymentId` / `stripeCheckoutSessionId` are only set for Stripe payments
- `paymentMethod` can be `cash`, `bizum`, `stripe`, or `paypal`
- `classId` links the payment to a specific class enrollment
- `metadata` (JSON) stores `enrollmentId`, `approvedBy`, `approvedAt` for audit trail
- Academy owner sees all student payments in `/dashboard/academy/payments`
- Admin sees all payments across all academies in `/dashboard/admin/pagos`

---

## 15. `Topic`

**What it is**: A grouping/folder for lessons within a class (e.g., "Unit 1: Algebra").

**Why it exists**: Classes can have many lessons. Topics let teachers organize lessons into logical units that students can navigate.

**How it's used**:
- Created by teachers inside a class
- Each topic belongs to a single class (`classId`)
- `orderIndex` controls display order (drag & drop reordering supported)
- Lessons reference `topicId` to belong to a topic (nullable — lessons can exist without a topic)
- When a topic is deleted, all its lessons have `topicId` set to NULL (they become ungrouped)

**Created in**: `0013_topics.sql`  
**Route files**: `topics.ts`, `lessons.ts`, `classes.ts`, `ratings.ts`

---

## 16. `VerificationCode`

**What it is**: Temporary codes used for email verification and password reset.

**Why it exists**: When a user registers or resets their password, a code is emailed to them. This table stores those codes with expiry.

**How it's used**:
- Created in `auth.ts` when a user requests a verification or password reset
- `code` is a short alphanumeric code sent via email
- `expiresAt` prevents stale codes from being reused
- Codes are deleted after successful verification

**Created in**: `0013_verification_codes.sql`  
**Route files**: `auth.ts`

---

## 17. `AcademicYear`

**What it is**: Defines academic year periods for an academy (e.g., "2025-2026").

**Why it exists**: Academies operate on academic year cycles. This lets them segment data, enrollments, and billing by year.

**How it's used**:
- Created by academy owners
- `isCurrent` flag marks the active year (only one can be current at a time)
- `startDate` / `endDate` define the year boundaries
- When setting a new current year, all others for that academy are set to `isCurrent = 0`

**Created in**: `0023_academic_year.sql`  
**Route files**: `academic-years.ts`

---

## 18. `ZoomAccount`

**What it is**: Zoom OAuth credentials for academy Zoom accounts.

**Why it exists**: Each academy can have multiple Zoom accounts to support concurrent live classes (each Zoom account can only host one meeting at a time).

**How it's used**:
- Created when an academy owner connects a Zoom account via OAuth flow
- `accessToken` and `refreshToken` are used to create/manage Zoom meetings
- `expiresAt` tracks token expiry for automatic refresh
- `accountEmail` identifies which Zoom account it is
- Classes are assigned a `zoomAccountId` so separate classes can have concurrent live streams
- Used in `live.ts`, `webhooks.ts`, `zoom.ts`, `zoom-accounts.ts`, `calendar-events.ts`

**Created in**: `0024_zoom_accounts.sql`  
**Route files**: `zoom-accounts.ts`, `zoom.ts`, `live.ts`, `webhooks.ts`, `calendar-events.ts`, `admin.ts`

---

## 19. `Assignment`

**What it is**: A homework or task assigned to students in a class.

**Why it exists**: Teachers need to assign work beyond video lessons. Assignments have titles, descriptions, due dates, and can accept file submissions.

**How it's used**:
- Created by teachers inside a class
- `dueDate` controls deadlines
- `classId` links it to a class
- Students submit work via `AssignmentSubmission`
- Can have file attachments via `AssignmentAttachment`

**Created in**: `0043_add_assignments.sql`  
**Route files**: `assignments.ts`, `classes.ts`

---

## 20. `AssignmentSubmission`

**What it is**: A student's submission for an assignment.

**Why it exists**: Students need to turn in assignments. Each submission is tied to a student and an assignment.

**How it's used**:
- Created when a student submits work for an assignment
- `status` tracks submission state (e.g., SUBMITTED, GRADED)
- `grade` stores the teacher's grade
- `feedback` stores teacher's written feedback
- Can have file attachments via `AssignmentAttachment`

**Created in**: `0043_add_assignments.sql`  
**Route files**: `assignments.ts`, `classes.ts`

---

## 21. `AssignmentAttachment`

**What it is**: File attachments for assignments or submissions.

**Why it exists**: Both assignment descriptions and student submissions can have file attachments (PDFs, images, etc.).

**How it's used**:
- Links to `uploadId` → `Upload.id` for the actual file
- Can belong to an `assignmentId` (teacher attachment) or `submissionId` (student attachment)
- Stored in R2 via the Upload system

**Created in**: `0045_assignment_attachments_table.sql`  
**Route files**: `assignments.ts`, `classes.ts`

---

## 22. `CalendarScheduledEvent`

**What it is**: A scheduled calendar event (usually a scheduled live class).

**Why it exists**: Teachers and academy owners can schedule live classes in advance. This stores the calendar event separately from the live stream so it can exist before the stream starts.

**How it's used**:
- Created when a teacher schedules a future live class from the calendar
- Linked to `LiveStream` when the scheduled time arrives and the stream is created
- `eventType` identifies the kind of event
- `startTime` / `endTime` define the scheduled window
- Can be recurring or one-off
- Updated when the associated live stream is edited or deleted

**Created in**: `0046_calendar_scheduled_events.sql`  
**Route files**: `calendar-events.ts`, `live.ts`, `webhooks.ts`

---

## 23. `LoginEvent`

**What it is**: Audit log of every login attempt.

**Why it exists**: Security tracking. Records when users log in, from where, and whether it succeeded.

**How it's used**:
- Created on every login attempt (success or failure)
- Stores IP hash, user agent, browser, OS for auditing
- Used by admin to investigate suspicious login patterns

**Created in**: `0071_login_events.sql`  
**Route files**: `auth.ts`

---

## 24. `Lead`

**What it is**: Sales lead from the public pricing/contact page.

**Why it exists**: Prospective academy owners can submit interest from the marketing site. This table stores their contact info for follow-up.

**How it's used**:
- Created via a public (no-auth) POST endpoint when someone fills out the pricing form
- `status` tracks lead lifecycle (NEW → CONTACTED → CONVERTED, etc.)
- `notes` field for admin follow-up comments
- Admin can view, update status, and delete leads from the admin dashboard

**Created in**: `0073_leads_table.sql`  
**Route files**: `leads.ts`

---

## 25. `AcademyBilling`

**What it is**: Monthly billing records for what each academy owes the platform.

**Why it exists**: The platform charges academies based on enrollment/student counts. This table tracks each month's billing data.

**How it's used**:
- Created by admin for each academy per month
- `studentCount`, `enrollmentCount`, `teacherCount` can be auto-filled from DB counts
- `pricePerEnrollment` × `enrollmentCount` = monthly charge
- `paidAt` records when the academy paid
- UNIQUE constraint on `(academyId, month, year)` — one record per academy per month
- Managed from the admin billing dashboard

**Created in**: `0077_academy_billing.sql`  
**Route files**: `admin.ts`

---

## 26. `RateLimit`

**What it is**: Token-bucket rate limiting records.

**Why it exists**: Protects sensitive endpoints (login, password reset, payment creation, explore) from abuse/brute-force attacks.

**How it's used**:
- Keyed by a composite key (e.g., `login:user@email.com`, `payment:userId`)
- `tokens` decrements on each request; when 0, the request is rejected
- `lastRefill` tracks when tokens were last replenished
- Used via `checkRateLimit()` in `lib/rate-limit.ts`
- Applied to: auth endpoints, payment creation, explore API, video streaming

**Created in**: `0088_rate_limit_table.sql`  
**Route files**: `auth.ts` (direct INSERT), plus any route using `checkRateLimit()` from `lib/rate-limit.ts`

---

## 27. `AuditLog`

**What it is**: Security audit trail for sensitive admin actions.

**Why it exists**: Platform needs a record of who did what for compliance and debugging. Tracks admin actions like approvals, deletions, and billing changes.

**How it's used**:
- Written via `writeAuditLog()` in `lib/audit.ts`
- `action` describes what happened (e.g., `APPROVE_ACADEMY`, `DELETE_USER`, `CREATE_BILLING`)
- `actorId` / `actorEmail` identify who performed the action
- `targetType` / `targetId` identify what was acted on
- `details` stores JSON with before/after state or extra context
- Admin can query logs with filters from the admin dashboard

**Created in**: `0089_audit_log_table.sql`  
**Route files**: `admin.ts`, `approvals.ts`

---

## Tables That No Longer Exist

| Table | Dropped in | Was replaced by |
|-------|-----------|----------------|
| `AcademyMembership` | `0010_restructure_database_corrected.sql` | `Teacher` table |
| `PlatformSettings` | `0006_cleanup_schema.sql` | Environment variables in `wrangler.toml` |
| `BillingConfig` | `0006_cleanup_schema.sql` | Never fully implemented, removed |
| `Notification` | `0085_drop_notification_table.sql` | Dropped (was for in-app notifications). **Note**: `classes.ts` still has a stale DELETE reference to this table. |

---

## Route File → Table Matrix

| Route File | Tables Used |
|------------|-------------|
| `academic-years.ts` | AcademicYear, Academy, Teacher |
| `academies.ts` | Academy, User, Teacher, Class, ClassEnrollment, Lesson, Video, Document, LessonRating, Payment |
| `admin.ts` | Academy, Payment, Class, Lesson, User, ZoomAccount, ClassEnrollment, LessonRating, VideoPlayState, Teacher, LiveStream, DeviceSession, AcademyBilling, AuditLog, Video, Document |
| `analytics.ts` | Academy, User, Class, Lesson, ClassEnrollment, VideoPlayState |
| `approvals.ts` | ClassEnrollment, AuditLog (via writeAuditLog) |
| `assignments.ts` | Assignment, AssignmentSubmission, AssignmentAttachment, Class, Academy, ClassEnrollment, Upload |
| `auth.ts` | User, DeviceSession, LoginEvent, VerificationCode, RateLimit, Academy, ClassEnrollment, Class |
| `bunny.ts` | Video, Upload, ClassEnrollment |
| `calendar-events.ts` | CalendarScheduledEvent, LiveStream, ZoomAccount, Class, Academy, Teacher, ClassEnrollment |
| `classes.ts` | Class, ClassEnrollment, Lesson, Video, Document, LessonRating, Assignment, AssignmentSubmission, AssignmentAttachment, Topic, Payment, Notification (stale), LiveStream, Academy, Teacher |
| `documents.ts` | Document, Lesson, ClassEnrollment, Class, Academy |
| `enrollments.ts` | ClassEnrollment, Class, Payment |
| `explore.ts` | Academy, Class, Teacher, User, ClassEnrollment, LiveStream, RateLimit (via exploreRateLimit) |
| `leads.ts` | Lead |
| `lessons.ts` | Lesson, Video, Document, Upload, VideoPlayState, LessonRating, Class, Academy, ClassEnrollment, Topic, LiveStream |
| `live.ts` | LiveStream, ClassEnrollment, Class, Academy, ZoomAccount, Teacher, Lesson, Upload, Video, CalendarScheduledEvent |
| `payments.ts` | Payment, Class, Academy, User, ClassEnrollment, RateLimit (via checkRateLimit) |
| `ratings.ts` | LessonRating, Lesson, Class, ClassEnrollment, Academy, Topic |
| `requests.ts` | Class, ClassEnrollment, Teacher |
| `storage.ts` | Upload, ClassEnrollment, Class, Academy |
| `student-payments.ts` | Class, Academy, ClassEnrollment, Payment |
| `students.ts` | User, Payment, Class, ClassEnrollment |
| `topics.ts` | Topic, Class, ClassEnrollment, Lesson, Academy |
| `users.ts` | User, Class, Academy, ClassEnrollment, Teacher, Video, Document, LessonRating, VideoPlayState, LiveStream |
| `videos.ts` | Video, Lesson, Class, Academy, ClassEnrollment, VideoPlayState, Upload, User, RateLimit (via checkRateLimit) |
| `webhooks.ts` | LiveStream, CalendarScheduledEvent, ZoomAccount, Academy, Class, ClassEnrollment, User, Payment, Upload |
| `zoom.ts` | LiveStream, ClassEnrollment, Class, Academy |
| `zoom-accounts.ts` | ZoomAccount, Academy, Class |

---

## Quick Reference: Who queries what

| Role | Primary tables queried |
|------|----------------------|
| Student | `ClassEnrollment`, `Lesson`, `Video`, `VideoPlayState`, `LiveStream`, `Payment`, `Assignment`, `AssignmentSubmission`, `Topic`, `CalendarScheduledEvent` |
| Teacher | `Class`, `Lesson`, `Video`, `ClassEnrollment`, `LiveStream`, `LessonRating`, `Assignment`, `AssignmentSubmission`, `AssignmentAttachment`, `Topic`, `CalendarScheduledEvent`, `Upload` |
| Academy owner | All teacher tables + `Teacher`, `Academy`, `Payment`, `ZoomAccount`, `AcademicYear` |
| Admin | All tables, especially `User`, `Academy`, `Payment`, `Lead`, `AcademyBilling`, `AuditLog`, `ZoomAccount` |

---

## Known Issues / Tech Debt

### `Teacher.status` — exists but is NOT enforced
- Added in migration `0015_add_approval_status_columns.sql` (PENDING / APPROVED / REJECTED)
- **Intention**: Academy owners would need to approve teachers before they could log in
- **Reality**: The column is SET to `'PENDING'` on insert but NEVER CHECKED in any auth or data query
- **Result**: All teachers can log in and access all data regardless of their `status` value
- **Fix if needed**: Add `AND t.status = 'APPROVED'` to the Teacher lookup in `auth.ts` line 44

### Tutorial seen status — stored in localStorage, NOT the database
- Key: `akademo_teacher_tutorial_v1`
- **Consequence**: If a teacher clears browser storage or logs in from another device/browser, they will see the tutorial again
- **Fix if needed**: Add a `tutorialSeenAt` TEXT column to the `Teacher` table + a `PATCH /teacher/tutorial-seen` endpoint, then check it on mount in `TeacherTutorial.tsx` instead of localStorage
