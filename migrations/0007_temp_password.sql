-- Add tempPassword column to User table for deferred welcome email sending
-- Stores the plain-text temp password until the academy sends the welcome email
-- Cleared once the welcome email is sent
ALTER TABLE User ADD COLUMN tempPassword TEXT;
