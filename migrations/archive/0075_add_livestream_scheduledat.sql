-- Add scheduledAt column to LiveStream for calendar-linked streams
ALTER TABLE LiveStream ADD COLUMN scheduledAt TEXT;
