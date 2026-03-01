-- Migration 0085: Drop Notification table
-- The Notification table was backend-only dead code with zero frontend consumers.
-- The student live pulsating indicator uses LiveStream.status = 'LIVE' directly.
DROP TABLE IF EXISTS Notification;
