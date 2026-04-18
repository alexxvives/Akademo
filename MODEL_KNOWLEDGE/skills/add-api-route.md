# Skill: Add API Route

Use this when adding or modifying a route in the `akademo-api` Hono worker.

## Parameters
- `ROUTE`: the path, e.g. `/classes/:id/students`
- `METHOD`: GET / POST / PATCH / DELETE
- `TABLE`: the D1 table(s) involved

## Steps

### 1. Verify schema first
```powershell
npx wrangler d1 execute akademo-db --remote --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='TABLE'"
```
Never assume column names. Check before writing SQL.

### 2. Find the right route file
```
workers/akademo-api/src/routes/
```
Group by domain: `classes.ts`, `lessons.ts`, `users.ts`, `payments.ts`, `live.ts`, etc.
If no matching file exists, create one and register it in `workers/akademo-api/src/index.ts`.

### 3. Write the handler

```typescript
// GET example
app.get('/classes/:id/students', async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;

  const rows = await db
    .prepare('SELECT id, firstName, lastName FROM User WHERE id IN (SELECT userId FROM ClassEnrollment WHERE classId = ?)')
    .bind(id)
    .all();

  return c.json({ success: true, data: rows.results });
});
```

Rules:
- Always use `.bind()` — never string-interpolate into SQL
- Always return `{ success: true, data: ... }` on success
- Always return `errorResponse('message', statusCode)` on failure
- Check that the calling user has permission before returning data (check session cookie)

### 4. Register new route files in the router

```typescript
// workers/akademo-api/src/index.ts
import { classesRouter } from './routes/classes';
app.route('/classes', classesRouter);
```

### 5. Build and verify

```powershell
npx @opennextjs/cloudflare build 2>&1 | Select-String "error TS|Type error|Compiled"
```

### 6. Test the endpoint before committing

```powershell
npx wrangler d1 execute akademo-db --remote --command "SELECT ..."
```

### 7. Commit

```powershell
git add .
git commit -m "feat: add GET /classes/:id/students"
git push
```
