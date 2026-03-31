-- Clean up all data from Academy Three and Academy Four for re-migration
-- Academy Three: 93fb3d86-d5ec-4dc9-8a37-e95fb0ca3098
-- Academy Four:  a8aee06c-7bc9-4b29-b7da-4574ab9bc9e0

-- 1. Delete payments for classes in these academies
DELETE FROM Payment 
WHERE classId IN (
  SELECT id FROM Class 
  WHERE academyId IN ('93fb3d86-d5ec-4dc9-8a37-e95fb0ca3098', 'a8aee06c-7bc9-4b29-b7da-4574ab9bc9e0')
);

-- 2. Delete enrollments for classes in these academies
DELETE FROM ClassEnrollment 
WHERE classId IN (
  SELECT id FROM Class 
  WHERE academyId IN ('93fb3d86-d5ec-4dc9-8a37-e95fb0ca3098', 'a8aee06c-7bc9-4b29-b7da-4574ab9bc9e0')
);

-- 3. Delete teachers for these academies
DELETE FROM Teacher 
WHERE academyId IN ('93fb3d86-d5ec-4dc9-8a37-e95fb0ca3098', 'a8aee06c-7bc9-4b29-b7da-4574ab9bc9e0');

-- 4. Delete classes for these academies
DELETE FROM Class 
WHERE academyId IN ('93fb3d86-d5ec-4dc9-8a37-e95fb0ca3098', 'a8aee06c-7bc9-4b29-b7da-4574ab9bc9e0');

-- 5. Delete users that were ONLY in these academies (not shared with other academies)
-- First get users enrolled only in these academies
DELETE FROM User 
WHERE id IN (
  SELECT DISTINCT u.id FROM User u
  WHERE u.id IN (
    -- Users from enrollments in these academies
    SELECT ce.userId FROM ClassEnrollment ce 
    JOIN Class c ON ce.classId = c.id 
    WHERE c.academyId IN ('93fb3d86-d5ec-4dc9-8a37-e95fb0ca3098', 'a8aee06c-7bc9-4b29-b7da-4574ab9bc9e0')
    UNION
    -- Users from teacher records in these academies
    SELECT t.userId FROM Teacher t 
    WHERE t.academyId IN ('93fb3d86-d5ec-4dc9-8a37-e95fb0ca3098', 'a8aee06c-7bc9-4b29-b7da-4574ab9bc9e0')
  )
  AND u.id NOT IN (
    -- Exclude users that also exist in OTHER academies
    SELECT ce2.userId FROM ClassEnrollment ce2 
    JOIN Class c2 ON ce2.classId = c2.id 
    WHERE c2.academyId NOT IN ('93fb3d86-d5ec-4dc9-8a37-e95fb0ca3098', 'a8aee06c-7bc9-4b29-b7da-4574ab9bc9e0')
    UNION
    SELECT t2.userId FROM Teacher t2 
    WHERE t2.academyId NOT IN ('93fb3d86-d5ec-4dc9-8a37-e95fb0ca3098', 'a8aee06c-7bc9-4b29-b7da-4574ab9bc9e0')
    UNION
    SELECT a.ownerId FROM Academy a
  )
);
