# Zoom Integration Guide

## Overview
AKADEMO uses Zoom API for live streaming with automatic participant tracking and recording management.

---

## Zoom OAuth Scopes

### Required Scopes
| Scope | Purpose |
|-------|---------|
| `meeting:write:meeting:admin` | Create Zoom meetings for live classes |
| `meeting:read:meeting:admin` | Get meeting details and status |
| `meeting:read:participant:admin` | Real-time participant tracking |
| `meeting:read:list_past_participants:admin` | Post-meeting participant analytics |
| `cloud_recording:read:list_recording_files:admin` | **CRITICAL** - Fetch recording download URLs |
| `cloud_recording:read:content:master` | Download recording files |
| `user:read:user:admin` | Get user ID for meeting creation |

### Optional Scopes (Future Use)
| Scope | Purpose |
|-------|---------|
| `cloud_recording:write:recording:admin` | Auto-delete from Zoom after Bunny upload |
| `cloud_recording:read:archive_files:admin` | Access archived recordings |

---

## Webhook Events

### Subscribed Events
| Event | Handler Action |
|-------|----------------|
| `meeting.started` | Update stream status → "active" |
| `meeting.ended` | Update stream status → "ended", schedule participant fetch |
| `meeting.participant_joined` | Update real-time participant count |
| `meeting.participant_left` | Update real-time participant count |
| `recording.completed` | Auto-upload recording to Bunny Stream |

**Webhook URL**: `https://akademo.alexxvives.workers.dev/api/webhooks/zoom`

---

## Participant Tracking

### How It Works

1. **Stream Creation**
   - Teacher creates live class
   - Zoom meeting created via API
   - `zoomMeetingId` stored in `LiveStream` table

2. **Meeting End Detection**
   - Zoom sends `meeting.ended` webhook
   - Stream status updated to "ended"
   - Delayed task scheduled (10 minutes later)

3. **Participant Fetching**
   - After 10 minutes, `/api/zoom/participants` called
   - Fetches data from Zoom Past Meetings API
   - Participants deduplicated by email/name
   - Stored in `LiveStream` table:
     - `participantCount`: Unique participant count
     - `participantsData`: JSON with full details
     - `participantsFetchedAt`: Timestamp

### Database Schema

```sql
-- LiveStream table columns
participantCount INTEGER
participantsFetchedAt TEXT
participantsData TEXT  -- JSON structure below
```

**participantsData JSON**:
```json
{
  "totalRecords": 25,
  "uniqueCount": 23,
  "participants": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "joinTime": "2026-01-01T10:00:00Z",
      "leaveTime": "2026-01-01T11:30:00Z",
      "duration": 5400
    }
  ]
}
```

### API Endpoints

**GET /api/zoom/participants?streamId={id}**
- Manual trigger to fetch participants
- Requires TEACHER/ADMIN role

**POST /api/zoom/participants**
- Automatic trigger (internal use)
- Called by webhook handler

### Deduplication Logic
- Participants deduplicated by `user_email` or `name` (fallback)
- Handles multiple join/leave events for same person

### 10-Minute Delay
- Zoom needs time to process participant data
- Immediate fetching may return incomplete data

---

## Recording Flow

### Architecture

```
1. Meeting ends in Zoom
   ↓
2. Zoom sends `meeting.ended` webhook
   ↓ (5-15 minutes later - Zoom processing)
3. Zoom finishes processing recording
   ↓
4. Zoom sends `recording.completed` webhook
   - download_token (expires ~24 hours)
   - recording_files[] with download URLs
   ↓
5. Our webhook handler:
   a. Gets fresh Zoom access token
   b. Fetches recording details from Zoom API
   c. Sends download URL to Bunny /fetch endpoint
   d. Bunny downloads from Zoom and transcodes
   e. Save bunnyGuid as recordingId in LiveStream
```

### Helper Functions

**extractZoomMeetingId(url: string)**
- Extracts meeting ID from various Zoom URL formats:
  - `https://zoom.us/j/1234567890`
  - `https://us05web.zoom.us/j/1234567890?pwd=abc123`
  - `https://zoom.us/wc/join/1234567890`

**getZoomMeetingParticipants(meetingId: string)**
- Fetches participant list for past meeting
- Returns paginated results (handle `next_page_token`)

---

## Configuration

### Cloudflare Workers Secrets
Set via: `wrangler secret put SECRET_NAME`

Required secrets:
- `ZOOM_ACCOUNT_ID`
- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `ZOOM_WEBHOOK_SECRET`

---

## UI Display

Teachers see participant counts on stream history:

```tsx
{stream.participantCount && (
  <div className="text-sm text-gray-600">
    {stream.participantCount} participantes
  </div>
)}
```

---

## Future Enhancements

### Option 1: Cloudflare Workers Cron
Replace setTimeout with reliable cron triggers:

```toml
# wrangler.toml
[triggers]
crons = ["*/15 * * * *"]  # Every 15 minutes
```

```typescript
export default {
  async scheduled(event, env, ctx) {
    // Find streams ended 10+ min ago without participant data
    const streams = await db.prepare(`
      SELECT id FROM LiveStream 
      WHERE status = 'ended' 
      AND endedAt < datetime('now', '-10 minutes')
      AND participantsFetchedAt IS NULL
    `).all();
    
    for (const stream of streams.results) {
      // Fetch participants
    }
  }
}
```

### Option 2: Cloudflare Queues
Use Cloudflare Queues for more reliable scheduling and retry logic.
