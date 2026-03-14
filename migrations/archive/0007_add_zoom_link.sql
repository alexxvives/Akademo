-- Add Zoom columns to LiveStream table
ALTER TABLE LiveStream ADD COLUMN zoomLink TEXT;
ALTER TABLE LiveStream ADD COLUMN zoomMeetingId TEXT;
ALTER TABLE LiveStream ADD COLUMN zoomStartUrl TEXT;
