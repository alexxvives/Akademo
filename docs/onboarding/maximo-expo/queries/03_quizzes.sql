-- Export to: quizzes.csv
-- Quiz metadata with section (tema) info for lessonId linking
-- DB prefix: mdl3y_
--
-- NOTE: You also need questions.csv (04_questions.sql) — both files are required.
-- This file tells you which quiz belongs to which course + section.
-- questions.csv gives you the actual questions and answer options.

SELECT
  c.fullname AS course_name,
  q.id AS quiz_id,
  q.name AS quiz_name,
  q.intro AS quiz_description,
  cs.section AS section_number,
  COALESCE(NULLIF(TRIM(cs.name), ''), CONCAT('Tema ', cs.section)) AS section_name
FROM mdl3y_quiz q
JOIN mdl3y_course c ON c.id = q.course
JOIN mdl3y_course_modules cm ON cm.course = q.course
  AND cm.instance = q.id
  AND cm.module = (SELECT id FROM mdl3y_modules WHERE name = 'quiz')
JOIN mdl3y_course_sections cs ON cs.id = cm.section
WHERE c.id > 1
  AND cm.visible = 1
  AND cm.deletioninprogress = 0
ORDER BY c.id, q.id;
