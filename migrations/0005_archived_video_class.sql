-- Add classId and className to ArchivedVideo for asignatura filtering and display
ALTER TABLE ArchivedVideo ADD COLUMN classId TEXT;
ALTER TABLE ArchivedVideo ADD COLUMN className TEXT;
CREATE INDEX IF NOT EXISTS idx_archived_video_class ON ArchivedVideo(classId);
