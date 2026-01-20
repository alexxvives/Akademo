# Deployment & Cache Management

## Critical: Cloudflare Cache Issue Fix

When making UI changes that don't appear after deployment, you're likely hitting Next.js and Cloudflare's aggressive caching layers.

### The Problem
Next.js and OpenNext use content-hash based caching that can cause changes to not appear even after deployment:
- `.next/` - Next.js build cache
- `.open-next/` - OpenNext worker bundle  
- Cloudflare CDN - Edge cache (respects content hashes)
- Browser cache - Can show stale JS bundles

### The Solution

**ALWAYS use this command for deployments where you want changes to be visible:**

```bash
Remove-Item -Recurse -Force .next, .open-next -ErrorAction SilentlyContinue; npx @opennextjs/cloudflare@latest build; npx wrangler deploy
```

### What This Does:

1. **Clears Build Cache** - `Remove-Item -Recurse -Force .next, .open-next` removes all cached builds
2. **Fresh Build** - `npx @opennextjs/cloudflare@latest build` creates a completely new build
3. **Deploy** - `npx wrangler deploy` pushes to Cloudflare

### When to Use This:

✅ **USE** when:
- UI changes aren't appearing after deployment
- CSS/styling updates seem to be ignored
- Component changes don't reflect on production
- Seeing old error messages after fixes
- Code changes work locally but not in production

❌ **SKIP** (use regular `npm run deploy`) when:
- Making quick API-only changes
- Updating environment variables
- Making database schema changes only

### After Deployment:

Always force refresh in browser: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)

---

**Pro Tip**: If changes still don't appear, check that you're viewing the correct URL and that Cloudflare Workers updated (check the Version ID in wrangler output).
