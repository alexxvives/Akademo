-- Migration: Add Topics (Temas) for organizing lessons within a class
-- Created: January 2026

-- Create Topic table
CREATE TABLE IF NOT EXISTS Topic (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  classId TEXT NOT NULL,
  orderIndex INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE
);

-- Add topicId column to Lesson table (nullable - lessons without topic go to "Sin tema")
ALTER TABLE Lesson ADD COLUMN topicId TEXT REFERENCES Topic(id) ON DELETE SET NULL;

-- Create index for faster topic queries
CREATE INDEX IF NOT EXISTS idx_topic_classId ON Topic(classId);
CREATE INDEX IF NOT EXISTS idx_lesson_topicId ON Lesson(topicId);
