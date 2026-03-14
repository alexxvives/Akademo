-- Migration: Calendar Scheduled Events
-- Stores manually scheduled streams and physical classes on the calendar

CREATE TABLE IF NOT EXISTS CalendarScheduledEvent (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  createdBy TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('physicalClass', 'scheduledStream')),
  eventDate TEXT NOT NULL,
  notes TEXT,
  classId TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES Academy(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_event_academy ON CalendarScheduledEvent(academyId);
CREATE INDEX IF NOT EXISTS idx_calendar_event_date ON CalendarScheduledEvent(eventDate);
