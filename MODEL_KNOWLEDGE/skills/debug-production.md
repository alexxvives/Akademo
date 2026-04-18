# Skill: Debug Production Issues

Use this when the site is broken, showing errors, or behaving unexpectedly in production.

## Parameters
- `SYMPTOM`: what the user reports (error page, wrong data, missing feature)
- `ROLE`: which user role is affected (STUDENT / TEACHER / ACADEMY / ADMIN / all)

## Steps

### 1. Check Cloudflare worker logs
```powershell
npx wrangler tail akademo --format pretty
# In a separate terminal for API:
cd workers/akademo-api
npx wrangler tail akademo-api --format pretty
```
Reproduce the issue in the browser while tailing logs.

### 2. Check GitHub Actions deployment status
Visit https://github.com/alexxvives/Akademo/actions — did the last deploy succeed?

### 3. Check the D1 database state
```powershell
npx wrangler d1 execute akademo-db --remote --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='TABLE'"
```
Verify the expected columns exist.

### 4. Common causes

| Symptom | Likely Cause |
|---------|-------------|
| Error 1027 | Exceeded 100k req/day Cloudflare free plan limit — check polling loops |
| `.open-next/worker.js not found` | Build failed but deploy continued — rebuild |
| Changes don't appear | Cache — `Ctrl+Shift+R` or the CI cached an old build |
| 500 on API call | Check worker logs — usually a missing column or bad SQL query |
| D1 timeout | Query too slow — need to simplify or paginate |
| Worker too large (>3MB) | Check what's bundled — look for accidentally imported WASM/fonts |

### 5. If it's a frontend rendering issue
Check the component file for:
- `useEffect` with bad dependencies (infinite loop)
- Missing null checks on data from API
- Stale closure in `useCallback`

### 6. If it's an API issue
Check the route in `workers/akademo-api/src/routes/`:
- Verify SQL prepared statements match actual schema
- Check auth middleware — is the route protected?
- Test the raw SQL in D1 console

### 7. Fix and verify
```powershell
npx @opennextjs/cloudflare build
git add . && git commit -m "fix: description" && git push
```
