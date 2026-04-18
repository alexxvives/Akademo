# Skill: Zoom Integration

Use this when working on Zoom OAuth, meeting creation, recordings, or live streaming.

## Architecture
- Zoom OAuth tokens stored in D1 `ZoomAccount` table
- OAuth flow: `/auth/zoom/callback` route handles the redirect
- Meetings created via Zoom API, webhook receives recording events
- Recordings auto-saved to Bunny CDN via `zoom-recording-download` webhook

## Key Files
```
workers/akademo-api/src/routes/zoom.ts           # Zoom API routes
workers/akademo-api/src/routes/zoom-accounts.ts   # OAuth management
workers/akademo-api/src/lib/zoom.ts               # Zoom API helpers
docs/zoom-oauth-quick-reference.md                # OAuth flow reference
docs/zoom-recording-behavior.md                   # Recording webhook behavior
```

## OAuth Flow
1. Academy/Teacher clicks "Connect Zoom" → redirected to Zoom OAuth
2. Zoom redirects back to `/api/zoom/callback` with auth code
3. API exchanges code for `access_token` + `refresh_token`
4. Tokens stored in `ZoomAccount` table, linked to userId

## Common Issues

| Problem | Fix |
|---------|-----|
| Token expired | Auto-refreshes via `refresh_token` — check `ZoomAccount.expiresAt` |
| Recording webhook not firing | Zoom app must have `recording.completed` event subscription |
| Meeting creation fails 401 | Token refresh failed — user needs to re-authorize |
| Recording download fails | Check Bunny CDN credentials in worker env vars |

## Before Making Changes
1. Read `docs/zoom-oauth-quick-reference.md` for the full OAuth flow
2. Read `docs/zoom-recording-behavior.md` for webhook payload format
3. Check `ZoomAccount` schema: `npx wrangler d1 execute akademo-db --remote --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='ZoomAccount'"`
