-- Migration 0019: Add topicId to Assignment
-- Allows quizzes/exercises to be associated with a specific topic

ALTER TABLE Assignment ADD COLUMN topicId TEXT REFERENCES Topic(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assignment_topicid ON Assignment(topicId);
