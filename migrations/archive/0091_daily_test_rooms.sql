-- Daily.co test rooms table
-- Used for prototyping/testing Daily.co integration before full migration from Zoom
CREATE TABLE IF NOT EXISTS DailyTestRoom (
  id TEXT PRIMARY KEY,
  roomName TEXT NOT NULL,
  roomUrl TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt TEXT NOT NULL
);
