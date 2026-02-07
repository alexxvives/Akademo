# AI Agent Quick Start Guide - AKADEMO

**Last Updated:** February 7, 2026  
**Purpose:** Get an AI agent up to speed on the AKADEMO codebase in minutes

---

## 🎯 What is AKADEMO?

**AKADEMO** is a Learning Management System (LMS) for academies to manage online education. Think "Udemy for private academies."

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Hono API on Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2 + Bunny Stream CDN
- **Live Streaming:** Zoom API integration
- **Email:** Resend API
- **Payments:** Stripe Connect (in progress)

**Production URLs:**
- Frontend: https://akademo-edu.com
- API: https://akademo-api.alexxvives.workers.dev

---

## 📊 Database Schema (21 Tables)

### Core User Roles

**User table** (`role` column):
- `ADMIN` - Platform administrator
- `ACADEMY` - Academy owner (can create academies)
- `TEACHER` - Works within an academy
- `STUDENT` - Enrolls in classes

### Critical Relationships

```
Academy.ownerId → User.id (where User.role = 'ACADEMY')
  ↓
Teacher.academyId → Academy.id (Teacher.userId → User.id where role = 'TEACHER')
  ↓
Class.academyId → Academy.id (Class.teacherId → User.id)
  ↓
ClassEnrollment.classId → Class.id (ClassEnrollment.userId → User.id where role = 'STUDENT')
  ↓
Lesson.classId → Class.id (Lesson.topicId → Topic.id)
  ↓
Video.lessonId → Lesson.id (Video.uploadId → Upload.id with bunnyGuid)
Document.lessonId → Lesson.id (Document.uploadId → Upload.id in R2)
Assignment.lessonId → Lesson.id → AssignmentAttachment, AssignmentSubmission
```

### Key Tables

1. **User** - All users (ADMIN, ACADEMY, TEACHER, STUDENT) - 8 columns
2. **Academy** - Educational institutions (`ownerId`, `paymentStatus`, `feedbackEnabled`) - 16 columns
3. **Teacher** - Links TEACHER users to academies (`userId` + `academyId`) - 6 columns
4. **Class** - Courses (`academyId`, `teacherId`, `monthlyPrice`, `oneTimePrice`, `zoomAccountId`) - 13 columns
5. **ClassEnrollment** - Student enrollments (`status`: PENDING/APPROVED/REJECTED) - 9 columns
6. **Lesson** - Class content (`releaseDate`, `maxWatchTimeMultiplier`, `topicId`) - 10 columns
7. **Video** - Bunny Stream videos (`uploadId` → `bunnyGuid`, `durationSeconds`) - 7 columns
8. **Document** - PDF/document files (`uploadId` → R2 storage) - 6 columns
9. **Upload** - File metadata (`storageType`: r2/bunny, `bunnyGuid`, `bunnyStatus`) - 10 columns
10. **LiveStream** - Zoom meetings (`zoomMeetingId`, `recordingId`, `participantCount`) - 14 columns
11. **LessonRating** - Student ratings (`rating` 1-5, `comment`, `isRead`) - 7 columns
12. **VideoPlayState** - Watch progress tracking (`totalWatchTimeSeconds`, `status`) - 10 columns
13. **Notification** - In-app notifications (`type`, `isRead`) - 8 columns
14. **DeviceSession** - Session management (`deviceFingerprint`, `isActive`) - 10 columns
15. **Payment** - Financial transactions (`type`, `status`, `paymentMethod`) - 19 columns
16. **ZoomAccount** - Zoom API credentials (`academyId`, `zoomAccountId`, `zoomClientId`) - 10 columns
17. **VerificationCode** - Email verification codes (`code`, `expiresAt`) - 4 columns
18. **Topic** - Lesson organization/grouping (`classId`, `name`, `order`) - 6 columns
19. **Assignment** - Homework/tasks (`lessonId`, `dueDate`, `maxScore`) - 10 columns
20. **AssignmentAttachment** - Assignment files (`assignmentId`, `uploadId`) - 5 columns
21. **AssignmentSubmission** - Student submissions (`assignmentId`, `userId`, `status`, `score`) - 10 columns

### Important Columns

**User:**
- `id`, `email` (UNIQUE), `password` (bcrypt), `firstName`, `lastName`
- `role` - ADMIN/ACADEMY/TEACHER/STUDENT
- `createdAt`, `lastLoginAt`

**Academy:**
- `id`, `name`, `description`, `ownerId` (FK → User.id)
- `paymentStatus` - NOT PAID/PAID (controls feature access)
- `stripeAccountId` - Stripe Connect (future)
- `feedbackEnabled`, `allowMultipleTeachers`, `feedbackAnonymous`
- `defaultWatermarkIntervalMins`, `defaultMaxWatchTimeMultiplier`
- `monoacademy` - Special flag for single-academy mode
- `address`, `phone`, `email`, `logoUrl`
- `allowedPaymentMethods` - JSON array

**Teacher:**
- `id`, `userId` (FK → User.id), `academyId` (FK → Academy.id)
- `defaultMaxWatchTimeMultiplier, `createdAt`

**Class:**
- `id`, `name`, `slug`, `description`, `academyId`, `teacherId`
- `monthlyPrice`, `oneTimePrice` (replaced old `price`/`currency`)
- `whatsappGroupLink`, `zoomAccountId`, `maxStudents`, `startDate`
- `createdAt`

**ClassEnrollment:**
- `id`, `classId`, `userId`, `status` (PENDING/APPROVED/REJECTED)
- `enrolledAt`, `approvedAt`, `documentSigned`
- `paymentFrequency` (ONE_TIME/MONTHLY), `nextPaymentDue`

**Lesson:**
- `id`, `title`, `description`, `classId`, `topicId`
- `maxWatchTimeMultiplier`, `watermarkIntervalMins`
- `releaseDate`, `createdAt`

**Video:**
- `id`, `title`, `lessonId`, `uploadId` (FK → Upload)
- `durationSeconds`, `createdAt`

**Document:**
- `id`, `title`, `lessonId`, `uploadId` (FK → Upload)
- `createdAt`

**Upload:**
- `id`, `fileName`, `fileSize`, `mimeType`, `storagePath`
- `uploadedById`, `createdAt`
- `bunnyGuid` - Bunny Stream video ID (when `storageType='bunny'`)
- `bunnyStatus` - 0=Queued, 1=Processing, 2=Encoding, 3=Finished, 4=Resolution finished, 5=Failed
- `storageType` - 'r2' or 'bunny'

**LiveStream:**
- `id`, `classId`, `teacherId`, `title`
- `zoomMeetingId`, `zoomLink`, `zoomStartUrl`
- `status` (PENDING/LIVE/ENDED)
- `startedAt`, `endedAt`, `recordingId` (Bunny video GUID)
- `participantCount`, `participantsFetchedAt`, `participantsData` (JSON)

**LessonRating:**
- `id`, `lessonId`, `studentId`, `rating` (1-5)
- `comment`, `isRead`, `createdAt`

**VideoPlayState:**
- `id`, `videoId`, `studentId`
- `totalWatchTimeSeconds`, `lastPositionSeconds`
- `sessionStartTime`, `lastWatchedAt`
- `status` (ACTIVE/COMPLETED/BLOCKED)
- `createdAt`

**Notification:**
- `id`, `userId`, `type`, `title`, `message`
- `data` (JSON), `isRead`, `createdAt`

**DeviceSession:**
- `id`, `userId`, `deviceFingerprint`
- `userAgent`, `ipHash`, `browser`, `os`
- `isActive`, `lastActiveAt`, `createdAt`

**Payment:** (Single source of truth for all payments)
- `id`, `type` (STUDENT_TO_ACADEMY/ACADEMY_TO_PLATFORM)
- `payerId`, `payerType`, `payerName`, `payerEmail`
- `receiverId`, `receiverName`
- `amount`, `currency`
- `status` (PAID/COMPLETED/PENDING/FAILED/REFUNDED)
- `stripePaymentId`, `stripeCheckoutSessionId`
- `paymentMethod` (cash/bizum/stripe)
- `classId`, `description`, `metadata` (JSON)
- `createdAt`, `completedAt`

**ZoomAccount:**
- `id`, `academyId`, `zoomAccountId`, `zoomEmail`
- `zoomClientId`, `zoomClientSecret`, `zoomAccountNumber`
- `accessToken`, `refreshToken`, `tokenExpiresAt`
- `createdAt`

**VerificationCode:**
- `id`, `email`, `code`, `expiresAt`

**Topic:**
- `id`, `classId`, `name`, `description`
- `order`, `createdAt`

**Assignment:**
- `id`, `lessonId`, `title`, `description`
- `dueDate`, `maxScore`, `allowLateSubmission`
- `lateSubmissionPenalty`, `createdAt`, `updatedAt`

**AssignmentAttachment:**
- `id`, `assignmentId`, `uploadId`, `order`, `createdAt`

**AssignmentSubmission:**
- `id`, `assignmentId`, `userId`
- `submittedAt`, `status` (DRAFT/SUBMITTED/GRADED)
- `score`, `feedback`, `gradedAt`, `gradedBy`
- `createdAt`, `updatedAt`

## 🔐 Authentication & Permissions

### Session Cookie
- **Name:** `academy_session`
- **Format:** Base64 encoded JSON `{ id, email, role, firstName, lastName }`
- **Validation:** Checked against DeviceSession table

### Permission Rules

**ACADEMY role can:**
- Create their own academy (auto-approved, but `paymentStatus = 'NOT PAID'`)
- Add teachers to their academy
- Create classes (only if `paymentStatus = 'PAID'`)
- Approve student enrollments
- Approve cash payments from students
- View academy analytics

**TEACHER role can:**
- Request to join academies (pending approval)
- Manage assigned classes
- Create lessons (videos, documents, live streams)
- Host Zoom classes
- View student progress

**STUDENT role can:**
- Browse academies/classes
- Request enrollment (pending approval)
- Access approved classes (if `paymentStatus = 'PAID'`)
- Watch videos (tracked by VideoPlayState)
- Join live streams

**ADMIN role can:**
- View all platform analytics
- Monitor all academies, teachers, students
- Platform-wide access

---

## 💰 Payment Flow

### Academy Payment (Platform Subscription)

**Current State:** Academy has TWO status columns:
1. `status` - PENDING/APPROVED/REJECTED (**DEPRECATED** - always APPROVED now)
2. `paymentStatus` - NOT PAID/PAID (this is what matters)

**Flow:**
1. Academy signs up → `status = 'APPROVED'`, `paymentStatus = 'NOT PAID'`
2. Academy can browse but **cannot create classes** until paid
3. Academy purchases plan → `paymentStatus = 'PAID'`
4. Now academy can create classes, add teachers, etc.

**Key Restriction:**
```typescript
// In AcademyClassesPage.tsx
<button
  disabled={paymentStatus === 'NOT PAID'}
  title="Debes comprar un plan desde la página Facturas para crear clases"
>
  Nueva Clase
</button>
```

### Student Payment (Class Enrollment)

**Flow:**
1. Student enrolls in class → `status = 'PENDING'`, `paymentStatus = 'PENDING'`
2. Academy approves enrollment → `status = 'APPROVED'`
3. Student tries to access class → PaymentModal appears
4. Student selects payment method:
   - **Cash:** `paymentStatus = 'CASH_PENDING'` → waits for academy approval
   - **Stripe/Bizum:** Not implemented (shows "Próximamente")
5. Academy approves cash payment → `paymentStatus = 'PAID'`
6. Student signs enrollment document → `documentSigned = 1`
7. Student can now access class content

**Free Classes:**
- If `Class.price = 0` → Auto-set `paymentStatus = 'PAID'`

---

## 🏗️ Architecture

### Two-Worker System

**1. Frontend Worker (`akademo`)**
- **Location:** Root directory
- **Deploy:** `npx @opennextjs/cloudflare build && npx wrangler deploy`
- **URL:** https://akademo-edu.com
- **Purpose:** Next.js UI pages

**2. Backend API Worker (`akademo-api`)**
- **Location:** `workers/akademo-api/`
- **Deploy:** `cd workers/akademo-api && npx wrangler deploy`
- **URL:** https://akademo-api.alexxvives.workers.dev
- **Purpose:** Hono API routes

### API Routes (17 Groups)

Located in `workers/akademo-api/src/routes/`:

1. **auth.ts** - Registration, login, email verification
2. **academies.ts** - Academy CRUD, teachers, students
3. **classes.ts** - Class CRUD
4. **enrollments.ts** - Student enrollment approval
5. **lessons.ts** - Lesson CRUD
6. **videos.ts** - Video management, watch progress
7. **live.ts** - Zoom streaming
8. **bunny.ts** - Bunny Stream integration
9. **storage.ts** - R2 file operations
10. **webhooks.ts** - Zoom webhooks
11. **notifications.ts** - Notification system
12. **analytics.ts** - Platform analytics
13. **explore.ts** - Public academy/class browsing
14. **approvals.ts** - Approval workflows
15. **requests.ts** - Join requests (student/teacher)
16. **users.ts** - User management
17. **payments.ts** - Payment processing

### Frontend Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── admin/          # Admin UI
│   │   ├── academy/        # Academy owner UI
│   │   ├── teacher/        # Teacher UI
│   │   └── student/        # Student UI
│   ├── join/[academyId]/   # Public enrollment flow
│   └── page.tsx            # Landing page
├── components/
│   ├── AuthModal.tsx
│   ├── PaymentModal.tsx
│   ├── DashboardLayout.tsx
│   └── ProtectedVideoPlayer.tsx
├── hooks/
│   ├── useRegistrationData.ts
│   └── useTeacherDashboard.ts
└── lib/
    ├── api-client.ts       # Fetch wrapper
    ├── auth.ts             # Auth utilities
    └── db.ts               # Type definitions
```

---

## 🚀 Deployment

### Automatic (GitHub Actions)

**Primary method - just push to main!**

```bash
git add .
git commit -m "Your changes"
git push
```

- Changes in `workers/akademo-api/**` → Deploys API worker
- Changes in `src/**`, `public/**`, etc. → Deploys frontend worker
- Check status: https://github.com/alexxvives/Akademo/actions

### Manual (Backup)

**API Worker:**
```bash
cd workers/akademo-api
npx wrangler deploy
cd ../..
```

**Frontend Worker (MUST be from root):**
```bash
npx @opennextjs/cloudflare build
npx wrangler deploy
```

**⚠️ IMPORTANT:** Always deploy API first, then frontend (frontend depends on API)

### Database Migrations

**Apply migration:**
```bash
npx wrangler d1 execute akademo-db --remote --file=migrations/0026_example.sql
```

**Query database:**
```bash
npx wrangler d1 execute akademo-db --remote --command "SELECT * FROM User LIMIT 5"
```

---

## 🔧 Common Tasks

### Add New API Endpoint

1. **Create route in `workers/akademo-api/src/routes/`**

```typescript
// workers/akademo-api/src/routes/example.ts
import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const example = new Hono<{ Bindings: Bindings }>();

example.get('/', async (c) => {
  const session = await requireAuth(c);
  
  const result = await c.env.DB
    .prepare('SELECT * FROM Example WHERE userId = ?')
    .bind(session.id)
    .all();
  
  return c.json(successResponse(result.results));
});

export default example;
```

2. **Register in `workers/akademo-api/src/index.ts`**

```typescript
import example from './routes/example';

app.route('/example', example);
```

3. **Deploy API worker**

```bash
cd workers/akademo-api
npx wrangler deploy
```

### Add New Database Column

1. **Create migration file**

```sql
-- migrations/0027_add_example_column.sql
ALTER TABLE Academy ADD COLUMN exampleField TEXT DEFAULT NULL;
```

2. **Apply migration**

```bash
npx wrangler d1 execute akademo-db --remote --file=migrations/0027_add_example_column.sql
```

3. **Update TypeScript types in `src/types/database.ts`**

---

## 🐛 Troubleshooting

### Changes Not Appearing After Deployment

**Cause:** Next.js build cache  
**Fix:**
```bash
Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue
npx @opennextjs/cloudflare build
npx wrangler deploy
```

### "Not Authorized" Errors

**Likely causes:**
1. Deployed frontend but not API (API has the new route)
2. Session expired (check `academy_session` cookie)
3. Wrong role permission (check `requireAuth` logic)

**Fix:** Deploy API worker, then hard refresh browser

### D1 Timeout (30s limit)

**Cause:** Large video uploads exceed D1 operation timeout  
**Fix:** Two-step process:
1. Upload video to Bunny first (returns `bunnyGuid`)
2. Create lesson with `bunnyGuid` (fast DB operation)

### Zoom Recording Not Saved

**Check:**
1. Webhook URL configured in Zoom app
2. Webhook secret matches `ZOOM_WEBHOOK_SECRET`
3. Recording processing delay (Zoom needs 5-15 minutes)

**Debug:**
```bash
npx wrangler tail akademo-api --format pretty
```

---

## 📚 Key Concepts

### Approval Workflows

**Academy Creation:**
- Old: Admin approves academy (`status` column)
- New: Auto-approved, but `paymentStatus = 'NOT PAID'` blocks features

**Teacher Joining Academy:**
- Teacher requests to join → `Teacher.status = 'PENDING'`
- Academy owner approves → `Teacher.status = 'APPROVED'`

**Student Enrollment:**
- Student requests enrollment → `ClassEnrollment.status = 'PENDING'`
- Academy/Teacher approves → `ClassEnrollment.status = 'APPROVED'`
- Student pays → `ClassEnrollment.paymentStatus = 'PAID'`

### Video Anti-Piracy

**VideoPlayState table tracks:**
- `totalWatchTimeSeconds` - Cumulative watch time
- `lastPositionSeconds` - Resume position
- `status` - ACTIVE/COMPLETED/BLOCKED

**Logic:**
- If `totalWatchTime > (videoDuration * maxWatchTimeMultiplier)` → BLOCKED
- Default `maxWatchTimeMultiplier = 2.0` (can watch video twice)

### Zoom Integration

**Creating Live Stream:**
1. Teacher clicks "Stream" button
2. API creates Zoom meeting (`POST /live`)
3. Returns `zoomMeetingId`, `zoomLink`, `zoomStartUrl`
4. Stream stored in LiveStream table

**Recording Flow:**
1. Meeting ends → Zoom webhook `meeting.ended`
2. Zoom processes recording (5-15 min delay)
3. Zoom webhook `recording.completed`
4. API downloads recording → uploads to Bunny Stream
5. `LiveStream.recordingId = bunnyGuid`

**Participant Tracking:**
- After meeting ends, fetch participants from Zoom API
- Deduplicate by email/name
- Store in `LiveStream.participantsData` (JSON)

---

## ⚠️ Critical Rules

### NEVER

❌ Use `Academy.status` for access control (use `paymentStatus` instead)  
❌ Use `Teacher` table to identify academy owners (use `Academy.ownerId`)  
❌ Deploy frontend without deploying API if API changed  
❌ Use `localStorage` for sessions (use `academy_session` cookie)  
❌ Return generic errors (include context: `errorResponse(\`User ${id} not found\`, 404)`)  
❌ Use SQL string interpolation (use prepared statements: `.bind()`)  
❌ Create files >250 lines (refactor immediately)  
❌ Use `any` type (define explicit interfaces)

### ALWAYS

✅ Deploy API before frontend if both changed  
✅ Query database to verify schema before writing code  
✅ Use `successResponse(data)` and `errorResponse(message, code)` format  
✅ Check `paymentStatus` for academy feature access  
✅ Use TypeScript strict mode  
✅ Test SQL queries with `npx wrangler d1 execute` before deploying  
✅ Force clean build when changes don't appear  
✅ Run `npm run lint` before commit

---

## 🔍 Quick Queries

**Get academy owned by user:**
```sql
SELECT * FROM Academy WHERE ownerId = ? -- User.id where role = 'ACADEMY'
```

**Get classes taught by teacher:**
```sql
SELECT * FROM Class WHERE teacherId = ? -- User.id where role = 'TEACHER'
```

**Get classes in academy:**
```sql
SELECT c.* FROM Class c
JOIN Academy a ON c.academyId = a.id
WHERE a.ownerId = ?
```

**Get enrolled students:**
```sql
SELECT u.* FROM User u
JOIN ClassEnrollment e ON e.userId = u.id
WHERE e.classId = ? AND e.status = 'APPROVED' AND e.paymentStatus = 'PAID'
```

**Check if student can access class:**
```sql
SELECT * FROM ClassEnrollment 
WHERE userId = ? AND classId = ? 
  AND status = 'APPROVED' 
  AND paymentStatus = 'PAID'
  AND documentSigned = 1
```

---

## 📖 Documentation Files

- [README.md](../README.md) - Project overview
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) - Complete schema reference
- [PROJECT_DOCUMENTATION.md](../PROJECT_DOCUMENTATION.md) - Architecture details
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Deployment instructions
- [docs/payment-system.md](../docs/payment-system.md) - Payment implementation
- [docs/zoom-integration.md](../docs/zoom-integration.md) - Zoom API guide
- [docs/troubleshooting.md](../docs/troubleshooting.md) - Common issues
- [.github/copilot-instructions.md](../.github/copilot-instructions.md) - Coding standards

---

## 🎯 Common User Flows

### Academy Signs Up
1. Register with role=ACADEMY → `Academy.status='APPROVED'`, `paymentStatus='NOT PAID'`
2. Browse platform (can see UI but features disabled)
3. Purchase plan → `paymentStatus='PAID'`
4. Create classes, add teachers, approve students

### Teacher Joins Academy
1. Register with role=TEACHER
2. Request to join academy → `Teacher.status='PENDING'`
3. Academy owner approves → `Teacher.status='APPROVED'`
4. Create lessons, host streams

### Student Enrolls in Class
1. Register with role=STUDENT
2. Browse academies → request enrollment → `ClassEnrollment.status='PENDING'`
3. Academy approves → `ClassEnrollment.status='APPROVED'`
4. Try to access class → PaymentModal appears
5. Pay (cash/stripe) → `paymentStatus='PAID'`
6. Sign enrollment document → `documentSigned=1`
7. Access class content

---

**Version:** 1.0 (January 2026)  
**Maintainer:** AKADEMO Development Team
