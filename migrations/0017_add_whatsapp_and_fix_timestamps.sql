-- Add WhatsApp group link to Class table
ALTER TABLE Class ADD COLUMN whatsappGroupLink TEXT;

-- Fix Academy table to ensure createdAt and updatedAt have defaults
-- (SQLite doesn't support ALTER COLUMN, so we document the expected behavior)
-- All INSERT statements must include datetime('now') for these fields
