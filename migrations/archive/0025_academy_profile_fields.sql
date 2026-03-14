-- Migration 0025: Add Academy profile fields and settings
-- Date: 2026-01-22

-- Add fields to Academy table
ALTER TABLE Academy ADD COLUMN address TEXT;
ALTER TABLE Academy ADD COLUMN phone TEXT;
ALTER TABLE Academy ADD COLUMN email TEXT;
ALTER TABLE Academy ADD COLUMN feedbackAnonymous INTEGER DEFAULT 0;
ALTER TABLE Academy ADD COLUMN defaultWatermarkIntervalMins INTEGER DEFAULT 5;
ALTER TABLE Academy ADD COLUMN defaultMaxWatchTimeMultiplier REAL DEFAULT 2.0;

-- Add phone field to User table (for academy owners)
ALTER TABLE User ADD COLUMN phone TEXT;
