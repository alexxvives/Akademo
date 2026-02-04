-- Create AssignmentAttachment table (like Video/Document for Lesson)
CREATE TABLE IF NOT EXISTS AssignmentAttachment (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  uploadId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assignmentId) REFERENCES Assignment(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadId) REFERENCES Upload(id) ON DELETE CASCADE
);

CREATE INDEX idx_assignment_attachment_assignment ON AssignmentAttachment(assignmentId);
CREATE INDEX idx_assignment_attachment_upload ON AssignmentAttachment(uploadId);

-- Migrate existing data from attachmentIds JSON to AssignmentAttachment table
-- This is safe to run multiple times (INSERT OR IGNORE)
-- Note: This migration will be manual or handled in API for existing records
