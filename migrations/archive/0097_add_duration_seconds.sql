-- Add durationSeconds column to LiveStream to store stream duration when it ends
ALTER TABLE LiveStream ADD COLUMN durationSeconds INTEGER;
