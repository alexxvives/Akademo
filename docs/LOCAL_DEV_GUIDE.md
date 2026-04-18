# Local Development Guide

How to develop and test locally while real users are active in production.

---

## Architecture Recap

| Piece | Location | Runs at |
|---|---|---|
| **API Worker** | `workers/akademo-api/` | `http://localhost:8787` locally |
| **Next.js Frontend** | `src/` | `http://localhost:3000` locally |
| **D1 Database** | remote: `akademo-db` | local: `.wrangler/state/` |
| **R2 Storage** | remote: `akademo-storage` | local: `.wrangler/state/` |

---

## One-time setup

### 1. Install dependencies
```powershell
npm install
cd workers/akademo-api
npm install
cd ../..
```

### 2. Create local environment file
```powershell
# Create .env.local at project root — never commit this
New-Item .env.local
```

Add:
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```
When you push to production, the real value is in `wrangler.toml` (`NEXT_PUBLIC_API_URL = "https://akademo-api.alexxvives.workers.dev"`).

### 3. Create local D1 database from baseline
```powershell
cd workers/akademo-api
npx wrangler d1 execute DB --local --file=../../migrations/0000_baseline.sql
cd ../..
```

This creates a local SQLite file in `.wrangler/state/v3/d1/` — completely isolated from production.

---

## Daily dev workflow

### Step 1 — Start the API worker
```powershell
cd workers/akademo-api
npx wrangler dev
```
Runs at `http://localhost:8787`. Wrangler uses your local D1 automatically.
Keep this terminal open.

### Step 2 — Start the frontend
In a second terminal:
```powershell
# From project root
npm run dev
```
Runs at `http://localhost:3000`. Uses `.env.local` so API calls hit your local worker.

### Step 3 — Make changes and test
Edit code → hot reload picks it up automatically.

---

## Database changes

### Schema change (new column / new table)
1. Write a new migration file:
   ```powershell
   # Name it 0099_your_description.sql (next number after latest)
   New-Item migrations/0099_your_description.sql
   ```
2. Apply locally first:
   ```powershell
   cd workers/akademo-api
   npx wrangler d1 execute DB --local --file=../../migrations/0099_your_description.sql
   ```
3. Test locally, confirm everything works.
4. Apply to production:
   ```powershell
   npx wrangler d1 execute akademo-db --remote --file=../../migrations/0099_your_description.sql
   ```
   > **Never** run `npx wrangler d1 migrations apply akademo-db --remote` — that applies ALL files and will break production.
5. Commit the migration file with your code changes.

### Inspect local database
```powershell
cd workers/akademo-api
npx wrangler d1 execute DB --local --command "SELECT * FROM User LIMIT 5"
```

### Inspect production database
```powershell
npx wrangler d1 execute akademo-db --remote --command "SELECT * FROM User LIMIT 5"
```

---

## Deploying to production

### Normal flow — just push
```powershell
# 1. Always build first to catch TypeScript errors
npx @opennextjs/cloudflare build

# 2. If build passes, commit and push
git add .
git commit -m "describe your change"
git push
```
GitHub Actions deploys the frontend automatically. Check progress at https://github.com/alexxvives/Akademo/actions.

### Deploy the API worker
The API worker is **not** in GitHub Actions — deploy it manually whenever you change files in `workers/akademo-api/`:
```powershell
cd workers/akademo-api
npx wrangler deploy
cd ../..
```
> Deploy the API worker **before** pushing the frontend if both changed, so the new frontend never calls a stale API.

### Secrets
Secrets are never in code or `wrangler.toml`. If you need to add or rotate one:
```powershell
cd workers/akademo-api
npx wrangler secret put SECRET_NAME
# or for the frontend worker:
cd ../..
npx wrangler secret put SECRET_NAME
```

---

## Keeping local in sync with production

After a production migration that someone else applied (or you applied from a different machine):
```powershell
cd workers/akademo-api
npx wrangler d1 execute DB --local --file=../../migrations/0099_the_new_migration.sql
```
Local D1 state lives in `.wrangler/state/` which is gitignored — each machine maintains its own.

---

## Useful commands

```powershell
# Check production logs (frontend worker)
npx wrangler tail akademo --format pretty

# Check production logs (API worker)
cd workers/akademo-api
npx wrangler tail akademo-api --format pretty

# Hard reset local D1 (nuke and recreate)
Remove-Item -Recurse -Force .wrangler/state/v3/d1
cd workers/akademo-api
npx wrangler d1 execute DB --local --file=../../migrations/0000_baseline.sql
cd ../..
```

---

## What NOT to do

- **Never** edit production data with `--remote` without testing locally first.
- **Never** run `npx wrangler d1 migrations apply --remote` — use specific `--file` flags only.
- **Never** commit `.env.local` — it's in `.gitignore`.
- **Never** run `npx @opennextjs/cloudflare build` from a subdirectory — always from project root.
- **Never** push without a successful local build first.
