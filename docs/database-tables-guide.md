# AKADEMO Database Tables — Purpose & Usage Guide

**Database**: Cloudflare D1 (SQLite)  
**Name**: `akademo-db`

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

## 13. `Notification`

**What it is**: In-app notifications sent to users.

**Why it exists**: Users need to know about events (class starting, payment approved, enrollment approved, etc.) without having to check every page.

**How it's used**:
- Created by backend API calls when events happen (e.g., live stream starts → notify all enrolled students)
- `type` categorizes the notification (`live_class`, `enrollment_approved`, `payment_received`, etc.)
- `isRead` toggles from 0 to 1 when the user opens the notification
- `data` is a JSON blob with extra context (e.g., `{"streamId": "...", "classId": "..."}`)
- The UI polls for unread notifications and shows a badge count

---

## 14. `DeviceSession`

**What it is**: Tracks active login sessions per device.

**Why it exists**: Anti-piracy. Students should not be able to share their accounts. The platform enforces single-device-at-a-time logins.

**How it's used**:
- Created when a user logs in
- `deviceFingerprint` is a hash of browser/OS/screen characteristics
- If a user logs in from a second device, the first `DeviceSession` is marked `isActive = 0` (kicked out)
- `lastActiveAt` is updated periodically to detect stale sessions
- `ipHash` and `browser`/`os` are stored for audit purposes but not used for enforcement

---

## 15. `Payment`

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

## Tables That No Longer Exist

| Table | Was replaced by |
|-------|----------------|
| `AcademyMembership` | `Teacher` table (migration 0010) |
| `PlatformSettings` | Environment variables in `wrangler.toml` |
| `BillingConfig` | Never fully implemented, removed |

---

## Quick Reference: Who queries what

| Role | Primary tables queried |
|------|----------------------|
| Student | `ClassEnrollment`, `Lesson`, `Video`, `VideoPlayState`, `LiveStream`, `Payment`, `Notification` |
| Teacher | `Class`, `Lesson`, `Video`, `ClassEnrollment`, `LiveStream`, `LessonRating`, `Assignment` |
| Academy owner | All teacher tables + `Teacher`, `Academy`, `Payment`, `Notification` |
| Admin | All tables, especially `User`, `Academy`, `Payment`, `Lead` |

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
