-- Migration: Remove description column from Video and Document tables
-- Created: 2026-01-03
-- Reason: Description field no longer needed for videos and documents

-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the tables

-- 1. Remove description from Video table
CREATE TABLE Video_new (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  lessonId TEXT NOT NULL,
  uploadId TEXT NOT NULL UNIQUE,
  durationSeconds INTEGER,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lessonId) REFERENCES Lesson(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadId) REFERENCES Upload(id) ON DELETE CASCADE
);

INSERT INTO Video_new (id, title, lessonId, uploadId, durationSeconds, createdAt, updatedAt)
SELECT id, title, lessonId, uploadId, durationSeconds, createdAt, updatedAt
FROM Video;

DROP TABLE Video;
ALTER TABLE Video_new RENAME TO Video;

-- 2. Remove description from Document table
CREATE TABLE Document_new (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  lessonId TEXT NOT NULL,
  uploadId TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lessonId) REFERENCES Lesson(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadId) REFERENCES Upload(id) ON DELETE CASCADE
);

INSERT INTO Document_new (id, title, lessonId, uploadId, createdAt, updatedAt)
SELECT id, title, lessonId, uploadId, createdAt, updatedAt
FROM Document;

DROP TABLE Document;
ALTER TABLE Document_new RENAME TO Document;
