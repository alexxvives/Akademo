-- Migration: Restructure database for better intuitiveness
-- 1. Create new Teacher table
-- 2. Migrate data from AcademyMembership to Teacher
-- 3. Remove redundant columns from Academy and Class
-- 4. Drop AcademyMembership table

-- Step 1: Create Teacher table
CREATE TABLE Teacher (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  academyId TEXT NOT NULL,
  defaultMaxWatchTimeMultiplier REAL DEFAULT 2.0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (academyId) REFERENCES Academy(id) ON DELETE CASCADE
);

-- Step 2: Migrate approved teachers from AcademyMembership to Teacher
INSERT INTO Teacher (id, userId, academyId, defaultMaxWatchTimeMultiplier, createdAt, updatedAt)
SELECT 
  'teacher-' || userId || '-' || academyId,
  userId,
  academyId,
  2.0,
  createdAt,
  updatedAt
FROM AcademyMembership
WHERE status = 'APPROVED'
AND userId IN (SELECT id FROM User WHERE role = 'TEACHER');

-- Step 3: Add teacherId column to Class table
ALTER TABLE Class ADD COLUMN teacherId TEXT;

-- Step 4: Update Class table - link classes to teachers through academy
-- For each class, find a teacher from that academy (prioritize existing if any class had implicit teacher)
UPDATE Class
SET teacherId = (
  SELECT userId 
  FROM Teacher t 
  WHERE t.academyId = Class.academyId 
  LIMIT 1
);

-- Step 5: Remove redundant columns from Academy
-- SQLite doesn't support DROP COLUMN, so we need to recreate the table
CREATE TABLE Academy_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Copy data
INSERT INTO Academy_new (id, name, createdAt, updatedAt)
SELECT id, name, createdAt, updatedAt FROM Academy;

-- Drop old table and rename new one
DROP TABLE Academy;
ALTER TABLE Academy_new RENAME TO Academy;

-- Step 6: Remove defaultMaxWatchTimeMultiplier from Class
CREATE TABLE Class_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  academyId TEXT NOT NULL,
  teacherId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (academyId) REFERENCES Academy(id) ON DELETE CASCADE,
  FOREIGN KEY (teacherId) REFERENCES Teacher(userId) ON DELETE SET NULL
);

-- Copy data
INSERT INTO Class_new (id, name, slug, description, academyId, teacherId, createdAt, updatedAt)
SELECT id, name, slug, description, academyId, teacherId, createdAt, updatedAt FROM Class;

-- Drop old table and rename new one
DROP TABLE Class;
ALTER TABLE Class_new RENAME TO Class;

-- Step 7: Drop AcademyMembership table (students don't need membership, only class enrollment)
DROP TABLE AcademyMembership;

-- Step 8: Update ClassEnrollment to use userId instead of studentId for clarity
CREATE TABLE ClassEnrollment_new (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  userId TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  enrolledAt TEXT NOT NULL,
  approvedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(classId, userId)
);

-- Copy data
INSERT INTO ClassEnrollment_new (id, classId, userId, status, enrolledAt, approvedAt, createdAt, updatedAt)
SELECT id, classId, studentId, status, enrolledAt, approvedAt, createdAt, updatedAt FROM ClassEnrollment;

-- Drop old table and rename new one
DROP TABLE ClassEnrollment;
ALTER TABLE ClassEnrollment_new RENAME TO ClassEnrollment;
