-- migrations/0027_quiz_feedback_mode.sql
-- Adds feedbackMode to Assignment: 'at_end' (default) or 'after_each'
ALTER TABLE Assignment ADD COLUMN feedbackMode TEXT NOT NULL DEFAULT 'at_end';
