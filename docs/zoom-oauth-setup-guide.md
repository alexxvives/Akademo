# Zoom OAuth Setup Guide

## ✅ Current Configuration

**App Client ID**: `W2jPo9CJR0uZbFnEWtBF7Q`  
**Client Secret**: `mcpbUBWlTY6WOEwV23J2TA` ✅ Configured in Cloudflare Workers

---

## 📋 Step 1: OAuth Configuration

In your Zoom App Marketplace settings, configure the OAuth section:

### OAuth Redirect URL
```
https://akademo-edu.com/api/zoom/oauth/callback
```

**Important**: 
- ✅ This URL is already filled in your screenshot
- Must be EXACTLY this URL (no trailing slash)
- Use Strict Mode for security

### OAuth Allow Lists
Add the same URL:
```
https://akademo-edu.com/api/zoom/oauth/callback
```

---

## 📋 Step 2: Webhook Event Subscription

### Event Notification Endpoint URL
```
https://akademo-api.alexxvives.workers.dev/api/webhooks/zoom
```

### Required Events to Subscribe

Click "Add Events" and select these:

#### 1. Meeting Events (Required)
- ✅ `meeting.started` - Detects when live class begins
- ✅ `meeting.ended` - Detects when live class finishes
- ✅ `meeting.participant_joined` - Tracks student attendance
- ✅ `meeting.participant_left` - Tracks when students leave

#### 2. Recording Events (Required)
- ✅ `recording.completed` - Auto-upload recording to Bunny Stream

### Why These Events?

| Event | What It Does |
|-------|--------------|
| `meeting.started` | Updates LiveStream status to "active" when teacher starts |
| `meeting.ended` | Updates LiveStream status to "ended", schedules participant fetch |
| `participant_joined` | Real-time participant count updates |
| `participant_left` | Updates participant count when students leave |
| `recording.completed` | **Critical** - Automatically downloads recording and uploads to Bunny Stream |

---

## 📋 Step 3: Required Scopes

Make sure these scopes are enabled in your Zoom app:

### ✅ Required Scopes (Must Have)
- `meeting:write:meeting:admin` - Create Zoom meetings
- `meeting:read:meeting:admin` - Get meeting details
- `meeting:read:participant:admin` - Real-time participant tracking
- `meeting:read:list_past_participants:admin` - Post-meeting analytics
- `cloud_recording:read:list_recording_files:admin` - **CRITICAL** - Fetch recording URLs
- `cloud_recording:read:content:master` - Download recordings
- `user:read:user:admin` - Get user ID for meeting creation

### Optional (Future Features)
- `cloud_recording:write:recording:admin` - Auto-delete recordings from Zoom
- `cloud_recording:read:archive_files:admin` - Access archived recordings

---

## 📋 Step 4: Authentication Header (Optional but Recommended)

For webhook security, configure authentication:

1. Click "Authentication Header Option"
2. Add a custom header:
   - **Header Name**: `X-Zoom-Webhook-Secret`
   - **Header Value**: Generate a random secret (e.g., `your-secure-random-string-here`)

3. Save this secret in Cloudflare:
   ```powershell
   echo "your-secret" | npx wrangler secret put ZOOM_WEBHOOK_SECRET
   ```

---

## 🧪 Testing the Setup

### Test OAuth Flow

1. Go to: https://akademo-edu.com/dashboard/academy/profile
2. Click "Conectar Zoom"
3. You should see Zoom authorization page (not error 4702)
4. Authorize the app
5. You'll be redirected back to profile with success message
6. Zoom account should appear in the list

### Test Webhook

1. Create a test Zoom meeting through the academy
2. Start the meeting
3. Check logs: `npx wrangler tail akademo-api --format pretty`
4. You should see webhook events arriving

### Test Recording Upload

1. Create a Zoom meeting with recording enabled
2. End the meeting
3. Wait 5-15 minutes (Zoom processing time)
4. Check logs for `[Zoom Webhook] Recording completed`
5. Verify `LiveStream.recordingId` is populated in database

---

## 🔍 Common Issues

### Error: Invalid client_id (4702)
**Cause**: Frontend not deployed or using old credentials  
**Fix**: ✅ Already fixed - new build deployed with `W2jPo9CJR0uZbFnEWtBF7Q`

### Webhooks not arriving
**Cause**: Wrong endpoint URL or subscription not saved  
**Fix**: 
- Verify endpoint: `https://akademo-api.alexxvives.workers.dev/api/webhooks/zoom`
- Click "Save" after adding events
- Wait 5-10 minutes for Zoom to propagate

### Recordings not uploading
**Cause**: Missing `cloud_recording:read:list_recording_files:admin` scope  
**Fix**: Add the scope, re-authorize Zoom account in academy profile

---

## 📊 How It Works

```
1. Academy Owner connects Zoom account:
   ↓
   OAuth flow → Zoom authorization → Callback saves access/refresh tokens
   
2. Teacher creates live class:
   ↓
   Uses academy's Zoom account → Creates Zoom meeting → Stores zoomMeetingId
   
3. Teacher starts meeting:
   ↓
   Zoom sends meeting.started webhook → Updates status to "active"
   
4. Students join:
   ↓
   Zoom sends participant_joined webhooks → Updates participant count
   
5. Teacher ends meeting:
   ↓
   Zoom sends meeting.ended webhook → Schedules participant fetch (10 min delay)
   
6. Zoom processes recording (5-15 min):
   ↓
   Zoom sends recording.completed webhook → Downloads from Zoom → Uploads to Bunny → Saves recordingId
   
7. Teacher can convert recording to lesson:
   ↓
   Creates new lesson with bunnyGuid from LiveStream.recordingId
```

---

## ✅ Checklist

- [ ] OAuth Redirect URL configured: `https://akademo-edu.com/api/zoom/oauth/callback`
- [ ] OAuth Allow List added: `https://akademo-edu.com/api/zoom/oauth/callback`
- [ ] Webhook endpoint configured: `https://akademo-api.alexxvives.workers.dev/api/webhooks/zoom`
- [ ] Meeting events added: `started`, `ended`, `participant_joined`, `participant_left`
- [ ] Recording event added: `recording.completed`
- [ ] All required scopes enabled (especially `cloud_recording:read:list_recording_files:admin`)
- [ ] Frontend deployed with new client ID ✅
- [ ] Client secret configured in Cloudflare Workers ✅
- [ ] Test OAuth flow works
- [ ] Test webhooks arrive in logs

---

**Last Updated**: January 22, 2026  
**Zoom App**: W2jPo9CJR0uZbFnEWtBF7Q  
**Status**: ✅ Ready for production (after Zoom Marketplace configuration)
