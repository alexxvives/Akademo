-- cleanup-academy.sql — Full wipe of Máximo Exponente content + classes + enrollments
-- Academy row, Users, and R2 files are NOT touched
-- Run: npx wrangler d1 execute akademo-db --remote --yes --file="docs/onboarding/maximo-expo/files/cleanup-academy.sql"

-- 1. Play state (joins through Video → Lesson → Topic → Class)
DELETE FROM VideoPlayState WHERE videoId IN (
  SELECT v.id FROM Video v JOIN Lesson l ON l.id = v.lessonId JOIN Topic t ON t.id = l.topicId JOIN Class c ON c.id = t.classId WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 2. Ratings
DELETE FROM LessonRating WHERE lessonId IN (
  SELECT l.id FROM Lesson l JOIN Topic t ON t.id = l.topicId JOIN Class c ON c.id = t.classId WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 3. Links
DELETE FROM LessonLink WHERE lessonId IN (
  SELECT l.id FROM Lesson l JOIN Topic t ON t.id = l.topicId JOIN Class c ON c.id = t.classId WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 4. Documents
DELETE FROM Document WHERE lessonId IN (
  SELECT l.id FROM Lesson l JOIN Topic t ON t.id = l.topicId JOIN Class c ON c.id = t.classId WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 5. Uploads (R2 references in DB only — actual R2 files untouched)
DELETE FROM Upload WHERE storagePath LIKE 'maximo-expo/%';

-- 6. Videos
DELETE FROM Video WHERE lessonId IN (
  SELECT l.id FROM Lesson l JOIN Topic t ON t.id = l.topicId JOIN Class c ON c.id = t.classId WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 7. Assignment submissions
DELETE FROM AssignmentSubmission WHERE assignmentId IN (
  SELECT a.id FROM Assignment a JOIN Lesson l ON l.id = a.lessonId JOIN Topic t ON t.id = l.topicId JOIN Class c ON c.id = t.classId WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 8. Quiz attempts (linked via Assignment)
DELETE FROM QuizAttempt WHERE assignmentId IN (
  SELECT a.id FROM Assignment a JOIN Lesson l ON l.id = a.lessonId JOIN Topic t ON t.id = l.topicId JOIN Class c ON c.id = t.classId WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 9. Quiz questions (linked via Assignment)
DELETE FROM QuizQuestion WHERE assignmentId IN (
  SELECT a.id FROM Assignment a JOIN Lesson l ON l.id = a.lessonId JOIN Topic t ON t.id = l.topicId JOIN Class c ON c.id = t.classId WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 10. Assignment attachments
DELETE FROM AssignmentAttachment WHERE assignmentId IN (
  SELECT a.id FROM Assignment a JOIN Lesson l ON l.id = a.lessonId JOIN Topic t ON t.id = l.topicId JOIN Class c ON c.id = t.classId WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 11. Assignments
DELETE FROM Assignment WHERE lessonId IN (
  SELECT l.id FROM Lesson l JOIN Topic t ON t.id = l.topicId JOIN Class c ON c.id = t.classId WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 12. Enrollments
DELETE FROM ClassEnrollment WHERE classId IN (
  SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 13. Live streams
DELETE FROM LiveStream WHERE classId IN (
  SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 14. Archived videos (unlink before delete)
UPDATE ArchivedVideo SET classId = NULL WHERE classId IN (
  SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 15. Lessons
DELETE FROM Lesson WHERE topicId IN (
  SELECT t.id FROM Topic t JOIN Class c ON c.id = t.classId WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 16. Topics
DELETE FROM Topic WHERE classId IN (
  SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 17. Classes
DELETE FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38';

-- 18. Teachers
DELETE FROM Teacher WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38';
