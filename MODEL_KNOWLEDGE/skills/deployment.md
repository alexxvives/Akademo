# Skill: Deployment

Use this when deploying to production, fixing a failed deploy, or troubleshooting CI.

## Architecture
- **Frontend**: Next.js on Cloudflare Workers via OpenNext (`akademo` worker)
- **API**: Hono on Cloudflare Workers (`akademo-api` worker)
- **Database**: Cloudflare D1 (`akademo-db`)
- **CI/CD**: GitHub Actions — triggers on push to `main`

## Standard Deploy (preferred)
```powershell
# 1. Build locally first to catch errors
npx @opennextjs/cloudflare build

# 2. Push — GitHub Actions handles the rest
git add .
git commit -m "description"
git push
```
Check status: https://github.com/alexxvives/Akademo/actions

## Manual Deploy (hotfix only)
```powershell
# API worker — deploy from its folder
cd workers/akademo-api
npx wrangler deploy
cd ../..

# Frontend worker — deploy from ROOT
npx @opennextjs/cloudflare build
npx wrangler deploy
```
**Always deploy API before frontend** if both changed.

## Common Deploy Failures

| Error | Fix |
|-------|-----|
| Worker >3MB gzipped | Remove heavy imports (WASM, fonts, images) from bundled routes |
| `worker.js not found` | Build failed — run `npx @opennextjs/cloudflare build` and check output |
| TypeScript errors in CI | Run build locally first: `npx @opennextjs/cloudflare build` |
| Node.js deprecation | Set `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` in workflow env |

## Never Do
- ❌ `npx wrangler deploy` without building first (deploys stale code)
- ❌ Build from subdirectories (OpenNext must run from project root)
- ❌ Skip `npx @opennextjs/cloudflare build` before committing (TypeScript errors won't be caught by `wrangler deploy`)
