# Zoom vs Daily.co — Full Comparison for AKADEMO

**Last updated**: March 2026  
**Context**: AKADEMO uses Zoom for live classes. This document evaluates a potential migration to Daily.co.

---

## TL;DR Recommendation

**Stay on Zoom for now.** Daily.co has a better developer experience and more UI control, but Zoom is cheaper at scale, already integrated, and more familiar to students. Daily.co becomes worth it only if you need deeply custom video UI or want to remove the Zoom app requirement.

---

## Cost Comparison

### Zoom (current)
| Plan | Price | Participants | Notes |
|------|-------|--------------|-------|
| Pro | ~$15/month/host | 100 | 1 host = 1 teacher |
| Business | ~$20/month/host | 300 | Better for multiple concurrent classes |

**Real cost for 50-student class:**
- 1 teacher needs 1 Zoom host license → **~$15–20/month flat**
- 10 teachers = 10 licenses = **~$150–200/month** regardless of how many classes they run
- No per-minute fees

### Daily.co
| Plan | Price | Notes |
|------|-------|-------|
| Developer (free) | $0 | 2,000 participant-minutes/month, no cloud recording |
| Scale | Pay-as-you-go | ~$0.004/participant-minute |
| Enterprise | Custom | Flat rate, custom limits |

**Real cost for 1h class, 50 students + 1 teacher:**
- 51 participants × 60 minutes = **3,060 participant-minutes**
- At $0.004 = **~$12.24 per class**
- 20 classes/month = **~$245/month**
- 50 classes/month = **~$612/month**

**Adding cloud recording (required to send to Bunny):**
- Included in Scale plan on top of participant-minutes
- Recording storage: ~$0.02/GB/month

### Verdict on cost
| Scenario | Zoom | Daily.co Scale |
|----------|------|----------------|
| 1 teacher, 5 classes/month | ~$15 | ~$60 |
| 5 teachers, 20 classes/month | ~$75–100 | ~$245 |
| 10 teachers, 40 classes/month | ~$150–200 | ~$490 |

**Zoom is 3–4× cheaper at scale.** Daily.co only becomes competitive with an Enterprise flat-rate deal.

---

## Feature Comparison

| Feature | Zoom | Daily.co |
|---------|------|----------|
| Requires app install | Yes (students must install Zoom) | No (fully browser-based) |
| Custom video UI | No (Zoom controls the UI) | Yes (full React SDK control) |
| Recording → Bunny | ✅ Automatic via `recording.completed` webhook | ✅ Automatic via `recording.ready` webhook (must process within ~1h) |
| Recording URL expiry | Persistent download URL | Signed URL, expires ~1 hour after ready |
| Max participants | 100–300 depending on plan | 200 on Business, custom on Enterprise |
| Mobile support | Native Zoom app (very stable) | Browser-based (good, not as robust on poor networks) |
| Breakout rooms | ✅ Native | ✅ Available |
| Waiting room / lobby | ✅ | ✅ |
| Screen share | ✅ | ✅ |
| Chat | ✅ | ✅ |
| Whiteboard | ✅ Native | Via integration only |
| Reactions | ✅ | ✅ |
| Co-host support | ✅ | ✅ |
| Zoom account required | For host only | No Zoom account ever needed |
| SDK/API quality | REST API, good docs | REST + React/JS SDK, excellent docs |
| Webhook reliability | Very reliable | Very reliable |
| GDPR / data residency | EU option available | EU option available |
| Student familiarity | Very high (everyone knows Zoom) | Low (students may be confused) |

---

## Daily.co Advantages

1. **No app install** — Students join from the browser directly. Eliminates "I can't find the Zoom link" support tickets.
2. **Full UI control** — You can build a completely branded video room inside the AKADEMO dashboard (custom layout, watermarks, your logo, student names styled your way).
3. **Granular token-based access** — Can give each student a unique signed token to join, enabling per-student controls (mute, remove, restrict screen share).
4. **Better API for automation** — Room creation, deletion, participant management all via clean REST API or JS SDK.
5. **Embedded experience** — Video can live inside your `/dashboard/teacher/streams` page, not open a separate Zoom window.

---

## Daily.co Disadvantages

1. **Cost** — 3–4× more expensive than Zoom at typical class sizes (see above).
2. **Recording URL expiry** — `recording.ready` webhook fires with a signed URL valid ~1 hour. If the Bunny processing webhook handler is slow or fails, you lose the recording permanently. Zoom gives you a persistent link.
3. **Student familiarity** — Zoom is universally known. Daily.co is not, which may cause confusion for less tech-savvy students.
4. **Network reliability** — The Zoom native app has better performance on poor/mobile connections than a browser WebRTC session.
5. **Whiteboard** — Zoom has a built-in whiteboard. Daily.co requires a third-party integration (e.g., Miro embed).
6. **No Zoom ecosystem** — If your students already use Zoom for other purposes, they lose that familiarity.

---

## How Recording Would Work with Daily.co

The current Zoom → Bunny pipeline:
```
Zoom meeting ends
  → Zoom fires `recording.completed` webhook
  → /webhooks/zoom handler in akademo-api
  → Fetches recording download URL
  → Calls Bunny /videos/fetch (server-to-server)
  → LiveStream.recordingId updated with Bunny GUID
```

With Daily.co, the pipeline is identical in structure:
```
Daily.co meeting ends
  → Daily.co fires `recording.ready` webhook
  → New /webhooks/dailyco handler in akademo-api
  → data.recording.download_url → Bunny /videos/fetch
  → LiveStream.recordingId updated with Bunny GUID
```

**Critical difference**: Daily.co signed URLs expire in ~1 hour. The Bunny fetch must be triggered immediately in the webhook handler. If your Worker is slow or the Bunny fetch fails, retry logic is essential.

---

## How to Integrate Daily.co (if you decide to migrate)

### 1. Create a Daily.co account
- Sign up at [daily.co](https://www.daily.co)
- Get your API key from the dashboard
- Add to wrangler.toml: `DAILY_API_KEY = "your-key"`

### 2. Add API key to Worker environment
```toml
# wrangler.toml (workers/akademo-api)
[vars]
DAILY_API_KEY = ""  # set via wrangler secret

# Set secret:
# npx wrangler secret put DAILY_API_KEY --name akademo-api
```

### 3. Create a room when teacher starts a class
```typescript
// workers/akademo-api/src/routes/live.ts
const room = await fetch('https://api.daily.co/v1/rooms', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${c.env.DAILY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: `class-${classId}-${Date.now()}`,
    privacy: 'private',
    properties: {
      exp: Math.floor(Date.now() / 1000) + 7200, // 2h expiry
      enable_recording: 'cloud',
      max_participants: 201,
    },
  }),
}).then(r => r.json());
```

### 4. Create a meeting token per participant
```typescript
// Give each student a unique join token (important for per-student control)
const token = await fetch('https://api.daily.co/v1/meeting-tokens', {
  method: 'POST',
  headers: { Authorization: `Bearer ${c.env.DAILY_API_KEY}` },
  body: JSON.stringify({
    properties: {
      room_name: room.name,
      user_name: `${student.firstName} ${student.lastName}`,
      user_id: student.id,
      is_owner: false,
      start_video_off: true,
      start_audio_off: true,
    },
  }),
}).then(r => r.json());
```

### 5. Embed the Daily.co iframe in your frontend
```tsx
// src/components/teacher/LiveClassRoom.tsx
import DailyIframe from '@daily-co/daily-js';

// Or simpler: use the prebuilt iframe embed
<iframe
  src={`${roomUrl}?t=${participantToken}`}
  allow="camera; microphone; fullscreen; display-capture"
  style={{ width: '100%', height: '600px', border: 'none' }}
/>
```

Install the SDK:
```powershell
pnpm add @daily-co/daily-js
```

### 6. Handle the recording webhook
```typescript
// workers/akademo-api/src/routes/webhooks.ts
app.post('/webhooks/dailyco', async (c) => {
  const body = await c.req.json();
  
  if (body.action === 'recording.ready') {
    const downloadUrl = body.payload.download_url; // expires in ~1h!
    const roomName = body.payload.room_name;
    
    // Find the LiveStream by room name
    const stream = await c.env.DB
      .prepare('SELECT id FROM LiveStream WHERE roomName = ?')
      .bind(roomName)
      .first();
    
    if (stream) {
      // Immediately fetch to Bunny — don't delay!
      const bunnyRes = await fetch(`https://video.bunnycdn.com/library/${c.env.BUNNY_LIBRARY_ID}/videos/fetch`, {
        method: 'POST',
        headers: { AccessKey: c.env.BUNNY_API_KEY },
        body: JSON.stringify({ url: downloadUrl, title: `Recording ${roomName}` }),
      }).then(r => r.json());
      
      await c.env.DB
        .prepare('UPDATE LiveStream SET recordingId = ? WHERE id = ?')
        .bind(bunnyRes.guid, stream.id)
        .run();
    }
  }
  
  return c.json({ ok: true });
});
```

### 7. Register the webhook on Daily.co
In the Daily.co dashboard → Webhooks → Add endpoint:
- URL: `https://akademo-api.your-account.workers.dev/webhooks/dailyco`
- Events: `recording.ready`, `meeting.ended`, `participant.joined`, `participant.left`

### 8. Schema changes needed
```sql
-- migrations/XXXX_dailyco_support.sql
ALTER TABLE LiveStream ADD COLUMN dailyRoomName TEXT;
ALTER TABLE LiveStream ADD COLUMN dailyRoomUrl TEXT;
```

---

## Migration Effort Estimate

| Task | Effort |
|------|--------|
| Daily.co room creation API | 2h |
| Meeting token generation per participant | 1h |
| Frontend iframe embed | 2h |
| Recording webhook handler | 2h |
| Schema migration | 30min |
| Remove Zoom account assignment logic | 2h |
| Remove ZoomAccount table (optional) | 1h |
| Testing end-to-end | 4h |
| **Total** | **~14h** |

---

## Files to Change if Migrating

- `workers/akademo-api/src/routes/live.ts` — replace Zoom meeting creation with Daily.co room creation
- `workers/akademo-api/src/routes/webhooks.ts` — add `recording.ready` handler, remove/keep Zoom handler
- `workers/akademo-api/src/routes/calendar-events.ts` — replace Zoom link generation
- `src/components/teacher/LiveStreamCard.tsx` — embed iframe instead of Zoom link
- `src/components/student/LiveClassJoin.tsx` — generate token, embed iframe
- `wrangler.toml` — add `DAILY_API_KEY`, optionally remove `ZOOM_*` vars
- New migration: add `dailyRoomName`, `dailyRoomUrl` columns to `LiveStream`
