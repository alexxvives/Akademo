-- Migration 0041: Move feedbackEnabled from Class to Academy level
-- Feedback should be academy-wide, not per-class

-- Add feedbackEnabled column to Academy table
ALTER TABLE Academy ADD COLUMN feedbackEnabled INTEGER DEFAULT 1;

-- Update Academy feedbackEnabled based on existing Class settings
-- If any class in an academy has feedback enabled, enable it for the academy
UPDATE Academy
SET feedbackEnabled = (
  SELECT MAX(feedbackEnabled)
  FROM Class
  WHERE Class.academyId = Academy.id
);

-- Drop feedbackEnabled from Class table (no longer needed)
ALTER TABLE Class DROP COLUMN feedbackEnabled;
