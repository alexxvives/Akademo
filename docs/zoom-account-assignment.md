# Zoom Account Assignment to Classes

## Overview
AKADEMO allows academies to connect multiple Zoom accounts and assign them to specific classes. This enables:
- Using different Zoom accounts for different classes
- Assigning the same Zoom account to multiple classes  
- Better organization of live streaming resources

## Zoom Account Types
**Both Basic and Pro Zoom accounts work**, though Pro accounts are recommended:

| Feature | Basic | Pro (Recommended) |
|---------|-------|-------------------|
| Meeting Duration | 40 min (3+ participants) | Unlimited |
| Cloud Recording | ❌ No | ✅ Yes |
| Automatic Recording Upload | ❌ No | ✅ Yes (via webhook) |
| Cost | Free | $149.90/year per license |

## How It Works

### 1. Connect Zoom Accounts
**Location:** `/dashboard/academy/profile`

Academy owners can connect multiple Zoom accounts via OAuth:
1. Click "Conectar Zoom"
2. Authorize in Zoom
3. Account appears in list with name and status

### 2. Assign to Classes
**Locations:** 
- `/dashboard/academy/classes` (create/edit class modals)
- `/dashboard/academy/class/[id]` (class settings)

When creating or editing a class:
1. Select "Cuenta de Zoom" dropdown
2. Choose from connected accounts or "Sin cuenta de Zoom"
3. Save class

### 3. Live Stream Creation
**Location:** `/dashboard/academy/class/[id]` or `/dashboard/teacher/class/[id]`

When teacher clicks "Stream":
- System checks class's `zoomAccountId`
- If assigned: Uses that Zoom account's OAuth tokens
- If not assigned: Falls back to platform credentials (admin account)
- Creates Zoom meeting automatically

## Database Schema

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
  FOREIGN KEY (academyId) REFERENCES Academy(id) ON DELETE CASCADE
);
```

### Class.zoomAccountId
```sql
ALTER TABLE Class ADD COLUMN zoomAccountId TEXT REFERENCES ZoomAccount(id);
```

**Relationships:**
- One academy → Many Zoom accounts
- One class → One Zoom account (optional)
- One Zoom account → Many classes ✅ (can be reused)

## Token Management

### Auto-Refresh
Tokens automatically refresh when:
- Expires in < 5 minutes
- Before creating Zoom meeting
- Webhook `refreshZoomToken()` function

### Expiry Handling
If token refresh fails:
1. Meeting creation fails with error
2. Academy owner must reconnect Zoom account
3. Error logged in API worker

## API Endpoints

### GET /zoom-accounts
Lists all Zoom accounts for authenticated academy.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "accountName": "John Doe",
      "accountId": "abc123",
      "createdAt": "2026-01-22T10:00:00Z"
    }
  ]
}
```

### DELETE /zoom-accounts/:id
Removes Zoom account and unassigns from all classes.

### POST /live
Creates Zoom meeting using class's assigned Zoom account.

**Logic:**
```typescript
if (classInfo.zoomAccountId) {
  // Use class's Zoom account
  const zoomAccount = await getZoomAccount(classId);
  const accessToken = await refreshIfNeeded(zoomAccount);
  createMeeting({ config: { accessToken } });
} else {
  // Use platform credentials (fallback)
  createMeeting({ config: platformCredentials });
}
```

## Use Cases

### Scenario 1: Multiple Teachers, One Account
Academy has 3 teachers, 1 Zoom Pro account:
- Connect 1 Zoom account
- Assign same account to all classes
- Teachers share the account for streaming

### Scenario 2: Department Separation
Academy has Math & Science departments:
- Connect 2 Zoom Pro accounts (one per department)
- Math classes → Math Zoom account
- Science classes → Science Zoom account
- Better tracking and organization

### Scenario 3: Free Trial
Academy testing platform:
- Don't connect any Zoom account
- All classes use platform fallback (admin account)
- Works but uses shared credentials

### Scenario 4: Dedicated Classes
Large academy with premium classes:
- Connect multiple Zoom Pro accounts
- Assign dedicated account per VIP class
- Standard classes share general account

## UI Components

### Profile Page - Zoom Account List
[src/app/dashboard/academy/profile/page.tsx](../src/app/dashboard/academy/profile/page.tsx)

Shows:
- Connected account name
- Account ID
- "Activa" status badge
- Connection date
- Disconnect button (on hover)

### Class Form - Zoom Account Selector
[src/app/dashboard/academy/classes/page.tsx](../src/app/dashboard/academy/classes/page.tsx)

Dropdown with:
- "Sin cuenta de Zoom" (no assignment)
- List of connected accounts
- Link to connect if none available

## Best Practices

### For Academies
✅ **DO:**
- Use Pro accounts for unlimited meetings and recording
- Assign dedicated accounts to high-priority classes
- Test streaming before live classes
- Reconnect accounts if token expires

❌ **DON'T:**
- Share Zoom credentials outside platform
- Delete Zoom accounts mid-class
- Use Basic accounts for long sessions (40-min limit)

### For Developers
✅ **DO:**
- Always refresh tokens before creating meetings
- Check `classInfo.zoomAccountId` exists before querying ZoomAccount
- Log errors with context (account ID, class ID)
- Handle token refresh failures gracefully

❌ **DON'T:**
- Assume Zoom account exists (can be deleted)
- Skip token expiry checks
- Return generic errors (include account/class context)

## Testing

### Manual Test Flow
1. **Connect Zoom:**
   - Profile → "Conectar Zoom"
   - Should redirect to Zoom OAuth
   - After auth, returns to profile with account listed

2. **Assign to Class:**
   - Create/edit class → Select Zoom account
   - Save → Verify `Class.zoomAccountId` in DB

3. **Create Stream:**
   - Click "Stream" in class
   - Check Zoom dashboard for new meeting
   - Join meeting to verify

4. **Check Recording:**
   - After meeting ends, check Zoom cloud recordings
   - Should appear in academy's Zoom account

### Database Queries
```sql
-- Check class's Zoom account
SELECT c.name, z.accountName 
FROM Class c
LEFT JOIN ZoomAccount z ON c.zoomAccountId = z.id
WHERE c.id = ?;

-- List academy's Zoom accounts
SELECT * FROM ZoomAccount WHERE academyId = ?;

-- Find classes using specific Zoom account
SELECT * FROM Class WHERE zoomAccountId = ?;
```

## Troubleshooting

### "Class has no Zoom account"
Classes without assigned Zoom account use platform credentials (admin's Zoom account).

**To fix:**
1. Go to class settings
2. Select academy's Zoom account
3. Save

### "Failed to refresh Zoom token"
Token refresh failed after multiple attempts.

**To fix:**
1. Disconnect Zoom account
2. Reconnect via OAuth
3. Reassign to classes

### "Meeting not in my Zoom account"
Meeting created but not appearing in academy's Zoom.

**Check:**
- Class has `zoomAccountId` set
- ZoomAccount exists with valid tokens
- API logs show: `[Zoom] Using custom access token`

### Multiple Meetings Overlap
Same Zoom account assigned to multiple classes, meetings created simultaneously.

**Solution:**
- Connect multiple Zoom accounts
- Assign different accounts to classes with overlapping schedules
- Or use platform fallback for some classes

## Future Enhancements

### Planned
- [ ] Zoom account health dashboard
- [ ] Usage analytics per account (meeting minutes, recordings)
- [ ] Email notifications when token expires
- [ ] Automatic account rotation for load balancing

### Optional
- [ ] Zoom account usage quotas
- [ ] Recording auto-deletion from Zoom after Bunny upload
- [ ] Multi-academy Zoom account sharing
- [ ] Zoom account cost tracking

---

**Last Updated:** January 22, 2026  
**Status:** Production Ready ✅  
**Related Docs:** 
- [zoom-oauth-implementation.md](./zoom-oauth-implementation.md)
- [zoom-oauth-quick-reference.md](./zoom-oauth-quick-reference.md)
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)
