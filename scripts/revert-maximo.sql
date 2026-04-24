-- ============================================================
-- REVERT MIGRATION: Maximo Exponente
-- Academy ID : 93ab97cf-271b-48de-924b-10fb7eab0a38
-- Owner User  : 3d26da5d-c5b6-4c49-ae62-d4687c44cfd7  ← NOT deleted
--
-- Order: leaf tables first, then parents, to respect FK constraints.
-- The Academy record and owner User are KEPT so the academy can
-- be re-migrated from scratch.
-- ============================================================

-- ----------------------------------------------------------------
-- STEP 1: QuizAttempts
-- ----------------------------------------------------------------
DELETE FROM QuizAttempt WHERE assignmentId IN (
  SELECT a.id FROM Assignment a
  JOIN Class c ON a.classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 2: QuizQuestions
-- ----------------------------------------------------------------
DELETE FROM QuizQuestion WHERE assignmentId IN (
  SELECT a.id FROM Assignment a
  JOIN Class c ON a.classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 3: AssignmentSubmission Uploads  (delete Uploads first so FK is free)
-- ----------------------------------------------------------------
DELETE FROM Upload WHERE id IN (
  SELECT s.uploadId FROM AssignmentSubmission s
  JOIN Assignment a ON s.assignmentId = a.id
  JOIN Class c ON a.classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
    AND s.uploadId IS NOT NULL
);

-- ----------------------------------------------------------------
-- STEP 4: AssignmentSubmissions
-- ----------------------------------------------------------------
DELETE FROM AssignmentSubmission WHERE assignmentId IN (
  SELECT a.id FROM Assignment a
  JOIN Class c ON a.classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 5: AssignmentAttachment Uploads
-- ----------------------------------------------------------------
DELETE FROM Upload WHERE id IN (
  SELECT aa.uploadId FROM AssignmentAttachment aa
  JOIN Assignment a ON aa.assignmentId = a.id
  JOIN Class c ON a.classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 6: AssignmentAttachments
-- ----------------------------------------------------------------
DELETE FROM AssignmentAttachment WHERE assignmentId IN (
  SELECT a.id FROM Assignment a
  JOIN Class c ON a.classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 7: Assignment main-file and solution-file Uploads
-- ----------------------------------------------------------------
DELETE FROM Upload WHERE id IN (
  SELECT uploadId FROM Assignment
  JOIN Class c ON classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
    AND uploadId IS NOT NULL
  UNION
  SELECT solutionUploadId FROM Assignment
  JOIN Class c ON classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
    AND solutionUploadId IS NOT NULL
);

-- ----------------------------------------------------------------
-- STEP 8: Assignments
-- ----------------------------------------------------------------
DELETE FROM Assignment WHERE classId IN (
  SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 9: VideoPlayState
-- ----------------------------------------------------------------
DELETE FROM VideoPlayState WHERE videoId IN (
  SELECT v.id FROM Video v
  JOIN Lesson l ON v.lessonId = l.id
  JOIN Topic t ON l.topicId = t.id
  JOIN Class c ON t.classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 10: LessonRatings
-- ----------------------------------------------------------------
DELETE FROM LessonRating WHERE lessonId IN (
  SELECT l.id FROM Lesson l
  JOIN Topic t ON l.topicId = t.id
  JOIN Class c ON t.classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 11: Document Uploads
-- ----------------------------------------------------------------
DELETE FROM Upload WHERE id IN (
  SELECT d.uploadId FROM Document d
  JOIN Lesson l ON d.lessonId = l.id
  JOIN Topic t ON l.topicId = t.id
  JOIN Class c ON t.classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
    AND d.uploadId IS NOT NULL
);

-- ----------------------------------------------------------------
-- STEP 12: Documents
-- ----------------------------------------------------------------
DELETE FROM Document WHERE lessonId IN (
  SELECT l.id FROM Lesson l
  JOIN Topic t ON l.topicId = t.id
  JOIN Class c ON t.classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 13: Video Uploads (Bunny or R2)
-- ----------------------------------------------------------------
DELETE FROM Upload WHERE id IN (
  SELECT v.uploadId FROM Video v
  JOIN Lesson l ON v.lessonId = l.id
  JOIN Topic t ON l.topicId = t.id
  JOIN Class c ON t.classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 14: Videos
-- ----------------------------------------------------------------
DELETE FROM Video WHERE lessonId IN (
  SELECT l.id FROM Lesson l
  JOIN Topic t ON l.topicId = t.id
  JOIN Class c ON t.classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 15: Lessons
-- ----------------------------------------------------------------
DELETE FROM Lesson WHERE topicId IN (
  SELECT t.id FROM Topic t
  JOIN Class c ON t.classId = c.id
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 16: Topics
-- ----------------------------------------------------------------
DELETE FROM Topic WHERE classId IN (
  SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 17: LiveStreams
-- ----------------------------------------------------------------
DELETE FROM LiveStream WHERE classId IN (
  SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 18: CalendarScheduledEvents
-- ----------------------------------------------------------------
DELETE FROM CalendarScheduledEvent WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38';

-- ----------------------------------------------------------------
-- STEP 19: ClassEnrollments
-- ----------------------------------------------------------------
DELETE FROM ClassEnrollment WHERE classId IN (
  SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- ----------------------------------------------------------------
-- STEP 20: Payments linked to this academy
-- ----------------------------------------------------------------
DELETE FROM Payment WHERE receiverId = '93ab97cf-271b-48de-924b-10fb7eab0a38';

-- ----------------------------------------------------------------
-- STEP 21: Classes
-- ----------------------------------------------------------------
DELETE FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38';

-- ----------------------------------------------------------------
-- STEP 22: ArchivedVideos
-- ----------------------------------------------------------------
DELETE FROM ArchivedVideo WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38';

-- ----------------------------------------------------------------
-- STEP 23: ZoomAccounts
-- ----------------------------------------------------------------
DELETE FROM ZoomAccount WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38';

-- ----------------------------------------------------------------
-- STEP 24: Teachers
-- ----------------------------------------------------------------
DELETE FROM Teacher WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38';

-- ----------------------------------------------------------------
-- Academy and owner User are intentionally NOT deleted.
-- ----------------------------------------------------------------
-- NOTE: R2 files referenced by the deleted Upload rows are now
-- orphaned in storage. Run a separate cleanup against R2 if needed.
-- ----------------------------------------------------------------
