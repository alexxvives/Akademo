-- Add currentCount (live running count) to LiveStream
-- participantCount remains as the peak-ever counter
-- participantsData is no longer used (dropped in favour of simple counter)
ALTER TABLE LiveStream ADD COLUMN currentCount INTEGER DEFAULT 0;
ALTER TABLE LiveStream DROP COLUMN participantsData;
