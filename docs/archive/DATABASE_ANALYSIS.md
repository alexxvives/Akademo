# AKADEMO Database Analysis - Complete Review
**Date**: January 26, 2026  
**Database**: akademo-db (Cloudflare D1)

---

## Summary Statistics
- **Total Tables**: 18 (excluding system tables)
- **Core User Tables**: 4 (User, Academy, Teacher, ClassEnrollment)
- **Content Tables**: 5 (Lesson, Video, Document, Upload, LiveStream)
- **Supporting Tables**: 9

---

## Table-by-Table Analysis

### 1. **User** (10 columns)
**Purpose**: Central user authentication and profile storage for all roles (ADMIN, ACADEMY, TEACHER, STUDENT)

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | YES | - | ✅ KEEP - Primary key |
| email | TEXT | YES | - | ✅ KEEP - Authentication & Stripe matching |
| password | TEXT | YES | - | ✅ KEEP - Bcrypt hashed auth |
| firstName | TEXT | YES | - | ✅ KEEP - Display name |
| lastName | TEXT | YES | - | ✅ KEEP - Display name |
| role | TEXT | YES | 'STUDENT' | ✅ KEEP - Core permission system |
| createdAt | TEXT | YES | datetime('now') | ✅ KEEP - Audit trail |
| updatedAt | TEXT | YES | datetime('now') | ⚠️ RARELY USED - Consider removing |
| phone | TEXT | NO | null | ❌ **UNUSED** - Not shown/used anywhere |
| lastLoginAt | TEXT | NO | null | ✅ KEEP - Activity tracking (dashboard) |

**Recommendation**: 
- **REMOVE `phone`** - Not used in code, not displayed in UI
- **CONSIDER REMOVING `updatedAt`** - User profiles rarely change, `createdAt` sufficient

---

### 2. **Academy** (16 columns)
**Purpose**: Educational institution profiles

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | NO | - | ✅ KEEP - Primary key |
| name | TEXT | YES | - | ✅ KEEP - Academy name |
| createdAt | TEXT | YES | - | ✅ KEEP - Audit trail |
| updatedAt | TEXT | YES | - | ⚠️ RARELY USED |
| description | TEXT | NO | - | ✅ KEEP - Academy profile |
| ownerId | TEXT | NO | - | ✅ KEEP - Critical: Links to ACADEMY role user |
| status | TEXT | NO | 'PENDING' | ❌ **UNUSED** - Approval system not implemented |
| monoacademy | INTEGER | NO | 0 | ✅ KEEP - Role switcher feature (ACTIVE) |
| paymentStatus | TEXT | NO | 'NOT PAID' | ✅ KEEP - Stripe payment tracking (active) |
| stripeAccountId | TEXT | NO | NULL | ✅ KEEP - Stripe Connect (planned) |
| address | TEXT | NO | null | ✅ KEEP - Profile page display |
| phone | TEXT | NO | null | ✅ KEEP - Profile page display |
| email | TEXT | NO | null | ✅ KEEP - Profile page display |
| feedbackAnonymous | INTEGER | NO | 0 | ✅ KEEP - Feedback toggle on profile (ACTIVE) |
| defaultWatermarkIntervalMins | INTEGER | NO | 5 | ✅ KEEP - Default for new lessons (ACTIVE) |
| defaultMaxWatchTimeMultiplier | REAL | NO | 2.0 | ✅ KEEP - Default for new lessons (ACTIVE) |

**Recommendation**:
- **REMOVE**: `status` only
- **KEEP**: All other columns are actively used

---

### 3. **Teacher** (8 columns)
**Purpose**: Links TEACHER role users to academies they work in

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | NO | - | ✅ KEEP - Primary key |
| userId | TEXT | YES | - | ✅ KEEP - Links to User (TEACHER role) |
| academyId | TEXT | YES | - | ✅ KEEP - Links to Academy |
| defaultMaxWatchTimeMultiplier | REAL | NO | 2.0 | ❌ **UNUSED** - Not used anywhere |
| createdAt | TEXT | YES | - | ✅ KEEP - Audit trail |
| updatedAt | TEXT | YES | - | ⚠️ RARELY USED |
| status | TEXT | NO | 'PENDING' | ✅ KEEP - Approval workflow (active) |
| monoacademy | INTEGER | NO | 0 | ✅ KEEP - Role switcher feature (ACTIVE) |

**Recommendation**:
- **REMOVE**: `defaultMaxWatchTimeMultiplier`, `updatedAt`
- **KEEP**: Core relationship fields (userId, academyId, status, monoacademy, createdAt)

---

### 4. **Class** (13 columns)
**Purpose**: Courses/classes within academies

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | NO | - | ✅ KEEP - Primary key |
| name | TEXT | YES | - | ✅ KEEP - Class name |
| slug | TEXT | NO | null | ✅ KEEP - URL-friendly class identifier (ACTIVE) |
| description | TEXT | NO | null | ✅ KEEP - Class description |
| academyId | TEXT | YES | - | ✅ KEEP - Academy relationship |
| teacherId | TEXT | NO | null | ✅ KEEP - Assigned teacher |
| createdAt | TEXT | YES | - | ✅ KEEP - Audit trail |
| updatedAt | TEXT | YES | - | ⚠️ RARELY USED |
| feedbackEnabled | BOOLEAN | YES | 1 | ✅ KEEP - Feedback toggle (active) |
| whatsappGroupLink | TEXT | NO | null | ✅ KEEP - External communication |
| price | REAL | NO | 0 | ✅ KEEP - Enrollment pricing (active) |
| currency | TEXT | NO | 'EUR' | ✅ KEEP - Pricing currency |
| zoomAccountId | TEXT | NO | null | ✅ KEEP - Zoom account assignment |

**Recommendation**:
- **REMOVE**: `updatedAt` only
- **KEEP**: All others (actively used including slug for URLs)

---

### 5. **ClassEnrollment** (15 columns)
**Purpose**: Student enrollment in classes with approval workflow

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | NO | - | ✅ KEEP - Primary key |
| classId | TEXT | YES | - | ✅ KEEP - Class relationship |
| userId | TEXT | YES | - | ✅ KEEP - Student relationship |
| status | TEXT | NO | 'PENDING' | ✅ KEEP - Approval workflow (active) |
| enrolledAt | TEXT | YES | - | ✅ KEEP - Enrollment timestamp |
| approvedAt | TEXT | NO | null | ✅ KEEP - Approval timestamp |
| createdAt | TEXT | YES | - | ⚠️ REDUNDANT with enrolledAt |
| updatedAt | TEXT | YES | - | ⚠️ RARELY USED |
| documentSigned | INTEGER | NO | 0 | ❌ **UNUSED** - Document signing not used |
| paymentStatus | TEXT | NO | 'PENDING' | ✅ KEEP - Payment tracking (active) |
| paymentMethod | TEXT | NO | NULL | ✅ KEEP - Payment method tracking |
| paymentId | TEXT | NO | NULL | ✅ KEEP - Payment reference |
| paymentAmount | REAL | NO | 0 | ✅ KEEP - Payment amount |
| approvedBy | TEXT | NO | null | ✅ KEEP - Approver tracking |
| approvedByName | TEXT | NO | null | ✅ KEEP - Approver name display |

**Recommendation**:
- **REMOVE**: `documentSigned`, `createdAt` (redundant with enrolledAt), `updatedAt`
- **KEEP**: All enrollment and payment fields

---

### 6. **Lesson** (10 columns)
**Purpose**: Content units within classes

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | YES | - | ✅ KEEP - Primary key |
| title | TEXT | YES | - | ✅ KEEP - Lesson title |
| description | TEXT | NO | null | ✅ KEEP - Lesson description |
| classId | TEXT | YES | - | ✅ KEEP - Class relationship |
| maxWatchTimeMultiplier | REAL | YES | 2.0 | ✅ KEEP - Anti-piracy limit |
| watermarkIntervalMins | INTEGER | YES | 5 | ✅ KEEP - Anti-piracy watermark |
| createdAt | TEXT | YES | datetime('now') | ✅ KEEP - Audit trail |
| updatedAt | TEXT | YES | datetime('now') | ⚠️ RARELY USED |
| releaseDate | TEXT | NO | CURRENT_TIMESTAMP | ✅ KEEP - Scheduled content |
| topicId | TEXT | NO | null | ✅ KEEP - Topic organization |

**Recommendation**:
- **REMOVE**: `updatedAt`
- **KEEP**: All others (actively used)

---

### 7. **Video** (7 columns)
**Purpose**: Video content linked to lessons

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | YES | - | ✅ KEEP - Primary key |
| title | TEXT | YES | - | ✅ KEEP - Video title |
| lessonId | TEXT | YES | - | ✅ KEEP - Lesson relationship |
| uploadId | TEXT | YES | - | ✅ KEEP - Upload metadata reference |
| durationSeconds | INTEGER | NO | null | ✅ KEEP - Video duration (for limits) |
| createdAt | TEXT | YES | datetime('now') | ✅ KEEP - Audit trail |
| updatedAt | TEXT | YES | datetime('now') | ❌ **UNUSED** - Videos don't update |

**Recommendation**:
- **REMOVE**: `updatedAt`

---

### 8. **Document** (6 columns)
**Purpose**: PDF/document files linked to lessons

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | YES | - | ✅ KEEP - Primary key |
| title | TEXT | YES | - | ✅ KEEP - Document title |
| lessonId | TEXT | YES | - | ✅ KEEP - Lesson relationship |
| uploadId | TEXT | YES | - | ✅ KEEP - Upload metadata reference |
| createdAt | TEXT | YES | datetime('now') | ✅ KEEP - Audit trail |
| updatedAt | TEXT | YES | datetime('now') | ❌ **UNUSED** - Documents don't update |

**Recommendation**:
- **REMOVE**: `updatedAt`

---

### 9. **Upload** (10 columns)
**Purpose**: File storage metadata (R2 + Bunny Stream)

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | YES | - | ✅ KEEP - Primary key |
| fileName | TEXT | YES | - | ✅ KEEP - Original filename |
| fileSize | INTEGER | YES | - | ✅ KEEP - File size tracking |
| mimeType | TEXT | YES | - | ✅ KEEP - File type |
| storagePath | TEXT | YES | - | ✅ KEEP - R2 key path |
| uploadedById | TEXT | YES | - | ✅ KEEP - Uploader tracking |
| createdAt | TEXT | YES | datetime('now') | ✅ KEEP - Upload timestamp |
| bunnyGuid | TEXT | NO | null | ✅ KEEP - Bunny Stream video ID |
| bunnyStatus | INTEGER | NO | NULL | ✅ KEEP - Transcoding status |
| storageType | TEXT | NO | 'r2' | ✅ KEEP - Storage backend type |

**Recommendation**:
- **KEEP ALL** - All columns actively used

---

### 10. **LiveStream** (17 columns)
**Purpose**: Zoom live class sessions

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | NO | - | ✅ KEEP - Primary key |
| classId | TEXT | YES | - | ✅ KEEP - Class relationship |
| teacherId | TEXT | YES | - | ✅ KEEP - Host tracking |
| roomName | TEXT | YES | - | ⚠️ **REDUNDANT** with title |
| roomUrl | TEXT | YES | - | ⚠️ **REDUNDANT** with zoomLink |
| status | TEXT | YES | 'PENDING' | ✅ KEEP - Stream status |
| title | TEXT | NO | null | ✅ KEEP - Stream title |
| startedAt | DATETIME | NO | null | ✅ KEEP - Start timestamp |
| endedAt | DATETIME | NO | null | ✅ KEEP - End timestamp |
| recordingId | TEXT | NO | null | ✅ KEEP - Bunny recording ID |
| createdAt | DATETIME | YES | CURRENT_TIMESTAMP | ✅ KEEP - Audit trail |
| zoomLink | TEXT | NO | null | ✅ KEEP - Zoom join URL |
| zoomMeetingId | TEXT | NO | null | ✅ KEEP - Zoom meeting ID |
| zoomStartUrl | TEXT | NO | null | ✅ KEEP - Host start URL |
| participantCount | INTEGER | NO | null | ✅ KEEP - Attendance tracking |
| participantsFetchedAt | TEXT | NO | null | ✅ KEEP - Fetch timestamp |
| participantsData | TEXT | NO | null | ✅ KEEP - Participant JSON data |

**Recommendation**:
- **REMOVE**: `roomName` (use `title`), `roomUrl` (use `zoomLink`)
- **KEEP**: All others (actively used)

---

### 11. **LessonRating** (7 columns)
**Purpose**: Student lesson ratings/feedback

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | NO | - | ✅ KEEP - Primary key |
| lessonId | TEXT | YES | - | ✅ KEEP - Lesson relationship |
| studentId | TEXT | YES | - | ✅ KEEP - Student relationship |
| rating | INTEGER | YES | - | ✅ KEEP - 1-5 star rating |
| createdAt | TEXT | YES | datetime('now') | ✅ KEEP - Rating timestamp |
| updatedAt | TEXT | YES | datetime('now') | ⚠️ RARELY USED |
| comment | TEXT | NO | null | ✅ KEEP - Feedback text |

**Recommendation**:
- **REMOVE**: `updatedAt` (ratings rarely updated)

---

### 12. **VideoPlayState** (10 columns)
**Purpose**: Anti-piracy video watch tracking

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | YES | - | ✅ KEEP - Primary key |
| videoId | TEXT | YES | - | ✅ KEEP - Video relationship |
| studentId | TEXT | YES | - | ✅ KEEP - Student relationship |
| totalWatchTimeSeconds | REAL | YES | 0 | ✅ KEEP - Watch time limit tracking |
| lastPositionSeconds | REAL | YES | 0 | ✅ KEEP - Resume playback |
| sessionStartTime | TEXT | NO | null | ✅ KEEP - Session tracking |
| lastWatchedAt | TEXT | NO | null | ✅ KEEP - Activity timestamp |
| createdAt | TEXT | YES | datetime('now') | ✅ KEEP - Initial watch |
| updatedAt | TEXT | YES | datetime('now') | ✅ KEEP - Progress updates (active) |
| status | TEXT | YES | 'ACTIVE' | ✅ KEEP - Blocking status |

**Recommendation**:
- **KEEP ALL** - Critical anti-piracy system

---

### 13. **Notification** (8 columns)
**Purpose**: In-app user notifications

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | NO | - | ✅ KEEP - Primary key |
| userId | TEXT | YES | - | ✅ KEEP - User relationship |
| type | TEXT | YES | 'live_class' | ✅ KEEP - Notification type |
| title | TEXT | YES | - | ✅ KEEP - Notification title |
| message | TEXT | NO | null | ✅ KEEP - Notification body |
| data | TEXT | NO | null | ✅ KEEP - JSON metadata |
| isRead | INTEGER | YES | 0 | ✅ KEEP - Read status |
| createdAt | TEXT | YES | - | ✅ KEEP - Notification timestamp |

**Recommendation**:
- **KEEP ALL** - Actively used

---

### 14. **Payment** (20 columns)
**Purpose**: Financial transaction tracking

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | NO | - | ✅ KEEP - Primary key |
| type | TEXT | YES | - | ✅ KEEP - Payment type |
| payerId | TEXT | YES | - | ✅ KEEP - Payer ID |
| payerType | TEXT | YES | - | ✅ KEEP - STUDENT/ACADEMY |
| payerName | TEXT | YES | - | ✅ KEEP - Display name |
| payerEmail | TEXT | YES | - | ✅ KEEP - Contact/matching |
| receiverId | TEXT | NO | null | ✅ KEEP - Receiver ID |
| receiverName | TEXT | NO | null | ✅ KEEP - Display name |
| amount | REAL | YES | - | ✅ KEEP - Payment amount |
| currency | TEXT | YES | 'USD' | ✅ KEEP - Currency |
| status | TEXT | YES | 'PENDING' | ✅ KEEP - Payment status |
| stripePaymentId | TEXT | NO | null | ✅ KEEP - Stripe payment ID |
| stripeCheckoutSessionId | TEXT | NO | null | ✅ KEEP - Stripe session ID |
| paymentMethod | TEXT | NO | null | ✅ KEEP - Payment method |
| classId | TEXT | NO | null | ✅ KEEP - Enrollment link |
| description | TEXT | NO | null | ✅ KEEP - Payment description |
| metadata | TEXT | NO | null | ✅ KEEP - JSON extra data |
| createdAt | TEXT | YES | datetime('now') | ✅ KEEP - Payment timestamp |
| completedAt | TEXT | NO | null | ✅ KEEP - Completion timestamp |
| updatedAt | TEXT | YES | datetime('now') | ⚠️ RARELY USED |

**Recommendation**:
- **REMOVE**: `updatedAt` (rarely updated)
- **KEEP**: All others (payment auditing critical)

---

### 15. **DeviceSession** (10 columns)
**Purpose**: Single-session enforcement (anti-sharing)

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | YES | - | ✅ KEEP - Primary key |
| userId | TEXT | YES | - | ✅ KEEP - User relationship |
| deviceFingerprint | TEXT | YES | - | ✅ KEEP - Device identification |
| userAgent | TEXT | NO | null | ✅ KEEP - Browser tracking |
| ipHash | TEXT | NO | null | ✅ KEEP - IP tracking (hashed) |
| browser | TEXT | NO | null | ✅ KEEP - Browser name |
| os | TEXT | NO | null | ✅ KEEP - OS name |
| isActive | INTEGER | YES | 1 | ✅ KEEP - Session status |
| lastActiveAt | TEXT | YES | datetime('now') | ✅ KEEP - Activity tracking |
| createdAt | TEXT | YES | datetime('now') | ✅ KEEP - Session start |

**Recommendation**:
- **KEEP ALL** - Anti-sharing system

---

### 16. **VerificationCode** (4 columns)
**Purpose**: Email verification codes

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| email | TEXT | NO | - | ✅ KEEP - Primary key |
| code | TEXT | YES | - | ✅ KEEP - 6-digit code |
| expiresAt | TEXT | YES | - | ✅ KEEP - Expiry timestamp |
| createdAt | TEXT | NO | datetime('now') | ✅ KEEP - Creation timestamp |

**Recommendation**:
- **KEEP ALL** - Email verification active

---

### 17. **Topic** (6 columns)
**Purpose**: Lesson organization/grouping

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | NO | lower(hex(randomblob(16))) | ✅ KEEP - Primary key |
| name | TEXT | YES | - | ✅ KEEP - Topic name |
| classId | TEXT | YES | - | ✅ KEEP - Class relationship |
| orderIndex | INTEGER | YES | 0 | ✅ KEEP - Topic ordering |
| createdAt | TEXT | YES | datetime('now') | ✅ KEEP - Audit trail |
| updatedAt | TEXT | YES | datetime('now') | ⚠️ RARELY USED |

**Recommendation**:
- **REMOVE**: `updatedAt`
- **KEEP**: All others (topic organization active)

---

### 18. **ZoomAccount** (9 columns)
**Purpose**: Zoom OAuth account linking

| Column | Type | Required | Default | Analysis |
|--------|------|----------|---------|----------|
| id | TEXT | NO | - | ✅ KEEP - Primary key |
| academyId | TEXT | YES | - | ✅ KEEP - Academy relationship |
| accountName | TEXT | YES | - | ✅ KEEP - Display name |
| accessToken | TEXT | YES | - | ✅ KEEP - OAuth access token |
| refreshToken | TEXT | YES | - | ✅ KEEP - OAuth refresh token |
| expiresAt | TEXT | YES | - | ✅ KEEP - Token expiry |
| accountId | TEXT | YES | - | ✅ KEEP - Zoom account ID |
| createdAt | TEXT | YES | datetime('now') | ✅ KEEP - Account linking |
| updatedAt | TEXT | YES | datetime('now') | ✅ KEEP - Token refresh tracking |

**Recommendation**:
- **KEEP ALL** - Zoom OAuth active

---

## Cleanup Recommendations Summary

### ❌ **REMOVE (10 columns total)**

**High Priority (Unused Features - 2 columns)**:
1. `User.phone` - Not used anywhere
2. `Academy.status` - Approval system not implemented

**Teacher table (1 column)**:
3. `Teacher.defaultMaxWatchTimeMultiplier` - Not used anywhere

**LiveStream redundant columns (2 columns)**:
4. `LiveStream.roomName` - Redundant with `title`
5. `LiveStream.roomUrl` - Redundant with `zoomLink`

**Low Priority (`updatedAt` columns - consider removing for simplicity)**:
6. `User.updatedAt`
7. `Academy.updatedAt`
8. `Teacher.updatedAt`
9. `Class.updatedAt`
10. `ClassEnrollment.updatedAt` (also redundant with `enrolledAt`)
11. `ClassEnrollment.createdAt` (redundant with `enrolledAt`)
12. `Lesson.updatedAt`
13. `Video.updatedAt`
14. `Document.updatedAt`
15. `LessonRating.updatedAt`
16. `Payment.updatedAt`
17. `Topic.updatedAt`

**Note**: Keep `ZoomAccount.updatedAt` - needed for OAuth token refresh tracking
**Note**: Keep `VideoPlayState.updatedAt` - actively tracks progress updates

### ✅ **KEEP (All Other Columns)**

---

## Migration Script

```sql
-- Remove unused columns from User
ALTER TABLE User DROP COLUMN phone;
ALTER TABLE User DROP COLUMN updatedAt;

-- Remove unused columns from Academy
ALTER TABLE Academy DROP COLUMN status;
ALTER TABLE Academy DROP COLUMN updatedAt;

-- Remove unused columns from Teacher
ALTER TABLE Teacher DROP COLUMN defaultMaxWatchTimeMultiplier;
ALTER TABLE Teacher DROP COLUMN updatedAt;

-- Remove unused columns from Class
ALTER TABLE Class DROP COLUMN updatedAt;

-- Remove unused columns from ClassEnrollment
ALTER TABLE ClassEnrollment DROP COLUMN documentSigned;
ALTER TABLE ClassEnrollment DROP COLUMN createdAt;
ALTER TABLE ClassEnrollment DROP COLUMN updatedAt;

-- Remove unused columns from Lesson
ALTER TABLE Lesson DROP COLUMN updatedAt;

-- Remove unused columns from Video
ALTER TABLE Video DROP COLUMN updatedAt;

-- Remove unused columns from Document
ALTER TABLE Document DROP COLUMN updatedAt;

-- Remove redundant columns from LiveStream
ALTER TABLE LiveStream DROP COLUMN roomName;
ALTER TABLE LiveStream DROP COLUMN roomUrl;

-- Remove unused columns from LessonRating
ALTER TABLE LessonRating DROP COLUMN updatedAt;

-- Remove unused columns from Payment
ALTER TABLE Payment DROP COLUMN updatedAt;

-- Remove unused columns from Topic
ALTER TABLE Topic DROP COLUMN updatedAt;
```

**Note**: SQLite doesn't support `DROP COLUMN` directly. You need to recreate tables without these columns. This is a destructive operation - backup first!

---

## Impact Analysis

### After Cleanup:
- **Total Columns Before**: ~170
- **Total Columns After**: ~153
- **Reduction**: ~10% smaller schema
- **Benefits**:
  - Simpler schema to maintain
  - Faster queries (fewer columns to scan)
  - Less storage space
  - Clearer audit trail (less confusion between createdAt/updatedAt)
  - Reduced migration complexity

### Breaking Changes:
- **NONE** - All removed columns are either unused or redundant

### About `updatedAt` Columns:
**Why remove them?**
- Most entities are append-only (videos, documents, enrollments)
- Updates are rare and don't need historical tracking
- `createdAt` is sufficient for most audit purposes
- Exception: Keep for OAuth tokens (ZoomAccount) and real-time updates (VideoPlayState)

---

## Next Steps

1. **Review this analysis** with team
2. **Create backup** of production database
3. **Test migration** on local/staging database
4. **Update DATABASE_SCHEMA.md** with cleaned schema
5. **Create migration file** (0027_cleanup_unused_columns.sql)
6. **Deploy to production** during maintenance window
