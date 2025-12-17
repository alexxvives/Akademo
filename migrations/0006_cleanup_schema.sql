-- Schema cleanup migration
-- Remove redundant columns and unused tables

-- 1. Remove storageType from Upload table (always 'r2')
-- Note: SQLite doesn't support DROP COLUMN in older versions
-- We'll create a new table without the column and migrate data

-- Create new Upload table without storageType
CREATE TABLE IF NOT EXISTS Upload_new (
  id TEXT PRIMARY KEY NOT NULL,
  fileName TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  mimeType TEXT NOT NULL,
  storagePath TEXT NOT NULL,
  uploadedById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copy data from old table to new table
INSERT INTO Upload_new (id, fileName, fileSize, mimeType, storagePath, uploadedById, createdAt)
SELECT id, fileName, fileSize, mimeType, storagePath, uploadedById, createdAt
FROM Upload;

-- Drop old table
DROP TABLE Upload;

-- Rename new table to Upload
ALTER TABLE Upload_new RENAME TO Upload;

-- 2. Drop PlatformSettings table (unused - defaults set at Academy/Class/Lesson levels)
DROP TABLE IF EXISTS PlatformSettings;

-- 3. Drop BillingConfig table (not yet implemented)
DROP TABLE IF EXISTS BillingConfig;

-- 4. Recreate indexes that were lost during table recreation
CREATE INDEX IF NOT EXISTS idx_upload_uploader ON Upload(uploadedById);
