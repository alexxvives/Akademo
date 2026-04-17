# Moodle → AKADEMO Migration Guide

Internal reference for migrating clients from Moodle to AKADEMO.
Tested on: maximo exponente (April 2026). DB prefix: `mdl3y_` (varies per install).

---

## Step 0 — Find the DB prefix

```sql
SHOW TABLES;
```

Look for the prefix before `_user`, `_course`, etc. (Standard Moodle uses `mdl_`, but SiteGround installs often auto-generate it, e.g. `mdl3y_`.)

---

## Step 1 — Export CSVs from phpMyAdmin

Go to **SiteGround → Sitio Web → MySQL → PHPMYADMIN**, open the Moodle database, click **SQL**, run each query and click **Export → CSV** (keep column names in first row). Save files to the **project root**.

### `enrollments.csv`
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
ORDER BY u.email;
```

### `courses.csv`
```sql
SELECT
  fullname AS nombre,
  FROM_UNIXTIME(startdate, '%d/%m/%Y') AS fechaInicio
FROM {PREFIX}_course
WHERE id > 1
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

### `files.csv` (PDFs)
```sql
SELECT
  r.name AS file_title,
  c.fullname AS course_name,
  f.filename,
  f.filesize,
  CONCAT(LEFT(f.contenthash,2), '/', MID(f.contenthash,3,2), '/', f.contenthash) AS file_path
FROM {PREFIX}_files f
JOIN {PREFIX}_context ctx ON ctx.id = f.contextid AND ctx.contextlevel = 70
JOIN {PREFIX}_course_modules cm ON cm.id = ctx.instanceid
JOIN {PREFIX}_course c ON c.id = cm.course
JOIN {PREFIX}_resource r ON cm.instance = r.id
WHERE f.component = 'mod_resource'
  AND f.filearea = 'content'
  AND f.filename != '.'
  AND f.filesize > 0
ORDER BY c.fullname, r.name;
```

> **Note**: Replace `{PREFIX}` with the actual prefix found in Step 0.

---

## Step 2 — Apply DB migration

Before importing, make sure the schema is up to date:

```powershell
npx wrangler d1 execute akademo-db --remote --file=migrations/0009_class_published.sql
```

---

## Step 3 — Generate Excel + post-import SQL

```powershell
node scripts/moodle-to-excel.js
```

Outputs:
- `moodle-migration.xlsx` — import-ready Excel (Usuarios + Asignaturas tabs)
- `post-import.sql` — approves enrollments + marks legacy courses as paid

**Before importing**: Open `moodle-migration.xlsx` and fill in the `precio` column in the Asignaturas tab.  
Leave blank → class is created as `isPublished=0` (invisible until academy sets a price).

---

## Step 4 — Create the academy account

1. Register the academy via the AKADEMO admin panel with a temporary email
2. Note the academy ID from the URL or DB: `SELECT id FROM Academy WHERE name = '...'`

---

## Step 5 — Import the Excel

In the AKADEMO admin panel:
- Admin → Academias → [academy] → Importar usuarios
- Upload `moodle-migration.xlsx`
- Note any errors (unmatched class names, missing fields)

---

## Step 6 — Run post-import SQL

```powershell
npx wrangler d1 execute akademo-db --remote --file=post-import.sql
```

This:
- Sets all legacy enrollment statuses to `APPROVED`
- Creates `COMPLETED` payment records (`amount=0`, `method='migration'`) so students don't appear as pending

---

## Step 7 — Generate quiz SQL + PDF manifest

```powershell
node scripts/generate-quiz-sql.js
```

Outputs:
- `quiz-import.sql` — creates `Assignment` (type=quiz) + `QuizQuestion` records
- `pdf-manifest.txt` — list of PDFs with their SiteGround paths

```powershell
npx wrangler d1 execute akademo-db --remote --file=quiz-import.sql
```

---

## Step 8 — Download and upload PDFs

1. Open `pdf-manifest.txt` — it lists every PDF with its full SiteGround path
2. Go to **SiteGround → Sitio Web → Gestor archivos**
3. Navigate to `/home/customer/www/{domain}/campus/moodledata/filedir/`
4. Download each file listed in the manifest
5. Upload via AKADEMO dashboard → Clases → [class] → Lecciones → Nueva lección → Añadir documento
   - Assign each PDF to the correct class as shown in the manifest

---

## Useful diagnostic queries

```sql
-- Count all in new academy by role
SELECT role, COUNT(*) FROM User u
JOIN ClassEnrollment ce ON ce.userId = u.id
JOIN Class c ON c.id = ce.classId
WHERE c.academyId = 'ACADEMY_ID_HERE'
GROUP BY role;

-- Check for unpublished classes (missing price)
SELECT name, isPublished FROM Class WHERE academyId = 'ACADEMY_ID_HERE' AND isPublished = 0;

-- Verify payment records were created
SELECT COUNT(*) FROM Payment WHERE paymentMethod = 'migration';

-- Check quiz import
SELECT a.title, COUNT(q.id) as question_count
FROM Assignment a
LEFT JOIN QuizQuestion q ON q.assignmentId = a.id
WHERE a.type = 'quiz'
GROUP BY a.id;
```

---

## Role mapping

| Moodle role       | AKADEMO role |
|-------------------|--------------|
| `student`         | `STUDENT`    |
| `editingteacher`  | `TEACHER`    |
| `teacher`         | `TEACHER`    |
| `manager`         | skip         |
| `usuariowebservice` | skip       |

---

## Caveats

- **Videos**: Not migrated. If hosted on external servers (e.g. GTM), add manually.
- **Student submissions**: Not migrated (historical data, low value).
- **Moodle-only question types** (drag & drop, matching, etc.) are skipped — only `multichoice` is supported.
- **Duplicate questions**: Moodle reuses questions across quizzes via a question bank. Each quiz gets its own copy in AKADEMO.
- **Content hash deduplication**: Moodle stores files by SHA1 hash. The PDF manifest deduplicates so the same file isn't downloaded twice.
