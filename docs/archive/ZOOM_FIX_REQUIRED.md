# ZOOM RECORDING FIX - REQUIRED ACTIONS

## Problem Summary
Zoom recordings are not being saved because:
1. Webhook URL has wrong path (`/api/webhooks/zoom` should be `/webhooks/zoom`)
2. Platform Zoom credentials are from deleted server-to-server app
3. Webhooks never reach the API worker, so recordings never get uploaded to Bunny

## Evidence
Database shows recent streams stuck in 'scheduled' status with null recordingId:
- `50109862-0b83-4760-9ba4-b584b3573f62` - Created 2026-01-24, never started
- `acf5e4b6-2f17-4ae4-a15d-9f7b9fcb8d54` - Created 2026-01-24, never started

## Required Actions

### 1. Fix Webhook URL in Zoom App
Go to: https://marketplace.zoom.us/user/build → Your App → Feature Tab → Event Subscriptions

**Current (Wrong)**: `https://akademo-api.alexxvives.workers.dev/api/webhooks/zoom`  
**Change To**: `https://akademo-api.alexxvives.workers.dev/webhooks/zoom`

### 2. Get OAuth App Credentials
Since you deleted the server-to-server app, get the credentials from your NEW OAuth app:

1. Go to: https://marketplace.zoom.us/user/build
2. Click on your OAuth app (Client ID: `W2jPo9CJR0uZbFnEWtBF7Q`)
3. Go to **App Credentials** tab
4. Copy these values:
   - **Account ID** (looks like: `abc123_XYZ`)
   - **Client ID**: `W2jPo9CJR0uZbFnEWtBF7Q` (already have this)
   - **Client Secret**: (click "View" to reveal)

### 3. Update Cloudflare Secrets
Run these commands to update the platform Zoom credentials:

```powershell
# Update Account ID (from OAuth app)
echo "YOUR_ACCOUNT_ID" | npx wrangler secret put ZOOM_ACCOUNT_ID --config workers/akademo-api/wrangler.toml

# Update Client ID (confirm it's the OAuth app)
echo "W2jPo9CJR0uZbFnEWtBF7Q" | npx wrangler secret put ZOOM_CLIENT_ID --config workers/akademo-api/wrangler.toml

# Update Client Secret (from OAuth app)
echo "YOUR_CLIENT_SECRET" | npx wrangler secret put ZOOM_CLIENT_SECRET --config workers/akademo-api/wrangler.toml
```

### 4. Verify Webhook Events Enabled
In Zoom App → Feature → Event Subscriptions, ensure these are checked:
- ✅ `meeting.started`
- ✅ `meeting.ended`
- ✅ `meeting.participant_joined`
- ✅ `meeting.participant_left`
- ✅ `recording.completed` ← **CRITICAL**

### 5. Test the Fix

#### A. Test webhook endpoint directly:
```powershell
Invoke-WebRequest -Uri "https://akademo-api.alexxvives.workers.dev/webhooks/zoom" -Method POST -ContentType "application/json" -Body '{"event":"endpoint.url_validation","payload":{"plainToken":"test123"}}' -UseBasicParsing
```
Should return 200 with encrypted token.

#### B. Create a new stream:
1. Go to teacher dashboard
2. Create a new live stream
3. Start the Zoom meeting
4. Check database:
```powershell
npx wrangler d1 execute akademo-db --remote --command "SELECT id, title, status, startedAt FROM LiveStream ORDER BY createdAt DESC LIMIT 1"
```
Status should change from 'scheduled' to 'active' when you start the meeting.

#### C. End meeting and check recording:
1. End the Zoom meeting
2. Wait 10-15 minutes (Zoom processing time)
3. Check database:
```powershell
npx wrangler d1 execute akademo-db --remote --command "SELECT id, title, recordingId FROM LiveStream WHERE endedAt IS NOT NULL ORDER BY createdAt DESC LIMIT 1"
```
recordingId should be populated with a Bunny GUID.

## Why This Happened
1. You created a server-to-server app → stored credentials in Cloudflare
2. Created an OAuth app for multi-tenant support
3. Deleted server-to-server app → broke platform-level credentials
4. Old documentation had `/api/` prefix in webhook URL (now fixed)

## Current Architecture
- **Platform-level meetings** (fallback): Use `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` secrets
- **Academy-specific meetings**: Use OAuth tokens stored in `ZoomAccount` table
- **Webhook handler**: Receives all events at `/webhooks/zoom` (no `/api/` prefix)

## After Fix
Once you complete steps 1-3 above:
1. Webhooks will reach the API worker
2. Meetings will auto-update status (scheduled → active → ended)
3. Recordings will auto-upload to Bunny Stream
4. `LiveStream.recordingId` will be populated
5. Teachers can convert recordings to lessons

---

**Date**: 2026-01-24  
**Status**: ❌ Awaiting manual fixes (webhook URL + credentials)
