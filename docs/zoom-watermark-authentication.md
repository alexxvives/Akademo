# Zoom Watermark & Authentication — Source of Truth

## What Is the Watermark Feature?

Zoom overlays each participant's **email address** as a semi-transparent pattern across shared content and video feeds. This prevents screen-sharing leaks — anyone who shares a screenshot will have their email burned into it.

**Requirement from Zoom**: Watermark only works if participants are **authenticated** (logged into a Zoom account). Zoom needs to know *who* is watching so it can stamp their email. Anonymous / guest joiners cannot have a watermark.

---

## The Bug We Debugged (May 2026) — Root Cause

### Symptom
`watermark: true` was being sent in the meeting creation API call, Zoom accepted it silently, but the watermark **never appeared** for students on mobile.

### Why It Happened

Zoom requires **two things** together:
1. `watermark: true`
2. `meeting_authentication: true` + a valid `authentication_option` profile ID

Without a valid `authentication_option` ID, Zoom **silently ignores** `meeting_authentication: true` and sets it to `false` in the response. No error is returned. Watermark is then skipped because participants are not authenticated.

### What We Tried That Did NOT Work
| Attempt | Why It Failed |
|---------|--------------|
| `meeting_authentication: true` alone | Zoom ignores it silently without `authentication_option` |
| `enforce_login: true` | Zoom ignores this field too on Pro plan without an auth profile |
| `/users/me/meeting_authentication` endpoint | Returns `404 {"code":2300}` on Pro plan |

### The Fix
Changed the endpoint to fetch authentication profiles from **account level** instead of user level:

```
❌ GET /v2/users/me/meeting_authentication          → 404 on Pro plan
✅ GET /v2/accounts/me/settings/meeting_authentication → Works on Pro plan
```

This returns the "Sign in to Zoom (Default)" profile that exists on the account. Its `id` is then passed as `authentication_option`, which makes `meeting_authentication: true` respected by Zoom.

### Verified Working Meeting Settings (API Response)
```json
{
  "watermark": true,
  "meeting_authentication": true,
  "authentication_option": "<profile-id>"
}
```

---

## Current Implementation

**File**: `workers/akademo-api/src/lib/zoom.ts` → `createZoomMeeting()`

### Step 1 — Fetch Auth Profile ID
```typescript
const profilesRes = await fetch(
  'https://api.zoom.us/v2/accounts/me/settings/meeting_authentication',
  { headers: { Authorization: `Bearer ${token}` } }
);
const profiles = profilesData.authentication_options ?? [];
// Prefer enforce_login type (any Zoom user), fall back to first profile
const profile = profiles.find(p => p.type === 'enforce_login') ?? profiles[0];
const authenticationOption = profile?.id ?? null;
```

### Step 2 — Create Meeting with Auth
```typescript
settings: {
  watermark: true,
  enforce_login: true,
  meeting_authentication: true,
  ...(authenticationOption ? { authentication_option: authenticationOption } : {}),
}
```

The `authentication_option` is only included if we successfully retrieved the profile ID. If the fetch fails (e.g. token issue), the meeting is still created — just without enforced authentication.

---

## Account-Level Settings Required in Zoom Portal

These must be configured in the Zoom web portal under **Account Management → Account Settings → Meeting tab**:

| Setting | Value | Notes |
|---------|-------|-------|
| Add watermark | ✅ ON + 🔒 Locked | Opacity ~56%, visible on "Both" |
| Only authenticated meeting participants can join | ✅ ON + 🔒 Locked | Required for watermark |
| Sign in to Zoom (Default) | ✅ Must exist | The authentication profile used by API |

> **Never disable** "Only authenticated participants" — if unlocked, a teacher could accidentally turn it off and break watermark for all classes.

---

## How to Diagnose if Watermark Breaks Again

### 1. Check the meeting creation log
In `wrangler tail`, after a `POST /live`, look for:
```
[Zoom] Auth profiles: [{"id":"...","type":"enforce_login","name":"Sign in to Zoom (Default)"}]
[Zoom] Meeting created — full settings echo: {...,"watermark":true,"meeting_authentication":true,...}
```

**If you see:**
- `Auth profiles: []` → The account-level auth profile was deleted in Zoom portal. Recreate it.
- `Could not fetch auth profiles: 404` → Endpoint changed or token scope issue. Check the endpoint in zoom.ts.
- `"meeting_authentication": false` in the echo → `authentication_option` was not sent (profile fetch failed).
- `"watermark": false` in the echo → `watermark: true` was overridden at account level. Check Zoom portal.

### 2. Verify the Zoom account settings
Log in to [zoom.us](https://zoom.us) as admin → Account Management → Account Settings → Meeting tab. Confirm the settings in the table above are still ON and locked.

### 3. Verify participant is logged into Zoom
The watermark shows the participant's **email**. If they join as a guest (no Zoom account login), `meeting_authentication: true` will block them from joining entirely (good). If watermark is missing but they did join, check if the student is actually signed into their Zoom app (not just "opened" the app).

---

## Zoom Plan Requirements

| Feature | Basic | Pro | Business |
|---------|-------|-----|----------|
| Watermark | ✅ | ✅ | ✅ |
| meeting_authentication via API | ❌ | ✅ (with account-level profile) | ✅ |
| `/users/me/meeting_authentication` endpoint | ❌ | ❌ (404) | ✅ |
| `/accounts/me/settings/meeting_authentication` endpoint | ❌ | ✅ | ✅ |
| enforce_login field via API | ❌ | ⚠️ Ignored | ✅ |

> We are on **Pro**. Use `/accounts/me/settings/meeting_authentication` — never `/users/me/meeting_authentication`.

---

## OAuth Scopes Needed

The watermark/authentication feature does **not** require special scopes beyond what is already in the OAuth app. The scopes that were present when it worked:
- `meeting:write:meeting`
- Standard user OAuth scopes

The `/accounts/me/settings/meeting_authentication` endpoint works with the same token used to create meetings. No additional scope is required.

---

## Related Files

| File | Purpose |
|------|---------|
| `workers/akademo-api/src/lib/zoom.ts` | Meeting creation, auth profile fetch |
| `workers/akademo-api/src/routes/live.ts` | `POST /live` route that calls `createZoomMeeting` |
| `workers/akademo-api/src/routes/webhooks.ts` | Handles `meeting.started`, `recording.completed`, etc. |
| `docs/zoom-oauth-quick-reference.md` | OAuth setup, token refresh, ZoomAccount table |
| `docs/zoom-recording-behavior.md` | Cloud vs local recording, webhook flow |
