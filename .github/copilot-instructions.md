# GitHub Copilot Instructions for AKADEMO Project

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

**Remember**: The goal is to write code that works correctly the first time through careful verification, not to iterate quickly through broken implementations. Slow down, test thoroughly, deploy confidently.

## Development Standards

### Quality Assurance
- **State-of-the-Art Solutions**: Always implement robust, best-practice solutions using modern frameworks/libraries. Avoid temporary patches or dirty hacks.
- **Root Cause Analysis**: Identify and fix the underlying issue rather than masking symptoms.
- **Mandatory Verification**: You must TEST all API calls and verify they work as expected before marking a task as complete. 
- **Error Handling**: Implement proper error handling that returns appropriate HTTP status codes (401 for Auth, 403 for Permissions, 404 for Not Found) instead of generic 500 errors.

