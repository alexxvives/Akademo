-- Prevent multiple submissions per student per assignment (current logic replaces on resubmit)
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignment_submission_unique ON AssignmentSubmission(assignmentId, studentId);
