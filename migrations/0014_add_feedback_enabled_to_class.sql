-- Migration: Add feedbackEnabled flag to Class table
-- Created: January 2026

ALTER TABLE Class ADD COLUMN feedbackEnabled BOOLEAN NOT NULL DEFAULT 1;
