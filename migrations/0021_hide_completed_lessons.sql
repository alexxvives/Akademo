-- Migration: Add hideCompletedLessons toggle to Academy
-- When enabled, lessons where the student has watched all videos (BLOCKED) are hidden automatically.
ALTER TABLE Academy ADD COLUMN hideCompletedLessons INTEGER DEFAULT 0;
