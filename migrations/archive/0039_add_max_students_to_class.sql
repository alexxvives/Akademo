-- Add maxStudents column to Class table
ALTER TABLE Class ADD COLUMN maxStudents INTEGER DEFAULT NULL;

-- NULL means unlimited students (no limit)
