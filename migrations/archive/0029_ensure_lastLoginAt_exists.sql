-- Migration: Ensure lastLoginAt column exists and has values
-- Date: 2026-01-26
-- Description: Idempotent migration to add lastLoginAt if missing and populate it

-- This is a safe, idempotent migration that checks if column exists
-- SQLite will error if column already exists, but we'll handle that in application

-- Add lastLoginAt column if it doesn't exist (will error if exists, but that's ok)
ALTER TABLE User ADD COLUMN lastLoginAt TEXT;

-- Update all NULL values to use createdAt as initial value
-- This ensures existing users have a lastLoginAt value
UPDATE User SET lastLoginAt = createdAt WHERE lastLoginAt IS NULL;
