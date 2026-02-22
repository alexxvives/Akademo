-- LoginEvent table for impossible travel detection
CREATE TABLE IF NOT EXISTS LoginEvent (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  ipAddress TEXT,
  country TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Suspicion counter on User
ALTER TABLE User ADD COLUMN suspicionCount INTEGER DEFAULT 0;
