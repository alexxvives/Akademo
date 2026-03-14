-- Remove unused Zoom registrant cache columns from ClassEnrollment
-- These were added in 0080 for a registrant-based access control approach that was reverted.
ALTER TABLE ClassEnrollment DROP COLUMN zoomRegistrantId;
ALTER TABLE ClassEnrollment DROP COLUMN zoomJoinUrl;
ALTER TABLE ClassEnrollment DROP COLUMN zoomMeetingId;
