-- ============================================================
-- ⚠️  ALREADY USED — ran 2026-04-26 before re-importing with import-documents.sql
-- Only needed if you need to wipe and re-import documents for this academy.
-- Safe to re-run (deletes Topic/Lesson/Document/Upload for maximoexponente).
-- ============================================================
-- Cleanup: Remove all Topic / Lesson / Document / Upload records
-- for the maximoexponente academy so they can be re-imported
-- with proper Moodle section grouping + original file dates.
--
-- Run BEFORE applying the newly regenerated import-documents.sql
-- ============================================================

-- 1. Delete Documents linked to Lessons belonging to maximoexpo classes
DELETE FROM Document
WHERE lessonId IN (
  SELECT l.id FROM Lesson l
  JOIN Class c ON c.id = l.classId
  WHERE c.academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 2. Delete Uploads owned by the academy owner that back those documents
--    (only the ones from the R2 maximo-exponente/documents/ prefix)
DELETE FROM Upload
WHERE uploadedById = '3d26da5d-c5b6-4c49-ae62-d4687c44cfd7'
  AND storagePath LIKE 'maximo-exponente/documents/%';

-- 3. Delete all Lessons belonging to maximoexpo classes
DELETE FROM Lesson
WHERE classId IN (
  SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);

-- 4. Delete all Topics belonging to maximoexpo classes
DELETE FROM Topic
WHERE classId IN (
  SELECT id FROM Class WHERE academyId = '93ab97cf-271b-48de-924b-10fb7eab0a38'
);
