-- Add attempts column to VerificationCode table for brute-force protection
-- After 5 failed attempts, the code is invalidated
ALTER TABLE VerificationCode ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
