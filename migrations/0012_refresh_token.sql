-- Add refresh token support to DeviceSession for silent token refresh (SOTA auth)
-- Access tokens become short-lived (15 min); refresh tokens (30 days) silently mint new ones.
ALTER TABLE DeviceSession ADD COLUMN refreshTokenHash TEXT DEFAULT NULL;
ALTER TABLE DeviceSession ADD COLUMN refreshTokenExpiresAt TEXT DEFAULT NULL;
