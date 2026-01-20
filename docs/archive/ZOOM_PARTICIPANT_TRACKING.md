# Zoom Participant Tracking

## Overview
Automatic tracking of Zoom meeting participants for live classes. The system fetches participant data from Zoom API 10 minutes after a stream ends.

## How It Works

### 1. Stream Creation
- When a teacher creates a live class, a Zoom meeting is automatically created via the Zoom API
- The `zoomMeetingId` is extracted and stored in the `LiveStream` table

### 2. Meeting End Detection
- When the Zoom meeting ends, a webhook is sent to `/api/webhooks/zoom`
- The `handleMeetingEnded` function updates the stream status to "ended"
- A delayed task is scheduled to fetch participants 10 minutes later

### 3. Participant Fetching
- After 10 minutes, the `/api/zoom/participants` endpoint is called
- The system fetches participant data from Zoom's Past Meetings API
- Participants are deduplicated by email or name to count unique attendees
- The data is stored in the `LiveStream` table:
  - `participantCount`: Number of unique participants
  - `participantsData`: JSON with full participant details (names, emails, join/leave times, duration)
  - `participantsFetchedAt`: Timestamp when data was fetched

### 4. Database Schema

#### LiveStream Table (New Columns)
```sql
participantCount INTEGER            -- Count of unique participants
participantsFetchedAt TEXT          -- When participants were fetched
participantsData TEXT               -- JSON with participant details
```

#### participantsData JSON Structure
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

## API Endpoints

### GET /api/zoom/participants?streamId={id}
Manual trigger to fetch participants for a specific stream (requires TEACHER/ADMIN role).

**Response:**
```json
{
  "success": true,
  "data": {
    "participantCount": 23,
    "totalRecords": 25,
    "uniqueCount": 23,
    "fetchedAt": "2026-01-01T12:00:00Z"
  }
}
```

### POST /api/zoom/participants
Automatic trigger (internal use only - called by webhook handler).

**Request:**
```json
{
  "streamId": "stream_id_here",
  "cronSecret": "your-secret-here"
}
```

## Zoom OAuth Scopes Required

- ✅ `meeting:read:list_past_participants:admin` - **REQUIRED** for fetching participant data
- ✅ `meeting:write:meeting:admin` - Already in use for creating meetings
- ✅ `meeting:read:meeting:admin` - Already in use for meeting details

## Helper Functions

### extractZoomMeetingId(url: string)
Extracts meeting ID from various Zoom URL formats:
- `https://zoom.us/j/1234567890`
- `https://us05web.zoom.us/j/1234567890?pwd=abc123`
- `https://zoom.us/wc/join/1234567890`

### getZoomMeetingParticipants(meetingId: string)
Fetches participant list from Zoom API for a past meeting.

**Returns:**
```typescript
interface ZoomParticipantsResponse {
  page_count: number;
  page_size: number;
  total_records: number;
  next_page_token?: string;
  participants: Array<{
    id: string;
    user_id?: string;
    name: string;
    user_email?: string;
    join_time: string;
    leave_time: string;
    duration: number; // seconds
  }>;
}
```

## Implementation Notes

### Deduplication Logic
Participants are deduplicated by `user_email` or `name` (fallback). This handles cases where:
- Same person joins/leaves multiple times
- Multiple join records exist for one participant

### 10-Minute Delay
The system waits 10 minutes after a meeting ends before fetching participants because:
- Zoom needs time to process and finalize participant data
- Immediate fetching may return incomplete data

### Error Handling
The POST endpoint returns `{ success: true, skipped: true, reason: '...' }` in cases like:
- `no_zoom_meeting_id`: Stream has no Zoom meeting
- `not_ended`: Stream hasn't ended yet
- `already_fetched`: Participants already retrieved
- `too_soon`: Less than 10 minutes since meeting ended
- `zoom_api_error`: Zoom API returned an error
- `no_data_from_zoom`: No participant data available

## Future Enhancements

### Option 1: Cloudflare Workers Cron Triggers
Instead of setTimeout (which doesn't work reliably in serverless), use Cloudflare Workers Cron:

```toml
# wrangler.toml
[triggers]
crons = ["*/15 * * * *"]  # Every 15 minutes
```

```typescript
// Scheduled handler
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Find streams that ended 10+ minutes ago and haven't had participants fetched
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
For more reliable scheduling, use Cloudflare Queues to trigger participant fetching.

## Display in UI

Teachers can see participant counts on their stream history:

```tsx
{stream.participantCount && (
  <div className="text-sm text-gray-600">
    {stream.participantCount} participantes
  </div>
)}
```
