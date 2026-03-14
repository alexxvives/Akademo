-- Migration: Support multiple submission versions per student
-- Allow students to resubmit assignments, with teachers seeing all versions

-- Step 1: Create new table without UNIQUE constraint
CREATE TABLE IF NOT EXISTS AssignmentSubmission_new (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  uploadId TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1, -- Track submission version (1, 2, 3, etc.)
  score REAL,
  feedback TEXT,
  submittedAt TEXT NOT NULL DEFAULT (datetime('now')),
  gradedAt TEXT,
  gradedBy TEXT,
  downloadedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assignmentId) REFERENCES Assignment(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadId) REFERENCES Upload(id) ON DELETE CASCADE,
  FOREIGN KEY (gradedBy) REFERENCES User(id) ON DELETE SET NULL
);

-- Step 2: Copy existing data
INSERT INTO AssignmentSubmission_new (
  id, assignmentId, studentId, uploadId, version, score, feedback,
  submittedAt, gradedAt, gradedBy, downloadedAt, createdAt, updatedAt
)
SELECT 
  id, assignmentId, studentId, uploadId, 1, score, feedback,
  submittedAt, gradedAt, gradedBy, downloadedAt, createdAt, updatedAt
FROM AssignmentSubmission;

-- Step 3: Drop old table
DROP TABLE AssignmentSubmission;

-- Step 4: Rename new table
ALTER TABLE AssignmentSubmission_new RENAME TO AssignmentSubmission;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_submission_assignmentId ON AssignmentSubmission(assignmentId);
CREATE INDEX IF NOT EXISTS idx_submission_studentId ON AssignmentSubmission(studentId);
CREATE INDEX IF NOT EXISTS idx_submission_submittedAt ON AssignmentSubmission(submittedAt);
CREATE INDEX IF NOT EXISTS idx_submission_gradedAt ON AssignmentSubmission(gradedAt);
CREATE INDEX IF NOT EXISTS idx_submission_version ON AssignmentSubmission(assignmentId, studentId, version);
