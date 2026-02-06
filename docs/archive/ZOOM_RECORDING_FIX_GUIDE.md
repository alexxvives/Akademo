# Zoom Recording Not Uploading - Troubleshooting Guide

## Current Status (As of Jan 24, 2026 - 17:04)

### ✅ What's Working:
- Zoom meetings are created successfully
- `meeting.started` webhook fires (status changes to 'active')
- `meeting.ended` webhook fires (status changes to 'ended')
- Participant count is updated (via webhooks)

### ❌ What's NOT Working:
- `recording.completed` webhook never fires
- `recordingId` stays null after meeting ends
- Recordings never upload to Bunny Stream

## Evidence from Database

Recent stream (ID: `ffe14122-bc16-4efe-85a5-a59f5c5d7a8e`):
- Created: 2026-01-24 16:59:41
- Started: 2026-01-24 16:59:41 ✅ (webhook fired)
- Ended: 2026-01-24 17:03:50 ✅ (webhook fired)
- Participant Count: 0 ✅ (webhook updated)
- Recording ID: **null** ❌ (webhook never fired)
- Zoom Meeting ID: 84871215871

## Root Cause: `recording.completed` Webhook Not Subscribed

The `recording.completed` event is NOT enabled in your Zoom app's webhook settings.

## Fix Steps

### 1. Go to Zoom Marketplace
https://marketplace.zoom.us/user/build

### 2. Open Your OAuth App
Find the app with Client ID: `W2jPo9CJR0uZbFnEWtBF7Q`

### 3. Navigate to Feature → Event Subscriptions

Verify Event Notification URL:
```
https://akademo-api.alexxvives.workers.dev/webhooks/zoom
```

### 4. **Subscribe to `recording.completed` Event**

Click "Add Events" and ensure these are ALL checked:

#### Meeting Events (Already Working ✅)
- ✅ `meeting.started` - WORKING
- ✅ `meeting.ended` - WORKING
- ✅ `meeting.participant_joined` - WORKING
- ✅ `meeting.participant_left` - WORKING

#### Recording Events (**MISSING** ❌)
- ❌ `recording.completed` - **ADD THIS!**
- ❌ `recording.transcript_completed` - Optional (for transcripts)

### 5. Save Changes

Click "Save" at the bottom of the page.

### 6. Test the Fix

1. Create a new Zoom stream in the teacher dashboard
2. Start the meeting and enable cloud recording
3. Record for at least 30 seconds
4. End the meeting
5. Wait 10-15 minutes for Zoom to process the recording
6. Check database:
   ```powershell
   npx wrangler d1 execute akademo-db --remote --command "SELECT id, title, recordingId FROM LiveStream WHERE status='ended' ORDER BY createdAt DESC LIMIT 1"
   ```
7. recordingId should be populated with a Bunny GUID

## How the Recording Flow Works

```
1. Meeting ends → meeting.ended webhook fires
   ↓
2. Zoom processes recording (5-15 minutes)
   ↓
3. Zoom sends recording.completed webhook
   ↓
4. Webhook handler fetches recording from Zoom API
   ↓
5. Webhook uploads recording to Bunny Stream (via Bunny /fetch API)
   ↓
6. Bunny processes video (transcoding)
   ↓
7. Bunny webhook fires when video ready
   ↓
8. recordingId saved in LiveStream table
```

## Why It Was Working Before (Jan 23)

Older streams have `recordingId`:
- `5026079e-194a-4ac6-9f34-8bfdd7c4c9c6` has recordingId: `50655f7b-e202-49db-bd50-1c7b4dcaec27`
- `7ae66642-7e34-461c-ba05-ebbb3d895983` has recordingId: `6c15a3ba-f3d2-46f5-a9d7-01eb505c3467`

This means `recording.completed` webhook WAS working on Jan 23 but stopped working today.

### Possible Reasons:
1. **Zoom app was edited** and webhook event was unchecked
2. **Webhook URL was changed** (we fixed this - removed `/api/` prefix)
3. **Recording settings changed** in Zoom account
4. **Zoom app was deactivated/reactivated** (resets webhook settings)

## Alternative Check: Cloud Recording Enabled?

The teacher's Zoom account must have cloud recording enabled:

1. Go to https://zoom.us → Settings
2. Click "Recording" tab
3. Ensure "Cloud recording" is ON
4. Ensure "Record active speaker" is enabled

If cloud recording is disabled, recordings won't be created and webhook won't fire.

## Manual Workaround (If Webhook Still Doesn't Fire)

If after enabling `recording.completed` it still doesn't work, you can manually fetch recordings:

```powershell
# Run this command after a meeting ends
npx wrangler d1 execute akademo-db --remote --command "SELECT zoomMeetingId FROM LiveStream WHERE status='ended' AND recordingId IS NULL LIMIT 1"

# Use that meeting ID to manually trigger recording fetch
Invoke-WebRequest -Uri "https://akademo-api.alexxvives.workers.dev/webhooks/zoom" -Method POST -ContentType "application/json" -Body '{"event":"recording.completed","payload":{"object":{"id":MEETING_ID_HERE}}}'
```

## Summary

**Primary Issue**: `recording.completed` webhook event not subscribed in Zoom app  
**Fix**: Add event subscription in Zoom Marketplace  
**Test**: Create new stream, record, wait 15 minutes, check recordingId  
**Expected Result**: recordingId populated with Bunny GUID after recording processes

---

**Last Updated**: January 24, 2026 17:15  
**Status**: ❌ Awaiting webhook event subscription fix
