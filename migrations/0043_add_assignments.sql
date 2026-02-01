-- Create Assignment table for teachers to create assignments
CREATE TABLE IF NOT EXISTS Assignment (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  teacherId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  dueDate TEXT, -- ISO 8601 datetime
  maxScore REAL DEFAULT 100, -- Maximum score for grading
  uploadId TEXT, -- Optional: if teacher attaches a file (worksheet, instructions)
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE,
  FOREIGN KEY (teacherId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadId) REFERENCES Upload(id) ON DELETE SET NULL
);

-- Create AssignmentSubmission table for student submissions
CREATE TABLE IF NOT EXISTS AssignmentSubmission (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  uploadId TEXT NOT NULL, -- Student's submitted file
  score REAL, -- Grade (0 to maxScore)
  feedback TEXT, -- Teacher's feedback/comments
  submittedAt TEXT NOT NULL DEFAULT (datetime('now')),
  gradedAt TEXT, -- When teacher graded it
  gradedBy TEXT, -- Teacher who graded (could be different from assignment creator)
  downloadedAt TEXT, -- When teacher downloaded this submission (for bulk download tracking)
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assignmentId) REFERENCES Assignment(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadId) REFERENCES Upload(id) ON DELETE CASCADE,
  FOREIGN KEY (gradedBy) REFERENCES User(id) ON DELETE SET NULL,
  UNIQUE(assignmentId, studentId) -- One submission per student per assignment
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assignment_classId ON Assignment(classId);
CREATE INDEX IF NOT EXISTS idx_assignment_teacherId ON Assignment(teacherId);
CREATE INDEX IF NOT EXISTS idx_assignment_dueDate ON Assignment(dueDate);

CREATE INDEX IF NOT EXISTS idx_submission_assignmentId ON AssignmentSubmission(assignmentId);
CREATE INDEX IF NOT EXISTS idx_submission_studentId ON AssignmentSubmission(studentId);
CREATE INDEX IF NOT EXISTS idx_submission_submittedAt ON AssignmentSubmission(submittedAt);
CREATE INDEX IF NOT EXISTS idx_submission_gradedAt ON AssignmentSubmission(gradedAt);
