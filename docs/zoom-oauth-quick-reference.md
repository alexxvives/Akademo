# Zoom OAuth Quick Reference

## For Academies

### Connect Your Zoom PRO Account
1. Click your profile in the sidebar
2. Click "Conectar Zoom"
3. Sign in with Zoom
4. Authorize AKADEMO

### Assign Zoom to Class
When creating/editing a class:
- Select your Zoom account from dropdown
- Or leave as "Sin cuenta de Zoom" to use platform default

### Start Live Stream
- Click "Stream" in your class
- Meeting created in YOUR Zoom account
- Recordings saved to YOUR Zoom cloud storage

---

## For Developers

### Query Class's Zoom Account
```sql
SELECT c.*, z.accessToken, z.accountName 
FROM Class c
LEFT JOIN ZoomAccount z ON c.zoomAccountId = z.id
WHERE c.id = ?
```

### Check Token Expiry
```typescript
const expiresAt = new Date(account.expiresAt);
if (expiresAt <= new Date(Date.now() + 5 * 60 * 1000)) {
  // Token expires in < 5 minutes, refresh it
  const newToken = await refreshZoomToken(c, accountId);
}
```

### Create Meeting with Custom Token
```typescript
const zoomMeeting = await createZoomMeeting({
  topic: 'My Meeting',
  duration: 120,
  waitingRoom: false,
  config: { accessToken: 'academy_token_here' }
});
```

### Refresh Token
```typescript
import { refreshZoomToken } from './routes/zoom-accounts';

const freshToken = await refreshZoomToken(c, zoomAccountId);
if (!freshToken) {
  // Token refresh failed, notify academy
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/zoom-accounts` | List academy's Zoom accounts |
| DELETE | `/zoom-accounts/:id` | Disconnect Zoom account |
| POST | `/zoom-accounts/oauth/callback` | OAuth callback handler |
| POST | `/live` | Create stream (uses class's Zoom) |

---

## Database

### ZoomAccount Table
```sql
CREATE TABLE ZoomAccount (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  accountName TEXT NOT NULL,
  accessToken TEXT NOT NULL,
  refreshToken TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  accountId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES Academy(id)
);
```

### Class.zoomAccountId
```sql
ALTER TABLE Class ADD COLUMN zoomAccountId TEXT;
```

---

## Environment Variables

### Required
- `NEXT_PUBLIC_ZOOM_CLIENT_ID` - OAuth client ID (public)
- `ZOOM_CLIENT_SECRET` - OAuth secret (Cloudflare secret)
- `ZOOM_ACCOUNT_ID` - Platform fallback account ID

### Set Secret
```bash
echo "your_secret" | npx wrangler secret put ZOOM_CLIENT_SECRET
```

---

## Common Issues

### "Class has no Zoom account"
Classes without assigned Zoom account use platform credentials. To fix:
1. Go to class settings
2. Select academy's Zoom account
3. Save

### Token Expired
Auto-refresh happens automatically. If fails:
1. Check refresh token is valid
2. Check Zoom API quotas
3. Disconnect and reconnect account

### Meeting not in my Zoom
Verify:
1. Class has `zoomAccountId` set
2. ZoomAccount exists and is active
3. Check API logs for errors

---

## Testing Flow

1. **Connect Zoom**
   - Profile → "Conectar Zoom"
   - Should redirect to Zoom OAuth
   - After auth, returns to profile with account listed

2. **Assign to Class**
   - Create class → Select Zoom account
   - Save → Check `Class.zoomAccountId` in DB

3. **Create Stream**
   - Click "Stream" in class
   - Check Zoom dashboard for new meeting
   - Join meeting to verify

4. **Check Recording**
   - After meeting ends, check Zoom cloud recordings
   - Should appear in academy's Zoom account

---

## Deployment Commands

```bash
# API Worker
cd workers/akademo-api
npx wrangler deploy

# Frontend
npx @opennextjs/cloudflare build
npx wrangler deploy

# Or just push to GitHub (auto-deploys)
git push
```

---

**Last Updated**: January 22, 2026  
**Status**: Production Ready ✅
