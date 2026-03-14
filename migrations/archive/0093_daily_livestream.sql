-- Migration 0093: Add Daily.co room fields to LiveStream
-- Enables embedded Daily.co video sessions in place of Zoom

ALTER TABLE LiveStream ADD COLUMN dailyRoomName TEXT;
ALTER TABLE LiveStream ADD COLUMN dailyRoomUrl TEXT;
