-- Grant extra video watch time to individual students within a specific time window.
-- extraSeconds: additional seconds beyond the normal max.
-- validFrom / validUntil (ISO 8601): the window during which this extension is active.

CREATE TABLE IF NOT EXISTS VideoPlayExtension (
  id TEXT PRIMARY KEY,
  videoId TEXT NOT NULL REFERENCES Video(id) ON DELETE CASCADE,
  studentId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  extraSeconds INTEGER NOT NULL,
  validFrom TEXT NOT NULL,
  validUntil TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vpe_video_student ON VideoPlayExtension(videoId, studentId);
