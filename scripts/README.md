# Database Maintenance Scripts

This directory contains **manual** maintenance scripts for the AKADEMO database. These are tools you run on-demand, **not automated cron jobs**.

## sync-bunny-videos.ps1

**Manual cleanup script** to sync database video references with Bunny Stream CDN.

### 📋 Quick Start

```powershell
# 1. Preview what would be deleted (SAFE - always run this first)
.\scripts\sync-bunny-videos.ps1 -DryRun

# 2. Review the output and generated SQL file

# 3. Apply the deletions (only after reviewing!)
.\scripts\sync-bunny-videos.ps1 -Execute
```

### 🤔 What This Script Does

**Problem**: When you delete videos in Bunny Stream dashboard, the database still has their `bunnyGuid` references. Students see "ghost videos" in lessons that return 404 errors.

**Solution**: This script:
1. Fetches all video records from database
2. Checks each one against Bunny Stream API
3. Identifies videos that return 404 (deleted in Bunny)
4. Generates SQL DELETE statements
5. Optionally applies them to clean the database

**This is a MANUAL tool** - you run it when needed, not automatically.

### ⏰ When Should You Run This?

**Run this script:**
- ✅ After deleting videos from Bunny dashboard
- ✅ When students report "video not found" errors
- ✅ As part of monthly maintenance routine
- ✅ 24-48 hours after bulk video deletions (after CDN cache expires)

**DON'T run it:**
- ❌ Immediately after deleting videos (CDN cache still serves them)
- ❌ Automatically on a schedule (unnecessary overhead)
- ❌ Before checking what would be deleted (always dry-run first!)

### Prerequisites

1. Environment variables must be set:
   ```powershell
   $env:BUNNY_STREAM_API_KEY = "your-api-key"
   $env:BUNNY_STREAM_LIBRARY_ID = "your-library-id"
   ```

2. Wrangler CLI must be installed:
   ```powershell
   npm install -g wrangler
   ```

3. Must be authenticated with Cloudflare:
   ```powershell
   npx wrangler login
   ```

### Usage

#### 1. Dry Run (Safe Mode - Recommended First)

Preview what would be deleted without making changes:

```powershell
.\scripts\sync-bunny-videos.ps1 -DryRun
```

**Output**:
```
ℹ AKADEMO Video Cleanup Script
ℹ DRY RUN MODE: No changes will be made

ℹ Step 1: Fetching videos from database...
✓ Found 45 videos in database

ℹ Step 2: Validating videos against Bunny Stream...
⚠ Orphaned: Upload ID 12 (Bunny GUID: abc123, Lesson: 5)
⚠ Orphaned: Upload ID 19 (Bunny GUID: def456, Lesson: 8)

ℹ Step 3: Summary
✓ Valid videos: 43
✗ Orphaned videos: 2

ℹ Step 4: Generating cleanup SQL...
DELETE FROM Upload WHERE id = 12;
DELETE FROM Upload WHERE id = 19;

ℹ DRY RUN: No changes made to database
✓ SQL statements saved to: sync-bunny-videos-YYYYMMDD-HHMMSS.sql
```

#### 2. Execute Cleanup (Production Mode)

Apply the deletions to the database:

```powershell
.\scripts\sync-bunny-videos.ps1 -Execute
```

**⚠️ WARNING**: This will permanently delete database records. Always run with `-DryRun` first!

### How It Works

1. **Fetch Videos**: Queries `Upload` table for all videos with `bunnyGuid`
2. **Validate**: Calls Bunny Stream API `GET /videos/{guid}` for each video
3. **Identify Orphans**: Videos returning 404 are marked for deletion
4. **Generate SQL**: Creates `DELETE FROM Upload WHERE id = X` statements
5. **Execute/Save**: Either applies deletions or saves SQL to file

### Safety Features

- **Dry Run Default**: Always runs in safe mode unless `-Execute` specified
- **SQL File Output**: Saves generated SQL to timestamped file for review
- **Progress Display**: Shows real-time validation progress
- **Error Handling**: Catches API errors and continues processing
- **Rate Limiting**: 100ms delay between API calls to avoid throttling

### Frequency Recommendations

Run this script:
- **Weekly**: If you frequently delete videos from Bunny
- **Monthly**: For general maintenance
- **After Bulk Deletions**: Immediately after deleting many videos in Bunny dashboard
- **Before Cache Expiry**: Within 24 hours of video deletion to catch issues early

### Troubleshooting

**Error: "BUNNY_STREAM_API_KEY environment variable not set"**
- Solution: Set environment variables (see Prerequisites)

**Error: "Failed to query database"**
- Solution: Ensure `npx wrangler login` is authenticated
- Check `wrangler.toml` has correct database binding

**Error: "API error checking video"**
- Solution: Verify Bunny API key has correct permissions
- Check network connectivity to `video.bunnycdn.com`

**Too many orphaned videos found**
- This is normal if you haven't run cleanup in a while
- Review the SQL file first before executing
- Consider running a few deletions manually as a test

### Alternative: Webhook Integration

For automatic cleanup without running scripts, implement a webhook that listens for `video.deleted` events from Bunny Stream and removes database references automatically.

### Best Practices

1. ✅ **Always test with `-DryRun` first**
2. ✅ **Review generated SQL file before executing**
3. ✅ **Run during low-traffic hours** to minimize impact
4. ✅ **Backup database before large cleanups** (Cloudflare D1 has point-in-time recovery)
5. ✅ **Monitor video playback errors** in production to identify orphans

### Example Workflow

```powershell
# 1. Check what would be cleaned
.\scripts\sync-bunny-videos.ps1 -DryRun

# 2. Review the generated SQL file
notepad sync-bunny-videos-YYYYMMDD-HHMMSS.sql

# 3. If everything looks good, execute
.\scripts\sync-bunny-videos.ps1 -Execute

# 4. Verify in production
# Check that lessons no longer show deleted videos
```

---

## gen-hash.js — Reset Admin Password

Generates a bcrypt hash and prints the wrangler command to reset the `admin` user password.

```bash
node scripts/gen-hash.js <new-password>
```

Copy the printed `wrangler d1 execute` command and run it. **Do not save the output to a file or commit it.**

---

## Future Enhancements

- [ ] Add email notification after cleanup
- [ ] Support batch processing for large datasets (>1000 videos)
- [ ] Implement retry logic for transient API failures
- [ ] Add metrics reporting (videos checked, deleted, errors)
- [ ] Create companion script for document cleanup (R2 storage)
