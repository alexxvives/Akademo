# Skill: Add Database Migration

Use this when adding a column, creating a table, or changing schema in D1.

## Parameters
- `TABLE`: the table being changed
- `CHANGE`: what's being added/modified

## Steps

### 1. Check current schema
```powershell
npx wrangler d1 execute akademo-db --remote --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='TABLE'"
```
Confirm what columns exist before writing the migration.

### 2. Find the next migration number
```powershell
Get-ChildItem migrations/ | Sort-Object Name | Select-Object -Last 1
```
Name the new file `migrations/XXXX_description.sql` (increment by 1).

### 3. Write the migration file

For adding a column:
```sql
-- migrations/0011_add_user_preferences.sql
ALTER TABLE User ADD COLUMN preferences TEXT DEFAULT '{}';
```

For a new table:
```sql
-- migrations/0011_create_audit_log.sql
CREATE TABLE IF NOT EXISTS AuditLog (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  action TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

Rules:
- Always use `IF NOT EXISTS` for CREATE TABLE
- Always provide DEFAULT values for new columns (existing rows need a value)
- D1 is SQLite — no ENUM types, use TEXT with CHECK constraints instead

### 4. Run ONLY the new file
```powershell
npx wrangler d1 execute akademo-db --remote --file=migrations/0011_description.sql
```

⚠️ **NEVER run this** — it replays ALL migrations and breaks the database:
```powershell
# ❌ FORBIDDEN
npx wrangler d1 migrations apply akademo-db --remote
```

### 5. Verify the change applied
```powershell
npx wrangler d1 execute akademo-db --remote --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='TABLE'"
```

### 6. Update DATABASE_SCHEMA.md
Add the new column/table to the relevant section in `DATABASE_SCHEMA.md`.

### 7. Commit
```powershell
git add migrations/0011_description.sql DATABASE_SCHEMA.md
git commit -m "feat: add preferences column to User"
git push
```
