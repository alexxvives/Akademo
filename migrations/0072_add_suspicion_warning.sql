-- Add suspicionWarning flag to User table
-- Set it manually by academy/admin; student sees warning on next login
ALTER TABLE User ADD COLUMN suspicionWarning INTEGER DEFAULT 0;
