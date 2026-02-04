-- Add JSON column for multiple file attachments
-- This allows storing multiple uploadIds per assignment
ALTER TABLE Assignment ADD COLUMN attachmentIds TEXT DEFAULT '[]'; -- JSON array of uploadId strings

-- Migrate existing single uploadId to array format (if any exist)
-- This will be empty for now since all current uploadIds are null
