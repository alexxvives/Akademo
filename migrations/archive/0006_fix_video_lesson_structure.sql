-- Migration to fix Video and Document tables to use lessonId instead of classId
-- Created: 2025-12-15

-- Create new Video table with lessonId as NOT NULL
CREATE TABLE Video_new (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  lessonId TEXT NOT NULL,
  uploadId TEXT NOT NULL UNIQUE,
  durationSeconds INTEGER,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lessonId) REFERENCES Lesson(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadId) REFERENCES Upload(id) ON DELETE CASCADE
);

-- Copy data from old table (only if lessonId is not null)
INSERT INTO Video_new (id, title, description, lessonId, uploadId, durationSeconds, createdAt, updatedAt)
SELECT id, title, description, lessonId, uploadId, durationSeconds, createdAt, updatedAt
FROM Video
WHERE lessonId IS NOT NULL;

-- Drop old table
DROP TABLE Video;

-- Rename new table
ALTER TABLE Video_new RENAME TO Video;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_video_lesson ON Video(lessonId);
CREATE INDEX IF NOT EXISTS idx_video_upload ON Video(uploadId);

-- Create new Document table with lessonId as NOT NULL
CREATE TABLE Document_new (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  lessonId TEXT NOT NULL,
  uploadId TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lessonId) REFERENCES Lesson(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadId) REFERENCES Upload(id) ON DELETE CASCADE
);

-- Copy data from old table (only if lessonId is not null)
INSERT INTO Document_new (id, title, description, lessonId, uploadId, createdAt, updatedAt)
SELECT id, title, description, lessonId, uploadId, createdAt, updatedAt
FROM Document
WHERE lessonId IS NOT NULL;

-- Drop old table
DROP TABLE Document;

-- Rename new table
ALTER TABLE Document_new RENAME TO Document;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_document_lesson ON Document(lessonId);
CREATE INDEX IF NOT EXISTS idx_document_upload ON Document(uploadId);
