-- Add liveStreamId to ArchivedVideo so stream recordings can be restored
ALTER TABLE ArchivedVideo ADD COLUMN liveStreamId TEXT REFERENCES LiveStream(id) ON DELETE SET NULL;
