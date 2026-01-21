# GitHub Copilot Instructions - AKADEMO

**Stack**: Next.js 14 + Cloudflare Workers + D1 + Hono + TypeScript  
**Architecture**: Two-worker system (Frontend `akademo` + API `akademo-api`)

---

## 🚀 QUICK REFERENCE

### Deployment Commands
```powershell
# API Worker (from root)
cd workers/akademo-api
npx wrangler deploy --config wrangler.toml
cd ../..

# Frontend (from root)
Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue
npx @opennextjs/cloudflare build
npx wrangler deploy

# Deploy Order: ALWAYS deploy API first if API changed, then frontend
# IMPORTANT: Always deploy after making changes - we're not working locally!
```

### Database Commands
```powershell
# Query remote D1
npx wrangler d1 execute akademo-db --remote --command "SELECT * FROM User LIMIT 10"

# Run specific migration file (safer than applying all)
npx wrangler d1 execute akademo-db --remote --file=migrations/0019_example.sql

# Check schema
npx wrangler d1 execute akademo-db --remote --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='User'"
```

### Check Logs
```powershell
npx wrangler tail akademo --format pretty
```

---

## ⚡ CORE RULES

### 0. ALWAYS DEPLOY AFTER CHANGES
**CRITICAL**: We are NOT working locally - changes only work after deployment!
- Changed API code? → Deploy API worker immediately
- Changed frontend code? → Clean build + deploy frontend immediately
- Test deployment success before telling user "it works"

### 1. Search Before You Code
Always verify current state before changes:
- Use `grep_search` or `semantic_search` to find existing patterns
- Check file size: `(Get-Content path/to/file.tsx).Count`
- Query schema before writing API code

### 2. Component Size: 250 Lines Max
**HARD LIMIT**: No component/file > 250 lines
- If exceeds → Extract to `/components/[feature]/` or `/hooks/`
- Page components orchestrate, don't implement

### 3. Schema-First Protocol
Before API changes:
1. Query D1 to verify table structure
2. Create migration if schema needs changes
3. Test query before deploying

### 4. Two-Worker Architecture
- **Frontend** (`akademo`): Next.js app in `src/`
- **API** (`akademo-api`): Hono routes in `workers/akademo-api/src/`
- Deploy API **before** frontend if both changed
---

## 🚫 NEVER DO THIS

❌ Use `any` type → Define explicit interfaces  
❌ Deploy without clean build → Use deployment commands above  
❌ Ignore TypeScript errors → Fix before deploying  
❌ Create files >250 lines → Refactor immediately  
❌ Use `localStorage` for sessions → Use `academy_session` cookie  
❌ Hardcode secrets → Use `c.env.VAR` (Hono) or `process.env.NEXT_PUBLIC_*` (Next.js)  
❌ Return generic errors → Include context: `errorResponse(\`User ${id} not found\`, 404)`  
❌ Assume database data exists → Query first  
❌ Use index as React key → Use stable IDs: `key={item.id}`  
❌ Chain async in loops → Use `Promise.all()`  
❌ Forget null safety → Use `(data || []).filter()`  
❌ Use Teacher table for ACADEMY role → ACADEMY = `Academy.ownerId`, TEACHER = `Teacher.userId`  
❌ Keep backup files in src/ → Use git history instead  

---

## 🗄️ DATABASE SCHEMA

See [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) for complete reference.

**Key Tables**: User, Academy, Teacher, Class, ClassEnrollment, Lesson, VideoResource, LiveStream, Notification

**Important Relationships**:
- `Academy.ownerId` → User.id (ACADEMY role - owner)
- `Teacher.userId` → User.id (TEACHER role - works in academy)
- `Class.teacherId` → User.id (assigned teacher)
- `ClassEnrollment.userId` → User.id (STUDENT role)

**Creating Migrations**:
```sql
-- migrations/0017_example.sql
ALTER TABLE User ADD COLUMN preferences TEXT DEFAULT '{}';
```

Apply with: `npx wrangler d1 execute akademo-db --remote --file=migrations/0017_example.sql`

---

## 📂 PROJECT STRUCTURE

```
src/
├── app/                    # Next.js pages (<200 lines each)
│   ├── dashboard/[role]/  # Role-based dashboards
│   └── api/               # Next.js API routes (AVOID - use akademo-api worker)
├── components/            # Feature-organized components
│   ├── ui/               # Primitives (<100 lines)
│   ├── shared/           # Cross-role components
│   └── [feature]/        # Feature-specific
├── hooks/                 # Custom React hooks (<80 lines)
├── lib/                   # Utilities (<150 lines)
└── types/                 # TypeScript definitions

workers/akademo-api/src/   # Hono API routes
```

---

## 💻 CODING STANDARDS

### API Responses (Required Format)
```typescript
// ✅ CORRECT
return c.json({ success: true, data: user });
return errorResponse(`User ${id} not found`, 404);

// ❌ WRONG
return c.json({ user });
return c.json({ error: 'Not found' }, 404);
```

### TypeScript
```typescript
// ✅ CORRECT
interface LessonResponse {
  id: string;
  title: string;
  videos: Video[];
}

const loadLessons = async (classId: string): Promise<void> => {
  const res = await apiClient<ApiResponse<Lesson[]>>(`/lessons?classId=${classId}`);
};

// ❌ WRONG
const loadLessons = async (classId: any): Promise<any> => { /* ... */ };
```

### Database Queries
```typescript
// ✅ CORRECT - Prepared statements
const user = await db.prepare('SELECT * FROM User WHERE id = ?').bind(userId).first();

// ❌ WRONG - SQL injection risk
const user = await db.prepare(`SELECT * FROM User WHERE id = '${userId}'`).first();
```

### React Performance
```typescript
// ✅ CORRECT - Memoization
const filtered = useMemo(() => lessons.filter(l => l.active), [lessons]);
const handleSubmit = useCallback((data) => { /* ... */ }, [deps]);

// ❌ WRONG - Recreates every render
const filtered = lessons.filter(l => l.active);
```

---

## 🐛 COMMON ISSUES

### `.open-next/worker.js not found`
**Cause**: Build failed but deployment continued  
**Fix**: Clean build with deployment command above

### D1 Timeout (30s limit)
**Cause**: Operation too slow (usually video uploads)  
**Fix**: Two-step process - upload to Bunny first, then save metadata to D1

### Changes Don't Appear
**Cause**: Cache not cleared  
**Fix**: Force clean build, then hard refresh browser (`Ctrl+Shift+R`)

---

## 📚 MORE DOCUMENTATION

- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) - Complete table definitions
- [PROJECT_DOCUMENTATION.md](../PROJECT_DOCUMENTATION.md) - Architecture details
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Production deployment
- [docs/troubleshooting.md](../docs/troubleshooting.md) - Common problems
- [docs/zoom-integration.md](../docs/zoom-integration.md) - Zoom API & webhooks

---

**Version**: 3.0 (Simplified 2026)  
**Maintainer**: AKADEMO Development Team
