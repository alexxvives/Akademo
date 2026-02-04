# Grading Issue - Root Cause Analysis & Fix

**Date**: February 4, 2026  
**Status**: ✅ RESOLVED

---

## The Problem

Teachers/Academy owners/Admins were getting **500 Internal Server Error** when trying to grade student submissions, despite having the correct permissions.

---

## Root Cause

The issue was in the **error handling** of the authentication layer:

### How Authentication Works

1. `requireAuth(c)` is called in the grading endpoint
2. This function calls `getSession(c)` to validate the user's session cookie
3. If authentication fails, `requireAuth` **throws an Error**
4. The grading endpoint had a generic `try/catch` block that caught ALL errors

### The Bug

```typescript
// ❌ OLD CODE - Masked authentication errors as 500
assignments.patch('/submissions/:submissionId/grade', async (c) => {
  try {
    const session = await requireAuth(c);  // Throws Error if not authenticated
    // ... grading logic ...
  } catch (error: any) {
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});
```

**What happened**:
- User not logged in or invalid session → `requireAuth` throws "Unauthorized"
- Generic catch block catches it → Returns 500 error instead of 401
- Frontend sees 500 → Thinks it's a server bug, not an auth issue
- Developer (us) thinks SQL is broken → Spend hours debugging wrong thing

---

## The Fix

```typescript
// ✅ NEW CODE - Proper authentication error handling
assignments.patch('/submissions/:submissionId/grade', async (c) => {
  try {
    // Handle authentication separately
    let session;
    try {
      session = await requireAuth(c);
    } catch (authError) {
      console.error('[Assignments/grade PATCH] Auth error:', authError);
      return c.json(errorResponse('Not authenticated. Please log in.'), 401);
    }

    // ... rest of grading logic with proper 403/404 errors ...
  } catch (error: any) {
    // Now only catches actual server errors
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});
```

**Key changes**:
1. **Nested try/catch** for authentication - catches auth errors separately
2. Returns **401 Unauthorized** for auth failures (proper HTTP status)
3. Returns **403 Forbidden** for permission issues (teacher doesn't own assignment)
4. Returns **404 Not Found** if submission doesn't exist
5. Returns **500 Internal Server Error** only for actual server bugs (DB errors, etc.)

---

## Why This Matters

### HTTP Status Codes Mean Something

- **401 Unauthorized**: "You need to log in"
- **403 Forbidden**: "You're logged in but don't have permission"
- **404 Not Found**: "That resource doesn't exist"
- **500 Internal Server Error**: "The server broke"

Using the **wrong status code** makes debugging impossible because:
- Developer thinks there's a server bug (500) when it's actually auth (401)
- Frontend can't handle errors properly (should redirect to login on 401)
- Logs get polluted with "errors" that are actually just auth failures

---

## Testing

After deployment, verify:

1. **Not logged in**: Try to grade → Should get 401 with message "Not authenticated. Please log in."
2. **Wrong role** (student tries to grade): Should get 403 "Only teachers, academy owners, and admins can grade"
3. **Wrong teacher** (teacher tries to grade another teacher's assignment): Should get 403 "You do not have permission"
4. **Valid request**: Grading should work ✅

---

## Lessons Learned

1. **Don't use generic catch blocks** - Catch specific error types separately
2. **Return proper HTTP status codes** - 401 vs 403 vs 500 are NOT interchangeable
3. **Add debug logging** - `console.error('[Endpoint] Error:', error)` helps trace issues
4. **Test authentication flows** - Always test what happens when NOT logged in

---

## Related Issues Fixed

While investigating, we also fixed:

### 1. Collapsible Icon Styling
- **Old**: Text arrows (▶/▼) with inconsistent alignment
- **New**: SVG chevron icon with smooth rotation animation, centered in 24px button

### 2. Grades Page Empty State
- **Old**: Generic "No tienes asignaturas asignadas" (confusing)
- **New**: Detailed message explaining teachers need to be assigned to classes, with instruction to contact academy admin

---

## Deployment

- **API**: Version `2f97b3aa-a7af-4172-a52d-5b97dc257fbe`
- **Frontend**: Version `db0eb28d-7b75-4c64-aa6b-15fe7ffccaca`

---

## Additional Notes

The SQL query fix we attempted earlier (changing `a.classId` to `c.id`) was actually correct and needed, but it wasn't the root cause of the 500 error. The auth error was masking everything.

**Both fixes were necessary**:
1. SQL fix (correct column reference)
2. Auth error handling (proper HTTP status codes)
