-- Add tutorialSeenAt column to Teacher table
-- Tracks when the onboarding tutorial was dismissed, enabling cross-device sync
ALTER TABLE Teacher ADD COLUMN tutorialSeenAt TEXT;
