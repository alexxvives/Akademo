# Skill: Video Upload & Transcoding

Use this when working on Bunny CDN video uploads, transcoding status, or the protected video player.

## Architecture
- Videos uploaded directly from browser to **Bunny CDN** (not through our API — avoids D1 30s timeout)
- Upload creates a `VideoResource` record in D1 with `isTranscoding = 1`
- `useTranscodingPoll` hook polls API until Bunny reports transcoding complete
- Playback uses signed URLs with expiry for DRM protection

## Key Files
```
src/lib/bunny-upload.ts                        # Browser upload to Bunny
src/lib/multipart-upload.ts                    # Chunked upload for large files
src/hooks/useTranscodingPoll.ts                # Polls transcoding status (max 60 polls)
src/components/protected-video-player/         # HLS player with watermark
src/components/video/                          # Video-related UI components
workers/akademo-api/src/routes/videos.ts       # Video metadata CRUD
workers/akademo-api/src/routes/bunny.ts        # Bunny CDN webhooks
workers/akademo-api/src/lib/cloudflare.ts      # Signed URL generation
```

## Upload Flow
1. Teacher selects file → `bunny-upload.ts` uploads directly to Bunny CDN
2. On upload complete → API saves `VideoResource` row with `isTranscoding = 1`
3. `useTranscodingPoll` checks every 10s (max 60 polls = ~10 min cap)
4. When Bunny reports ready → API sets `isTranscoding = 0`

## Playback
- Signed URL generated per video per session (expires in minutes)
- `DailyWatermark` overlays user email on video to deter screen recording
- `ProgressTracker` records watch progress for analytics

## Common Issues

| Problem | Fix |
|---------|-----|
| Video stuck "transcoding" | Check if `isTranscoding = 1` in DB but Bunny says ready — manually set to 0 |
| Upload fails on large files | Check chunked upload — Bunny has a 5GB limit |
| Signed URL expired | Increase expiry or check clock skew |
| Watermark not showing | Check `DailyWatermark.tsx` — requires user email from session |
