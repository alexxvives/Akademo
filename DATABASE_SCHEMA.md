# AKADEMO Database Schema

## Overview
Database: **Cloudflare D1** (SQLite-based)
Purpose: Academy management platform with video protection and multi-tenant architecture

---

## Core Tables (Essential - Keep)

### 1. **User**
- **Purpose**: Stores all users (admins, academy owners, teachers, students)
- **Status**: ✅ KEEP - Core table
- **Columns**:
  - `id` - Unique user identifier
  - `email` - Login email (unique)
  - `password` - Bcrypt hashed password
  - `firstName`, `lastName` - User name
  - `role` - ADMIN | ACADEMY | TEACHER | STUDENT
  - `createdAt`, `updatedAt` - Timestamps

### 2. **Academy**
- **Purpose**: Represents individual academy institutions
- **Status**: ✅ KEEP - Core table
- **Columns**:
  - `id` - Academy identifier
  - `name`, `description` - Academy details
  - `ownerId` - References User (ACADEMY role)
  - `defaultMaxWatchTimeMultiplier` - Video watch time limit
  - `createdAt`, `updatedAt` - Timestamps

### 3. **AcademyMembership**
- **Purpose**: Links teachers to academies (with approval workflow)
- **Status**: ✅ KEEP - Required for teacher-academy relationships
- **Columns**:
  - `id` - Membership identifier
  - `userId` - References User (teacher)
  - `academyId` - References Academy
  - `status` - PENDING | APPROVED | REJECTED
  - `requestedAt`, `approvedAt` - Approval timestamps
  - `createdAt`, `updatedAt` - Timestamps
- **Note**: Does NOT have a `role` column (role is determined by User.role)

### 4. **Class**
- **Purpose**: Courses/classes within an academy
- **Status**: ✅ KEEP - Core table
- **Columns**:
  - `id` - Class identifier
  - `name`, `description` - Class details
  - `academyId` - References Academy
  - `defaultMaxWatchTimeMultiplier` - Override for video limits
  - `createdAt`, `updatedAt` - Timestamps

### 5. **ClassEnrollment**
- **Purpose**: Links students to classes (with approval workflow)
- **Status**: ✅ KEEP - Required for student-class relationships
- **Columns**:
  - `id` - Enrollment identifier
  - `classId` - References Class
  - `studentId` - References User (student)
  - `status` - PENDING | APPROVED | REJECTED
  - `requestedAt`, `approvedAt` - Approval timestamps
  - `enrolledAt` - When student joined
  - `createdAt`, `updatedAt` - Timestamps

### 6. **Upload**
- **Purpose**: Metadata for files stored in R2 (videos, documents)
- **Status**: ✅ KEEP - Essential for content storage
- **Columns**:
  - `id` - Upload identifier
  - `fileName`, `fileSize`, `mimeType` - File metadata
  - `storagePath` - R2 object key (always R2 storage)
  - `uploadedById` - References User
  - `createdAt` - Timestamp
- **Note**: Removed `storageType` column (always 'r2')

### 7. **Video**
- **Purpose**: Video content in lessons
- **Status**: ✅ KEEP - Core feature
- **Columns**:
  - `id` - Video identifier
  - `title`, `description` - Video details (now used in upload form)
  - `lessonId` - References Lesson
  - `uploadId` - References Upload (one-to-one)
  - `durationSeconds` - Video length
  - `createdAt`, `updatedAt` - Timestamps
- **Note**: Removed `maxWatchTimeMultiplier` (now only at Lesson level)

### 8. **Document**
- **Purpose**: Document files in lessons (PDFs, etc.)
- **Status**: ✅ KEEP - Core feature
- **Columns**:
  - `id` - Document identifier
  - `title`, `description` - Document details
  - `lessonId` - References Lesson
  - `uploadId` - References Upload (one-to-one)
  - `createdAt`, `updatedAt` - Timestamps

---

## Anti-Piracy Tables (Essential - Keep)

### 9. **VideoPlayState**
- **Purpose**: Tracks student video viewing progress and watch time
- **Status**: ✅ KEEP - Critical for anti-piracy and watch limits
- **Columns**:
  - `id` - State identifier
  - `videoId` - References Video
  - `studentId` - References User
  - `totalWatchTimeSeconds` - Cumulative watch time
  - `lastPositionSeconds` - Resume position
  - `sessionStartTime` - Current session start
  - `lastWatchedAt` - Last activity
  - `createdAt`, `updatedAt` - Timestamps
- **Use**: Prevents students from exceeding watch time limits (e.g., 2x video duration)

### 10. **DeviceSession**
- **Purpose**: Tracks active devices per user (single-session enforcement)
- **Status**: ✅ KEEP - Critical for preventing account sharing
- **Columns**:
  - `id` - Session identifier
  - `userId` - References User
  - `deviceFingerprint` - Unique device ID
  - `userAgent`, `browser`, `os` - Device info
  - `ipHash` - Hashed IP for anomaly detection
  - `isActive` - Whether session is active (1/0)
  - `lastActiveAt` - Last ping time
  - `createdAt` - Session creation
- **Use**: Only ONE active session per student at a time

---

## Configuration Tables (Keep But Optional)

### 11. **PlatformSettings**
- **Purpose**: Global platform configuration
- **Status**: ⚠️ KEEP - Useful but could be environment variables
- **Columns**:
  - `id` - Always 'platform_settings'
  - `defaultMaxWatchTimeMultiplier` - Default 2.0 (200% of video length)
  - `createdAt`, `updatedAt` - Timestamps
- **Recommendation**: Keep for now, can move to config file later

### 12. **BillingConfig**
- **Purpose**: Stripe billing configuration per academy
- **Status**: ⚠️ OPTIONAL - Not currently implemented
- **Columns**:
  - `id` - Config identifier
  - `academyId` - References Academy
  - `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId` - Stripe IDs
  - `pricePerStudentPerMonth` - Pricing
  - `createdAt`, `updatedAt` - Timestamps
- **Recommendation**: Keep for future billing feature, but not critical now

---

## Database Cleanup Recommendations

### ✅ Keep All Tables
All tables are currently being used or planned for essential features. No cleanup needed.

### 🔧 Required Fixes Applied
1. **Fixed**: Removed non-existent `role` column from AcademyMembership INSERT query
   - File: `src/app/api/requests/teacher/route.ts`
   - Issue: Tried to insert `role='TEACHER'` but column doesn't exist
   - Solution: Role is already stored in User table, no need to duplicate

### 📊 Table Usage Summary
- **Active Users**: 12 tables in use
- **Critical for Core Features**: 10 tables (User through Document)
- **Critical for Anti-Piracy**: 2 tables (VideoPlayState, DeviceSession)
- **Optional/Future**: 2 tables (PlatformSettings, BillingConfig)

### 🎯 Performance Indexes
All necessary indexes are in place for:
- User lookups by email
- Academy ownership queries
- Membership and enrollment queries
- Video and class associations
- Session tracking

---

## Data Flow Example

1. **Academy Owner** creates Academy
2. **Teacher** requests to join Academy → AcademyMembership (PENDING)
3. **Academy Owner** approves → AcademyMembership (APPROVED)
4. **Teacher** creates Class in Academy
5. **Student** requests to enroll → ClassEnrollment (PENDING)
6. **Teacher** approves → ClassEnrollment (APPROVED)
7. **Teacher** uploads Video → Upload + Video records
8. **Student** watches Video → VideoPlayState tracks time
9. **System** enforces single device → DeviceSession management

---

## Migration Status
- ✅ 0001_initial.sql - All tables created
- ✅ 0002_approval_system.sql - Added status columns
- ✅ 0003_seed_users.sql - Test users and academies
- ✅ 0006_cleanup_schema.sql - Removed PlatformSettings, BillingConfig, Upload.storageType

**Database is clean and properly structured.**

---

## Schema Cleanup Notes (Dec 2025)

**Removed:**
- ❌ **PlatformSettings** table - Redundant (defaults set at Academy/Class/Lesson levels)
- ❌ **BillingConfig** table - Not implemented yet, removed for clarity
- ❌ **Upload.storageType** column - Always 'r2', no longer needed

**Schema Logic - Why This Structure?**
- **Upload** = Generic file storage metadata (reusable)
- **Video/Document** = Content-type specific data + title/description
- **Lesson** = Groups videos & documents with settings (maxWatchTimeMultiplier, watermarkIntervalMins)
- **Class** → **Lesson** → **Video/Document** → **Upload** = Clean hierarchy
