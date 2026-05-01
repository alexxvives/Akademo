# AKADEMO Database Schema

## Overview
- **Database**: Cloudflare D1 (SQLite-based)
- **ID**: `65c2951c-acf6-4c1d-8810-4c3d6be18767`
- **Name**: `akademo-db`
- **Last Updated**: April 2026
- **Total tables**: 31

---

## Table Index

| # | Table | Purpose |
|---|---|---|
| 1 | [User](#1-user) | All platform users |
| 2 | [Academy](#2-academy) | Educational institutions |
| 3 | [AcademyBilling](#3-academybilling) | Monthly platform billing |
| 4 | [Teacher](#4-teacher) | Teacher↔Academy assignments |
| 5 | [AcademicYear](#5-academicyear) | Academic year periods |
| 6 | [Class](#6-class) | Courses within an academy |
| 7 | [ClassEnrollment](#7-classenrollment) | Student↔Class enrollment |
| 8 | [Topic](#8-topic) | Class lesson groupings |
| 9 | [Lesson](#9-lesson) | Content units within a class |
| 10 | [Video](#10-video) | Lesson video content |
| 11 | [Upload](#11-upload) | File storage metadata (R2/Bunny) |
| 12 | [Document](#12-document) | Lesson document content |
| 13 | [ArchivedVideo](#13-archivedvideo) | Academy video library |
| 14 | [VideoPlayState](#14-videoplaystate) | Student watch progress |
| 15 | [LessonRating](#15-lessonrating) | Student lesson ratings |
| 16 | [LiveStream](#16-livestream) | Live class sessions (Zoom/Daily) |
| 17 | [Assignment](#17-assignment) | Class assignments & quizzes |
| 32 | [LessonLink](#32-lessonlink) | External links attached to lessons |
| 18 | [AssignmentAttachment](#18-assignmentattachment) | Files attached to assignments |
| 19 | [AssignmentSubmission](#19-assignmentsubmission) | Student assignment submissions |
| 20 | [QuizQuestion](#20-quizquestion) | Quiz questions |
| 21 | [QuizAttempt](#21-quizattempt) | Student quiz attempts |
| 22 | [Payment](#22-payment) | Financial transactions |
| 23 | [CalendarScheduledEvent](#23-calendarscheduledevent) | Calendar events |
| 24 | [DailyTestRoom](#24-dailytestroom) | Daily.co test rooms |
| 25 | [DeviceSession](#25-devicesession) | Active device sessions |
| 26 | [LoginEvent](#26-loginevent) | Login location history |
| 27 | [RateLimit](#27-ratelimit) | API rate limiting |
| 28 | [VerificationCode](#28-verificationcode) | Email verification codes |
| 29 | [Lead](#29-lead) | Sales leads (potential academies) |
| 30 | [ZoomAccount](#30-zoomaccount) | Zoom OAuth accounts |
| 31 | [AuditLog](#31-auditlog) | Admin action audit trail |

---

## Domain Overview

```
User ─────────────────────────┐
 ├── ACADEMY role → Academy.ownerId
 ├── TEACHER role → Teacher.userId → Academy
 └── STUDENT role → ClassEnrollment.userId → Class

Academy
 ├── Teacher (staff)
 ├── Class (courses)
 ├── ZoomAccount (for live classes)
 └── ArchivedVideo (media library)

Class
 ├── Topic (lesson groupings)
 ├── Lesson → Video / Document
 ├── ClassEnrollment (students)
 ├── LiveStream (live sessions)
 └── Assignment → AssignmentSubmission / QuizAttempt
```

---

## Tables

### 1. User

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| email | TEXT | NO | — | UNIQUE |
| password | TEXT | NO | — | bcrypt hashed |
| firstName | TEXT | NO | — | |
| lastName | TEXT | NO | — | |
| role | TEXT | NO | `'STUDENT'` | `ADMIN`, `ACADEMY`, `TEACHER`, `STUDENT` |
| createdAt | TEXT | NO | datetime('now') | |
| lastLoginAt | TEXT | YES | NULL | |
| suspicionCount | INTEGER | YES | 0 | Anti-piracy flag counter |
| suspicionWarning | INTEGER | YES | 0 | 0=none, 1=warned |

**Role semantics**:
- `ADMIN` — Platform superadmin
- `ACADEMY` — Academy owner; linked via `Academy.ownerId`
- `TEACHER` — Works in academy; linked via `Teacher.userId`
- `STUDENT` — Enrolled in classes; linked via `ClassEnrollment.userId`

---

### 2. Academy

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| name | TEXT | NO | — | |
| createdAt | TEXT | NO | — | |
| description | TEXT | YES | NULL | |
| ownerId | TEXT | YES | NULL | FK → User.id (ACADEMY role) |
| paymentStatus | TEXT | YES | `'NOT PAID'` | Platform billing status |
| stripeAccountId | TEXT | YES | NULL | Stripe Connect account |
| address | TEXT | YES | NULL | |
| phone | TEXT | YES | NULL | |
| logoUrl | TEXT | YES | NULL | |
| defaultWatermarkIntervalMins | INTEGER | YES | 5 | |
| defaultMaxWatchTimeMultiplier | REAL | YES | 2.0 | |
| allowedPaymentMethods | TEXT | YES | `'["stripe","cash","bizum"]'` | JSON array |
| allowMultipleTeachers | INTEGER | YES | 0 | 0=single teacher, 1=multi |
| feedbackEnabled | INTEGER | YES | 1 | 0=off, 1=on |
| requireGrading | INTEGER | YES | 1 | 0=off, 1=on |
| hiddenMenuItems | TEXT | YES | `'[]'` | JSON array of hidden nav items |
| restrictStreamAccess | INTEGER | YES | 0 | Restrict live stream to enrolled only |
| dailyEnabled | INTEGER | YES | 0 | Daily.co streaming enabled |
| transferenciaIban | TEXT | YES | NULL | Bank transfer details |
| bizumPhone | TEXT | YES | NULL | Bizum phone number |

---

### 3. AcademyBilling

Monthly platform billing records per academy.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| academyId | TEXT | NO | — | FK → Academy.id |
| month | INTEGER | NO | — | 1–12 |
| year | INTEGER | NO | — | e.g. 2026 |
| studentCount | INTEGER | YES | 0 | |
| enrollmentCount | INTEGER | YES | 0 | |
| teacherCount | INTEGER | YES | 0 | |
| pricePerEnrollment | REAL | YES | 0.0 | |
| notes | TEXT | YES | NULL | |
| paidAt | TEXT | YES | NULL | |
| createdAt | TEXT | YES | datetime('now') | |

**UNIQUE** (academyId, month, year)

---

### 4. Teacher

Links TEACHER-role users to academies.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| userId | TEXT | NO | — | FK → User.id (TEACHER role) |
| academyId | TEXT | NO | — | FK → Academy.id |
| createdAt | TEXT | NO | — | |
| status | TEXT | YES | `'PENDING'` | `PENDING`, `APPROVED` |

> **Note**: Use `Academy.ownerId` to find the academy owner, **not** this table.

---

### 5. AcademicYear

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| academyId | TEXT | NO | — | FK → Academy.id |
| name | TEXT | NO | — | e.g. "2025-2026" |
| startDate | TEXT | NO | — | ISO date |
| endDate | TEXT | YES | NULL | ISO date |
| isCurrent | INTEGER | NO | 1 | 0=past, 1=current |
| createdAt | TEXT | NO | datetime('now') | |

---

### 6. Class

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| name | TEXT | NO | — | |
| slug | TEXT | YES | NULL | URL-friendly identifier |
| description | TEXT | YES | NULL | |
| academyId | TEXT | NO | — | FK → Academy.id |
| teacherId | TEXT | YES | NULL | FK → User.id (TEACHER) |
| createdAt | TEXT | NO | — | |
| whatsappGroupLink | TEXT | YES | NULL | WhatsApp group URL |
| zoomAccountId | TEXT | YES | NULL | FK → ZoomAccount.id |
| monthlyPrice | REAL | YES | NULL | Monthly subscription price |
| oneTimePrice | REAL | YES | NULL | One-time enrollment price |
| startDate | TEXT | YES | NULL | Class start date |
| maxStudents | INTEGER | YES | NULL | Enrollment cap |
| university | TEXT | YES | NULL | Associated university |
| carrera | TEXT | YES | NULL | Degree/program |

---

### 7. ClassEnrollment

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| classId | TEXT | NO | — | FK → Class.id |
| userId | TEXT | NO | — | FK → User.id (STUDENT) |
| status | TEXT | YES | `'PENDING'` | `PENDING`, `APPROVED`, `REJECTED` |
| enrolledAt | TEXT | NO | — | |
| approvedAt | TEXT | YES | NULL | |
| documentSigned | INTEGER | YES | 0 | 0=no, 1=yes |
| paymentFrequency | TEXT | YES | `'ONE_TIME'` | `ONE_TIME`, `MONTHLY` |
| nextPaymentDue | TEXT | YES | NULL | Next billing date |
| stripeSubscriptionId | TEXT | YES | NULL | Stripe subscription ID |

**UNIQUE** (classId, userId)

---

### 8. Topic

Groupings of lessons within a class (like modules/chapters).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | lower(hex(randomblob(16))) | PK |
| name | TEXT | NO | — | |
| classId | TEXT | NO | — | FK → Class.id |
| orderIndex | INTEGER | NO | 0 | Sort order |
| createdAt | TEXT | NO | datetime('now') | |

---

### 9. Lesson

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| title | TEXT | NO | — | |
| description | TEXT | YES | NULL | |
| classId | TEXT | NO | — | FK → Class.id |
| topicId | TEXT | YES | NULL | FK → Topic.id |
| maxWatchTimeMultiplier | REAL | NO | 2.0 | Watch time limit multiplier |
| watermarkIntervalMins | INTEGER | NO | 5 | Watermark display frequency |
| createdAt | TEXT | NO | datetime('now') | |
| releaseDate | TEXT | YES | CURRENT_TIMESTAMP | When lesson becomes visible |

---

### 10. Video

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| title | TEXT | NO | — | |
| lessonId | TEXT | NO | — | FK → Lesson.id |
| uploadId | TEXT | NO | — | FK → Upload.id |
| durationSeconds | INTEGER | YES | NULL | |
| createdAt | TEXT | NO | datetime('now') | |

---

### 11. Upload

Generic file metadata for both R2 and Bunny Stream.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| fileName | TEXT | NO | — | Original filename |
| fileSize | INTEGER | NO | — | Bytes |
| mimeType | TEXT | NO | — | e.g. `video/mp4` |
| storagePath | TEXT | NO | — | R2 key or Bunny path |
| uploadedById | TEXT | NO | — | FK → User.id |
| createdAt | TEXT | NO | datetime('now') | |
| bunnyGuid | TEXT | YES | NULL | Bunny Stream video GUID |
| bunnyStatus | INTEGER | YES | NULL | Bunny transcoding status (0–5) |
| storageType | TEXT | YES | `'r2'` | `'r2'` or `'bunny'` |

**Bunny status codes**: 0=Queued, 1=Processing, 2=Encoding, 3=Finished, 4=Resolution finished, 5=Failed

---

### 12. Document

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| title | TEXT | NO | — | |
| lessonId | TEXT | NO | — | FK → Lesson.id |
| uploadId | TEXT | NO | — | FK → Upload.id |
| createdAt | TEXT | NO | datetime('now') | |

---

### 13. ArchivedVideo

Academy-level video library (not linked to lessons).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| academyId | TEXT | NO | — | FK → Academy.id |
| title | TEXT | NO | — | |
| fileName | TEXT | NO | — | |
| fileSize | INTEGER | YES | NULL | Bytes |
| mimeType | TEXT | YES | `'video/mp4'` | |
| storageKey | TEXT | NO | — | R2 or Bunny path |
| durationSeconds | INTEGER | YES | NULL | |
| uploadedById | TEXT | NO | — | FK → User.id |
| classId | TEXT | YES | NULL | FK → Class.id (optional class tag) |
| className | TEXT | YES | NULL | Denormalized class name |
| createdAt | TEXT | YES | datetime('now') | |

---

### 14. VideoPlayState

Per-student video watch tracking (anti-piracy).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| videoId | TEXT | NO | — | FK → Video.id |
| studentId | TEXT | NO | — | FK → User.id |
| totalWatchTimeSeconds | REAL | NO | 0 | Cumulative seconds |
| lastPositionSeconds | REAL | NO | 0 | Resume position |
| sessionStartTime | TEXT | YES | NULL | |
| lastWatchedAt | TEXT | YES | NULL | |
| createdAt | TEXT | NO | datetime('now') | |
| updatedAt | TEXT | NO | datetime('now') | |
| status | TEXT | NO | `'ACTIVE'` | `ACTIVE`, `COMPLETED`, `BLOCKED` |
| suspiciousCompletion | INTEGER | YES | 0 | Flag for cheating detection |
| completedAt | TEXT | YES | NULL | When video was completed |

**UNIQUE** (videoId, studentId)

---

### 15. LessonRating

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| lessonId | TEXT | NO | — | FK → Lesson.id |
| studentId | TEXT | NO | — | FK → User.id |
| rating | INTEGER | NO | — | 1–5 |
| comment | TEXT | YES | NULL | Optional text feedback |
| isRead | INTEGER | YES | 0 | 0=unread by teacher, 1=read |
| createdAt | TEXT | NO | datetime('now') | |

---

### 16. LiveStream

Live class sessions (Zoom or Daily.co).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| classId | TEXT | NO | — | FK → Class.id |
| teacherId | TEXT | NO | — | FK → User.id |
| status | TEXT | NO | `'PENDING'` | `PENDING`, `LIVE`, `ENDED` |
| title | TEXT | YES | NULL | |
| startedAt | DATETIME | YES | NULL | |
| endedAt | DATETIME | YES | NULL | |
| recordingId | TEXT | YES | NULL | Bunny GUID for recording |
| createdAt | DATETIME | NO | CURRENT_TIMESTAMP | |
| zoomLink | TEXT | YES | NULL | Zoom join URL |
| zoomMeetingId | TEXT | YES | NULL | Zoom meeting ID |
| zoomStartUrl | TEXT | YES | NULL | Zoom host URL |
| zoomPassword | TEXT | YES | NULL | Zoom meeting password |
| participantCount | INTEGER | YES | NULL | From Zoom API |
| participantsFetchedAt | TEXT | YES | NULL | |
| scheduledAt | TEXT | YES | NULL | Scheduled start time |
| calendarEventId | TEXT | YES | NULL | FK → CalendarScheduledEvent.id |
| location | TEXT | YES | NULL | Physical location (if applicable) |
| currentCount | INTEGER | YES | 0 | Live viewer count |
| dailyRoomName | TEXT | YES | NULL | Daily.co room name |
| dailyRoomUrl | TEXT | YES | NULL | Daily.co room URL |

---

### 17. Assignment

Class tasks (file submission or quiz type).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| classId | TEXT | NO | — | FK → Class.id |
| teacherId | TEXT | NO | — | FK → User.id |
| lessonId | TEXT | YES | NULL | FK → Lesson.id (ON DELETE SET NULL) |
| topicId | TEXT | YES | NULL | FK → Topic.id (ON DELETE SET NULL) |
| title | TEXT | NO | — | |
| description | TEXT | YES | NULL | |
| dueDate | TEXT | YES | NULL | ISO 8601 datetime |
| maxScore | REAL | YES | 100 | |
| uploadId | TEXT | YES | NULL | FK → Upload.id (instructions file) |
| attachmentIds | TEXT | YES | `'[]'` | JSON array of Upload IDs |
| solutionUploadId | TEXT | YES | NULL | FK → Upload.id (solution file) |
| type | TEXT | NO | `'file'` | `'file'` or `'quiz'` |
| createdAt | TEXT | NO | datetime('now') | |
| updatedAt | TEXT | NO | datetime('now') | |

---

### 18. AssignmentAttachment

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| assignmentId | TEXT | NO | — | FK → Assignment.id |
| uploadId | TEXT | NO | — | FK → Upload.id |
| createdAt | TEXT | NO | datetime('now') | |

---

### 19. AssignmentSubmission

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| assignmentId | TEXT | NO | — | FK → Assignment.id |
| studentId | TEXT | NO | — | FK → User.id |
| uploadId | TEXT | NO | — | FK → Upload.id |
| version | INTEGER | NO | 1 | Submission version (resubmissions) |
| score | REAL | YES | NULL | Graded score |
| feedback | TEXT | YES | NULL | Teacher feedback |
| submittedAt | TEXT | NO | datetime('now') | |
| gradedAt | TEXT | YES | NULL | |
| gradedBy | TEXT | YES | NULL | FK → User.id (teacher) |
| downloadedAt | TEXT | YES | NULL | When teacher downloaded submission |
| createdAt | TEXT | NO | datetime('now') | |
| updatedAt | TEXT | NO | datetime('now') | |

---

### 20. QuizQuestion

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| assignmentId | TEXT | NO | — | FK → Assignment.id (type='quiz') |
| questionText | TEXT | NO | — | |
| questionOrder | INTEGER | NO | 0 | Sort order |
| options | TEXT | NO | `'[]'` | JSON array: `[{id, text}]` |
| correctOptionId | TEXT | NO | — | ID of correct option |
| explanation | TEXT | YES | NULL | Shown after answering |
| createdAt | TEXT | NO | datetime('now') | |

---

### 21. QuizAttempt

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| assignmentId | TEXT | NO | — | FK → Assignment.id |
| studentId | TEXT | NO | — | FK → User.id |
| score | REAL | YES | NULL | Auto-calculated |
| totalQuestions | INTEGER | NO | 0 | |
| correctAnswers | INTEGER | NO | 0 | |
| answers | TEXT | NO | `'[]'` | JSON: `[{questionId, selectedOptionId, correct}]` |
| completedAt | TEXT | NO | datetime('now') | |
| createdAt | TEXT | NO | datetime('now') | |

---

### 22. Payment

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| type | TEXT | NO | — | `STUDENT_TO_ACADEMY`, `ACADEMY_TO_PLATFORM` |
| payerId | TEXT | NO | — | FK → User.id |
| payerType | TEXT | YES | `'STUDENT'` | `STUDENT`, `ACADEMY` |
| payerName | TEXT | YES | `''` | Denormalized |
| payerEmail | TEXT | YES | `''` | Denormalized |
| receiverId | TEXT | YES | NULL | FK → Academy.id |
| receiverName | TEXT | YES | NULL | Denormalized academy name |
| amount | REAL | NO | — | |
| currency | TEXT | NO | `'USD'` | |
| status | TEXT | NO | `'PENDING'` | `PENDING`, `PAID`, `COMPLETED`, `FAILED`, `REFUNDED` |
| stripePaymentId | TEXT | YES | NULL | |
| stripeCheckoutSessionId | TEXT | YES | NULL | |
| paymentMethod | TEXT | YES | NULL | `cash`, `bizum`, `stripe`, `transferencia` |
| classId | TEXT | YES | NULL | FK → Class.id |
| description | TEXT | YES | NULL | |
| metadata | TEXT | YES | NULL | JSON (enrollmentId, approvedBy, etc.) |
| createdAt | TEXT | NO | datetime('now') | |
| completedAt | TEXT | YES | NULL | |
| nextPaymentDue | TEXT | YES | NULL | For monthly subscriptions |
| billingCycleEnd | TEXT | YES | NULL | |

---

### 23. CalendarScheduledEvent

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| academyId | TEXT | NO | — | FK → Academy.id |
| createdBy | TEXT | NO | — | FK → User.id |
| title | TEXT | NO | — | |
| type | TEXT | NO | — | `physicalClass`, `scheduledStream` |
| eventDate | TEXT | NO | — | ISO date |
| startTime | TEXT | YES | NULL | HH:MM |
| notes | TEXT | YES | NULL | |
| classId | TEXT | YES | NULL | FK → Class.id |
| location | TEXT | YES | NULL | Physical address |
| zoomLink | TEXT | YES | NULL | |
| createdAt | TEXT | YES | datetime('now') | |

---

### 24. DailyTestRoom

Daily.co test/preview rooms.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| roomName | TEXT | NO | — | |
| roomUrl | TEXT | NO | — | Daily.co room URL |
| status | TEXT | NO | `'active'` | `active`, `expired` |
| recordingId | TEXT | YES | NULL | |
| recordingStatus | TEXT | YES | `'none'` | |
| createdAt | TEXT | NO | — | |

---

### 25. DeviceSession

Active device sessions (single-session enforcement per user).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| userId | TEXT | NO | — | FK → User.id |
| deviceFingerprint | TEXT | NO | — | Unique device hash |
| userAgent | TEXT | YES | NULL | |
| ipHash | TEXT | YES | NULL | Hashed IP |
| browser | TEXT | YES | NULL | |
| os | TEXT | YES | NULL | |
| isActive | INTEGER | NO | 1 | 0=inactive, 1=active |
| lastActiveAt | TEXT | NO | datetime('now') | |
| createdAt | TEXT | NO | datetime('now') | |

**UNIQUE** (userId, deviceFingerprint)

---

### 26. LoginEvent

Login history with geolocation.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| userId | TEXT | NO | — | FK → User.id |
| ipAddress | TEXT | YES | NULL | |
| country | TEXT | YES | NULL | |
| city | TEXT | YES | NULL | |
| latitude | REAL | YES | NULL | |
| longitude | REAL | YES | NULL | |
| createdAt | TEXT | NO | — | |

---

### 27. RateLimit

Sliding-window rate limiting counters.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | INTEGER | NO | AUTOINCREMENT | PK |
| key | TEXT | NO | — | e.g. `login:<ip>`, `reset:<email>` |
| windowStart | INTEGER | NO | — | Unix timestamp (seconds) |
| count | INTEGER | NO | 1 | Requests in window |

**UNIQUE** (key, windowStart)

---

### 28. VerificationCode

Email verification / password-reset codes.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| email | TEXT | NO | — | PK |
| code | TEXT | NO | — | 6-digit code |
| expiresAt | TEXT | NO | — | ISO datetime |
| attempts | INTEGER | NO | 0 | Failed attempts |
| createdAt | TEXT | YES | datetime('now') | |

---

### 29. Lead

Sales pipeline for prospective academy customers.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | lower(hex(randomblob(16))) | PK |
| name | TEXT | NO | — | |
| email | TEXT | NO | — | |
| phone | TEXT | YES | NULL | |
| academyName | TEXT | YES | NULL | |
| monthlyEnrollments | TEXT | YES | NULL | Estimated volume |
| teacherCount | TEXT | YES | NULL | |
| subjectCount | TEXT | YES | NULL | |
| message | TEXT | YES | NULL | |
| status | TEXT | NO | `'new'` | `new`, `contacted`, `qualified`, `converted`, `lost` |
| notes | TEXT | YES | NULL | Internal notes |
| createdAt | TEXT | NO | datetime('now') | |
| updatedAt | TEXT | NO | datetime('now') | |

---

### 30. ZoomAccount

Zoom OAuth accounts linked to academies.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | — | PK |
| academyId | TEXT | NO | — | FK → Academy.id |
| accountName | TEXT | NO | — | Display name |
| accessToken | TEXT | NO | — | OAuth access token |
| refreshToken | TEXT | NO | — | OAuth refresh token |
| expiresAt | TEXT | NO | — | Token expiry (ISO datetime) |
| accountId | TEXT | NO | — | Zoom account ID |
| provider | TEXT | YES | `'zoom'` | `'zoom'` or `'daily'` |
| createdAt | TEXT | NO | datetime('now') | |
| updatedAt | TEXT | NO | datetime('now') | |

---

### 31. AuditLog

Admin action audit trail. **Pending migration 0006 — not yet applied.**

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | INTEGER | NO | AUTOINCREMENT | PK |
| actorId | TEXT | NO | — | FK → User.id |
| actorRole | TEXT | NO | — | Role at time of action |
| action | TEXT | NO | — | e.g. `DELETE_USER`, `APPROVE_ENROLLMENT` |
| targetType | TEXT | YES | NULL | e.g. `User`, `Class` |
| targetId | TEXT | YES | NULL | ID of affected entity |
| meta | TEXT | YES | NULL | JSON extra context |
| ip | TEXT | YES | NULL | Request IP |
| createdAt | TEXT | NO | datetime('now') | |

---

### 32. LessonLink

External links (URLs) attached to a lesson.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | TEXT | NO | lower(hex(randomblob(16))) | PK |
| lessonId | TEXT | NO | — | FK → Lesson.id (ON DELETE CASCADE) |
| title | TEXT | NO | — | Display name for the link |
| url | TEXT | NO | — | Must be http or https |
| orderIndex | INTEGER | NO | 0 | Sort order |
| createdAt | TEXT | NO | datetime('now') | |

**Index**: `idx_lessonlink_lessonid` on `lessonId`

---

## Key Relationships

```sql
-- Academy owner
SELECT * FROM Academy WHERE ownerId = :userId

-- Teacher's academies
SELECT a.* FROM Academy a
JOIN Teacher t ON t.academyId = a.id
WHERE t.userId = :userId AND t.status = 'APPROVED'

-- Student's approved classes
SELECT c.* FROM Class c
JOIN ClassEnrollment e ON e.classId = c.id
WHERE e.userId = :userId AND e.status = 'APPROVED'

-- All lessons in academy
SELECT l.* FROM Lesson l
JOIN Class c ON l.classId = c.id
JOIN Academy a ON c.academyId = a.id
WHERE a.ownerId = :userId

-- Teacher's classes
SELECT * FROM Class WHERE teacherId = :userId AND academyId = :academyId
```

---

## Notes

1. **ACADEMY vs TEACHER roles**:
   - `ACADEMY` users own academies — identified via `Academy.ownerId`
   - `TEACHER` users work in academies — identified via `Teacher.userId`
   - The `Teacher` table is **never** used for academy owners

2. **Video storage**:
   - Videos → Bunny Stream (`Upload.storageType = 'bunny'`, `Upload.bunnyGuid` set)
   - Documents → R2 (`Upload.storageType = 'r2'`)

3. **Zoom webhook**:
   - Registered URL: `https://akademo-api.alexxvives.workers.dev/webhooks/zoom`
   - Handler: `workers/akademo-api/src/routes/webhooks.ts`

4. **Missing tables once applied**:
   - `AuditLog` — requires running `migrations/0006_audit_log.sql`
