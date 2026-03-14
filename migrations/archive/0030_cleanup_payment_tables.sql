-- Phase 3: Clean up redundant denormalized columns from Payment table
-- Remove columns that can be JOINed from User and Academy tables

-- Clean up Payment table (remove denormalized columns)
ALTER TABLE Payment DROP COLUMN payerType;
ALTER TABLE Payment DROP COLUMN payerName;
ALTER TABLE Payment DROP COLUMN payerEmail;
ALTER TABLE Payment DROP COLUMN receiverName;

-- Note: ClassEnrollment payment columns kept for now as transition layer
-- Will be removed in future migration after full Payment table adoption

