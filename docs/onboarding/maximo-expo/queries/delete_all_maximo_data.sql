-- Delete ALL Maximo Expo migration data EXCEPT the Academy row itself
-- Safe to re-run: idempotent deletes

-- 1. Quiz attempts for Maximo Expo assignments
DELETE FROM QuizAttempt WHERE assignmentId IN (
  SELECT asn.id FROM Assignment asn
  JOIN Class c ON c.id = asn.classId
  JOIN Academy a ON a.id = c.academyId
  WHERE a.name LIKE '%ximo%'
);

-- 2. Quiz questions for Maximo Expo assignments
DELETE FROM QuizQuestion WHERE assignmentId IN (
  SELECT asn.id FROM Assignment asn
  JOIN Class c ON c.id = asn.classId
  JOIN Academy a ON a.id = c.academyId
  WHERE a.name LIKE '%ximo%'
);

-- 3. Assignments (quizzes) for Maximo Expo classes
DELETE FROM Assignment WHERE classId IN (
  SELECT c.id FROM Class c
  JOIN Academy a ON a.id = c.academyId
  WHERE a.name LIKE '%ximo%'
);

-- 4. Lesson links (video links) under Maximo Expo lessons
DELETE FROM LessonLink WHERE lessonId IN (
  SELECT l.id FROM Lesson l
  JOIN Class c ON c.id = l.classId
  JOIN Academy a ON a.id = c.academyId
  WHERE a.name LIKE '%ximo%'
);

-- 5. Documents attached to Maximo Expo lessons
DELETE FROM Document WHERE lessonId IN (
  SELECT l.id FROM Lesson l
  JOIN Class c ON c.id = l.classId
  JOIN Academy a ON a.id = c.academyId
  WHERE a.name LIKE '%ximo%'
);

-- 6. Lessons under Maximo Expo classes
DELETE FROM Lesson WHERE classId IN (
  SELECT c.id FROM Class c
  JOIN Academy a ON a.id = c.academyId
  WHERE a.name LIKE '%ximo%'
);

-- 7. Topics under Maximo Expo classes
DELETE FROM Topic WHERE classId IN (
  SELECT c.id FROM Class c
  JOIN Academy a ON a.id = c.academyId
  WHERE a.name LIKE '%ximo%'
);

-- 8. Class enrollments for Maximo Expo classes
DELETE FROM ClassEnrollment WHERE classId IN (
  SELECT c.id FROM Class c
  JOIN Academy a ON a.id = c.academyId
  WHERE a.name LIKE '%ximo%'
);

-- 9. Teacher records linked to Maximo Expo academy
DELETE FROM Teacher WHERE academyId IN (
  SELECT id FROM Academy WHERE name LIKE '%ximo%'
);

-- 10. Classes belonging to Maximo Expo academy
DELETE FROM Class WHERE academyId IN (
  SELECT id FROM Academy WHERE name LIKE '%ximo%'
);

-- NOTE: User accounts are intentionally kept.
-- On re-import they will be re-linked (new Teacher/ClassEnrollment rows).
