-- Create ZoomAccount table for academies to connect their own Zoom accounts
CREATE TABLE IF NOT EXISTS ZoomAccount (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  accountName TEXT NOT NULL,
  accessToken TEXT NOT NULL,
  refreshToken TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  accountId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES Academy(id) ON DELETE CASCADE
);

-- Add zoomAccountId to Class table so each class can use a specific Zoom account
ALTER TABLE Class ADD COLUMN zoomAccountId TEXT REFERENCES ZoomAccount(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX idx_zoom_account_academy ON ZoomAccount(academyId);
CREATE INDEX idx_class_zoom_account ON Class(zoomAccountId);
