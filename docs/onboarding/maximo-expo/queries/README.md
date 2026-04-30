# maximo-expo / queries

**SQL files to run in phpMyAdmin → results get exported as CSVs and saved in `../files/`**

| SQL file | Export as | Notes |
|----------|-----------|-------|
| `01_enrollments.sql` | `../files/users.csv` | Users + course roles |
| `02_asignaturas.sql` | `../files/asignaturas.csv` | Course list with start dates |
| `03_quizzes.sql` | `../files/quizzes.csv` | Quiz metadata + section info |
| `04_questions.sql` | `../files/questions.csv` | Questions + answer options |
| `05_files.sql` | `../files/files.csv` | PDF paths for R2 upload (mod_resource + mod_folder) |
| `06_urls.sql` | `../files/links.csv` | External link resources (YouTube, etc.) |

**How to export**: phpMyAdmin → SQL tab → paste query → run → Export → CSV (keep headers) → save to `files/`.

All queries use the `mdl3y_` prefix (hardcoded for this client).

The `.sql` files here are committed. The `.csv` outputs in `files/` are gitignored (contain student data).

---

**What was NOT migrated and why:**
- `mdl3y_assign` (12 rows) — written assignment submission tasks. AKADEMO doesn't have this content type (only multiple-choice quizzes).
- `mdl3y_quiz_attempts` / `mdl3y_quiz_grades` — past attempt history. Not currently in scope.
- `mdl3y_forum` / discussions / posts — forum content. Not applicable to AKADEMO.

---


**Drop your phpMyAdmin CSV exports here before running the migration scripts.**

| File | From query in moodle-migration.md |
|------|-----------------------------------|
| `enrollments.csv` | Step 1 — users + course assignments |
| `asignaturas.csv` | Step 1 — class list with start dates |
| `quizzes.csv` | Step 1 — quiz metadata + section info |
| `questions.csv` | Step 1 — quiz questions + answers |
| `files.csv` | Step 1 — PDF file references (includes folder contents) |

> These files contain student data — **do not commit them**.
> They are gitignored via `docs/onboarding/maximo-expo/queries/*.csv`.
