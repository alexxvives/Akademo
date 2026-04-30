# maximo-expo / queries

## SQL files → run in phpMyAdmin, export result as CSV

| SQL file | Export as | Notes |
|----------|-----------|-------|
| `01_enrollments.sql` | `enrollments.csv` | Users + course roles |
| `02_asignaturas.sql` | `asignaturas.csv` | Course list with start dates |
| `03_quizzes.sql` | `quizzes.csv` | Quiz metadata + section info |
| `04_questions.sql` | `questions.csv` | Questions + answer options |
| `05_files.sql` | `files.csv` | PDF paths for R2 upload |

**How to export**: phpMyAdmin → SQL tab → paste query → run → Export → CSV (keep headers).

Remember to replace `{PREFIX}` in each SQL file with the actual Moodle DB prefix (e.g. `mdl3y_`).

The generated `.csv` files are gitignored (contain student data). The `.sql` files are committed.

---
<!-- original README content below -->


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
