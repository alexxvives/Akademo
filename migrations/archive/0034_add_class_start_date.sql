-- Add startDate to Class table for fixed monthly payment scheduling
-- This enables:
-- 1. Fixed recurring payment dates (not rolling 30-day)
-- 2. Prorated first month payments
-- 3. Predictable billing cycles

ALTER TABLE Class ADD COLUMN startDate TEXT DEFAULT NULL;

-- Update existing classes to have a default start date (their creation date)
UPDATE Class SET startDate = createdAt WHERE startDate IS NULL;
