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

### `asignaturas.csv`
> **This is the list of Asignaturas (Classes), not lessons.** Lessons are created later from `files.csv` via `ftp-to-r2.js`.

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
  cs.section AS section_number,
  COALESCE(NULLIF(TRIM(cs.name), ''), CONCAT('Tema ', cs.section)) AS section_name,
  f.filename,
  f.filesize,
  CONCAT(LEFT(f.contenthash,2), '/', MID(f.contenthash,3,2), '/', f.contenthash) AS file_path
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
ORDER BY c.fullname, cs.section, r.name;
```

> **Note**: Replace `{PREFIX}` with the actual prefix found in Step 0. The `files.csv` query now includes `section_number` and `section_name` directly — `ftp-to-r2.js` uses these to create one topic per Moodle section instead of a single "Documentos" topic. Sections without a custom name fall back to `Tema N`.

---

## Step 2 — Create the academy account

1. Register the academy via the AKADEMO admin panel with a temporary email
2. Note the academy ID from the URL or DB: `SELECT id FROM Academy WHERE name = '...'`

---

## Step 3 — Import CSVs in Admin UI

In the AKADEMO admin panel:
- Admin → Academias → [academy] → Importar usuarios
- Upload all CSVs at once (`enrollments.csv`, `asignaturas.csv`, `quizzes.csv`, `questions.csv`, `files.csv`)
- Check **"Marcar todos como pagados"** for legacy academies (students already paid in Moodle)
- The import creates users, classes, enrollments, quizzes, questions, and COMPLETED payment records in one step
- Note any errors (unmatched class names, missing fields)

> **Note**: Classes with no `precio` in `courses.csv` are created as `isPublished=0` — invisible until the academy sets a price manually.

> **Legacy note**: `node scripts/moodle-to-excel.js` can still generate a `moodle-migration.xlsx` if you prefer to review data in Excel before uploading. The UI accepts both `.xlsx` and raw CSVs. The separate `post-import.sql` step is no longer needed — payment records are created inline by the UI when "Marcar todos como pagados" is checked.

---

## Step 4 — Upload PDFs to R2 (CLI only)

> **Why CLI?** This step downloads hundreds of files from SiteGround via FTP and uploads them to Cloudflare R2. It takes several minutes and requires credentials that can't be stored in the UI.

1. Set credentials at the top of `scripts/ftp-to-r2.js` (or via env vars)
2. Run:

```powershell
node scripts/ftp-to-r2.js
```

This:
- Downloads every PDF from SiteGround FTP
- Uploads to R2 bucket `akademo-storage`
- Generates `scripts/moodle-import/import-documents.sql`
- **Automatically applies it** to the remote D1 DB

> **Quizzes are already done.** If you uploaded `quizzes.csv` + `questions.csv` in Step 3, the quiz assignments and questions are already imported — `generate-quiz-sql.js` is not needed.

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

---

## Full Moodle → AKADEMO data mapping

| Moodle concept | Moodle table(s) | AKADEMO table | Script/step |
|---|---|---|---|
| Course | `{PREFIX}_course` | `Class` | Step 3 (Admin UI) |
| Course sections (topics) | `{PREFIX}_course_sections` | `Topic` | Step 4 (ftp-to-r2.js, one topic per section, name from `section_name` col in files.csv) |
| Student enrollment | `{PREFIX}_user_enrolments` + `{PREFIX}_enrol` | `ClassEnrollment` | Step 3 (Admin UI) |
| User account | `{PREFIX}_user` | `User` | Step 3 (Admin UI) |
| PDF/file resource | `{PREFIX}_files` + `{PREFIX}_resource` | `Upload` + `Document` + `Lesson` | Step 5 (ftp-to-r2.js) |
| Quiz | `{PREFIX}_quiz` | `Assignment` (type=quiz) | Step 3 (Admin UI) |
| Quiz questions | `{PREFIX}_question` | `QuizQuestion` | Step 3 (Admin UI) |
| Quiz attempts | `{PREFIX}_quiz_attempts` | **not migrated** (historical) | — |
| Forum (feedback) | `{PREFIX}_forum` | **no equivalent** | — |
| Grades | `{PREFIX}_grade_items` + `{PREFIX}_grade_grades` | **no equivalent** | — |
| Calendar events | `{PREFIX}_event` | `CalendarScheduledEvent` (manual) | — |
| URL resources | `{PREFIX}_url` | **no equivalent** | — |
| Labels/HTML content | `{PREFIX}_label` | **no equivalent** | — |

**What we migrate**: Users, course list, student enrollments, PDF files (grouped by Moodle section), quizzes + questions.  
**What we skip**: Videos (need re-upload to Bunny), forum posts, grades, quiz attempts, HTML labels. Topic names come from Moodle section names (`section_name` column in `files.csv`); sections without a custom name become `Tema N`.
