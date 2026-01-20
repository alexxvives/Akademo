# GitHub Copilot Instructions for AKADEMO Project

## 🚨 CRITICAL: DEPLOYMENT PROTOCOL 🚨

**MANDATORY**: After making ANY code changes (API, UI, components, etc.), you MUST deploy:

```powershell
Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue; npx @opennextjs/cloudflare build; npx wrangler deploy
```

**WHY THIS IS CRITICAL**:
- Changes are NOT visible until deployed
- Next.js and Cloudflare use aggressive caching
- `npm run deploy` reuses cached builds - changes won't appear
- **ALWAYS** use the clean build command above
- **NEVER** skip deployment or say "changes are ready" without deploying

### 🛑 DEPLOYMENT ERROR PREVENTION

**Common Error**: `[ERROR] The entry-point file at ".open-next\worker.js" was not found.`

**Root Cause**: This error occurs when:
1. Next.js build fails (TypeScript errors, syntax errors, import issues)
2. OpenNext build doesn't complete (build cache corruption)
3. Wrangler deploy runs anyway because the command chain continues

**Prevention Strategy**:
- **ALWAYS check build output** - if you see "Failed to compile", STOP and fix errors
- **NEVER ignore TypeScript errors** - fix them before deploying
- Clean build directories first: `Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue`
- If error persists after fixing code, clear node_modules: `Remove-Item -Recurse -Force node_modules; npm install`

**Troubleshooting Steps**:
1. Check if `.open-next/worker.js` exists after build
2. Review build logs for compilation errors
3. Verify all imports are correct (no missing files)
4. Ensure TypeScript types are valid
5. Clear caches and rebuild from scratch

## 🏗️ TWO-WORKER ARCHITECTURE - CRITICAL!

**AKADEMO uses TWO separate Cloudflare Workers:**

### 1. Frontend Worker: `akademo`
- **Location**: Root directory (`./`)
- **Purpose**: Next.js frontend (UI pages, components)
- **Deploy Command**:
  ```powershell
  Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue
  npx @opennextjs/cloudflare build
  npx wrangler deploy
  ```
- **URL**: https://akademo.alexxvives.workers.dev
- **When to Deploy**: UI changes, component updates, frontend fixes, page modifications

### 2. Backend API Worker: `akademo-api`
- **Location**: `workers/akademo-api/`
- **Purpose**: Hono API backend (all /auth, /live, /classes, /lessons, etc. endpoints)
- **Deploy Command**:
  ```powershell
  cd workers/akademo-api
  npx wrangler deploy
  ```
- **URL**: https://akademo-api.alexxvives.workers.dev
- **When to Deploy**: API changes, database queries, auth logic, permissions, stream creation, ANY route changes

### ⚠️ DEPLOYMENT CHECKLIST

**For API Changes** (routes, database, permissions):
1. Deploy API worker **FIRST**: `cd workers/akademo-api; npx wrangler deploy`
2. Then deploy frontend if needed (see above)

**For Frontend Changes** (UI, components):
1. Deploy frontend worker only (see above)

**For Both API + Frontend Changes**:
1. Deploy API worker **FIRST**
2. Then deploy frontend worker

### 📁 File Path → Worker Mapping

| File Path | Deploy Worker |
|-----------|---------------|
| `src/app/` → Frontend | `akademo` |
| `src/components/` → Frontend | `akademo` |
| `src/hooks/` → Frontend | `akademo` |
| `workers/akademo-api/src/` → **API** | **`akademo-api`** |
| `workers/akademo-api/src/routes/` → **API** | **`akademo-api`** |

**Remember**: Frontend calls `https://akademo-api.alexxvives.workers.dev` for ALL API requests. If you only deploy frontend, API changes won't be live!

## Critical Development Workflow

### API Development & Debugging Protocol

**MANDATORY**: When fixing or creating API endpoints, you MUST follow this testing protocol before claiming success:

1. **Test Database Queries First**
   ```bash
   npx wrangler d1 execute akademo-db --remote --command "YOUR_SQL_QUERY"
   ```
   - Run the EXACT SQL query that your code will execute
   - Verify the query returns expected data
   - Check that all referenced columns exist in the schema

2. **Verify Database Schema Matches Code**
   ```bash
   npx wrangler d1 execute akademo-db --remote --command "PRAGMA table_info(TableName)"
   ```
   - Confirm all columns referenced in code actually exist
   - Check data types match expectations
   - Verify foreign key relationships

3. **Test Data Existence**
   ```bash
   npx wrangler d1 execute akademo-db --remote --command "SELECT * FROM Table WHERE condition LIMIT 5"
   ```
   - Verify test data exists for your queries
   - Check that relationships (JOINs) will succeed
   - Confirm no NULL values where NOT NULL expected

4. **Deploy Only After Verification**
   - Only run `npm run deploy` AFTER all queries tested successfully
   - **ALWAYS force clean build before deploying**: `Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue; npx @opennextjs/cloudflare build; npx wrangler deploy`
   - Never use `npm run deploy` alone - it reuses cached builds and changes won't appear
   - Never say "it should work now" - say "I tested X, Y, Z and confirmed they work"
   - If tests fail, fix the root cause before deploying

5. **Post-Deployment Verification**
   - Check browser console for actual error messages
   - Use detailed error responses that show what failed
   - Return helpful debugging info: `errorResponse(\`User ${userId} not found in academy ${academyId}\`, 403)`

### Common Anti-Patterns to AVOID

❌ **DON'T**: Deploy without testing queries
❌ **DON'T**: Assume database schema matches code expectations
❌ **DON'T**: Return generic error messages like "Forbidden" or "Bad Request"
❌ **DON'T**: Add console.log and hope it appears (Cloudflare Workers don't show console.log easily)
❌ **DON'T**: Make multiple sequential fixes without verification between each
❌ **DON'T**: Use placeholder values or mock data in queries - use real production data

✅ **DO**: Test every SQL query before deploying
✅ **DO**: Verify schema with PRAGMA commands
✅ **DO**: Return detailed error messages with actual values
✅ **DO**: Check production database state, not assumptions
✅ **DO**: Verify data relationships exist before coding JOINs
✅ **DO**: Use incremental, verified fixes rather than "shotgun debugging"
✅ **DO**: Add debug console.log statements when investigating errors to identify root causes
✅ **DO**: Always use null safety with optional chaining or default values for array methods (`.filter()`, `.map()`, etc.)

### Debugging Best Practices

**When encountering runtime errors:**
1. Add console.log statements with descriptive prefixes like `[ComponentName]`
2. Log the actual values before the error occurs (e.g., `console.log('[loadData] classResult:', classResult)`)
3. Check if optional properties are undefined before using array methods
4. Verify API responses match expected interface shapes

**Null Safety Patterns:**
```typescript
// ❌ BAD - Will crash if data is undefined
const filtered = result.data.filter(x => x.active);

// ✅ GOOD - Safe with default empty array
const filtered = (result.data || []).filter(x => x.active);

// ✅ BETTER - Check both success and data
if (result.success && result.data) {
  const filtered = result.data.filter(x => x.active);
}
```

### Build & Cache Management

**Cache Issues**: Next.js and Cloudflare use aggressive caching. When changes aren't visible:

1. **Force Clean Build**
   ```bash
   Remove-Item -Recurse -Force .next, .open-next
   npm run deploy
   ```

2. **Understanding Cache Layers**
   - `.next/` - Next.js build cache (content-hash based)
   - `.open-next/` - OpenNext worker bundle
   - Cloudflare CDN - Edge cache (respects content hashes)
   - Browser cache - Can show stale JS bundles

3. **When to Clear Cache**
   - Code changes not appearing after deploy
   - Seeing old error messages after fixes
   - API responses look correct but UI shows old data

### Database Schema Conventions

**Column Naming**:
- Use `userId` NOT `studentId` - unified user reference
- ClassEnrollment has `userId` column linking to User
- Teacher table has `userId` column (not separate student/teacher ID)

**Table Naming**:
- Singular names: `User`, `Academy`, `Class`, `ClassEnrollment`
- NOT plural: ~~`Users`~~, ~~`Enrollments`~~

**Deprecated Tables**:
- ❌ `AcademyMembership` - replaced by `Teacher` table
- Use `Teacher` table with `userId` and `academyId` columns

**Required Columns**:
- `Academy` MUST have: `ownerId`, `description`
- `ClassEnrollment` MUST have: `userId` (not studentId), `status`
- `Teacher` MUST have: `userId`, `academyId`

## Project Structure (State-of-the-Art)

The codebase follows a feature-based organization with shared infrastructure:

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── dashboard/               # Protected dashboard routes
│       ├── admin/               # Admin role pages
│       ├── academy/             # Academy owner pages
│       ├── teacher/             # Teacher pages
│       │   ├── layout.tsx       # Wraps with ErrorBoundary + DashboardLayout
│       │   ├── page.tsx         # Dashboard home
│       │   └── class/[id]/      # Dynamic class page
│       │       ├── page.tsx     # Main page component
│       │       └── components/  # Page-specific components
│       └── student/             # Student pages
│
├── components/                   # Shared components
│   ├── ui/                      # Reusable UI primitives
│   │   ├── index.ts             # Barrel export
│   │   ├── ErrorBoundary.tsx    # Error boundary wrapper
│   │   ├── LoadingSpinner.tsx   # Spinner with sizes
│   │   ├── PageLoader.tsx       # Full page loading state
│   │   └── EmptyState.tsx       # Empty state with action
│   ├── DashboardLayout.tsx      # Main dashboard shell
│   ├── ProtectedVideoPlayer.tsx # Video player with DRM
│   └── ...
│
├── hooks/                        # Custom React hooks
│   ├── index.ts                 # Barrel export
│   ├── useAuth.ts               # Cached auth state
│   ├── useClass.ts              # Class data fetching
│   ├── useLessons.ts            # Lessons with polling
│   └── useNotifications.ts      # Notifications with polling
│
├── types/                        # TypeScript definitions
│   ├── index.ts                 # Barrel export
│   ├── api.ts                   # API response types
│   └── models.ts                # Domain entity types
│
└── lib/                          # Utilities and clients
    ├── api-client.ts            # Fetch wrapper for Hono API
    ├── bunny-stream.ts          # Bunny CDN helpers
    ├── bunny-upload.ts          # Video upload to Bunny
    └── multipart-upload.ts      # Document upload to R2
```

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ErrorBoundary.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Types | camelCase with descriptive name | `api.ts`, `models.ts` |
| Utilities | camelCase | `api-client.ts` |
| Page routes | `page.tsx` in folder | `app/dashboard/teacher/page.tsx` |

### Import Order Convention

```tsx
// 1. React imports
import { useState, useEffect, useMemo, useCallback } from 'react';

// 2. Next.js imports
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// 3. Third-party libraries
import { format } from 'date-fns';

// 4. Types (with 'type' keyword)
import type { Lesson, Video, User } from '@/types';

// 5. Hooks
import { useAuth, useLessons } from '@/hooks';

// 6. Components
import { PageLoader, EmptyState } from '@/components/ui';

// 7. Utilities
import { apiClient } from '@/lib/api-client';

// 8. Page-specific components (relative imports)
import ClassHeader from './components/ClassHeader';
```

### Error Loop Prevention

**When stuck in error loop**:
1. Stop making code changes
2. Test current database state with wrangler d1
3. Verify what data actually exists
4. Test the exact query your code will run
5. Only then make ONE targeted fix
6. Verify that fix before continuing

**Red Flags**:
- Making > 3 deploys without verification
- Seeing same error after "fix"
- Assuming data exists without checking
- Not reading actual error responses

### Testing Checklist for API Fixes

Before deploying any API fix, complete this checklist:

- [ ] SQL query tested with wrangler d1 execute
- [ ] Query returns expected data
- [ ] All columns referenced in query exist in schema
- [ ] Required foreign key relationships exist
- [ ] Test data exists for development/testing
- [ ] Error messages include specific values for debugging
- [ ] No assumptions made about data - verified actual state

### Response Standards

**API Error Responses Must Include**:
- Specific values that caused the error
- What was expected vs what was found
- Enough context to debug without checking code

**Example**:
```typescript
// ❌ Bad
return errorResponse('Forbidden', 403);

// ✅ Good
return errorResponse(`Teacher ${session.id} not found in academy ${classRecord.academyId}`, 403);
```

### Project-Specific Context

**Authentication**:
- Session stored in `academy_session` cookie
- Session.id = User.id (base64 encoded in cookie)
- Roles: ADMIN, ACADEMY, TEACHER, STUDENT

**Permissions Model - CRITICAL**:

1. **ACADEMY role** (Academy Owners):
   - Identified by: `Academy.ownerId = session.id`
   - Query pattern: `SELECT * FROM Academy WHERE ownerId = ?`
   - NEVER use Teacher table for ACADEMY role users!
   - Can manage all classes, teachers, students in their academy

2. **TEACHER role** (Teachers):
   - Identified by: `Teacher.userId = session.id`
   - Query pattern: `SELECT * FROM Class WHERE teacherId = ?`
   - Teacher table links teachers to academies they work in
   - Can only manage classes they are assigned to

3. **STUDENT role** (Students):
   - Identified by: `ClassEnrollment.userId = session.id`
   - Query pattern: `SELECT * FROM ClassEnrollment WHERE userId = ? AND status = 'APPROVED'`
   - Can only access classes they are enrolled in

**Common Permission Query Mistakes**:
```typescript
// ❌ WRONG - Academy owners are NOT in Teacher table
const teacher = await db.prepare('SELECT * FROM Teacher WHERE userId = ?').bind(session.id);

// ✅ CORRECT - Check Academy.ownerId for ACADEMY role
if (session.role === 'ACADEMY') {
  const academy = await db.prepare('SELECT * FROM Academy WHERE ownerId = ?').bind(session.id);
}
```

**Live Streaming**:
- Bunny Stream for video hosting
- Firebase Realtime Database for chat and viewer presence
- LiveStream table stores Zoom meeting details
- `recordingId` field stores Bunny GUID (set by Zoom webhook)
- Zoom webhook automatically handles recordings and participant counts
- No manual "Obtener" button needed - everything is automatic

## Database Quick Reference

**14 Tables**: User, Academy, Teacher, Class, ClassEnrollment, Lesson, Video, Document, Upload, LiveStream, LessonRating, VideoPlayState, Notification, DeviceSession

**Key Relationships**:
- `Academy.ownerId` → User.id (ACADEMY role) - WHO OWNS the academy
- `Teacher.userId` → User.id (TEACHER role) - Teachers WORKING in an academy
- `Class.teacherId` → User.id - Teacher ASSIGNED to a class
- `ClassEnrollment.userId` → User.id (STUDENT role) - Student enrolled in class
- `Upload.bunnyGuid` → Bunny Stream video GUID (for videos)

**Table Does NOT Exist**:
- ~~AcademyMembership~~ - Replaced by Teacher table
- ~~PlatformSettings~~ - Removed
- ~~BillingConfig~~ - Removed

## General Best Practices

### Code Quality
- Prefer TypeScript strict mode
- Use proper error handling with try/catch
- Return typed responses: `ApiResponse<T>`
- Validate all user inputs

### Performance
- Minimize database queries in loops
- Use prepared statements with bound parameters
- Cache expensive computations appropriately
- Avoid N+1 query patterns

### Security
- Never expose sensitive keys in responses
- Validate permissions before data access
- Use parameterized queries (prevent SQL injection)
- Hash passwords with bcrypt (never plain text)

---

## React & Frontend Best Practices (State-of-the-Art Standards)

### ❌ Anti-Patterns to AVOID

1. **Giant Components (>300 lines)**
   - NEVER create components over 300 lines
   - Split into smaller, focused components
   - Extract reusable logic into custom hooks

2. **No `any` Types**
   - NEVER use `: any` - define proper interfaces
   - All API responses should have typed interfaces
   - All handler functions should have explicit parameter and return types

3. **No Duplicate Data Fetching**
   - NEVER call the same API endpoint in multiple components independently
   - Use shared hooks or React Query for data caching
   - The `/auth/me` endpoint should only be called ONCE and cached

4. **No N+1 Query Patterns**
   ```tsx
   // ❌ BAD - Makes N+1 API calls
   const lessons = await getLessons();
   const detailed = await Promise.all(lessons.map(l => getLesson(l.id)));
   
   // ✅ GOOD - Single API call with includes
   const lessons = await getLessonsWithDetails(classId);
   ```

5. **No Index Keys in Lists**
   ```tsx
   // ❌ BAD
   {items.map((item, index) => <Item key={index} />)}
   
   // ✅ GOOD
   {items.map(item => <Item key={item.id} />)}
   ```

6. **No Race Conditions in useEffect**
   - Don't have multiple useEffects that depend on each other's data
   - Use a single data loading hook with proper state management
   - Consider abort controllers for cleanup

### ✅ Required Patterns

1. **Error Boundaries**
   - All dashboard layouts MUST wrap content in ErrorBoundary
   - Provide meaningful fallback UI for errors

2. **Loading States**
   - Use Suspense boundaries with skeleton loaders
   - Create reusable `<LoadingSpinner />` and `<PageLoader />` components
   - Never leave users with blank screens

3. **Custom Hooks Directory**
   - Create `src/hooks/` folder for reusable hooks
   - Required hooks: `useAuth`, `useClass`, `useLessons`, `useNotifications`
   - All data fetching logic should be in hooks, not components

4. **Component Organization**
   ```
   src/
   ├── components/
   │   ├── ui/           # Reusable UI primitives
   │   ├── forms/        # Form components
   │   └── layout/       # Layout components
   ├── hooks/            # Custom hooks
   │   ├── useAuth.ts
   │   ├── useClass.ts
   │   └── useLessons.ts
   ├── types/            # TypeScript interfaces
   │   ├── api.ts        # API response types
   │   └── models.ts     # Domain model types
   └── lib/              # Utilities
   ```

5. **Performance Optimization**
   ```tsx
   // Memoize expensive computations
   const filteredLessons = useMemo(() => 
     lessons.filter(l => l.status === 'active'),
     [lessons]
   );
   
   // Memoize callbacks passed to children
   const handleSubmit = useCallback((data) => {
     // ...
   }, [dependencies]);
   ```

6. **Proper TypeScript**
   ```tsx
   // Define interfaces for all API responses
   interface LessonResponse {
     id: string;
     title: string;
     videos: Video[];
     documents: Document[];
   }
   
   // Type all async functions
   const loadLessons = async (classId: string): Promise<void> => {
     const res = await apiClient<ApiResponse<Lesson[]>>(`/lessons?classId=${classId}`);
     // ...
   };
   ```

7. **API Client with Types**
   ```tsx
   // Extend apiClient to support generics
   async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
     const res = await fetch(/* ... */);
     return res.json() as Promise<T>;
   }
   ```

### Component Size Guidelines

| Component Type | Max Lines | Example |
|---------------|-----------|---------|
| Page Component | 150 lines | Orchestrates layout, delegates to child components |
| Feature Component | 200 lines | Self-contained feature like LessonForm |
| UI Component | 100 lines | Buttons, Cards, Modals |
| Custom Hook | 80 lines | Single-responsibility data/logic hook |

### Required Imports Structure

```tsx
// 1. React imports
import { useState, useEffect, useMemo, useCallback } from 'react';

// 2. Next.js imports
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// 3. Third-party imports
import { format } from 'date-fns';

// 4. Local imports (types first)
import type { Lesson, Video, User } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useLessons } from '@/hooks/useLessons';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
```

---

## Improvement Roadmap (Priority Order)

### Phase 1: Critical Fixes
- [ ] Add ErrorBoundary components to all layouts
- [ ] Create `src/hooks/useAuth.ts` to cache auth state
- [ ] Create `src/types/api.ts` and `src/types/models.ts`
- [ ] Replace all `: any` with proper types

### Phase 2: Performance
- [ ] Implement React Query or SWR for data caching
- [ ] Split `teacher/class/[id]/page.tsx` (1392 lines) into 5-6 components
- [ ] Split `student/class/[id]/page.tsx` (789 lines) into 4-5 components
- [ ] Fix N+1 queries in API endpoints

### Phase 3: Code Quality
- [ ] Create `src/components/ui/` for reusable components
- [ ] Create shared loading/error state components
- [ ] Add proper loading skeletons to all pages
- [ ] Consolidate polling intervals into unified system

### Phase 4: Developer Experience
- [ ] Add ESLint rules to enforce component size limits
- [ ] Add ESLint rule to disallow `any` type
- [ ] Create component templates for consistency
- [ ] Add Storybook for UI component documentation

---

**Remember**: The goal is to write code that works correctly the first time through careful verification, not to iterate quickly through broken implementations. Slow down, test thoroughly, deploy confidently.

## Development Standards

### Quality Assurance
- **State-of-the-Art Solutions**: Always implement robust, best-practice solutions using modern frameworks/libraries. Avoid temporary patches or dirty hacks.
- **Root Cause Analysis**: Identify and fix the underlying issue rather than masking symptoms.
- **Mandatory Verification**: You must TEST all API calls and verify they work as expected before marking a task as complete. 
- **Error Handling**: Implement proper error handling that returns appropriate HTTP status codes (401 for Auth, 403 for Permissions, 404 for Not Found) instead of generic 500 errors.

