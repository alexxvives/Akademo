-- Migration 0018: Add LessonLink table
-- Links attached to a lesson (e.g. external resources, reading material)

CREATE TABLE IF NOT EXISTS LessonLink (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  lessonId TEXT NOT NULL REFERENCES Lesson(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  orderIndex INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lessonlink_lessonid ON LessonLink(lessonId);
