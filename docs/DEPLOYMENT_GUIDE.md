# DEPLOYMENT GUIDE - READ THIS BEFORE DEPLOYING

## 🎯 PRIMARY METHOD: GitHub Actions (Automated)

**Just push to main branch - deployments happen automatically!**

- **API changes** in `workers/akademo-api/**` → Triggers API worker deployment
- **Frontend changes** in `src/**`, `public/**`, `package.json`, etc. → Triggers frontend worker deployment

Check deployment status: https://github.com/alexxvives/Akademo/actions

---

## ⚠️ CRITICAL: Two Separate Workers

AKADEMO uses **TWO separate Cloudflare Workers**:

### 1. Frontend Worker: `akademo`
- **Location**: Root directory (`./`)
- **Purpose**: Next.js frontend (UI pages)
- **URL**: https://akademo-edu.com
- **Auto-deploys on**: Push to main with changes in `src/**`, `public/**`, `package.json`, etc.
- **Manual deploy** (if needed): 
  ```powershell
  npx @opennextjs/cloudflare build
  npx wrangler deploy
  ```

### 2. Backend API Worker: `akademo-api`
- **Location**: `workers/akademo-api/`
- **Purpose**: Hono API backend (all /auth, /live, /classes, etc. endpoints)
- **URL**: https://akademo-api.alexxvives.workers.dev
- **Auto-deploys on**: Push to main with changes in `workers/akademo-api/**`
- **Manual deploy** (if needed):
  ```powershell
  cd workers/akademo-api
  npx wrangler deploy
  ```

## 🚨 COMMON MISTAKE

**Problem**: Deploying only the frontend when you changed API code
- Frontend calls `https://akademo-api.alexxvives.workers.dev`
- If you only deploy `akademo`, the API changes won't be live!
- **Result**: "Not authorized" errors, "endpoint not found", etc.

**Solution**: **ALWAYS deploy the API worker when you change anything in `workers/akademo-api/src/`**

## ✅ Deployment Workflow

### Automatic (Recommended)
1. Make your changes
2. Commit and push to main:
   ```powershell
   git add .
   git commit -m "Your change description"
   git push
   ```
3. GitHub Actions automatically deploys the appropriate worker(s)
4. Check deployment status: https://github.com/alexxvives/Akademo/actions

### Manual (If GitHub Actions Fails)

**For API Changes:**
```powershell
cd workers/akademo-api
npx wrangler deploy
```

**For Frontend Changes:**
```powershell
npx @opennextjs/cloudflare build
npx wrangler deploy
```

**For Both:**
Deploy API first, then frontend (API changes should be live before frontend calls them)

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
Open: https://akademo-edu.com
Should load the AKADEMO homepage

### Check GitHub Actions Status
- View all deployments: https://github.com/alexxvives/Akademo/actions
- Green checkmark = successful deployment
- Red X = failed deployment (check logs)

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
