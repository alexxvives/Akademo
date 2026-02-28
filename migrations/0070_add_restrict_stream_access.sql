-- Migration 0070: Add restrictStreamAccess flag to Academy table
-- When enabled, only enrolled students (with a registered email) can join Zoom streams

ALTER TABLE Academy ADD COLUMN restrictStreamAccess INTEGER DEFAULT 0;
