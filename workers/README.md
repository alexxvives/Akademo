<<<<<<< HEAD
# AKADEMO API

Backend API for AKADEMO platform built with Cloudflare Workers and Hono.

## Architecture

This is a standalone API worker that handles:
- Authentication & authorization
- Database operations (Cloudflare D1)
- Business logic
- File storage (R2)
- Video streaming (Bunny CDN)

The frontend (Next.js) calls this API for all data operations.

## Setup

```bash
npm install
npm run dev        # Local development
npm run deploy     # Deploy to Cloudflare
```

## Environment Variables

Set these secrets with wrangler:
```bash
wrangler secret put BUNNY_STREAM_API_KEY
wrangler secret put BUNNY_STREAM_TOKEN_KEY
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY
```

## API Endpoints

### Auth
- `GET /auth/me` - Get current user
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout

### Classes
- `GET /classes` - Get user's classes

(More routes being migrated...)

## Development

The API runs on `https://api.akademo-edu.com` and accepts requests from:
- https://akademo-edu.com (production)
- http://localhost:3000 (development)
=======
# Academy Hive

A secure learning platform where academies manage classes, teachers, students, and **highly protected video lessons**.

## 🎯 Overview

Academy Hive is a complete learning management system (LMS) built with security and content protection as the top priority. It features:

- 🔒 **Strong Access Control** - Role-based permissions (Admin, Teacher, Student)
- 🎥 **Protected Videos** - Dynamic watermarking, play limits, seek restrictions
- 🚫 **Anti-Sharing** - Single active session per student with device fingerprinting
- 📊 **Progress Tracking** - Resume playback, view analytics
- 🏢 **Multi-Academy** - Platform supports unlimited academies

## ⚡ Quick Start

### Installation (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Set up database (update .env with your DATABASE_URL)
npx prisma migrate dev --name init

# 3. Seed demo data
npx prisma db seed

# 4. Start dev server
npm run dev

# 5. Open http://localhost:3000
```

**Demo Accounts:**
- Admin: `admin@academyhive.com` / `admin123`
- Teacher: `teacher@example.com` / `teacher123`
- Student: `student@example.com` / `student123`

**💡 New to the project?** Authentication uses modal popups - click "Login" or "Get Started" on the homepage!

👉 **Detailed guide:** See [INSTALL.md](./INSTALL.md)  
👉 **Recent updates:** See [UPDATE_INSTRUCTIONS.md](./UPDATE_INSTRUCTIONS.md)

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
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Custom session-based (HTTP-only cookies)
- **Storage:** Local (dev) / Cloudflare R2 (production)
- **Deployment:** Cloudflare Pages/Workers ready

### Project Structure
```
akademo/
├── prisma/              # Database schema and migrations
├── src/
│   ├── app/
│   │   ├── api/        # Backend API routes
│   │   ├── dashboard/  # Admin, Teacher, Student dashboards
│   │   ├── login/      # Authentication pages
│   │   └── page.tsx    # Landing page
│   ├── components/     # React components
│   ├── lib/           # Utilities and helpers
│   └── middleware.ts  # Route protection
├── .env               # Environment variables
└── Documentation files
```

## 🎓 User Roles

### Admin
- View all platform statistics and analytics
- Monitor all academies, teachers, and students
- Set global default settings for video protection
- Platform-wide oversight

### Teacher
- **Instant Start**: Academy automatically created on signup - no approval needed!
- Create and manage classes
- Upload videos and documents immediately
- Configure video protection settings (play limits, seek-back)
- Approve student membership requests
- Enroll students in classes
- View student progress and analytics

### Student
- Browse all available teachers and their academies
- Request to join academies (teacher approval required)
- Access enrolled classes after approval
- Watch protected video lessons with watermarking
- Track personal progress
- View plays remaining per video

## 🎥 Video Protection in Action

When a student watches a video:

1. **Session Check** - Validates active session, logs out other devices if needed
2. **Enrollment Check** - Verifies student is enrolled in the class
3. **Play State Load** - Retrieves progress, plays used, furthest point
4. **Stream Begins** - Video served securely (no direct URL)
5. **Watermark Appears** - Student name + email overlay at random positions
6. **Progress Tracking** - Position saved every 5 seconds
7. **Seek Enforcement** - Server validates all seek attempts
8. **Play Count** - Increments when reaching 90%+ completion

## 📊 Database Models

### Core Models
- **User** - All platform users with role-based access
- **Academy** - Learning institutions with approval workflow
- **AcademyMembership** - User-academy relationships
- **Class** - Courses within academies
- **ClassEnrollment** - Student enrollment tracking
- **Video** - Protected video content
- **VideoPlayState** - Per-student progress and play tracking
- **DeviceSession** - Active session enforcement
- **Upload** - File metadata and storage paths
- **Document** - PDF and document files
- **PlatformSettings** - Global configuration
- **BillingConfig** - Future payment integration

## 🚀 Deployment

### Recommended: Cloudflare Pages + Workers

```bash
# 1. Set up production database (Neon, Supabase, etc.)
# 2. Configure R2 for video storage
# 3. Set environment variables
# 4. Build and deploy

npm run build
npx wrangler pages deploy .next
```

### Environment Variables (Production)
```env
DATABASE_URL=postgresql://...
SESSION_SECRET=<generate-secure-random-key>
STORAGE_TYPE=r2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

See [SETUP.md](./SETUP.md) for detailed deployment instructions.

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

```bash
# Start development server
npm run dev

# Build for production
npm run build

# View database in GUI
npx prisma studio

# Run migrations
npx prisma migrate dev

# Reset database (WARNING: deletes data)
npx prisma migrate reset

# Seed demo data
npx prisma db seed

# Generate Prisma client
npx prisma generate
```

## 📁 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user

### Academies & Classes
- `GET/POST /api/academies` - List/create academies
- `PATCH /api/academies/[id]` - Update academy status
- `GET/POST /api/classes` - List/create classes
- `GET/POST /api/enrollments` - Manage enrollments

### Videos
- `GET/POST /api/videos` - List/upload videos
- `GET /api/video/stream/[id]` - Stream video (protected)
- `GET/POST /api/video/progress` - Track watch progress

### Membership & Sessions
- `GET/POST /api/memberships` - Academy join requests
- `PATCH /api/memberships/[id]` - Approve/reject
- `GET/POST /api/session/check` - Validate active session

Full API documentation in [SETUP.md](./SETUP.md)

## 🧪 Testing

### Test All Roles
```bash
# After seeding, use these accounts:
Admin:   admin@academyhive.com / admin123
Teacher: teacher@example.com / teacher123
Student: student@example.com / student123
```

### Test Video Protection
1. Login as teacher, upload an MP4 video
2. Set maxPlays to 1 (for quick testing)
3. Login as student, watch video to completion
4. Try watching again - should be blocked

### Test Session Enforcement
1. Login as student in Chrome
2. Login as same student in Firefox
3. Chrome session should be terminated

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npx prisma db pull

# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

### Video Won't Play
- Verify file is in `./uploads/videos/`
- Check student is enrolled in class
- Ensure video is MP4 format
- Check browser console for errors

See [INSTALL.md](./INSTALL.md) for more troubleshooting tips.

## 📈 What's Included

✅ Complete authentication system with role-based access  
✅ Custom video player with watermarking and restrictions  
✅ Device fingerprinting and session enforcement  
✅ Progress tracking and resume functionality  
✅ Academy and class management workflows  
✅ Student enrollment and approval systems  
✅ Secure video streaming with access control  
✅ Admin dashboard for platform oversight  
✅ Teacher dashboard for content management  
✅ Student dashboard for learning  
✅ Comprehensive documentation  
✅ Demo data for immediate testing  
✅ Production-ready architecture  
✅ Cloudflare deployment support  

## 🚀 Next Steps

1. ✅ **Install** - Follow [INSTALL.md](./INSTALL.md)
2. ✅ **Explore** - Read [GETTING_STARTED.md](./GETTING_STARTED.md)
3. ✅ **Test** - Try all features with demo accounts
4. ✅ **Customize** - Update branding and styling
5. ✅ **Deploy** - Follow [SETUP.md](./SETUP.md) for production

## 📄 License

Proprietary - All Rights Reserved

---

**Built with ❤️ for Academy Hive**  
Secure, scalable learning platform with advanced video protection.
>>>>>>> f24ea82795dafc5341396e30094ad22af463a926
