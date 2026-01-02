-- Add Zoom participant tracking columns to LiveStream table
ALTER TABLE LiveStream ADD COLUMN participantCount INTEGER;
ALTER TABLE LiveStream ADD COLUMN participantsFetchedAt TEXT;
ALTER TABLE LiveStream ADD COLUMN participantsData TEXT; -- JSON with participant details
