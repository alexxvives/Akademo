-- Add VerificationCode table for email verification
-- Stores verification codes sent to users during registration
-- Replaces in-memory Map to support Cloudflare Workers stateless architecture

CREATE TABLE IF NOT EXISTS VerificationCode (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_verification_expires ON VerificationCode(expiresAt);
