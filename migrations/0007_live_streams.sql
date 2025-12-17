-- Live Streams table for Daily.co integration
CREATE TABLE IF NOT EXISTS LiveStream (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL REFERENCES Class(id) ON DELETE CASCADE,
  teacherId TEXT NOT NULL REFERENCES User(id),
  roomName TEXT NOT NULL UNIQUE,
  roomUrl TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, LIVE, ENDED
  title TEXT,
  startedAt DATETIME,
  endedAt DATETIME,
  recordingId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for finding active streams by class
CREATE INDEX idx_livestream_class_status ON LiveStream(classId, status);

-- Index for finding streams by teacher
CREATE INDEX idx_livestream_teacher ON LiveStream(teacherId);
