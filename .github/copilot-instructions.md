# AKADEMO — Agent Instructions

**Stack**: Next.js 14 + Cloudflare Workers + D1 + Hono + TypeScript  
**Architecture**: Two-worker system (Frontend `akademo` + API `akademo-api`)

---

## Context Resolver — Load These First

| Task | Read Before Starting |
|------|---------------------|
| Adding / changing an API route | [MODEL_KNOWLEDGE/skills/add-api-route.md](../MODEL_KNOWLEDGE/skills/add-api-route.md) |
| Adding / changing DB schema | [MODEL_KNOWLEDGE/skills/add-migration.md](../MODEL_KNOWLEDGE/skills/add-migration.md) |
| Adding a dashboard page or feature | [MODEL_KNOWLEDGE/skills/add-dashboard-feature.md](../MODEL_KNOWLEDGE/skills/add-dashboard-feature.md) |
| TypeScript / React / API patterns | [MODEL_KNOWLEDGE/conventions.md](../MODEL_KNOWLEDGE/conventions.md) |
| Database tables and relationships | [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) |
| Deployment process | [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) |
| Errors / unexpected behavior | [docs/troubleshooting.md](../docs/troubleshooting.md) |
| Zoom integration | [docs/zoom-oauth-quick-reference.md](../docs/zoom-oauth-quick-reference.md) |

---

## Always-On Rules

1. **Build before commit** — `npx @opennextjs/cloudflare build` catches TypeScript errors that `wrangler deploy` misses
2. **Then push** — GitHub Actions auto-deploys; only manually deploy for hotfixes
3. **Never run** `npx wrangler d1 migrations apply akademo-db --remote` — runs ALL migrations, breaks DB; run specific files only
4. **No `any` types**, no SQL string interpolation, no files > 250 lines
5. **Deploy API worker before frontend** if both changed
6. **TEACHER ≠ ACADEMY**: `Academy.ownerId` = ACADEMY role, `Teacher.userId` = TEACHER role

---

## Project Structure

```
src/app/dashboard/[role]/       # Role dashboards: student, teacher, academy, admin
src/components/                 # Shared UI components
src/hooks/                      # Custom React hooks
workers/akademo-api/src/        # Hono API routes
migrations/                     # D1 SQL migrations (run individually, never batch)
MODEL_KNOWLEDGE/                # Skills and conventions for this AI agent
```

---

**Version**: 4.0 (Resolver pattern, April 2026)


### Changes Don't Appear
**Cause**: Cache not cleared  
**Fix**: Force clean build, then hard refresh browser (`Ctrl+Shift+R`)

---

## 📚 MORE DOCUMENTATION

- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) - Complete table definitions
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Production deployment
- [docs/troubleshooting.md](../docs/troubleshooting.md) - Common problems
- [docs/zoom-oauth-quick-reference.md](../docs/zoom-oauth-quick-reference.md) - Zoom OAuth reference
- [docs/zoom-recording-behavior.md](../docs/zoom-recording-behavior.md) - Zoom recording behavior

---

**Version**: 3.0 (Simplified 2026)  
**Maintainer**: AKADEMO Development Team
