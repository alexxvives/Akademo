-- Add allowMultipleTeachers column to Academy table
-- Default value is 0 (false) - only one teacher per class
ALTER TABLE Academy ADD COLUMN allowMultipleTeachers INTEGER DEFAULT 0;
