# maximo-expo / queries

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
