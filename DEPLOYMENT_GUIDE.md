# DEPLOYMENT GUIDE - READ THIS BEFORE DEPLOYING

## ⚠️ CRITICAL: Two Separate Workers

AKADEMO uses **TWO separate Cloudflare Workers**:

### 1. Frontend Worker: `akademo`
- **Location**: Root directory (`./`)
- **Purpose**: Next.js frontend (UI pages)
- **Deploy Command**: 
  ```powershell
  Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue
  npx @opennextjs/cloudflare build
  npx wrangler deploy
  ```
- **URL**: https://akademo.alexxvives.workers.dev
- **When to Deploy**: UI changes, component updates, frontend fixes

### 2. Backend API Worker: `akademo-api`
- **Location**: `workers/akademo-api/`
- **Purpose**: Hono API backend (all /auth, /live, /classes, etc. endpoints)
- **Deploy Command**:
  ```powershell
  cd workers/akademo-api
  npx wrangler deploy
  ```
- **URL**: https://akademo-api.alexxvives.workers.dev
- **When to Deploy**: API changes, database queries, auth logic, stream creation, etc.

## 🚨 COMMON MISTAKE

**Problem**: Deploying only the frontend when you changed API code
- Frontend calls `https://akademo-api.alexxvives.workers.dev`
- If you only deploy `akademo`, the API changes won't be live!
- **Result**: "Not authorized" errors, "endpoint not found", etc.

**Solution**: **ALWAYS deploy the API worker when you change anything in `workers/akademo-api/src/`**

## ✅ Deployment Checklist

### For API Changes (routes, database queries, permissions)
```powershell
# 1. Deploy API worker FIRST
cd C:\Users\alexx\Desktop\Projects\AKADEMO\workers\akademo-api
npx wrangler deploy

# 2. Then deploy frontend if needed
cd C:\Users\alexx\Desktop\Projects\AKADEMO
Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue
npx @opennextjs/cloudflare build
npx wrangler deploy
```

### For UI Changes Only
```powershell
# Only deploy frontend
cd C:\Users\alexx\Desktop\Projects\AKADEMO
Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue
npx @opennextjs/cloudflare build
npx wrangler deploy
```

## 📋 Quick Reference

| Change Type | Deploy Frontend? | Deploy API? |
|-------------|------------------|-------------|
| Fix button color | ✅ Yes | ❌ No |
| Add new page | ✅ Yes | ❌ No |
| Fix API permissions | ❌ No | ✅ Yes |
| Add new API endpoint | ❌ No | ✅ Yes |
| Fix database query | ❌ No | ✅ Yes |
| Both UI + API changes | ✅ Yes | ✅ Yes (API first!) |

## 🔍 How to Tell Which Worker Needs Deployment

### Changed files in:
- `src/app/` → Frontend (`akademo`)
- `src/components/` → Frontend (`akademo`)
- `src/hooks/` → Frontend (`akademo`)
- `workers/akademo-api/src/` → **API (`akademo-api`)**
- `workers/akademo-api/src/routes/` → **API (`akademo-api`)**

## 🧪 Testing After Deployment

### Test API Deployment
```powershell
Invoke-WebRequest -Uri "https://akademo-api.alexxvives.workers.dev/" | Select-Object -ExpandProperty Content
```
Should return: `{"status":"ok","service":"akademo-api","version":"3.1",...}`

### Test Frontend Deployment
Open: https://akademo.alexxvives.workers.dev
Should load the AKADEMO homepage

## 💡 Pro Tip

**Always deploy API first, then frontend**. Why?
- Frontend depends on API
- If frontend deploys first with new API calls, those calls will fail until API deploys
- Deploying API first means old frontend still works, then new frontend gets new features

## 🐛 Troubleshooting

### "Not authorized" error after deployment
- **Cause**: Only deployed frontend, not API
- **Fix**: Deploy API worker

### "Endpoint not found" error
- **Cause**: API route not registered or API worker not deployed
- **Fix**: Check `workers/akademo-api/src/index.ts` for route registration, then deploy API worker

### Changes not showing up
- **Frontend changes**: Clear `.next` and `.open-next` folders before building
- **API changes**: Deploy `akademo-api` worker
- **Browser cache**: Hard refresh (Ctrl+Shift+R) or open incognito

---

**Remember**: When in doubt, deploy BOTH workers (API first, then frontend)!
