-- Export to: questions.csv
-- Quiz questions and answer options (multiple choice only)
-- DB prefix: mdl3y_
--
-- NOTE: You also need quizzes.csv (03_quizzes.sql) — both files are required.
-- This file gives you the questions and answers.
-- quizzes.csv links each quiz to a course section so the quiz gets the right lessonId.

SELECT
  qs.quizid AS quiz_id,
  qu.id AS question_id,
  qu.questiontext AS question_text,
  qa.id AS answer_id,
  qa.answer AS answer_text,
  qa.fraction AS is_correct
FROM mdl3y_quiz_slots qs
JOIN mdl3y_question qu ON qu.id = qs.questionid AND qu.qtype = 'multichoice'
JOIN mdl3y_question_answers qa ON qa.question = qu.id
ORDER BY qs.quizid, qu.id, qa.fraction DESC;
