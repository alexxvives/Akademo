-- Migration: Add Bunny Stream support for videos
-- Videos will use Bunny Stream (bunnyGuid), Documents stay on R2 (storagePath)

-- Add bunnyGuid column to Upload table
ALTER TABLE Upload ADD COLUMN bunnyGuid TEXT;

-- Add bunnyStatus column to track transcoding status (0-5)
ALTER TABLE Upload ADD COLUMN bunnyStatus INTEGER DEFAULT NULL;

-- Create index for bunnyGuid lookups
CREATE INDEX IF NOT EXISTS idx_upload_bunny_guid ON Upload(bunnyGuid);

-- Update storageType to allow 'bunny' in addition to 'r2'
-- storageType: 'r2' for documents, 'bunny' for videos
