-- Migration: Add quiz support to assignments
-- An assignment can be type='file' (default) or type='quiz'
-- Quiz questions and attempts are stored in separate tables

-- Add type column to Assignment (default 'file' for backwards compatibility)
ALTER TABLE Assignment ADD COLUMN type TEXT NOT NULL DEFAULT 'file';

-- Quiz questions linked to an assignment
CREATE TABLE IF NOT EXISTS QuizQuestion (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  questionText TEXT NOT NULL,
  questionOrder INTEGER NOT NULL DEFAULT 0,
  options TEXT NOT NULL DEFAULT '[]',     -- JSON array of {id, text} options
  correctOptionId TEXT NOT NULL,          -- ID of the correct option
  explanation TEXT,                        -- Optional explanation shown after answering
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assignmentId) REFERENCES Assignment(id) ON DELETE CASCADE
);

-- Quiz attempts - one per student per assignment (single attempt)
CREATE TABLE IF NOT EXISTS QuizAttempt (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  score REAL,                             -- Auto-calculated: correct / total * maxScore
  totalQuestions INTEGER NOT NULL DEFAULT 0,
  correctAnswers INTEGER NOT NULL DEFAULT 0,
  answers TEXT NOT NULL DEFAULT '[]',     -- JSON array of {questionId, selectedOptionId, correct}
  completedAt TEXT NOT NULL DEFAULT (datetime('now')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assignmentId) REFERENCES Assignment(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE
);

-- Ensure one attempt per student per quiz
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_attempt_unique ON QuizAttempt(assignmentId, studentId);
