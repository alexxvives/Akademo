-- Add startTime column to CalendarScheduledEvent for storing event time
ALTER TABLE CalendarScheduledEvent ADD COLUMN startTime TEXT;

-- Also ensure location column exists (may already exist)
-- If this fails, it means the column already exists — safe to ignore
-- ALTER TABLE CalendarScheduledEvent ADD COLUMN location TEXT;
