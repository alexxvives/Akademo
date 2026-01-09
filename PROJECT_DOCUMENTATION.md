# AKADEMO - Complete Project Documentation

**Last Updated:** January 9, 2026  
**Status:** Production - Live at https://akademo-edu.com

---

## Project Overview

AKADEMO is a comprehensive Learning Management System (LMS) deployed on Cloudflare's global network. The platform enables academies to manage teachers, students, classes, video lessons, live streaming, and comprehensive analytics.

### Key Statistics
- **Production URLs:**
  - Frontend: https://akademo-edu.com
  - API: https://akademo-api.alexxvives.workers.dev
- **Database:** 14 tables in Cloudflare D1
- **API Endpoints:** 64+ endpoints across 17 route groups
- **Storage:** Cloudflare R2 + Bunny Stream CDN
- **Live Streaming:** Zoom API integration

---

## Architecture

### Technology Stack

**Frontend:**
- Next.js 14.2.15 (App Router)
- TypeScript
- Tailwind CSS
- Deployed on Cloudflare Pages

**Backend:**
- Hono 4.0.0 (API framework)
- TypeScript
- Deployed on Cloudflare Workers

**Infrastructure:**
- Database: Cloudflare D1 (SQLite) - `akademo-db`
- Storage: Cloudflare R2 - `akademo-storage`
- Video CDN: Bunny Stream (Library 571240)
- Email: Resend API
- Live Streaming: Zoom API (Server-to-Server OAuth)

### Repository Structure

```
AKADEMO/
├── workers/
│   └── akademo-api/              # Backend API Worker
│       ├── src/
│       │   ├── routes/          # 17 API route groups
│       │   │   ├── auth.ts      # Authentication & verification
│       │   │   ├── academies.ts # Academy management
│       │   │   ├── classes.ts   # Class CRUD
│       │   │   ├── enrollments.ts
│       │   │   ├── lessons.ts
│       │   │   ├── videos.ts
│       │   │   ├── live.ts      # Zoom streaming
│       │   │   ├── bunny.ts     # Bunny Stream
│       │   │   ├── storage.ts   # R2 operations
│       │   │   ├── webhooks.ts  # Zoom webhooks
│       │   │   └── ... (8 more)
│       │   ├── lib/
│       │   │   ├── auth.ts      # Session management
│       │   │   ├── db.ts        # D1 database queries
│       │   │   ├── bunny-stream.ts
│       │   │   ├── zoom.ts
│       │   │   └── storage.ts
│       │   ├── index.ts         # Hono app entry
│       │   └── types.ts
│       ├── wrangler.toml        # Worker config
│       └── package.json
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── admin/          # Admin UI
│   │   │   ├── academy/        # Academy owner UI
│   │   │   ├── teacher/        # Teacher UI
│   │   │   └── student/        # Student UI
│   │   ├── join/[teacherId]/   # Enrollment flow
│   │   ├── verify-email/       # Email verification
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── AuthModal.tsx
│   │   ├── BunnyVideoPlayer.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── ProtectedVideoPlayer.tsx
│   ├── lib/
│   │   ├── api-client.ts       # API wrapper
│   │   ├── auth.ts             # Auth utilities
│   │   ├── db.ts               # Type-safe DB types
│   │   └── bunny-stream.ts
│   └── middleware.ts           # Route protection
├── migrations/                  # D1 migrations (11 files)
├── wrangler.toml               # Frontend Pages config
└── Documentation/
    ├── README.md
    ├── DATABASE_SCHEMA.md
    ├── DEPLOYMENT_CACHE_FIX.md
    └── ... (API docs)
```

---

## User Roles & Permissions

### 1. ADMIN
- Platform administrator
- View all analytics
- Monitor all academies, teachers, students
- Platform-wide access

### 2. ACADEMY
- **Identified by:** `Academy.ownerId = User.id`
- Own and manage their academy
- Add teachers to academy (Teacher table)
- Create classes
- Assign teachers to classes
- Approve student enrollments
- View academy analytics

### 3. TEACHER
- **Identified by:** `Teacher.userId = User.id` + `Teacher.academyId`
- Work within specific academies
- Manage assigned classes (`Class.teacherId`)
- Create lessons (videos, documents, live streams)
- Host Zoom classes
- View student progress for their classes

### 4. STUDENT
- Browse available classes
- Request enrollment
- Access approved class content
- Watch video lessons
- Join live streams
- Track personal progress

---

## Core Features

### 1. Academy Management
- Academy owners (ACADEMY role) manage their institution
- Add teachers via Teacher table
- Create classes and assign teachers
- View academy-wide analytics

### 2. Class Management
- Teachers create and manage classes
- Students enroll with approval workflow
- ClassEnrollment tracks status (PENDING, APPROVED, REJECTED)
- Classes contain lessons (videos, documents, live streams)

### 3. Video Lessons
- **Upload Flow:** Teacher → Bunny Stream API → Video record in DB
- **Storage:** Bunny Stream CDN (Library 571240)
- **Playback:** Token-based secure streaming
- **Progress:** VideoPlayState tracks watch progress per student
- **Resume:** Students continue where they left off

### 4. Live Streaming
- **Platform:** Zoom API (Server-to-Server OAuth)
- **Auto-Create:** Teacher clicks "Stream" → Zoom meeting created
- **Recording:** Cloud recording automatically uploaded to Bunny Stream
- **Attendance:** Participant tracking via Zoom API
- **Lesson Creation:** Convert recording to video lesson

### 5. Document Management
- PDF uploads to Cloudflare R2
- Secure download via signed URLs
- Document signing on enrollment

### 6. Email Verification
- Resend API integration
- 6-digit verification codes
- 10-minute expiry
- HTML email templates

### 7. Notifications
- In-app notification system
- Real-time updates for:
  - Enrollment approvals
  - New lessons
  - Live stream starts
  - Recording available

---

## Database Schema (Cloudflare D1)

**14 Tables** - See [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) for complete details

**Key Tables:**
- User (ADMIN, ACADEMY, TEACHER, STUDENT)
- Academy (linked to User via ownerId)
- Teacher (userId + academyId)
- Class (academyId + teacherId)
- ClassEnrollment (userId + classId + status)
- Lesson (classId + releaseDate)
- Video (bunnyGuid + lessonId)
- Document (R2 key + lessonId)
- LiveStream (zoomMeetingId + classId + recordingId)
- VideoPlayState (userId + videoId + progress)
- LessonRating (userId + lessonId + rating)
- Upload (metadata for all uploads)
- Notification (userId + type + data)
- DeviceSession (session management)

**Important Relationships:**
```sql
Academy.ownerId → User.id (ACADEMY role)
Teacher.userId → User.id (TEACHER role)
Teacher.academyId → Academy.id
Class.teacherId → User.id
Class.academyId → Academy.id
ClassEnrollment.userId → User.id (STUDENT role)
ClassEnrollment.classId → Class.id
Video.bunnyGuid → Bunny Stream video GUID
LiveStream.recordingId → Bunny Stream video GUID (after recording)
```

---

## API Documentation

**Base URL:** https://akademo-api.alexxvives.workers.dev

### Route Groups (17 total)

1. **`/auth`** - Authentication
   - POST `/auth/register` - Create account
   - POST `/auth/login` - Sign in
   - POST `/auth/logout` - Sign out
   - GET `/auth/me` - Current user
   - POST `/auth/send-verification` - Send email code
   - POST `/auth/verify-email` - Verify code

2. **`/academies`** - Academy Management
   - GET `/academies` - List academies
   - POST `/academies` - Create academy
   - GET `/academies/:id` - Get academy
   - PATCH `/academies/:id` - Update academy
   - GET `/academies/classes` - Academy classes
   - GET `/academies/students` - Academy students
   - GET `/academies/teachers` - Academy teachers

3. **`/classes`** - Class Management
   - GET `/classes` - List classes
   - POST `/classes` - Create class
   - GET `/classes/:id` - Get class
   - PATCH `/classes/:id` - Update class
   - DELETE `/classes/:id` - Delete class

4. **`/enrollments`** - Student Enrollment
   - GET `/enrollments` - List enrollments
   - POST `/enrollments` - Request enrollment
   - PATCH `/enrollments/:id` - Approve/reject
   - GET `/enrollments/pending` - Pending requests
   - POST `/enrollments/sign-document` - Sign enrollment doc

5. **`/lessons`** - Lesson Management
   - GET `/lessons` - List lessons
   - POST `/lessons` - Create lesson
   - GET `/lessons/:id` - Get lesson
   - PATCH `/lessons/:id` - Update lesson
   - DELETE `/lessons/:id` - Delete lesson
   - POST `/lessons/create-with-uploaded` - Create with uploaded content
   - POST `/lessons/rating` - Rate lesson

6. **`/videos`** - Video Management
   - GET `/videos` - List videos
   - POST `/videos` - Create video record
   - GET `/videos/:id` - Get video
   - GET `/videos/progress` - Get progress
   - POST `/videos/progress` - Save progress
   - POST `/videos/progress/reset` - Reset progress

7. **`/live`** - Live Streaming
   - GET `/live` - List streams
   - POST `/live` - Create stream (Zoom meeting)
   - GET `/live/active` - Active streams
   - GET `/live/history` - Past streams
   - POST `/live/create-lesson` - Convert recording to lesson

8. **`/bunny`** - Bunny Stream
   - POST `/bunny/video/create` - Create video in Bunny
   - POST `/bunny/video/upload` - Upload video
   - GET `/bunny/video/:guid` - Get video details
   - GET `/bunny/video/:guid/status` - Get encoding status
   - GET `/bunny/video/:guid/stream` - Get stream URL

9. **`/storage`** - R2 Storage
   - GET `/storage/serve/:key` - Download file
   - POST `/storage/multipart/init` - Init multipart upload
   - POST `/storage/multipart/upload-part` - Upload part
   - POST `/storage/multipart/complete` - Complete upload
   - POST `/storage/multipart/abort` - Abort upload

10. **`/webhooks`** - Zoom Webhooks
    - POST `/webhooks/zoom` - Zoom event handler

11. **`/notifications`** - Notifications
    - GET `/notifications` - List notifications
    - POST `/notifications` - Create notification
    - PATCH `/notifications/:id` - Mark as read
    - DELETE `/notifications/:id` - Delete notification

12. **`/analytics`** - Analytics
    - GET `/analytics` - Platform analytics

13. **`/explore`** - Public Browsing
    - GET `/explore/academies` - Browse academies
    - GET `/explore/academies/:id/classes` - Academy classes
    - GET `/explore/academies/:id/teachers` - Academy teachers
    - GET `/explore/enrolled-academies/classes` - Student's enrolled classes

14. **`/approvals`** - Approval Management
    - GET `/approvals/teacher` - Teacher approvals
    - POST `/approvals/teacher` - Approve/reject
    - GET `/approvals/academy` - Academy approvals

15. **`/requests`** - Join Requests
    - GET `/requests/student` - Student requests
    - GET `/requests/teacher` - Teacher requests

16. **`/users`** - User Management
    - POST `/users/create-student` - Create student
    - POST `/users/create-teacher` - Create teacher

17. **`/documents`** - Document Management
    - GET `/documents` - List documents
    - POST `/documents` - Upload document

### Authentication
All endpoints (except `/auth/*` and `/explore/*`) require session authentication via `academy_session` cookie.

**Session Format:**
- Cookie: `academy_session` (base64 encoded)
- Decoded: `{ id, email, role, firstName, lastName }`
- Validation: Session checked against DeviceSession table

---

## Deployment

### Frontend (Cloudflare Pages)

**Command:**
```bash
Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue
npx @opennextjs/cloudflare build
npx wrangler deploy
```

**Why?** Next.js caching can prevent changes from appearing. Always clean build.

**Config:** `wrangler.toml` (root)

### API Worker

**Command:**
```bash
cd workers/akademo-api
npm run deploy
```

**Config:** `workers/akademo-api/wrangler.toml`

### Database Migrations

**Apply to Production:**
```bash
npx wrangler d1 migrations apply akademo-db --remote
```

**Test Locally:**
```bash
npx wrangler d1 migrations apply akademo-db --local
```

### Secrets (Configured)

**Bunny Stream:**
- `BUNNY_STREAM_API_KEY` ✅
- `BUNNY_STREAM_TOKEN_KEY` ✅

**Zoom:**
- `ZOOM_ACCOUNT_ID` ✅
- `ZOOM_CLIENT_ID` ✅
- `ZOOM_CLIENT_SECRET` ✅
- `ZOOM_WEBHOOK_SECRET` ✅

**Email:**
- `RESEND_API_KEY` ✅

**Add Secret:**
```bash
echo "secret-value" | npx wrangler secret put SECRET_NAME
```

---

## Development

### Frontend
```bash
npm run dev  # http://localhost:3000
```

### API Worker
```bash
cd workers/akademo-api
npm run dev  # http://localhost:8787
```

### Database
```bash
# Execute query
npx wrangler d1 execute akademo-db --remote --command "SELECT * FROM User LIMIT 5"

# Table structure
npx wrangler d1 execute akademo-db --remote --command "PRAGMA table_info(User)"
```

### Logs
```bash
# Real-time API logs
npx wrangler tail
```

---

## Troubleshooting

### Changes Not Appearing
**Cause:** Next.js build cache  
**Fix:** Use clean build command (see DEPLOYMENT_CACHE_FIX.md)

### API Errors
**Check logs:**
```bash
npx wrangler tail
```

### Database Issues
**Test connection:**
```bash
npx wrangler d1 execute akademo-db --remote --command "SELECT 1"
```

### Video Upload Fails
**Check:**
- Bunny Stream API key configured
- Library ID correct (571240)
- File size < 5GB

---

## Important Notes

### Deprecated Features
- **AcademyMembership table** - Removed, replaced by Teacher table
- **Firebase integration** - Removed (old chat feature)
- **Old API routes in src/app/api/** - Removed, all routes now in workers/akademo-api

### Permission Model
- **ACADEMY role**: Use `Academy.ownerId` (NOT Teacher table)
- **TEACHER role**: Use `Teacher.userId` + `Teacher.academyId`
- **Class ownership**: Use `Class.teacherId` (direct User.id reference)

### Video Storage
- **Development**: Local testing not available (Bunny Stream required)
- **Production**: All videos in Bunny Stream Library 571240
- **Recordings**: Zoom recordings automatically uploaded to Bunny

---

## Support & Documentation

**Documentation Files:**
- [README.md](../README.md) - Main project overview
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) - Complete database schema
- [DEPLOYMENT_CACHE_FIX.md](../DEPLOYMENT_CACHE_FIX.md) - Deployment guide
- [workers/akademo-api/README.md](../workers/akademo-api/README.md) - API docs
- [ZOOM_PARTICIPANT_TRACKING.md](../ZOOM_PARTICIPANT_TRACKING.md) - Zoom features
- [ZOOM_SCOPE_FIX.md](../ZOOM_SCOPE_FIX.md) - Zoom OAuth setup

**Cloudflare Resources:**
- Dashboard: https://dash.cloudflare.com
- Workers: https://akademo-api.alexxvives.workers.dev
- Pages: https://akademo-edu.com

---

**Project Status:** ✅ Production - Fully Deployed  
**Last Major Update:** January 9, 2026 - Deep codebase cleanup
