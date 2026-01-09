# AKADEMO

A modern learning management platform for academies, teachers, and students with live streaming, video lessons, and comprehensive class management.

## 🎯 Overview

AKADEMO is a complete learning management system (LMS) deployed on Cloudflare's global network. It features:

- 🏫 **Multi-Academy Platform** - Unlimited academies with owner management
- 👨‍🏫 **Teacher Management** - Teachers work within academies, manage classes
- 🎥 **Live Streaming** - Integrated Zoom meetings with automatic recording
- 📹 **Video Hosting** - Bunny Stream CDN for fast, reliable video delivery
- 📊 **Analytics** - Track student progress, class performance, and engagement
- 🔒 **Role-Based Access** - ADMIN, ACADEMY, TEACHER, STUDENT roles

## 🚀 Deployment Info

**Production URLs:**
- Frontend: https://akademo-edu.com
- API Worker: https://akademo-api.alexxvives.workers.dev

**Architecture:**
- Frontend: Next.js 14 on Cloudflare Pages
- Backend: Hono API on Cloudflare Workers
- Database: Cloudflare D1 (SQLite)
- Storage: Cloudflare R2 + Bunny Stream
- Live Streaming: Zoom API integration
- Email: Resend API for verification

**Development:**
```bash
# Frontend
npm run dev

# API Worker (in workers/akademo-api/)
cd workers/akademo-api
npm run dev
```

**Documentation:**
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Complete database schema
- [DEPLOYMENT_CACHE_FIX.md](./DEPLOYMENT_CACHE_FIX.md) - Deployment best practices
- [workers/akademo-api/README.md](./workers/akademo-api/README.md) - API documentation

## 🔐 Security Features

### 1. Dynamic Watermarking
Student name and email appear as semi-transparent overlays at random positions and intervals. Makes screen recordings traceable.

### 2. Play Count Limits
Configurable maximum plays per video (default: 2). Counts as "played" when reaching 90%+ of video duration.

### 3. Seek-Back Restrictions
Students can only rewind up to X minutes (default: 10) from their furthest watched point. Prevents easy content copying.

### 4. Single Active Session
Only one active login per student. Device fingerprinting automatically terminates sessions on other devices.

### 5. No Direct Downloads
Videos served via secure streaming endpoints. Right-click and download buttons disabled.

### 6. Progress Tracking
All viewing progress saved server-side. Students resume from last position with all restrictions enforced.

## 📚 Documentation

- **[INSTALL.md](./INSTALL.md)** - Step-by-step installation (start here!)
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Complete feature guide and tutorials
- **[SETUP.md](./SETUP.md)** - Technical documentation and deployment
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Full project overview

## 🏗️ Architecture

### Tech Stack
- **Frontend:** Next.js 14.2.15 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Hono 4.0.0 on Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite) - `akademo-db`
- **Storage:** Cloudflare R2 (`akademo-storage`) + Bunny Stream (Library 571240)
- **Live Streaming:** Zoom API (Server-to-Server OAuth)
- **Email:** Resend API for verification
- **Deployment:** Cloudflare Pages + Workers

### Project Structure
```
AKADEMO/
├── workers/
│   └── akademo-api/         # Backend API Worker
│       ├── src/
│       │   ├── routes/      # 17 API route groups
│       │   ├── lib/         # Auth, DB, Storage utilities
│       │   ├── index.ts     # Hono app entry
│       │   └── types.ts     # TypeScript definitions
│       ├── wrangler.toml    # Worker config
│       └── package.json
├── src/
│   ├── app/
│   │   ├── dashboard/       # Admin, Teacher, Student UIs
│   │   ├── join/           # Student enrollment
│   │   ├── verify-email/   # Email verification
│   │   └── page.tsx        # Landing page
│   ├── components/         # React components
│   ├── lib/               # Frontend utilities
│   └── middleware.ts      # Auth middleware
├── migrations/            # D1 database migrations
├── wrangler.toml         # Frontend Pages config
└── Documentation files
```

## 🎓 User Roles

### ADMIN
- Platform administrator with full access
- View all platform analytics
- Monitor all academies, teachers, and students
- Platform-wide oversight

### ACADEMY
- Academy owner (identified by `Academy.ownerId`)
- Create and manage their academy
- Add teachers to academy (via Teacher table)
- Create classes and assign teachers
- Approve student enrollments
- View academy-wide analytics
- Manage academy settings

### TEACHER
- Works within an academy (`Teacher.academyId`)
- Assigned to specific classes (`Class.teacherId`)
- Create lessons (videos, documents, live streams)
- Manage class enrollments
- View student progress for their classes
- Host live Zoom classes

### STUDENT
- Browse available classes
- Request enrollment in classes
- Access enrolled class content after approval
- Watch video lessons
- Join live streams
- Track personal progress

## 🎥 Video Features

### Video Hosting
- **Bunny Stream CDN** - Global video delivery network
- **Automatic Encoding** - Multi-quality adaptive streaming
- **Direct Upload** - Teachers upload directly to Bunny Stream
- **Secure Playback** - Token-based authentication

### Live Streaming
- **Zoom Integration** - Automatic meeting creation
- **Cloud Recording** - Recordings automatically uploaded to Bunny Stream
- **Participant Tracking** - Automatic attendance tracking
- **Lesson Creation** - Convert recordings to video lessons

### Progress Tracking
- **Resume Playback** - Students continue where they left off
- **Watch History** - Track video completion
- **Analytics** - View watching patterns and engagement

## 📊 Database (Cloudflare D1)

**14 Tables** - See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete details

### Core Tables
- **User** - All users (ADMIN, ACADEMY, TEACHER, STUDENT roles)
- **Academy** - Educational institutions (linked to User via `ownerId`)
- **Teacher** - Teachers working in academies (`userId` + `academyId`)
- **Class** - Courses within academies (assigned to `teacherId`)
- **ClassEnrollment** - Student enrollments with approval status
- **Lesson** - Class lessons with release dates
- **Video** - Bunny Stream hosted videos (`bunnyGuid`)
- **Document** - PDF/document files in R2 storage
- **LiveStream** - Zoom meetings with recording metadata
- **VideoPlayState** - Student watch progress
- **LessonRating** - Student lesson ratings
- **Upload** - File upload metadata
- **Notification** - User notifications
- **DeviceSession** - Session management

**Deprecated:** `AcademyMembership` table removed - replaced by Teacher table

## 🚀 Deployment

### Frontend (Cloudflare Pages)

**Always use clean build for visible changes:**
```bash
Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue
npx @opennextjs/cloudflare build
npx wrangler deploy
```

See [DEPLOYMENT_CACHE_FIX.md](./DEPLOYMENT_CACHE_FIX.md) for details.

### API Worker
```bash
cd workers/akademo-api
npm run deploy
```

### Database Migrations
```bash
# Apply migrations to production D1
npx wrangler d1 migrations apply akademo-db --remote

# Test locally
npx wrangler d1 migrations apply akademo-db --local
```

### Secrets Configuration
See [workers/akademo-api/README.md](./workers/akademo-api/README.md) for required secrets:
- Bunny Stream API keys
- Zoom OAuth credentials
- Resend API key

### Environment Variables
Configured in `wrangler.toml` files:
- Frontend: Root `wrangler.toml`
- API: `workers/akademo-api/wrangler.toml`

## 🔧 Configuration

### Video Settings Hierarchy

Settings cascade with priority (most specific wins):

```
Platform Defaults (admin sets)
  ↓
Academy Defaults (optional override)
  ↓
Class Defaults (optional override)
  ↓
Video Specific (optional override)
```

**Example:**
- Platform: maxPlays = 2
- Academy "Math Academy": maxPlays = 3
- Class "Calculus 101": not set (inherits 3)
- Video "Derivatives": maxPlays = 5
- **Result:** Student can watch "Derivatives" 5 times

## 🛠️ Development Commands

### Frontend
```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run deploy       # Deploy to Cloudflare Pages
```

### API Worker
```bash
cd workers/akademo-api
npm run dev          # Start local worker
npm run deploy       # Deploy to Cloudflare Workers
npm run tail         # View production logs
```

### Database (D1)
```bash
# Execute SQL queries
npx wrangler d1 execute akademo-db --remote --command "SELECT * FROM User LIMIT 5"

# Apply migrations
npx wrangler d1 migrations apply akademo-db --remote

# Check table structure
npx wrangler d1 execute akademo-db --remote --command "PRAGMA table_info(User)"
```

### Secrets Management
```bash
# Add secret to worker
echo "secret-value" | npx wrangler secret put SECRET_NAME

# List configured secrets
npx wrangler secret list
```

## 📁 API Documentation

**Base URL:** https://akademo-api.alexxvives.workers.dev

**17 Route Groups** with 64+ endpoints:

- `/auth` - Authentication & email verification
- `/academies` - Academy management
- `/classes` - Class CRUD operations
- `/enrollments` - Student enrollment management
- `/teachers` - Teacher management (DEPRECATED: use `/users`)
- `/lessons` - Lesson creation and management
- `/videos` - Video metadata and progress
- `/documents` - Document management
- `/live` - Live streaming with Zoom
- `/bunny` - Bunny Stream integration
- `/storage` - R2 file operations
- `/webhooks` - Zoom webhook handlers
- `/notifications` - User notifications
- `/analytics` - Platform analytics
- `/explore` - Public academy/class browsing
- `/approvals` - Enrollment approvals
- `/requests` - Join requests
- `/users` - User management

**Full API Documentation:** [workers/akademo-api/README.md](./workers/akademo-api/README.md)

## 🧪 Testing

### Check Production Status
```bash
# API Worker health check
curl https://akademo-api.alexxvives.workers.dev/

# Should return:
# {"status":"ok","service":"akademo-api","version":"3.0","routes":17}
```

### Test Accounts
See database for current test accounts:
```bash
npx wrangler d1 execute akademo-db --remote --command "SELECT email, role FROM User"
```

## 🐛 Troubleshooting

### Changes Not Appearing After Deploy
**Solution:** Always use clean build command (see [DEPLOYMENT_CACHE_FIX.md](./DEPLOYMENT_CACHE_FIX.md))

### API Worker Errors
```bash
# View real-time logs
npx wrangler tail

# Check worker status
npx wrangler deployments list
```

### Database Issues
```bash
# Test D1 connection
npx wrangler d1 execute akademo-db --remote --command "SELECT 1"

# View table structure
npx wrangler d1 execute akademo-db --remote --command "PRAGMA table_info(TableName)"

# Check bindings
npx wrangler whoami
```

### Video Upload Fails
- Check Bunny Stream API key is configured
- Verify `BUNNY_STREAM_LIBRARY_ID` is correct (571240)
- Check worker logs for upload errors

## ✨ Features

✅ **Deployed & Production Ready** - Live at akademo-edu.com  
✅ **Separate API Worker** - Scalable backend on Cloudflare Workers  
✅ **Cloudflare D1 Database** - SQLite-based, globally distributed  
✅ **Bunny Stream CDN** - Fast global video delivery  
✅ **Zoom Integration** - Automated live streaming with recording  
✅ **Email Verification** - Resend API integration  
✅ **Role-Based Access** - 4 roles with granular permissions  
✅ **Progress Tracking** - Resume video playback  
✅ **Live Analytics** - Real-time platform metrics  
✅ **Document Management** - PDF uploads to R2 storage  
✅ **Notification System** - In-app notifications  
✅ **Responsive UI** - Tailwind CSS, mobile-friendly  
✅ **Clean Architecture** - Separated concerns, documented  

## 📚 Documentation Index

- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Complete D1 schema (14 tables)
- **[DEPLOYMENT_CACHE_FIX.md](./DEPLOYMENT_CACHE_FIX.md)** - Deployment best practices
- **[workers/akademo-api/README.md](./workers/akademo-api/README.md)** - API documentation
- **[ZOOM_PARTICIPANT_TRACKING.md](./ZOOM_PARTICIPANT_TRACKING.md)** - Zoom attendance tracking
- **[ZOOM_SCOPE_FIX.md](./ZOOM_SCOPE_FIX.md)** - Zoom OAuth configuration

## 📄 License

Proprietary - All Rights Reserved

---

**AKADEMO** - Modern Learning Management Platform  
Built with Next.js, Hono, Cloudflare, Bunny Stream, and Zoom
