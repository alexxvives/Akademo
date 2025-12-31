-- LiveStream table for live streaming functionality
CREATE TABLE IF NOT EXISTS LiveStream (
    id TEXT PRIMARY KEY,
    classId TEXT NOT NULL,
    teacherId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    bunnyStreamId TEXT,
    rtmpUrl TEXT,
    rtmpKey TEXT,
    hlsUrl TEXT,
    status TEXT DEFAULT 'scheduled', -- scheduled, live, ended
    scheduledFor TEXT,
    startedAt TEXT,
    endedAt TEXT,
    recordingUrl TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE,
    FOREIGN KEY (teacherId) REFERENCES User(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_livestream_class ON LiveStream(classId);
CREATE INDEX IF NOT EXISTS idx_livestream_teacher ON LiveStream(teacherId);
CREATE INDEX IF NOT EXISTS idx_livestream_status ON LiveStream(status);
