# Zoom App - Switch to Production Mode

**Date**: January 23, 2026  
**App**: AKADEMO Zoom Integration

---

## ⚠️ CRITICAL: Correct Zoom Scopes

The error you're seeing is because you added **`meeting:write:meeting`** but the correct scope is **`meeting:write:meeting:admin`** (with `:admin` at the end).

### Required Scopes (ALL must have `:admin` suffix)

Go to your Zoom App → **Scopes** tab and ensure these are checked:

✅ **`meeting:write:meeting:admin`** - Create Zoom meetings (NOT `meeting:write:meeting`)  
✅ **`meeting:read:meeting:admin`** - Read meeting details  
✅ **`meeting:read:participant:admin`** - Track participants  
✅ **`meeting:read:list_past_participants:admin`** - Participant analytics  
✅ **`cloud_recording:read:list_recording_files:admin`** - Get recording URLs  
✅ **`cloud_recording:read:content:master`** - Download recordings  
✅ **`user:read:user:admin`** - Get user ID  

**Important**: The `:admin` suffix is required for Server-to-Server OAuth apps!

---

## Steps to Switch to Production

### 1. Complete Development Testing
- ✅ Test creating meetings
- ✅ Test webhooks receiving events
- ✅ Test recording uploads to Bunny
- ✅ Verify all scopes work correctly

### 2. Prepare for Submission

#### A. App Information (Required)
Go to **App Marketplace Dashboard** → Your App → **Basic Information**

**Must be complete**:
- App Name: `AKADEMO Live Classes`
- Short Description: `Live streaming and video recording for educational classes`
- Long Description: (250+ words explaining features)
- Developer Contact Information
- Company name
- Support email
- Privacy Policy URL: `https://akademo-edu.com/privacy`
- Terms of Service URL: `https://akademo-edu.com/terms`

#### B. App Logo
- Upload 512x512 PNG logo
- Professional design
- No watermarks

#### C. Installation Instructions
Provide clear steps for:
1. How to authorize the app
2. What features it provides
3. How to use it

### 3. Submit for Review

**Go to**: Zoom App Marketplace → Your App → **Activation** tab

1. Click **"Submit for Production"**
2. Fill out the questionnaire:
   - What does your app do?
   - Who is it for?
   - How will users benefit?
   - Data handling practices
   - Security measures

3. Review takes **3-5 business days**

### 4. What Zoom Checks

❌ **They will reject if**:
- Missing privacy policy
- Missing terms of service
- Unclear app purpose
- Requesting unnecessary scopes
- Poor documentation

✅ **They approve if**:
- Clear documentation
- Legitimate use case
- All required info provided
- Scopes match functionality

### 5. After Approval

Once approved:
- App moves to **"Published"** status
- **OAuth credentials remain the same** (no code changes needed!)
- Rate limits increase significantly
- Access to all production features

---

## Alternative: Stay in Development

**You CAN keep it in development mode** if:
- Only your account uses it (account owner + up to 5 authorized accounts)
- You don't need high rate limits
- You're okay with "Development" badge in Zoom

**Advantage**: No review process, works immediately

**Disadvantage**: Limited to a few accounts, lower rate limits

---

## Testing the Scope Fix

After adding **`meeting:write:meeting:admin`** (with `:admin`):

1. **Refresh OAuth tokens** - The app might be using old cached tokens
2. In Zoom App Dashboard → **Local Test** tab → Click **"Authorize"** again
3. This generates new tokens with the correct scopes

### Verify Tokens Have Correct Scopes

You can decode your access token at [jwt.io](https://jwt.io) and check if `meeting:write:meeting:admin` is in the `scope` claim.

---

## Decision Matrix

| Factor | Development Mode | Production Mode |
|--------|------------------|-----------------|
| **Setup Time** | Immediate | 3-5 days review |
| **User Limit** | 5 accounts | Unlimited |
| **Rate Limits** | Low (10 req/sec) | High (100 req/sec) |
| **Credentials** | Same | Same (no change) |
| **Best for** | Single academy testing | Multiple academies |
| **Badge** | "Development" | "Published" |

---

## Recommendation

**For AKADEMO**:
1. **First**: Fix the scope (add `:admin` suffix)
2. **Test**: Verify meeting creation works
3. **Then decide**:
   - If you have **multiple academies using it** → Go to production
   - If it's **just your academy for now** → Stay in development (faster)

You can switch to production **anytime** without breaking existing functionality.

---

## Quick Fix for Current Error

**Right now, do this**:

1. Go to: https://marketplace.zoom.us/develop/apps
2. Click your app
3. Go to **Scopes** tab
4. Find **`meeting:write:meeting`** (without :admin) → Remove it
5. Add **`meeting:write:meeting:admin`** (WITH :admin)
6. Click **Save**
7. Go to **Local Test** or **Activation** tab
8. Click **Authorize** to regenerate tokens

Then try creating a stream again - it should work!

---

**Questions?** Check [Zoom Server-to-Server OAuth Docs](https://developers.zoom.us/docs/internal-apps/)
