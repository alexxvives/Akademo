-- Add status column to VideoPlayState table
-- This column tracks if a student's access to a video is ACTIVE or BLOCKED

-- Add the status column with default 'ACTIVE'
ALTER TABLE VideoPlayState ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE';

-- Update any existing records where watch time exceeded the limit to BLOCKED
-- This query will set status to BLOCKED for records where totalWatchTimeSeconds >= (video.durationSeconds * video.maxWatchTimeMultiplier)
UPDATE VideoPlayState
SET status = 'BLOCKED'
WHERE id IN (
  SELECT vps.id
  FROM VideoPlayState vps
  JOIN Video v ON vps.videoId = v.id
  WHERE vps.totalWatchTimeSeconds >= (v.durationSeconds * v.maxWatchTimeMultiplier)
    AND v.durationSeconds > 0
);
