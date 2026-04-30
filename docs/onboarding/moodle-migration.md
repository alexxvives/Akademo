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

## Per-client folder layout

Each client gets a folder under `docs/onboarding/{client-slug}/`:
```
docs/onboarding/{client-slug}/
  queries/          ← CSVs exported from phpMyAdmin (gitignored — contain student data)
    enrollments.csv
    asignaturas.csv
    quizzes.csv
    questions.csv
    files.csv
  files/            ← Generated SQL/JSON/xlsx (committed)
    moodle-migration.xlsx
    post-import.sql
    import-documents.sql
    ftp-progress.json
    quiz-assignments.sql
    quiz-questions.sql
    quiz-questions-filtered.sql
```

> When running scripts, point `FILES_CSV`, `QUIZZES_CSV`, `QUESTIONS_CSV` etc. to `docs/onboarding/{client-slug}/queries/*.csv`.
> Output SQL files should be written to `docs/onboarding/{client-slug}/files/`.

---

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

See [`docs/onboarding/{client}/queries/01_enrollments.sql`](maximo-expo/queries/01_enrollments.sql)

### `asignaturas.csv` — Class list with start dates
> This is the list of courses (clases), not individual lessons.

See [`docs/onboarding/{client}/queries/02_asignaturas.sql`](maximo-expo/queries/02_asignaturas.sql)

### `quizzes.csv` — Quiz metadata (one row per quiz)

> **You need this AND `questions.csv`** — they are two separate exports that work together.
> `quizzes.csv` tells you which quiz belongs to which course + section (tema).
> `questions.csv` gives you the actual questions and answer options.

See [`docs/onboarding/{client}/queries/03_quizzes.sql`](maximo-expo/queries/03_quizzes.sql)

### `questions.csv`

See [`docs/onboarding/{client}/queries/04_questions.sql`](maximo-expo/queries/04_questions.sql)

### `files.csv` — PDF references (for FTP transfer in Step 5)

> **Includes both single-file resources (`mod_resource`) and files inside folders (`mod_folder`).**
> Files inside folders will use their filename as the document title in AKADEMO.

See [`docs/onboarding/{client}/queries/05_files.sql`](maximo-expo/queries/05_files.sql)

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

Moodle quizzes become `Assignment` rows linked to the topic/lesson (via `lessonId`) they belong to in Moodle. The `quizzes.csv` now includes `section_number` and `section_name` which `generate-quiz-sql.js` uses to look up the matching `Lesson` row in AKADEMO and set `lessonId`.

> **Prerequisite**: `import-documents.sql` must have run first (Step 6b) so that `Lesson` rows exist before the quiz SQL tries to reference them.

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

-- Verify overall migration completeness (run after each phase)
SELECT
  (SELECT COUNT(*) FROM Class WHERE academyId='<academy-id>') AS classes,
  (SELECT COUNT(*) FROM Teacher WHERE academyId='<academy-id>') AS teachers,
  (SELECT COUNT(*) FROM ClassEnrollment ce JOIN Class c ON ce.classId=c.id WHERE c.academyId='<academy-id>') AS enrollments,
  (SELECT COUNT(*) FROM Topic t JOIN Class c ON t.classId=c.id WHERE c.academyId='<academy-id>') AS topics,
  (SELECT COUNT(*) FROM Lesson l JOIN Topic t ON l.topicId=t.id JOIN Class c ON t.classId=c.id WHERE c.academyId='<academy-id>') AS lessons,
  (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId=l.id JOIN Topic t ON l.topicId=t.id JOIN Class c ON t.classId=c.id WHERE c.academyId='<academy-id>') AS documents,
  (SELECT COUNT(*) FROM Assignment a JOIN Class c ON a.classId=c.id WHERE c.academyId='<academy-id>') AS assignments,
  (SELECT COUNT(*) FROM Payment WHERE receiverId='<academy-id>') AS payments;
```

---

## Known Issues & Fixes

### MIME type corruption (`.ppt`, `.jfif`, `.gif`)

SiteGround FTP serves some files without a content-type header, so `ftp-to-r2.js` uploads them as `application/octet-stream`. Affected extensions: `.ppt`, `.jfif`, `.gif`.

**Symptom**: Students can't open these files from the documents list (browser tries to download instead of preview, or app shows an error).

**Fix**: Run `scripts/fix-mime-types.js` to detect and re-upload affected files:

```powershell
node scripts/fix-mime-types.js
```

Before running, update the constants at the top of the script:
- `PROGRESS_JSON` — path to the client's `ftp-progress.json`
- `FTP_HOST`, `FTP_USER` — SiteGround FTP credentials (in `scripts/.env`)

The script prints `UPDATE Upload SET mimeType = '...' WHERE id = '...'` statements. Collect them, save as a `.sql` file, and run via wrangler:

```powershell
npx wrangler d1 execute akademo-db --remote --file=docs/onboarding/{client}/fix-mime-types.sql
```

---

### Duplicate quiz titles in the same course

Moodle allows multiple quizzes with the same title in one course. AKADEMO has a `NOT EXISTS (SELECT 1 FROM Assignment WHERE classId=? AND title=?)` guard, so the second duplicate is silently skipped.

**Symptom**: Expected N quizzes but DB shows fewer.

**Detection**:
```js
// Run from project root: node -e "..."
const fs = require('fs');
const sql = fs.readFileSync('docs/onboarding/{client}/quiz-import.sql', 'utf8');
const lines = sql.split('\n');
const counts = {};
for (const l of lines.filter(l => l.startsWith('-- Quiz:'))) {
  const m = l.match(/^-- Quiz: "(.+)" → Course: "(.+)" \(/);
  if (!m) continue;
  const key = m[2] + '|||' + m[1];
  counts[key] = (counts[key] || 0) + 1;
}
for (const [k, v] of Object.entries(counts)) {
  if (v > 1) { const [c, t] = k.split('|||'); console.log(`x${v}: [${c}] "${t}"`); }
}
```

**Fix**: For each duplicate, generate a new `INSERT` with the title renamed (e.g. append `" (2)"`), then insert matching `QuizQuestion` rows. Use the same approach as Step 7d (filter ghost IDs → run filtered questions file).

---

### Wipe and reimport documents only

If `import-documents.sql` was run with incorrect data (wrong R2 keys, wrong section grouping, etc.) and you need to reimport without touching enrollments/payments:

```sql
-- 1. Delete Documents linked to this academy's lessons
DELETE FROM Document
WHERE lessonId IN (
  SELECT l.id FROM Lesson l
  JOIN Class c ON c.id = l.classId
  WHERE c.academyId = '<academy-id>'
);

-- 2. Delete Uploads from the R2 documents prefix
DELETE FROM Upload
WHERE uploadedById = '<owner-user-id>'
  AND storagePath LIKE '{client-slug}/documents/%';

-- 3. Delete Lessons
DELETE FROM Lesson
WHERE classId IN (SELECT id FROM Class WHERE academyId = '<academy-id>');

-- 4. Delete Topics
DELETE FROM Topic
WHERE classId IN (SELECT id FROM Class WHERE academyId = '<academy-id>');
```

Then re-run `ftp-to-r2.js` (it's idempotent — skips files already in R2) and re-run `import-documents.sql`.

---

## Full rollback procedure

Delete all imported data for an academy while keeping the `Academy` record and owner `User` (so the migration can be re-run). Delete leaf tables first to respect FK constraints:

```sql
-- 1. QuizAttempts
DELETE FROM QuizAttempt WHERE assignmentId IN (
  SELECT a.id FROM Assignment a JOIN Class c ON a.classId = c.id WHERE c.academyId = '<academy-id>'
);
-- 2. QuizQuestions
DELETE FROM QuizQuestion WHERE assignmentId IN (
  SELECT a.id FROM Assignment a JOIN Class c ON a.classId = c.id WHERE c.academyId = '<academy-id>'
);
-- 3. AssignmentSubmission Uploads
DELETE FROM Upload WHERE id IN (
  SELECT s.uploadId FROM AssignmentSubmission s
  JOIN Assignment a ON s.assignmentId = a.id JOIN Class c ON a.classId = c.id
  WHERE c.academyId = '<academy-id>' AND s.uploadId IS NOT NULL
);
-- 4. AssignmentSubmissions
DELETE FROM AssignmentSubmission WHERE assignmentId IN (
  SELECT a.id FROM Assignment a JOIN Class c ON a.classId = c.id WHERE c.academyId = '<academy-id>'
);
-- 5. AssignmentAttachment Uploads
DELETE FROM Upload WHERE id IN (
  SELECT aa.uploadId FROM AssignmentAttachment aa
  JOIN Assignment a ON aa.assignmentId = a.id JOIN Class c ON a.classId = c.id
  WHERE c.academyId = '<academy-id>'
);
-- 6. AssignmentAttachments
DELETE FROM AssignmentAttachment WHERE assignmentId IN (
  SELECT a.id FROM Assignment a JOIN Class c ON a.classId = c.id WHERE c.academyId = '<academy-id>'
);
-- 7. Assignment file Uploads
DELETE FROM Upload WHERE id IN (
  SELECT uploadId FROM Assignment JOIN Class c ON classId = c.id
  WHERE c.academyId = '<academy-id>' AND uploadId IS NOT NULL
  UNION
  SELECT solutionUploadId FROM Assignment JOIN Class c ON classId = c.id
  WHERE c.academyId = '<academy-id>' AND solutionUploadId IS NOT NULL
);
-- 8. Assignments
DELETE FROM Assignment WHERE classId IN (SELECT id FROM Class WHERE academyId = '<academy-id>');
-- 9. VideoPlayState
DELETE FROM VideoPlayState WHERE videoId IN (
  SELECT v.id FROM Video v JOIN Lesson l ON v.lessonId = l.id JOIN Topic t ON l.topicId = t.id
  JOIN Class c ON t.classId = c.id WHERE c.academyId = '<academy-id>'
);
-- 10. LessonRatings
DELETE FROM LessonRating WHERE lessonId IN (
  SELECT l.id FROM Lesson l JOIN Topic t ON l.topicId = t.id
  JOIN Class c ON t.classId = c.id WHERE c.academyId = '<academy-id>'
);
-- 11. Document Uploads
DELETE FROM Upload WHERE id IN (
  SELECT d.uploadId FROM Document d JOIN Lesson l ON d.lessonId = l.id
  JOIN Topic t ON l.topicId = t.id JOIN Class c ON t.classId = c.id
  WHERE c.academyId = '<academy-id>' AND d.uploadId IS NOT NULL
);
-- 12. Documents
DELETE FROM Document WHERE lessonId IN (
  SELECT l.id FROM Lesson l JOIN Topic t ON l.topicId = t.id
  JOIN Class c ON t.classId = c.id WHERE c.academyId = '<academy-id>'
);
-- 13. Video Uploads
DELETE FROM Upload WHERE id IN (
  SELECT v.uploadId FROM Video v JOIN Lesson l ON v.lessonId = l.id
  JOIN Topic t ON l.topicId = t.id JOIN Class c ON t.classId = c.id
  WHERE c.academyId = '<academy-id>' AND v.uploadId IS NOT NULL
);
-- 14. Videos
DELETE FROM Video WHERE lessonId IN (
  SELECT l.id FROM Lesson l JOIN Topic t ON l.topicId = t.id
  JOIN Class c ON t.classId = c.id WHERE c.academyId = '<academy-id>'
);
-- 15. Lessons
DELETE FROM Lesson WHERE topicId IN (
  SELECT t.id FROM Topic t JOIN Class c ON t.classId = c.id WHERE c.academyId = '<academy-id>'
);
-- 16. Topics
DELETE FROM Topic WHERE classId IN (SELECT id FROM Class WHERE academyId = '<academy-id>');
-- 17. LiveStreams
DELETE FROM LiveStream WHERE classId IN (SELECT id FROM Class WHERE academyId = '<academy-id>');
-- 18. CalendarScheduledEvents
DELETE FROM CalendarScheduledEvent WHERE academyId = '<academy-id>';
-- 19. ClassEnrollments
DELETE FROM ClassEnrollment WHERE classId IN (SELECT id FROM Class WHERE academyId = '<academy-id>');
-- 20. Payments
DELETE FROM Payment WHERE receiverId = '<academy-id>';
-- 21. Classes
DELETE FROM Class WHERE academyId = '<academy-id>';
-- 22. ArchivedVideos
DELETE FROM ArchivedVideo WHERE academyId = '<academy-id>';
-- 23. ZoomAccounts
DELETE FROM ZoomAccount WHERE academyId = '<academy-id>';
-- 24. Teachers
DELETE FROM Teacher WHERE academyId = '<academy-id>';
-- Academy and owner User intentionally NOT deleted.
-- NOTE: R2 files referenced by deleted Upload rows are now orphaned.
-- Run a separate R2 cleanup (or re-run ftp-to-r2.js fresh) if needed.
```

---

## Payment record behavior summary

| Scenario | Payment record created |
|---|---|
| New student, priced class | PENDING (amount = class price) |
| New student, free class (price = 0) | COMPLETED �0 |
| Existing student (skipped) | **None** � run post-import.sql or backfill manually |
| post-import.sql | COMPLETED �0 for each legacy enrollment (idempotent) |
