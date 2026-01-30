# AKADEMO Database Schema

## Overview
- **Database**: Cloudflare D1 (SQLite-based)
- **ID**: `65c2951c-acf6-4c1d-8810-4c3d6be18767`
- **Name**: `akademo-db`
- **Last Updated**: January 2026

---

## Core Tables (15 tables)

### 1. **User**
Central user table for all roles.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | NO | - | PK |
| email | TEXT | NO | - | UNIQUE |
| password | TEXT | NO | - | Bcrypt hashed |
| firstName | TEXT | NO | - | |
| lastName | TEXT | NO | - | |
| role | TEXT | NO | 'STUDENT' | ADMIN, ACADEMY, TEACHER, STUDENT |
| createdAt | TEXT | NO | datetime('now') | |
| updatedAt | TEXT | NO | datetime('now') | |
| lastLoginAt | TEXT | YES | - | Last login timestamp |

**Roles:**
- `ADMIN` - Platform administrator
- `ACADEMY` - Academy owner (can create academies, manage classes)
- `TEACHER` - Works within an academy (assigned to classes)
- `STUDENT` - Enrolls in classes

---

### 2. **Academy**
Educational institutions.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | YES | - | PK |
| name | TEXT | NO | - | |
| createdAt | TEXT | NO | - | |
| updatedAt | TEXT | NO | - | |
| description | TEXT | YES | - | |
| ownerId | TEXT | YES | - | FK → User.id (ACADEMY role) |

**Important**: `ownerId` links to a user with role=ACADEMY. This is how we identify who owns an academy.

---

### 3. **Teacher**
Links teachers (TEACHER role users) to academies they work in.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | YES | - | PK |
| userId | TEXT | NO | - | FK → User.id (TEACHER role) |
| academyId | TEXT | NO | - | FK → Academy.id |
| defaultMaxWatchTimeMultiplier | REAL | YES | 2.0 | |
| createdAt | TEXT | NO | - | |
| updatedAt | TEXT | NO | - | |

**Important**: This table is for TEACHER role users only. Academy owners are identified via `Academy.ownerId`, NOT via this table.

---

### 4. **Class**
Courses within an academy.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | YES | - | PK |
| name | TEXT | NO | - | |
| slug | TEXT | YES | - | UNIQUE, URL-friendly |
| description | TEXT | YES | - | |
| academyId | TEXT | NO | - | FK → Academy.id |
| teacherId | TEXT | YES | - | FK → User.id (the assigned teacher) |
| zoomAccountId | TEXT | YES | - | FK → ZoomAccount.id (assigned Zoom account for live classes) |
| createdAt | TEXT | NO | - | |
| updatedAt | TEXT | NO | - | |

---

### 5. **ClassEnrollment**
Student enrollment in classes.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | YES | - | PK |
| classId | TEXT | NO | - | FK → Class.id |
| userId | TEXT | NO | - | FK → User.id (student) |
| status | TEXT | YES | 'PENDING' | PENDING, APPROVED, REJECTED |
| enrolledAt | TEXT | NO | - | When enrollment was requested |
| approvedAt | TEXT | YES | - | When approved |
| paymentFrequency | TEXT | NO | 'ONE_TIME' | ONE_TIME or MONTHLY |
| nextPaymentDue | TEXT | YES | - | Next payment date (for monthly) |
| createdAt | TEXT | NO | - | |
| updatedAt | TEXT | NO | - | |

**UNIQUE constraint**: (classId, userId)

---

### 6. **Lesson**
Content units within a class.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | NO | - | PK |
| title | TEXT | NO | - | |
| description | TEXT | YES | - | |
| classId | TEXT | NO | - | FK → Class.id |
| maxWatchTimeMultiplier | REAL | NO | 2.0 | Watch time limit |
| watermarkIntervalMins | INTEGER | NO | 5 | Watermark frequency |
| createdAt | TEXT | NO | datetime('now') | |
| updatedAt | TEXT | NO | datetime('now') | |
| releaseDate | TEXT | YES | CURRENT_TIMESTAMP | When lesson becomes available |

---

### 7. **Video**
Video content linked to lessons.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | NO | - | PK |
| title | TEXT | NO | - | |
| lessonId | TEXT | NO | - | FK → Lesson.id |
| uploadId | TEXT | NO | - | FK → Upload.id |
| durationSeconds | INTEGER | YES | - | Video length |
| createdAt | TEXT | NO | datetime('now') | |
| updatedAt | TEXT | NO | datetime('now') | |

---

### 8. **Document**
Document files linked to lessons.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | NO | - | PK |
| title | TEXT | NO | - | |
| lessonId | TEXT | NO | - | FK → Lesson.id |
| uploadId | TEXT | NO | - | FK → Upload.id |
| createdAt | TEXT | NO | datetime('now') | |
| updatedAt | TEXT | NO | datetime('now') | |

---

### 9. **Upload**
Generic file storage metadata (for R2 or Bunny Stream).

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | NO | - | PK |
| fileName | TEXT | NO | - | Original filename |
| fileSize | INTEGER | NO | - | Size in bytes |
| mimeType | TEXT | NO | - | MIME type |
| storagePath | TEXT | NO | - | R2 key or Bunny path |
| uploadedById | TEXT | NO | - | FK → User.id |
| createdAt | TEXT | NO | datetime('now') | |
| bunnyGuid | TEXT | YES | - | Bunny Stream video GUID |
| bunnyStatus | INTEGER | YES | NULL | 0-5 Bunny transcoding status |
| storageType | TEXT | YES | 'r2' | 'r2' or 'bunny' |

**Bunny Status Codes**: 0=Queued, 1=Processing, 2=Encoding, 3=Finished, 4=Resolution finished, 5=Failed

---

### 10. **LiveStream**
Zoom live class sessions.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | YES | - | PK |
| classId | TEXT | NO | - | FK → Class.id |
| teacherId | TEXT | NO | - | FK → User.id |
| roomName | TEXT | NO | - | Display name |
| roomUrl | TEXT | NO | - | Zoom join URL |
| status | TEXT | NO | 'PENDING' | PENDING, LIVE, ENDED |
| title | TEXT | YES | - | Stream title |
| startedAt | DATETIME | YES | - | When stream started |
| endedAt | DATETIME | YES | - | When stream ended |
| recordingId | TEXT | YES | - | Bunny video GUID for recording |
| createdAt | DATETIME | NO | CURRENT_TIMESTAMP | |
| zoomLink | TEXT | YES | - | Zoom join URL |
| zoomMeetingId | TEXT | YES | - | Zoom meeting ID |
| zoomStartUrl | TEXT | YES | - | Zoom host start URL |
| participantCount | INTEGER | YES | - | Number of participants |
| participantsFetchedAt | TEXT | YES | - | When participants were fetched |
| participantsData | TEXT | YES | - | JSON participant details |

---

### 11. **LessonRating**
Student ratings for lessons.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | YES | - | PK |
| lessonId | TEXT | NO | - | FK → Lesson.id |
| studentId | TEXT | NO | - | FK → User.id |
| rating | INTEGER | NO | - | 1-5 stars |
| createdAt | TEXT | NO | datetime('now') | |
| updatedAt | TEXT | NO | datetime('now') | |

---

### 12. **VideoPlayState**
Tracks student video watching progress (anti-piracy).

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | NO | - | PK |
| videoId | TEXT | NO | - | FK → Video.id |
| studentId | TEXT | NO | - | FK → User.id |
| totalWatchTimeSeconds | REAL | NO | 0 | Cumulative watch time |
| lastPositionSeconds | REAL | NO | 0 | Resume position |
| sessionStartTime | TEXT | YES | - | Current session start |
| lastWatchedAt | TEXT | YES | - | Last activity |
| createdAt | TEXT | NO | datetime('now') | |
| updatedAt | TEXT | NO | datetime('now') | |
| status | TEXT | NO | 'ACTIVE' | ACTIVE, COMPLETED, BLOCKED |

---

### 13. **Notification**
User notifications.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | YES | - | PK |
| userId | TEXT | NO | - | FK → User.id |
| type | TEXT | NO | 'live_class' | Notification type |
| title | TEXT | NO | - | |
| message | TEXT | YES | - | |
| data | TEXT | YES | - | JSON extra data |
| isRead | INTEGER | NO | 0 | 0=unread, 1=read |
| createdAt | TEXT | NO | - | |

---

### 14. **DeviceSession**
Active device sessions (single-session enforcement).

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | NO | - | PK |
| userId | TEXT | NO | - | FK → User.id |
| deviceFingerprint | TEXT | NO | - | Unique device ID |
| userAgent | TEXT | YES | - | Browser UA |
| ipHash | TEXT | YES | - | Hashed IP |
| browser | TEXT | YES | - | Browser name |
| os | TEXT | YES | - | OS name |
| isActive | INTEGER | NO | 1 | 0=inactive, 1=active |
| lastActiveAt | TEXT | NO | datetime('now') | Last ping |
| createdAt | TEXT | NO | datetime('now') | |

---

## Entity Relationships

```
User (id)
├── role = 'ACADEMY' → Academy.ownerId
├── role = 'TEACHER' → Teacher.userId → Academy.id
├── role = 'STUDENT' → ClassEnrollment.userId → Class.id
│
Academy (id)
├── ownerId → User.id (ACADEMY role)
├── Teacher.academyId (teachers working here)
└── Class.academyId (classes in this academy)
│
Class (id)
├── academyId → Academy.id
├── teacherId → User.id (assigned teacher)
├── ClassEnrollment.classId (enrolled students)
├── Lesson.classId (content)
└── LiveStream.classId (live sessions)
│
Lesson (id)
├── classId → Class.id
├── Video.lessonId (videos)
├── Document.lessonId (documents)
└── LessonRating.lessonId (ratings)
│
Video (id)
├── lessonId → Lesson.id
├── uploadId → Upload.id
└── VideoPlayState.videoId (watch tracking)
│
Upload (id)
├── uploadedById → User.id
├── Video.uploadId or Document.uploadId
└── bunnyGuid (for Bunny Stream videos)
```

---

## Important Query Patterns

### For ACADEMY role users:
```sql
-- Get academies owned by user
SELECT * FROM Academy WHERE ownerId = ?

-- Get all classes in owned academies
SELECT c.* FROM Class c
JOIN Academy a ON c.academyId = a.id
WHERE a.ownerId = ?

-- Get all lessons in owned academies
SELECT l.* FROM Lesson l
JOIN Class c ON l.classId = c.id
JOIN Academy a ON c.academyId = a.id
WHERE a.ownerId = ?
```

### For TEACHER role users:
```sql
-- Get academies teacher works in
SELECT a.* FROM Academy a
JOIN Teacher t ON t.academyId = a.id
WHERE t.userId = ?

-- Get classes assigned to teacher
SELECT * FROM Class WHERE teacherId = ?
```

### For STUDENT role users:
```sql
-- Get enrolled classes
SELECT c.* FROM Class c
JOIN ClassEnrollment e ON e.classId = c.id
WHERE e.userId = ? AND e.status = 'APPROVED'
```

---

### 15. **Payment**
Financial transactions tracking (single source of truth for all payments).

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | NO | - | PK |
| type | TEXT | NO | - | STUDENT_TO_ACADEMY, ACADEMY_TO_PLATFORM |
| payerId | TEXT | NO | - | User.id (for students) or Academy.ownerId |
| payerType | TEXT | NO | - | STUDENT, ACADEMY |
| payerName | TEXT | NO | - | Full name for display |
| payerEmail | TEXT | NO | - | Email for notifications |
| receiverId | TEXT | YES | - | Academy.id (for student payments) |
| receiverName | TEXT | YES | - | Academy name (optional, can be joined) |
| amount | REAL | NO | - | Payment amount |
| currency | TEXT | NO | 'USD' | EUR, USD, etc. |
| status | TEXT | NO | 'PENDING' | PAID, COMPLETED, PENDING, FAILED, REFUNDED |
| stripePaymentId | TEXT | YES | - | Stripe payment ID (for online payments) |
| stripeCheckoutSessionId | TEXT | YES | - | Stripe session ID (for online payments) |
| paymentMethod | TEXT | YES | - | cash, bizum, stripe, paypal |
| classId | TEXT | YES | - | FK → Class.id (links payment to enrollment) |
| description | TEXT | YES | - | Human-readable description |
| metadata | TEXT | YES | - | JSON with enrollmentId, approvedBy, etc. |
| createdAt | TEXT | NO | datetime('now') | When payment record created |
| completedAt | TEXT | YES | - | When payment was completed/approved |
| updatedAt | TEXT | NO | datetime('now') | Last modified (DEPRECATED - not used) |

**Payment Types:**
- `STUDENT_TO_ACADEMY` - Student pays for enrollment/subscription
- `ACADEMY_TO_PLATFORM` - Academy pays platform fees (future)

**Column Usage Notes:**
- **receiverName**: Optional - can be derived via JOIN with Academy table. Stored for performance/denormalization.
- **stripePaymentId/stripeCheckoutSessionId**: Only used for online Stripe payments. NULL for cash/bizum.
- **updatedAt**: DEPRECATED - not actively used. Status changes should be tracked via metadata.
- **metadata**: Store enrollment linkage, approval info, migration data as JSON:
  ```json
  {
    "originalEnrollmentId": "enrollment-id",
    "approvedBy": "user-id",
    "approvedAt": "2026-01-30T...",
    "migratedAt": "2026-01-30T..."
  }
  ```

**Recommended Cleanup (Future):**
- Remove `updatedAt` column (not used)
- Remove `receiverName` column (can be JOINed from Academy table)
- These are safe to remove once existing queries are audited

---

## Deleted Tables (Historical)

- ❌ **AcademyMembership** - Replaced by Teacher table
- ❌ **PlatformSettings** - Moved to environment variables
- ❌ **BillingConfig** - Not implemented

---

## Notes

1. **ACADEMY vs TEACHER Role**:
   - ACADEMY users own academies (`Academy.ownerId`)
   - TEACHER users work in academies (`Teacher.userId` + `Teacher.academyId`)
   - Never use Teacher table to identify academy owners!

2. **Video Storage**:
   - Videos stored in Bunny Stream (`Upload.storageType = 'bunny'`)
   - Documents stored in R2 (`Upload.storageType = 'r2'`)
   - `Upload.bunnyGuid` contains Bunny video GUID when applicable

3. **Zoom Integration**:
   - LiveStream stores Zoom meeting details
   - `recordingId` stores Bunny GUID for recordings (set by webhook)
   - `participantCount` fetched from Zoom API after meeting ends
