-- Cleanup script: remove migrated users/data for Academy Three, Four, Five
-- Run with: npx wrangler d1 execute akademo-db --remote --file=scripts/cleanup-academies-3-4-5.sql

-- 1. Delete payments linked to classes in these academies
DELETE FROM Payment WHERE classId IN (
  SELECT id FROM Class WHERE academyId IN (
    '93fb3d86-d5ec-4dc9-8a37-e95fb0ca3098',
    'a8aee06c-7bc9-4b29-b7da-4574ab9bc9e0',
    '5180be2f-2495-477b-a5b9-e7d9169fc3c1'
  )
);

-- 2. Delete enrollments in classes of these academies
DELETE FROM ClassEnrollment WHERE classId IN (
  SELECT id FROM Class WHERE academyId IN (
    '93fb3d86-d5ec-4dc9-8a37-e95fb0ca3098',
    'a8aee06c-7bc9-4b29-b7da-4574ab9bc9e0',
    '5180be2f-2495-477b-a5b9-e7d9169fc3c1'
  )
);

-- 3. Delete teacher records for these academies
DELETE FROM Teacher WHERE academyId IN (
  '93fb3d86-d5ec-4dc9-8a37-e95fb0ca3098',
  'a8aee06c-7bc9-4b29-b7da-4574ab9bc9e0',
  '5180be2f-2495-477b-a5b9-e7d9169fc3c1'
);

-- 4. Delete User accounts that are now fully orphaned:
--    - not an academy owner
--    - no remaining ClassEnrollment or Teacher records
--    - not a seed/fixed account (ADMIN, academy1, academy2, demo)
DELETE FROM User WHERE
  role IN ('STUDENT', 'TEACHER')
  AND id NOT IN (SELECT ownerId FROM Academy)
  AND id NOT IN (SELECT userId FROM ClassEnrollment)
  AND id NOT IN (SELECT userId FROM Teacher)
  AND id NOT IN ('admin', 'academy1', 'academy2', 'demo-academy-user');
