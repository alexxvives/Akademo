-- Add solutionUploadId to Assignment table for teacher solution sheets
ALTER TABLE Assignment ADD COLUMN solutionUploadId TEXT;
