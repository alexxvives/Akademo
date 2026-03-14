-- Migration for Lessons system
-- Created: 2025-12-15

-- Lesson table
CREATE TABLE IF NOT EXISTS Lesson (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  classId TEXT NOT NULL,
  maxWatchTimeMultiplier REAL NOT NULL DEFAULT 2.0,
  watermarkIntervalMins INTEGER NOT NULL DEFAULT 5,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE
);

-- Add lessonId to Video table and migrate from classId
ALTER TABLE Video ADD COLUMN lessonId TEXT;

-- Add lessonId to Document table and migrate from classId
ALTER TABLE Document ADD COLUMN lessonId TEXT;

-- Add status and approvedAt to ClassEnrollment
ALTER TABLE ClassEnrollment ADD COLUMN status TEXT NOT NULL DEFAULT 'APPROVED';
ALTER TABLE ClassEnrollment ADD COLUMN approvedAt TEXT;

-- Create indexes for Lesson
CREATE INDEX IF NOT EXISTS idx_lesson_class ON Lesson(classId);
CREATE INDEX IF NOT EXISTS idx_video_lesson ON Video(lessonId);
CREATE INDEX IF NOT EXISTS idx_document_lesson ON Document(lessonId);
CREATE INDEX IF NOT EXISTS idx_enrollment_status ON ClassEnrollment(status);
