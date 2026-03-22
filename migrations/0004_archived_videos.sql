-- Archived videos stored in Bunny Storage (not Stream)
-- Used for videos that don't need streaming/adaptive bitrate
CREATE TABLE IF NOT EXISTS ArchivedVideo (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  title TEXT NOT NULL,
  fileName TEXT NOT NULL,
  fileSize INTEGER,
  mimeType TEXT DEFAULT 'video/mp4',
  storageKey TEXT NOT NULL,
  durationSeconds INTEGER,
  uploadedById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES Academy(id),
  FOREIGN KEY (uploadedById) REFERENCES User(id)
);
CREATE INDEX IF NOT EXISTS idx_archived_video_academy ON ArchivedVideo(academyId);
