-- ============================================================
-- Update Demo User Emails
-- Changes demo user emails to shorter versions:
--   academiademo@akademo-edu.com → academia@akademo-edu.com
--   profesordemo@akademo-edu.com → profesor@akademo-edu.com
--   estudiantedemo@akademo-edu.com → estudiante@akademo-edu.com
-- ============================================================

UPDATE User 
SET email = 'academia@akademo-edu.com' 
WHERE id = 'demo-academy-user' AND email LIKE '%demo%akademo%';

UPDATE User 
SET email = 'profesor@akademo-edu.com' 
WHERE id = 'demo-teacher-user' AND email LIKE '%demo%akademo%';

UPDATE User 
SET email = 'estudiante@akademo-edu.com' 
WHERE id = 'demo-student-user' AND email LIKE '%demo%akademo%';
