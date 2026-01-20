# GitHub Copilot Instructions for AKADEMO Project

**Last Updated**: January 19, 2026  
**Architecture**: Two-worker system (Frontend + API)  
**Stack**: Next.js 14, Cloudflare Workers, D1, Hono, TypeScript

---

## 🧩 RULES OF ENGAGEMENT (2026 SOTA)

### Rule #1: Search Before You Act
**MANDATORY**: Before ANY code change, verify current state:
```powershell
# Check database schema
npx wrangler d1 execute akademo-db --remote --command "PRAGMA table_info(TableName)"

# Check component size (must be <250 lines)
(Get-Content path/to/file.tsx).Count

# Search for existing implementations
grep_search or semantic_search to find patterns
```

### Rule #2: Follow Standard Operating Procedures (SOPs)

| SOP | Purpose | Command |
|-----|---------|---------|
| **SOP-01** | Clean deployment | `Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue; npx @opennextjs/cloudflare build; npx wrangler deploy` |
| **SOP-02** | API worker deploy | `cd workers/akademo-api; npx wrangler deploy` |
| **SOP-03** | Test DB query | `npx wrangler d1 execute akademo-db --remote --command "SQL"` |
| **SOP-04** | Check worker logs | `npx wrangler tail akademo --format pretty` |

### Rule #3: The 250-Line Law
- **HARD LIMIT**: No component/file > 250 lines
- **ENFORCEMENT**: If a file exceeds 250 lines during editing, STOP and refactor
- **ACTION**: Extract into `/components/[feature]/` or `/hooks/`

### Rule #4: The Schema-First Protocol
Before writing API code:
1. Run SOP-03 to verify table schema matches expectations
2. If schema doesn't exist or is wrong → Create migration file FIRST
3. Never assume data exists → Test queries before deploying

### Rule #5: The Two-Worker Discipline
**Frontend** (`akademo`): `src/app/`, `src/components/`, `src/hooks/`  
**API** (`akademo-api`): `workers/akademo-api/src/`

**Deploy Rule**:
- API changes → Deploy API worker FIRST (SOP-02), then frontend (SOP-01)
- Frontend only → Deploy frontend only (SOP-01)
- Never deploy frontend alone if API routes changed

---

## 🚫 FORBIDDEN PATTERNS (Negative Constraints)

### Absolutely NEVER Do These:

❌ **Use `any` type** → Always define explicit interfaces  
❌ **Deploy without clean build** → Always use SOP-01  
❌ **Ignore TypeScript errors** → Fix before deploying  
❌ **Create files >250 lines** → Refactor immediately  
❌ **Use `localStorage` for sessions** → Use `academy_session` cookie  
❌ **Hardcode environment variables** → Use `c.env.VAR` (Hono) or `process.env` (Next.js)  
❌ **Return generic errors** → Include specific values: `errorResponse(\`User ${id} not found\`, 404)`  
❌ **Assume database data exists** → Always test queries first (SOP-03)  
❌ **Use index as React key** → Use stable IDs: `key={item.id}`  
❌ **Chain async operations in loops** → Use `Promise.all()` or batch queries  
❌ **Forget null safety** → Use `(data || []).filter()` pattern  
❌ **Create duplicate endpoints** → Check existing routes with grep_search  
❌ **Use Teacher table for ACADEMY role** → ACADEMY = `Academy.ownerId`, TEACHER = `Teacher.userId`  
❌ **Skip deployment after code changes** → ALWAYS deploy (SOP-01 or SOP-02)  
❌ **Use `npm run deploy`** → Reuses cache, changes won't appear. Use SOP-01.

---

## 🏗️ TWO-WORKER ARCHITECTURE

### Frontend Worker: `akademo`
- **URL**: https://akademo.alexxvives.workers.dev
- **Location**: Root directory (`./`)
- **Contains**: Next.js app (UI, pages, components)
- **Deploy**: SOP-01

### Backend API Worker: `akademo-api`
- **URL**: https://akademo-api.alexxvives.workers.dev
- **Location**: `workers/akademo-api/`
- **Contains**: Hono API (all routes: /auth, /live, /classes, etc.)
- **Deploy**: SOP-02

### Deployment Sequence
```powershell
# API changes → Deploy API first
cd workers/akademo-api; npx wrangler deploy

# Then deploy frontend (if UI also changed)
cd ..; Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue; npx @opennextjs/cloudflare build; npx wrangler deploy
```

---

## 🛠️ ENVIRONMENT VARIABLES & CONFIGURATION

### Frontend (Next.js)
```typescript
// ✅ CORRECT - Public variables in Next.js
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ❌ FORBIDDEN - Exposing secrets
const apiKey = process.env.BUNNY_API_KEY; // Never in frontend!
```

### Backend (Hono)
```typescript
// ✅ CORRECT - Access via context
app.get('/example', async (c) => {
  const apiKey = c.env.BUNNY_STREAM_API_KEY;
  return c.json({ success: true });
});

// ❌ FORBIDDEN - process.env doesn't work in Workers
const key = process.env.BUNNY_API_KEY;
```

### Setting Secrets
```powershell
# Cloudflare Workers secrets
npx wrangler secret put SECRET_NAME
```

---

## 🗄️ DATABASE & MIGRATIONS PROTOCOL

### Migration Creation (Schema Changes)
**When**: Anytime you add/remove/modify table columns

**Steps**:
1. Create new migration file: `migrations/XXXX_descriptive_name.sql`
2. Increment number (check last migration number)
3. Write UP migration (CREATE/ALTER statements)
4. Test locally: `npx wrangler d1 execute akademo-db --local --file=migrations/XXXX_file.sql`
5. Apply remote: `npx wrangler d1 execute akademo-db --remote --file=migrations/XXXX_file.sql`
6. Commit migration file to git

**Example**:
```sql
-- migrations/0017_add_user_preferences.sql
ALTER TABLE User ADD COLUMN preferences TEXT DEFAULT '{}';
```

### Database Conventions

**Table Names**: Singular (✅ `User`, `Academy`, `Class` | ❌ `Users`, `Academies`)

**Column Names**:
- ✅ `userId` (unified user reference)
- ❌ `studentId` or `teacherId` (use `userId` with role check)

**Key Relationships**:
- `Academy.ownerId` → User.id (ACADEMY role - WHO OWNS)
- `Teacher.userId` → User.id (TEACHER role - WHO WORKS IN academy)
- `Class.teacherId` → User.id (Teacher ASSIGNED to class)
- `ClassEnrollment.userId` → User.id (STUDENT role)

**Deprecated**:
- ❌ `AcademyMembership` table - Replaced by `Teacher`

---

## 📂 PROJECT STRUCTURE (State-of-the-Art)

```
src/
├── app/                          # Next.js App Router (<200 lines per page)
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page (orchestrator only)
│   └── dashboard/               # Protected routes
│       ├── [role]/              # Role-based dashboards
│       └── [role]/[feature]/    # Feature pages
│
├── components/                   # Feature-based organization
│   ├── ui/                      # Primitives (<100 lines each)
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── ErrorBoundary.tsx
│   ├── layout/                  # Dashboard infrastructure
│   │   ├── DashboardLayout.tsx  # Main orchestrator (<150 lines)
│   │   ├── Sidebar.tsx
│   │   ├── NotificationPanel.tsx
│   │   └── UserMenu.tsx
│   ├── auth/                    # Authentication forms
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ForgotPasswordForm.tsx
│   ├── video/                   # Video player components
│   │   ├── ProtectedPlayer.tsx
│   │   ├── WatermarkOverlay.tsx
│   │   └── ProgressTracker.tsx
│   ├── charts/                  # Data visualization
│   │   ├── BarChart.tsx
│   │   ├── LineChart.tsx
│   │   └── PieChart.tsx
│   └── landing/                 # Homepage sections
│       ├── Hero.tsx
│       ├── Features.tsx
│       └── Pricing.tsx
│
├── hooks/                        # Custom React hooks (<80 lines)
│   ├── useAuth.ts               # Cached auth state
│   ├── useClass.ts              # Class data fetching
│   └── useLessons.ts            # Lessons with polling
│
├── types/                        # TypeScript definitions
│   ├── api.ts                   # API response types
│   └── models.ts                # Domain entity types
│
└── lib/                          # Utilities (<150 lines)
    ├── api-client.ts            # Fetch wrapper
    ├── bunny-stream.ts          # Bunny CDN helpers
    └── multipart-upload.ts      # R2 upload helpers
```

---

## 💻 DEVELOPMENT STANDARDS

### API Development

**Response Format** (REQUIRED):
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ✅ CORRECT
return c.json({ success: true, data: user });
return errorResponse(`User ${id} not found`, 404);

// ❌ FORBIDDEN
return c.json({ user }); // Inconsistent format
return c.json({ error: 'Not found' }, 404); // No success field
```

**Error Handling** (REQUIRED):
```typescript
// ✅ CORRECT - Specific error with context
return errorResponse(`Teacher ${session.id} not found in academy ${academyId}`, 403);

// ❌ FORBIDDEN - Generic error
return errorResponse('Forbidden', 403);
```

**Database Queries**:
```typescript
// ✅ CORRECT - Prepared statements with bindings
const user = await db.prepare('SELECT * FROM User WHERE id = ?').bind(userId).first();

// ❌ FORBIDDEN - SQL injection risk
const user = await db.prepare(`SELECT * FROM User WHERE id = '${userId}'`).first();
```

**Permission Checks**:
```typescript
// ✅ CORRECT - Role-specific queries
if (session.role === 'ACADEMY') {
  const academy = await db.prepare('SELECT * FROM Academy WHERE ownerId = ?').bind(session.id).first();
}
if (session.role === 'TEACHER') {
  const teacher = await db.prepare('SELECT * FROM Teacher WHERE userId = ?').bind(session.id).first();
}

// ❌ FORBIDDEN - Using Teacher table for ACADEMY role
const teacher = await db.prepare('SELECT * FROM Teacher WHERE userId = ?').bind(session.id).first();
// ACADEMY users are NOT in Teacher table!
```

---

### Frontend Development

**Component Size Limits**:
| Type | Max Lines | Example |
|------|-----------|---------|
| Page Component | 150 | Orchestrates layout |
| Feature Component | 200 | Self-contained feature |
| UI Primitive | 100 | Button, Modal |
| Custom Hook | 80 | Data fetching |

**TypeScript Requirements**:
```typescript
// ✅ CORRECT - Explicit types
interface LessonResponse {
  id: string;
  title: string;
  videos: Video[];
}

const loadLessons = async (classId: string): Promise<void> => {
  const res = await apiClient<ApiResponse<Lesson[]>>(`/lessons?classId=${classId}`);
};

// ❌ FORBIDDEN - any type
const loadLessons = async (classId: any): Promise<any> => {
  const res = await fetch(`/lessons?classId=${classId}`);
};
```

**Null Safety**:
```typescript
// ✅ CORRECT
const filtered = (result.data || []).filter(x => x.active);

if (result.success && result.data) {
  const filtered = result.data.filter(x => x.active);
}

// ❌ FORBIDDEN - Will crash if undefined
const filtered = result.data.filter(x => x.active);
```

**React Keys**:
```typescript
// ✅ CORRECT
{items.map(item => <Item key={item.id} data={item} />)}

// ❌ FORBIDDEN
{items.map((item, index) => <Item key={index} data={item} />)}
```

**Performance Optimization**:
```typescript
// ✅ CORRECT - Memoize expensive computations
const filteredLessons = useMemo(() => 
  lessons.filter(l => l.status === 'active'),
  [lessons]
);

// ✅ CORRECT - Memoize callbacks
const handleSubmit = useCallback((data) => {
  // ...
}, [dependencies]);

// ❌ FORBIDDEN - Recreating on every render
const filteredLessons = lessons.filter(l => l.status === 'active');
const handleSubmit = (data) => { /* ... */ };
```

---

## 🐛 TROUBLESHOOTING PROTOCOL

### Common Error: `.open-next/worker.js not found`

**Cause**: Build failed but deployment continued (command chaining)

**Prevention**:
1. Always check build output for "Failed to compile"
2. Fix TypeScript errors BEFORE deploying
3. Use SOP-01 (clears cache first)

**Fix**:
```powershell
# Clear caches
Remove-Item -Recurse -Force .next, .open-next, node_modules

# Reinstall and rebuild
npm install
npx @opennextjs/cloudflare build
npx wrangler deploy
```

---

### D1 Timeout Error

**Cause**: Operation exceeds 30-second D1 timeout (usually video uploads)

**Solution**: Two-step upload workflow
1. Upload videos FIRST: `/api/bunny/video/upload`
2. Create lesson with video GUIDs: `/api/lessons/create-with-uploaded`

**See**: [docs/troubleshooting.md](docs/troubleshooting.md)

---

### Cache Issues (Changes don't appear)

**Symptoms**: Code changes work locally but not in production

**Solution**: Force clean build (SOP-01)
```powershell
Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue
npx @opennextjs/cloudflare build
npx wrangler deploy
```

**Post-deployment**: Force browser refresh (`Ctrl+Shift+R`)

---

## 📚 QUICK REFERENCE

### Key Documentation
- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) - Complete technical reference
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Database structure
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Two-worker architecture
- [docs/troubleshooting.md](docs/troubleshooting.md) - Common issues
- [docs/zoom-integration.md](docs/zoom-integration.md) - Zoom API & webhooks
- [docs/AGGRESSIVE_CLEANUP_REPORT.md](docs/AGGRESSIVE_CLEANUP_REPORT.md) - Refactoring roadmap

### Database Tables (14 total)
`User`, `Academy`, `Teacher`, `Class`, `ClassEnrollment`, `Lesson`, `Video`, `Document`, `Upload`, `LiveStream`, `LessonRating`, `VideoPlayState`, `Notification`, `DeviceSession`

### Authentication
- **Session Cookie**: `academy_session` (base64 encoded User.id)
- **Roles**: ADMIN, ACADEMY, TEACHER, STUDENT
- **Permissions**: Role-based (see Permission Checks section)

### Live Streaming Stack
- **Video Platform**: Bunny Stream (CDN + transcoding)
- **Meeting Platform**: Zoom (API + webhooks)
- **Chat/Presence**: Firebase Realtime Database
- **Recording Flow**: Zoom → Webhook → Bunny Stream → Database

---

## 🎯 WORKFLOW CHECKLIST

### Before Every Code Change
- [ ] Run SOP-03 to verify database schema
- [ ] Check component size (must be <250 lines)
- [ ] Search for existing patterns with grep/semantic search
- [ ] Review FORBIDDEN PATTERNS section

### Before Every Deployment
- [ ] TypeScript errors fixed
- [ ] All imports valid (no missing files)
- [ ] SOP-01 used for clean build
- [ ] API deployed FIRST if API changed (SOP-02)

### After Every Deployment
- [ ] Check browser console for errors
- [ ] Force refresh browser (`Ctrl+Shift+R`)
- [ ] Verify changes are visible
- [ ] Check SOP-04 logs if issues

### When Creating New Features
- [ ] Migration file created if schema changes
- [ ] Component size stays under 250 lines
- [ ] Feature folder created if needed (`components/[feature]/`)
- [ ] Types defined in `types/` folder
- [ ] Tests written (if test suite exists)

---

**Version**: 2.0 (2026 SOTA Edition)  
**Optimization**: Token-efficient SOPs, negative constraints, search-first protocol  
**Maintainer**: AKADEMO Development Team
