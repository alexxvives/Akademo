-- Fix demo data relationships for estudiante/profesor/academia demo accounts
-- Task 7: Proper relationships + Task 6: Real video GUIDs + Topics in DB

-- 1. Fix teacher status: PENDING → APPROVED (profesor is an active teacher)
UPDATE Teacher SET status = 'APPROVED' WHERE id = 'demo-teacher-record';

-- 2. Update 3 of 4 enrollments to documentSigned = 1 (physics stays unsigned)
UPDATE ClassEnrollment SET documentSigned = 1 WHERE id = 'demo-enroll-web';
UPDATE ClassEnrollment SET documentSigned = 1 WHERE id = 'demo-enroll-math';
UPDATE ClassEnrollment SET documentSigned = 1 WHERE id = 'demo-enroll-design';

-- 3. Remove payment for physics class (student can't access this one)
DELETE FROM Payment WHERE id = 'demo-pay-physics';

-- 4. Update all demo upload records with the REAL demo video bunny GUID
-- This makes videos actually playable for student/teacher/academy roles
UPDATE Upload SET bunnyGuid = '912efe98-e6af-4c29-ada3-2617f0ff6674' WHERE id LIKE 'demo-upload-video-%';

-- 5. Insert topics for demo classes (matching frontend demo data)
INSERT OR IGNORE INTO Topic (id, name, classId, orderIndex, createdAt) VALUES
  ('demo-topic-web-1', 'Fundamentos', 'demo-class-web', 0, datetime('now'));
INSERT OR IGNORE INTO Topic (id, name, classId, orderIndex, createdAt) VALUES
  ('demo-topic-web-2', 'Hooks y Estado', 'demo-class-web', 1, datetime('now'));
INSERT OR IGNORE INTO Topic (id, name, classId, orderIndex, createdAt) VALUES
  ('demo-topic-math-1', 'Cálculo Diferencial', 'demo-class-math', 0, datetime('now'));
INSERT OR IGNORE INTO Topic (id, name, classId, orderIndex, createdAt) VALUES
  ('demo-topic-math-2', 'Cálculo Integral', 'demo-class-math', 1, datetime('now'));
INSERT OR IGNORE INTO Topic (id, name, classId, orderIndex, createdAt) VALUES
  ('demo-topic-design-1', 'Teoría del Diseño', 'demo-class-design', 0, datetime('now'));

-- 6. Link lessons to their topics
UPDATE Lesson SET topicId = 'demo-topic-web-1' WHERE id IN ('demo-lesson-web-1', 'demo-lesson-web-2');
UPDATE Lesson SET topicId = 'demo-topic-web-2' WHERE id IN ('demo-lesson-web-3', 'demo-lesson-web-4');
UPDATE Lesson SET topicId = 'demo-topic-math-1' WHERE id IN ('demo-lesson-math-1', 'demo-lesson-math-2');
UPDATE Lesson SET topicId = 'demo-topic-math-2' WHERE id = 'demo-lesson-math-3';
UPDATE Lesson SET topicId = 'demo-topic-design-1' WHERE id IN ('demo-lesson-design-1', 'demo-lesson-design-2');
