-- Migration 0083: Add suspicious completion flag to VideoPlayState
-- Tracks whether a student's last video completion showed screen-recording patterns
-- (watched to end + no pause + no tab switch + real-time duration)

ALTER TABLE VideoPlayState ADD COLUMN suspiciousCompletion INTEGER DEFAULT 0;
ALTER TABLE VideoPlayState ADD COLUMN completedAt TEXT;
