-- ============================================================
-- WIPE all imported data for maximoexpo academy
-- Academy ID : 93ab97cf-271b-48de-924b-10fb7eab0a38
-- Owner ID   : 3d26da5d-c5b6-4c49-ae62-d4687c44cfd7  (kept)
-- ============================================================

-- 1. Documents (leaf — delete first)
DELETE FROM Document
WHERE lessonId IN (
  SELECT id FROM Lesson
  WHERE classId IN (SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38')
);

-- 2. QuizQuestions
DELETE FROM QuizQuestion
WHERE assignmentId IN (
  SELECT id FROM Assignment
  WHERE classId IN (SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38')
);

-- 3. Assignments
DELETE FROM Assignment
WHERE classId IN (SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38');

-- 4. Lessons
DELETE FROM Lesson
WHERE classId IN (SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38');

-- 5. Topics
DELETE FROM Topic
WHERE classId IN (SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38');

-- 6. Payments (student-to-academy for these classes)
DELETE FROM Payment
WHERE classId IN (SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38');

-- 7. ClassEnrollments
DELETE FROM ClassEnrollment
WHERE classId IN (SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38');

-- 8. Teachers linked to this academy
DELETE FROM Teacher
WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38';

-- 9. AcademicYear periods
DELETE FROM AcademicYear
WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38';

-- 10. Classes
DELETE FROM Class
WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38';

-- 11. R2 Uploads created by the ftp-to-r2.js migration
DELETE FROM Upload
WHERE storagePath LIKE 'maximo-exponente/%';

-- 12. LoginEvents for imported users (no CASCADE on this FK)
DELETE FROM LoginEvent
WHERE userId != '3d26da5d-c5b6-4c49-ae62-d4687c44cfd7'
  AND userId NOT IN (SELECT ownerId FROM Academy)
  AND userId NOT IN (SELECT userId FROM ClassEnrollment)
  AND userId NOT IN (SELECT userId FROM Teacher);

-- 13. Imported users: delete users that no longer have any ClassEnrollment,
--     are not a Teacher in any academy, don't own an Academy,
--     are not the maximoexpo owner, and are not ADMIN role.
DELETE FROM User
WHERE id != '3d26da5d-c5b6-4c49-ae62-d4687c44cfd7'
  AND role != 'ADMIN'
  AND id NOT IN (SELECT ownerId FROM Academy)
  AND id NOT IN (SELECT userId FROM ClassEnrollment)
  AND id NOT IN (SELECT userId FROM Teacher);
