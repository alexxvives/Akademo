-- Add Zoom registrant cache columns to ClassEnrollment
-- These store the per-session registrant data so students get a unique join URL
-- that works even when their Zoom account email is hidden (external/Google Zoom accounts).
-- zoomMeetingId: the meeting this registrant URL was created for (to detect stale cache)
-- zoomRegistrantId: Zoom's registrant_id, used in waiting-room webhook to identify the student
-- zoomJoinUrl: the personal join URL (contains Zoom's tk= token)

ALTER TABLE ClassEnrollment ADD COLUMN zoomRegistrantId TEXT;
ALTER TABLE ClassEnrollment ADD COLUMN zoomJoinUrl TEXT;
ALTER TABLE ClassEnrollment ADD COLUMN zoomMeetingId TEXT;
