-- Notification table for live class alerts
CREATE TABLE IF NOT EXISTS Notification (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'live_class', -- 'live_class', 'new_video', 'announcement'
  title TEXT NOT NULL,
  message TEXT,
  data TEXT, -- JSON data (classId, liveStreamId, zoomLink, etc.)
  isRead INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_user ON Notification(userId);
CREATE INDEX IF NOT EXISTS idx_notification_unread ON Notification(userId, isRead);
