# Zoom OAuth Implementation - Complete

## Overview
AKADEMO now supports **multi-tenant Zoom integration** where each academy can connect their own Zoom PRO accounts instead of using a shared platform account. This enables proper recording ownership, participant tracking, and billing per academy.

---

## Features Implemented

### 1. **Profile Page for Academy Owners**
- **Location**: `/dashboard/academy/profile`
- **Features**:
  - View all connected Zoom accounts
  - Connect new Zoom PRO account via OAuth 2.0
  - Disconnect/remove Zoom accounts
  - See account name and connection date
- **Access**: Click profile section in sidebar (ACADEMY role only)

### 2. **Zoom Account Management in Classes**
- **Create Class**: Dropdown to assign Zoom account
- **Edit Class**: Change assigned Zoom account
- **Default**: "Sin cuenta de Zoom" (no account assigned)
- **Fallback**: Classes without assigned Zoom account use platform credentials

### 3. **Live Stream Creation**
- **Smart Selection**: Uses class's assigned Zoom account tokens
- **Token Refresh**: Automatically refreshes expired tokens (5-minute buffer)
- **Fallback**: If no Zoom account assigned, uses platform credentials
- **Permission Check**: Verifies academy ownership before creating meeting

### 4. **Database Schema**
- **Table**: `ZoomAccount`
  - `id` (UUID)
  - `academyId` (FK to Academy)
  - `accountName` (from Zoom user profile)
  - `accessToken` (encrypted)
  - `refreshToken` (encrypted)
  - `expiresAt` (token expiry timestamp)
  - `accountId` (Zoom account ID)
  - `createdAt`, `updatedAt`

- **Class Table Addition**:
  - `zoomAccountId` (nullable FK to ZoomAccount)

---

## Technical Implementation

### API Endpoints (workers/akademo-api)

#### 1. **GET /zoom-accounts**
- Lists all Zoom accounts for authenticated academy
- Filters by `academyId` from session
- Returns: `id`, `accountName`, `accountId`, `createdAt`

#### 2. **DELETE /zoom-accounts/:id**
- Removes Zoom account
- Unassigns from all classes using it
- Verifies academy ownership

#### 3. **POST /zoom-accounts/oauth/callback**
- Exchanges authorization code for access tokens
- Fetches Zoom user info
- Stores tokens in database with expiry

#### 4. **POST /live** (Modified)
- Queries class's `zoomAccountId`
- Fetches ZoomAccount tokens
- Calls `refreshZoomToken` if token expires < 5 minutes
- Passes custom `accessToken` to `createZoomMeeting`
- Falls back to platform credentials if no Zoom account assigned

### Helper Functions

#### `refreshZoomToken(c: Context, accountId: string): Promise<string | null>`
- Checks token expiry (5-minute buffer)
- Refreshes via Zoom OAuth refresh token endpoint
- Updates database with new tokens
- Returns fresh access token

#### `createZoomMeeting(options)` (Updated)
- Accepts optional `accessToken` in config
- Uses custom token if provided, otherwise fetches platform token
- Creates meeting via Zoom API with user's credentials

---

## OAuth Flow

1. **Academy clicks "Conectar Zoom"** in profile page
2. **Redirect to Zoom OAuth**: `https://zoom.us/oauth/authorize?response_type=code&client_id=sHMNFyqHQCGV5TpqkPo2Uw&redirect_uri=https://akademo-edu.com/api/zoom/oauth/callback&state={academyId}`
3. **Zoom returns authorization code** to callback URL
4. **Frontend extracts code + state** (academyId)
5. **POST /zoom-accounts/oauth/callback** exchanges code for tokens
6. **Tokens stored in database** with academy association
7. **Redirect to profile page** with success message

---

## Environment Variables

### Frontend (wrangler.toml)
```toml
NEXT_PUBLIC_ZOOM_CLIENT_ID = "sHMNFyqHQCGV5TpqkPo2Uw"
```

### API Worker (Cloudflare Secrets)
```bash
ZOOM_ACCOUNT_ID        # Platform Zoom account (fallback)
ZOOM_CLIENT_ID         # OAuth client ID
ZOOM_CLIENT_SECRET     # OAuth client secret
ZOOM_WEBHOOK_SECRET    # Webhook verification
```

---

## Files Modified

### Frontend
1. `src/app/dashboard/academy/profile/page.tsx` - Profile page with Zoom management
2. `src/app/api/zoom/oauth/callback/page.tsx` - OAuth callback handler
3. `src/app/dashboard/academy/classes/page.tsx` - Zoom account selector in forms
4. `src/components/layout/Sidebar.tsx` - Profile link for academies
5. `wrangler.toml` - Added `NEXT_PUBLIC_ZOOM_CLIENT_ID`

### Backend (workers/akademo-api)
1. `src/routes/zoom-accounts.ts` - Complete Zoom OAuth API
2. `src/routes/live.ts` - Modified POST to use class's Zoom account
3. `src/lib/zoom.ts` - Updated `createZoomMeeting` to accept custom tokens
4. `src/index.ts` - Registered `zoomAccounts` routes

### Database
1. `migrations/0024_zoom_accounts.sql` - Schema changes

---

## Usage Instructions

### For Academy Owners

1. **Connect Zoom Account**:
   - Go to Dashboard → Profile (click your name in sidebar)
   - Click "Conectar Zoom"
   - Sign in with your Zoom PRO account
   - Authorize AKADEMO
   - Account appears in list

2. **Assign to Class**:
   - Create new class or edit existing
   - Select Zoom account from dropdown
   - Save class

3. **Create Live Stream**:
   - Go to class → Click "Stream"
   - Meeting automatically created in your Zoom account
   - Recordings saved to your Zoom cloud storage

4. **Disconnect Account**:
   - Go to Profile
   - Click "Desconectar" on account
   - Confirms before removing
   - Classes using it fallback to platform account

### For Students
- Join live streams as usual
- No visible changes

### For Teachers
- Create streams assigned to academy's Zoom account
- View recordings in academy's Zoom account

---

## Security Considerations

1. **Token Storage**: Access tokens encrypted in D1 database
2. **Token Refresh**: Automatic refresh 5 minutes before expiry
3. **Permission Checks**: Verify academy ownership before API calls
4. **OAuth State**: `academyId` passed in state parameter to prevent CSRF
5. **Secure Cookies**: HttpOnly, Secure, SameSite=Lax

---

## Future Enhancements

### Planned
- [ ] Webhook handler update to match recordings with correct Zoom account
- [ ] Participant tracking using class's Zoom account tokens
- [ ] Recording auto-deletion from Zoom after Bunny upload
- [ ] Multi-account support (academy can have multiple Zoom PRO accounts)
- [ ] Usage analytics per Zoom account

### Optional
- [ ] Zoom account usage quotas (meeting minutes tracking)
- [ ] Email notifications when token refresh fails
- [ ] Zoom account health dashboard
- [ ] Automatic Zoom account rotation for large academies

---

## Testing Checklist

✅ **Deployment**
- [x] API worker deployed
- [x] Frontend worker deployed
- [x] Environment variables set
- [x] GitHub Actions workflow triggered

⏳ **End-to-End Testing** (Manual)
- [ ] Academy can connect Zoom account
- [ ] Zoom account appears in profile
- [ ] Can select Zoom account in class form
- [ ] Live stream creates meeting in academy's Zoom
- [ ] Recording saves to academy's Zoom cloud
- [ ] Token refresh works when expired
- [ ] Can disconnect Zoom account
- [ ] Classes fallback to platform account when no Zoom assigned

---

## Troubleshooting

### "Failed to connect Zoom account"
- Check `ZOOM_CLIENT_ID` and `ZOOM_CLIENT_SECRET` are set
- Verify redirect URI matches in Zoom app settings
- Check API worker logs: `npx wrangler tail akademo-api`

### "Not authorized to create stream"
- Verify academy ownership in Class table
- Check `classInfo.academyOwnerId === session.id`

### "Zoom token expired"
- `refreshZoomToken` should auto-refresh
- Check token refresh logs in API worker
- Manual fix: Disconnect and reconnect Zoom account

### Meeting not created in academy's Zoom
- Verify class has `zoomAccountId` set
- Check ZoomAccount exists with valid tokens
- Logs should show: `[Zoom] Using custom access token`

---

## Deployment Status

**Date**: January 22, 2026  
**Version**: 3.0  
**Status**: ✅ DEPLOYED TO PRODUCTION  
**Frontend**: https://akademo-edu.com  
**API**: https://akademo-api.alexxvives.workers.dev  
**Commit**: caf3552

---

## Support

For issues or questions:
1. Check API logs: `npx wrangler tail akademo-api`
2. Check frontend logs in browser console
3. Review Zoom OAuth app settings
4. Test OAuth flow in incognito mode

