-- Remove unused status column from Academy table
-- This column was replaced by paymentStatus and is no longer used anywhere

-- Note: SQLite doesn't support DROP COLUMN directly in older versions
-- We'll create a new table without the column and copy data over

-- Create new Academy table without status column
CREATE TABLE Academy_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  description TEXT,
  ownerId TEXT,
  monoacademy INTEGER DEFAULT 0,
  paymentStatus TEXT DEFAULT 'NOT PAID',
  stripeAccountId TEXT DEFAULT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  feedbackAnonymous INTEGER DEFAULT 0,
  defaultWatermarkIntervalMins INTEGER DEFAULT 5,
  defaultMaxWatchTimeMultiplier REAL DEFAULT 2.0
);

-- Copy data from old table (excluding status column)
INSERT INTO Academy_new (
  id, name, createdAt, updatedAt, description, ownerId, monoacademy,
  paymentStatus, stripeAccountId, address, phone, email,
  feedbackAnonymous, defaultWatermarkIntervalMins, defaultMaxWatchTimeMultiplier
)
SELECT 
  id, name, createdAt, updatedAt, description, ownerId, monoacademy,
  paymentStatus, stripeAccountId, address, phone, email,
  feedbackAnonymous, defaultWatermarkIntervalMins, defaultMaxWatchTimeMultiplier
FROM Academy;

-- Drop old table
DROP TABLE Academy;

-- Rename new table to original name
ALTER TABLE Academy_new RENAME TO Academy;
