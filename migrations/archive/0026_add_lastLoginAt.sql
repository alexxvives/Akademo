-- Add lastLoginAt column to User table for tracking student activity
ALTER TABLE User ADD COLUMN lastLoginAt TEXT;

-- Set initial value for existing users to their createdAt date
UPDATE User SET lastLoginAt = createdAt WHERE lastLoginAt IS NULL;
