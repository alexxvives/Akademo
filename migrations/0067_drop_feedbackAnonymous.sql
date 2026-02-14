-- Drop unused feedbackAnonymous column from Academy table
-- This column was never used by application code
ALTER TABLE Academy DROP COLUMN feedbackAnonymous;
