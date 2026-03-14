-- Add recording support to DailyTestRoom
ALTER TABLE DailyTestRoom ADD COLUMN recordingId TEXT;
ALTER TABLE DailyTestRoom ADD COLUMN recordingStatus TEXT DEFAULT 'none';
