# AKADEMO Troubleshooting Guide

## D1 Timeout Error

### Problem
**Error**: `D1_ERROR: D1 DB storage operation exceeded timeout which caused object to be reset`

**Cause**: Cloudflare D1 has a **30-second timeout** per request. Large video uploads cause operations to exceed this limit.

### Solution: Two-Step Upload Workflow

**Step 1: Pre-upload videos**
```javascript
const uploadedVideos = [];
for (const videoFile of videoFiles) {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('title', videoFile.name);
  
  const response = await fetch('/api/bunny/video/upload', {
    method: 'POST',
    body: formData,
  });
  
  const { data } = await response.json();
  uploadedVideos.push({
    bunnyGuid: data.guid,
    bunnyLibraryId: data.libraryId,
    title: videoFile.name,
    durationSeconds: 0,
  });
}
```

**Step 2: Create lesson with uploaded video IDs**
```javascript
const response = await fetch('/api/lessons/create-with-uploaded', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "My Lesson",
    classId: "class-id",
    videos: uploadedVideos,
  }),
});
```

### Why This Works
- Video uploads happen independently (no D1 timeout risk)
- Lesson creation is fast (< 1 second)
- Better UX with individual upload progress
- More reliable (if one video fails, others succeed)

---

## Build & Cache Issues

### Problem
Changes don't appear after deployment. Hitting Next.js and Cloudflare's aggressive caching layers.

### Cache Layers
- `.next/` - Next.js build cache
- `.open-next/` - OpenNext worker bundle
- Cloudflare CDN - Edge cache
- Browser cache - Stale JS bundles

### Solution: Force Clean Build

**ALWAYS use this command when changes must be visible:**
```powershell
Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue
npx @opennextjs/cloudflare build
npx wrangler deploy
```

### When to Use

✅ **USE** when:
- UI changes aren't appearing
- CSS/styling updates ignored
- Component changes don't reflect
- Seeing old error messages
- Code works locally but not production

❌ **SKIP** when:
- API-only changes
- Environment variables updates
- Database schema changes only

### Post-Deployment
Always force refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)

---

## Zoom Recording Issues

### Issue: Recordings not saved to Bunny

**Symptoms**: `LiveStream.recordingId = null` after meeting ends

**Debug Steps**:

1. Check webhook logs:
   ```powershell
   npx wrangler tail akademo --format pretty
   ```
   Look for `[Zoom Webhook] Recording completed`

2. Verify webhook URL in Zoom App settings

3. Check Bunny for failed uploads (status=6):
   ```powershell
   $headers = @{ "AccessKey" = "YOUR_KEY" }
   Invoke-RestMethod -Uri "https://video.bunnycdn.com/library/571240/videos" -Headers $headers
   ```

**Common Causes**:
- Zoom download URL expired
- Webhook secret mismatch
- Recording not available when webhook fires (Zoom delay)

### Issue: Cannot create Zoom meetings

**Error**: `Invalid access token, does not contain scopes:[user:read:user:admin]`

**Fix**: Add scope in Zoom App → Scopes tab

---

## Deployment Error Prevention

### Common Error
```
[ERROR] The entry-point file at ".open-next\worker.js" was not found.
```

### Root Cause
1. Next.js build fails (TypeScript/syntax errors)
2. OpenNext build doesn't complete
3. Wrangler deploy runs anyway (command chain continues)

### Prevention
- **ALWAYS check build output** - stop if "Failed to compile"
- **NEVER ignore TypeScript errors**
- Clean build directories first
- Clear node_modules if error persists

### Troubleshooting
1. Check if `.open-next/worker.js` exists
2. Review build logs for errors
3. Verify all imports are correct
4. Ensure TypeScript types are valid
5. Clear caches and rebuild

---

## Common Error Patterns

### Null Safety Issues
```typescript
// ❌ BAD - Will crash if data is undefined
const filtered = result.data.filter(x => x.active);

// ✅ GOOD - Safe with default empty array
const filtered = (result.data || []).filter(x => x.active);
```

### Database Query Errors
- Test SQL queries with `npx wrangler d1 execute akademo-db --remote --command "SQL"`
- Verify schema matches code: `PRAGMA table_info(TableName)`
- Check data exists before querying

### Permission Errors
- Return detailed error messages with actual values
- Don't return generic "Forbidden" or "Bad Request"
- Example: `errorResponse(\`Teacher ${session.id} not found in academy ${academyId}\`, 403)`

---

## Quick Reference

| Issue | Command |
|-------|---------|
| Test DB query | `npx wrangler d1 execute akademo-db --remote --command "SQL"` |
| Check DB schema | `npx wrangler d1 execute akademo-db --remote --command "PRAGMA table_info(TableName)"` |
| Force clean deploy | `Remove-Item -Recurse -Force .next, .open-next; npx @opennextjs/cloudflare build; npx wrangler deploy` |
| View worker logs | `npx wrangler tail akademo --format pretty` |
| Deploy API worker | `cd workers/akademo-api; npx wrangler deploy` |
