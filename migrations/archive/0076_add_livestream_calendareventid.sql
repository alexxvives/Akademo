-- Link LiveStream records created from calendar events back to their source event
ALTER TABLE LiveStream ADD COLUMN calendarEventId TEXT;
