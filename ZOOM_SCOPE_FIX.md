# Zoom API Configuration

## Current Configuration (as of Jan 2026)

### Webhook Events Subscribed
| Event | Status | Purpose |
|-------|--------|---------|
| `meeting.started` | ✅ | Update stream status to "active" |
| `meeting.ended` | ✅ | Update stream status to "ended", fetch participants |
| `meeting.participant_joined` | ✅ | Track real-time participant count |
| `meeting.participant_left` | ✅ | Track real-time participant count |
| `recording.completed` | ✅ | Auto-upload recording to Bunny Stream |

**Webhook URL**: `https://akademo.alexxvives.workers.dev/api/webhooks/zoom`

### Scopes Configured
| Scope | Description | Used For |
|-------|-------------|----------|
| `meeting:write:meeting:admin` | Create meetings | Creating Zoom meetings for streams |
| `meeting:read:meeting:admin` | View meetings | Getting meeting details |
| `meeting:read:participant:admin` | View participants | Real-time participant tracking |
| `meeting:read:list_past_participants:admin` | View past participants | Post-meeting analytics |
| `cloud_recording:read:list_recording_files:admin` | **⚠️ REQUIRED** List recording files | Fetching recording download URLs |
| `cloud_recording:read:archive_files:admin` | Read archive files | Recording access |
| `cloud_recording:read:content:master` | Read recording content | Download recordings |
| `cloud_recording:read:recording:admin` | View recordings | List/view recordings |
| `user:read:user:admin` | View user info | Get user ID for meeting creation |

### ⚠️ CRITICAL Missing Scope (Jan 2026)
If recordings are not being saved, ensure you have:
- `cloud_recording:read:list_recording_files:admin` - Required for `/meetings/{id}/recordings` API

### Optional Scopes (Not Currently Needed)
| Scope | Description | When to Add |
|-------|-------------|-------------|
| `cloud_recording:write:recording:admin` | Delete recordings | If you want to auto-delete from Zoom after upload to Bunny |
| `cloud_recording:read:list_recording_files:admin` | List recording files | If you need to list all recordings |

**Note**: "Recording file" = individual video/audio files from a meeting (MP4, M4A, transcript, etc.)

---

## Credentials Location
Stored as Cloudflare Workers secrets:
- `ZOOM_ACCOUNT_ID`
- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `ZOOM_WEBHOOK_SECRET`

Set via: `wrangler secret put SECRET_NAME`

---

## Troubleshooting

### Issue: Recordings not being saved to Bunny

**Symptoms**: LiveStream records have `recordingId = null` after meeting ends

**Debugging Steps**:
1. Check if webhook is receiving events:
   ```powershell
   npx wrangler tail akademo --format pretty
   ```
   Look for `[Zoom Webhook] Recording completed` logs

2. Verify webhook URL is correct in Zoom App settings

3. Test webhook manually:
   ```powershell
   $body = @{ event = "recording.completed"; payload = @{ object = @{ id = "MEETING_ID" } } } | ConvertTo-Json
   Invoke-RestMethod -Uri "https://akademo.alexxvives.workers.dev/api/webhooks/zoom" -Method POST -Body $body -ContentType "application/json"
   ```

4. Check Bunny for failed uploads (status=6):
   ```powershell
   $headers = @{ "AccessKey" = "YOUR_KEY" }
   Invoke-RestMethod -Uri "https://video.bunnycdn.com/library/571240/videos?page=1&itemsPerPage=20" -Headers $headers | Select items
   ```

**Common Causes**:
- Zoom download URL expired before Bunny could fetch
- Webhook secret mismatch (silent failure)
- Recording not yet available when webhook fires (Zoom delay)

### Issue: Cannot create meetings

**Error**: `Invalid access token, does not contain scopes:[user:read:user:admin]`

**Fix**: Add `user:read:user:admin` scope in Zoom App → Scopes tab

---

## Architecture: Recording Flow

```
1. Meeting ends in Zoom
   ↓
2. Zoom sends `meeting.ended` webhook
   ↓ (5-15 minutes later)
3. Zoom finishes processing recording
   ↓
4. Zoom sends `recording.completed` webhook with:
   - download_token (expires in ~24 hours)
   - recording_files[] with download URLs
   ↓
5. Our webhook handler:
   a. Gets fresh access token
   b. Fetches recording details from Zoom API
   c. Sends download URL to Bunny's /fetch endpoint
   d. Bunny downloads from Zoom and transcodes
   e. We save bunnyGuid as recordingId in LiveStream
```
