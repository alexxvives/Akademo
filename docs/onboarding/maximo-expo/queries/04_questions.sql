-- Export to: questions.csv
-- Quiz questions and answer options (multiple choice + true/false)
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
  CASE qu.qtype
    WHEN 'truefalse' THEN CASE qa.answer WHEN 'True' THEN 'Verdadero' WHEN 'False' THEN 'Falso' ELSE qa.answer END
    ELSE qa.answer
  END AS answer_text,
  qa.fraction AS is_correct
FROM mdl3y_quiz_slots qs
JOIN mdl3y_question qu ON qu.id = qs.questionid AND qu.qtype IN ('multichoice', 'truefalse')
JOIN mdl3y_question_answers qa ON qa.question = qu.id
ORDER BY qs.quizid, qu.id, qa.fraction DESC;
