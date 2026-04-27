# Moodle → AKADEMO Migration Guide

Internal reference for migrating clients from Moodle to AKADEMO.
Tested on: maximo exponente (April 2026). DB prefix: `mdl3y_` (varies per install).

---

## Quick Roadmap

| # | What | Command / Action |
|---|------|------------------|
| 0 | Find DB prefix | `SHOW TABLES;` in phpMyAdmin |
| 1 | Export 5 CSVs | phpMyAdmin → SQL → Export CSV |
| 2 | Create academy | Admin panel → register academy |
| 3 | Generate Excel + post-import.sql | `node scripts/moodle-to-excel.js` |
| 4 | Fill prices in xlsx | Open `moodle-migration.xlsx`, Asignaturas sheet |
| 5 | Upload via admin UI | Admin → Academias → Migración CSV |
| 6 | Run post-import.sql | `npx wrangler d1 execute akademo-db --remote --yes --file=post-import.sql` |
| 7 | Upload PDFs to R2 | `node scripts/ftp-to-r2.js` (needs FTP + R2 creds in `scripts/.env`) |
| 8 | Run import-documents.sql | `npx wrangler d1 execute akademo-db --remote --yes --file=docs/onboarding/{client}/import-documents.sql` |
| 9 | Generate quiz SQL | `node scripts/generate-quiz-sql.js` |
| 10 | Split quiz SQL | Node script: separate assignments + questions, filter ghost IDs |
| 11 | Run quiz-assignments.sql | `npx wrangler d1 execute akademo-db --remote --yes --file=docs/onboarding/{client}/quiz-assignments.sql` |
| 12 | Run quiz-questions-filtered.sql | `npx wrangler d1 execute akademo-db --remote --yes --file=docs/onboarding/{client}/quiz-questions-filtered.sql` |
| 13 | Send welcome emails | Admin → [academy] → Enviar emails de bienvenida |

> **Critical**: Steps 8 and 11–12 must run **after** Step 5 (classes must already exist in DB). Steps 11–12 must run in order — assignments before questions.

---

## Data Flow Overview

```
phpMyAdmin (Moodle DB)
  → Export CSVs: enrollments.csv + asignaturas.csv + quizzes.csv + questions.csv + files.csv
      → node scripts/moodle-to-excel.js  (CSVs must be in project root)
          → moodle-migration.xlsx  (Usuarios + Asignaturas sheets — fill precio manually)
          → post-import.sql        (COMPLETED payments for legacy courses, run after import)
              → Admin UI: Migración CSV  (uploads xlsx → POST /admin/bulk-import)
              → run post-import.sql via wrangler d1 execute
              → node scripts/ftp-to-r2.js  (PDFs: SiteGround FTP → R2)
                  → docs/onboarding/{client}/import-documents.sql  (run manually)
                  → docs/onboarding/{client}/ftp-progress.json     (KEEP — used for re-upload recovery)
      → node scripts/generate-quiz-sql.js  (CSVs must be in project root)
          → quiz-import.sql  (DO NOT run directly — split first, see Step 9)
```

---

## Step 0 — Find the DB prefix

```sql
SHOW TABLES;
```

Look for the prefix before `_user`, `_course`, etc. (Standard Moodle uses `mdl_`, SiteGround installs often auto-generate it, e.g. `mdl3y_`.)

---

## Step 1 — Export CSVs from phpMyAdmin

Go to **SiteGround → Sitio Web → MySQL → PHPMYADMIN**, open the Moodle database, click **SQL**, run each query and click **Export → CSV** (keep column names in first row). Save files to the **project root** (`C:\...\AKADEMO\`).

### `enrollments.csv` — Users + course assignments
```sql
SELECT
  u.email,
  u.firstname AS nombre,
  u.lastname  AS apellido,
  c.fullname  AS asignatura,
  r.shortname AS moodle_rol
FROM {PREFIX}_user_enrolments ue
JOIN {PREFIX}_enrol e   ON ue.enrolid   = e.id
JOIN {PREFIX}_course c  ON e.courseid   = c.id
JOIN {PREFIX}_context ctx ON ctx.instanceid = c.id AND ctx.contextlevel = 50
JOIN {PREFIX}_role_assignments ra ON ra.userid = ue.userid AND ra.contextid = ctx.id
JOIN {PREFIX}_role r  ON r.id  = ra.roleid
JOIN {PREFIX}_user u  ON u.id  = ue.userid
WHERE u.deleted = 0 AND u.suspended = 0
  AND r.shortname IN ('student','editingteacher')
  AND c.visible = 1
ORDER BY u.email;
```

### `asignaturas.csv` — Class list with start dates
> This is the list of courses (clases), not individual lessons.

```sql
SELECT
  fullname AS nombre,
  FROM_UNIXTIME(startdate, '%d/%m/%Y') AS fechaInicio
FROM {PREFIX}_course
WHERE id > 1
  AND visible = 1
ORDER BY fullname;
```

### `quizzes.csv`
```sql
SELECT
  c.fullname AS course_name,
  q.id AS quiz_id,
  q.name AS quiz_name,
  q.intro AS quiz_description
FROM {PREFIX}_quiz q
JOIN {PREFIX}_course c ON c.id = q.course
WHERE c.id > 1
ORDER BY c.id, q.id;
```

### `questions.csv`
```sql
SELECT
  qs.quizid AS quiz_id,
  qu.id AS question_id,
  qu.questiontext AS question_text,
  qa.id AS answer_id,
  qa.answer AS answer_text,
  qa.fraction AS is_correct
FROM {PREFIX}_quiz_slots qs
JOIN {PREFIX}_question qu ON qu.id = qs.questionid AND qu.qtype = 'multichoice'
JOIN {PREFIX}_question_answers qa ON qa.question = qu.id
ORDER BY qs.quizid, qu.id, qa.fraction DESC;
```

### `files.csv` — PDF references (for FTP transfer in Step 4)
```sql
SELECT
  r.name AS file_title,
  c.fullname AS course_name,
  cs.section AS section_number,
  COALESCE(NULLIF(TRIM(cs.name), ''), CONCAT('Tema ', cs.section)) AS section_name,
  f.filename,
  f.filesize,
  CONCAT(LEFT(f.contenthash,2), '/', MID(f.contenthash,3,2), '/', f.contenthash) AS file_path,
  f.timecreated AS file_timestamp
FROM {PREFIX}_files f
JOIN {PREFIX}_context ctx ON ctx.id = f.contextid AND ctx.contextlevel = 70
JOIN {PREFIX}_course_modules cm ON cm.id = ctx.instanceid
JOIN {PREFIX}_course c ON c.id = cm.course
JOIN {PREFIX}_course_sections cs ON cs.id = cm.section
JOIN {PREFIX}_resource r ON cm.instance = r.id
WHERE f.component = 'mod_resource'
  AND f.filearea = 'content'
  AND f.filename != '.'
  AND f.filesize > 0
  AND c.visible = 1
ORDER BY c.fullname, cs.section, r.name;
```

Replace `{PREFIX}` with the actual prefix found in Step 0.

---

## Step 2 — Create the academy account

1. Register the academy via the AKADEMO admin panel
2. Note the academy ID: `SELECT id FROM Academy WHERE name = '...'`

---

## Step 3 — Convert CSVs to Excel

Place all CSV files in the project root, then run:

```bash
node scripts/moodle-to-excel.js
```

This produces two files in the project root:

**`moodle-migration.xlsx`** — two sheets:
- `Usuarios`: `email`, `nombre`, `apellido`, `rol`, `asignaturas` — one row per user
- `Asignaturas`: `nombre`, `precio` �? **FILL THIS IN MANUALLY**, `cuotas`, `fechaInicio`, `profesorEmail`, `descripcion`, `universidad`, `carrera`, `maxEstudiantes`, `whatsapp`

> Classes left with no `precio` are created as unpublished (invisible to students until the academy adds a price manually).

**`post-import.sql`** — SQL to run AFTER the UI import (Step 4b) to create COMPLETED payment records for legacy courses (those with `startDate < 2025-01-01`). Students in newer courses don't need this — see Step 4b for details.

---

## Step 4a — Import in the Admin UI

In the AKADEMO admin panel:
- Admin → Academias → [academy] → **Migración CSV**
- Upload `moodle-migration.xlsx` (or the raw CSVs directly — the UI auto-detects both)
- Click **Importar**

**What the import does:**
- Creates `User` records with temp passwords for NEW users (format: `fir12345`, first 3 chars of name + 5 random digits)
- Creates `Class` records for any class in the Asignaturas sheet that doesn't already exist
- Creates `ClassEnrollment` (APPROVED) for each user+class pair
- **Skips silently** any user already in this academy (no payment record created for them — run `post-import.sql` if these users need payment records)
- Creates `Assignment` + `QuizQuestion` records if quizzes/questions CSVs are included
- Creates **COMPLETED payment records** for all newly imported students (the import always marks everyone as already paid, since Moodle migrations are for students who already paid offline)

> **Important:** If a student was enrolled BEFORE this import (e.g. enrolled manually, or added in a previous import batch), they will be SKIPPED — no payment record is created for them. Use `post-import.sql` or a direct SQL insert to backfill those.

---

## Step 4b — Run post-import.sql

The `post-import.sql` generated by `moodle-to-excel.js` creates COMPLETED payment records for all enrollments in legacy courses (startDate before Jan 2025). This covers students who were skipped or enrolled through other means.

```powershell
npx wrangler d1 execute akademo-db --remote --file=post-import.sql
```

> Run this from the **project root**. Only run it once per migration — the SQL has a `NOT EXISTS` guard to prevent duplicate payment records.

---

## Step 5 — Upload PDFs to R2 (CLI only)

> **Why CLI?** This step downloads hundreds of files from SiteGround via FTP and uploads them to Cloudflare R2. It takes several minutes and requires credentials that cannot be stored in the UI.

1. Set credentials in `scripts/.env` (create if missing):
```
FTP_HOST=ftp.example.es
FTP_USER=user@example.es
FTP_PASS=yourpassword
R2_ACCESS_KEY_ID=<key from Cloudflare R2 API Tokens>
R2_SECRET_ACCESS_KEY=<secret>
```
2. Update `scripts/ftp-to-r2.js` constants: `ACADEMY_ID`, `OWNER_ID`, `FILES_CSV` path (should point to `docs/onboarding/{client}/files.csv`)
3. Run from project root:

```powershell
node scripts/ftp-to-r2.js
```

This:
- Downloads every PDF from SiteGround FTP using the paths in `files.csv`
- Uploads to R2 bucket `akademo-storage` under prefix `{client-slug}/documents/`
- Generates `docs/onboarding/{client}/import-documents.sql` — **run this manually in Step 8**
- Generates `docs/onboarding/{client}/ftp-progress.json` — **commit this file, it's needed for recovery**

> The script is idempotent: it checks R2 with `HeadObject` before uploading, so it safely re-runs if interrupted.

---

## Step 6b — Run import-documents.sql

```powershell
npx wrangler d1 execute akademo-db --remote --yes --file="docs/onboarding/{client}/import-documents.sql"
```

This creates `Topic → Lesson → Upload → Document` rows linked to the already-imported `Class` records.

> **Do NOT re-run this** if data already exists — use `INSERT OR IGNORE` guards mean it's safe, but duplicates could appear if the file was regenerated with new UUIDs.

---

## Step 7 — Import quizzes

Moodle quizzes become `Assignment` rows (class-level, **not** linked to a topic/tema). Each multiple-choice option becomes a `QuizQuestion` row.

### 7a — Generate quiz-import.sql

Place `quizzes.csv` and `questions.csv` in the **project root** (same directory you ran `moodle-to-excel.js` from), then:

```powershell
node scripts/generate-quiz-sql.js
```

This generates `quiz-import.sql` in the project root.

> ⚠️ **Do NOT run `quiz-import.sql` directly** — it will fail with FK errors if any quiz title appears more than once in the same course (Moodle allows duplicates; AKADEMO does not via `NOT EXISTS` guard). See 7b.

### 7b — Split into assignments + questions

Run this Node script to produce two safe files:

```js
// Run from project root: node -e "..."
const fs = require('fs');
const sql = fs.readFileSync('quiz-import.sql', 'utf8');
const stmts = sql.split(/(?<=;)\n+/);
const assignments = [], questions = [];
for (const s of stmts) {
  if (!s.trim()) continue;
  if (s.includes('INSERT INTO Assignment')) assignments.push(s);
  else if (s.includes('INSERT INTO QuizQuestion')) questions.push(s);
}
fs.writeFileSync('docs/onboarding/{client}/quiz-assignments.sql', assignments.join('\n'));
fs.writeFileSync('docs/onboarding/{client}/quiz-questions.sql', questions.join('\n'));
console.log('Assignments:', assignments.length, 'Questions:', questions.length);
```

### 7c — Run assignments first, identify ghost IDs

```powershell
npx wrangler d1 execute akademo-db --remote --yes --file="docs/onboarding/{client}/quiz-assignments.sql"
```

Then check if any were skipped (count should match expected):
```powershell
npx wrangler d1 execute akademo-db --remote --yes --command="SELECT COUNT(*) FROM Assignment WHERE classId IN (SELECT id FROM Class WHERE academyId = '{academy-id}')"
```

If the count is less than the number of INSERT statements, some quizzes had duplicate titles. Find which assignment IDs were skipped (ghost IDs):

```js
// Run: node -e "..."
const fs = require('fs');
const sql = fs.readFileSync('docs/onboarding/{client}/quiz-assignments.sql', 'utf8');
const blocks = sql.split(/(?<=;)\n+/).filter(s => s.includes('INSERT INTO Assignment'));
const seen = {}; const dupeIds = [];
for (const b of blocks) {
  const idM = b.match(/'([a-f0-9-]{36})'/);
  const titleM = b.match(/title = '([^']+)'/) || b.match(/'([^']+)',.*WHERE NOT EXISTS/);
  const classM = b.match(/classId = '([^']+)'/);
  if (!idM || !classM) continue;
  const key = (titleM ? titleM[1] : '') + '|' + classM[1];
  if (seen[key]) { dupeIds.push(idM[1]); console.log('Ghost ID:', idM[1]); }
  else seen[key] = idM[1];
}
console.log('Total ghost IDs:', dupeIds.length);
```

### 7d — Filter questions and run

```js
// Run: node -e "..."
const fs = require('fs');
const ghostIds = new Set([ /* paste IDs from 7c */ ]);
const sql = fs.readFileSync('docs/onboarding/{client}/quiz-questions.sql', 'utf8');
const stmts = sql.split(/(?<=;)\n+/);
const out = [], skipped = [];
for (const s of stmts) {
  if (!s.trim().startsWith('INSERT INTO QuizQuestion')) { out.push(s); continue; }
  const ids = s.match(/'([0-9a-z]+-[0-9a-f]+-[0-9a-f]+-[0-9a-f]+-[0-9a-f]+)'/g);
  const assignId = ids && ids[1] ? ids[1].replace(/'/g,'') : null;
  if (assignId && ghostIds.has(assignId)) { skipped.push(assignId); continue; }
  out.push(s);
}
fs.writeFileSync('docs/onboarding/{client}/quiz-questions-filtered.sql', out.join('\n'));
console.log('Kept:', out.filter(s=>s.includes('INSERT')).length, 'Skipped:', skipped.length);
```

Then run:
```powershell
npx wrangler d1 execute akademo-db --remote --yes --file="docs/onboarding/{client}/quiz-questions-filtered.sql"
```

---

## Step 8 — Send welcome emails

After import, use Admin → [academy] → **Enviar emails de bienvenida** to send credentials to all newly imported users. Temp passwords are stored in `User.tempPassword` until overwritten on first login.

---

## Recovery: R2 files missing ("File not found" errors)

If students see `{"success":false,"error":"File not found"}` when opening documents, the R2 objects are missing but the DB records are intact. This can happen if the workspace was cloned fresh and the `ftp-progress.json` file was not checked out.

**Fix:**

1. Restore the progress file from git:
```powershell
git checkout -- docs/onboarding/{client}/ftp-progress.json
```

2. Run the re-upload script (checks R2 first, only downloads what's truly missing):
```powershell
node scripts/re-upload-to-r2.js
```

This script re-downloads from FTP and re-uploads to R2 only the missing files. It does **not** touch the database.

> **Root cause**: `ftp-progress.json` must stay committed to git. It maps Moodle contenthash paths → R2 keys and is needed for recovery. Never add it to `.gitignore`.

---

## Useful diagnostic queries

```sql
-- Count all users in new academy by role
SELECT role, COUNT(*) FROM User u
  JOIN ClassEnrollment ce ON ce.userId = u.id
  JOIN Class c ON c.id = ce.classId
  JOIN Academy a ON a.id = c.academyId
  WHERE a.name = 'Academy Name'
  GROUP BY u.role;

-- Check for students with no payment record (missing from payments tab)
SELECT u.firstName, u.lastName, c.name as class
FROM ClassEnrollment ce
JOIN User u ON u.id = ce.userId
JOIN Class c ON c.id = ce.classId
WHERE c.academyId = '<academy-id>'
  AND ce.status = 'APPROVED'
  AND NOT EXISTS (
    SELECT 1 FROM Payment p
    WHERE p.payerId = ce.userId AND p.classId = ce.classId
  );
```

---

## Payment record behavior summary

| Scenario | Payment record created |
|---|---|
| New student, priced class | PENDING (amount = class price) |
| New student, free class (price = 0) | COMPLETED �0 |
| Existing student (skipped) | **None** � run post-import.sql or backfill manually |
| post-import.sql | COMPLETED �0 for each legacy enrollment (idempotent) |
