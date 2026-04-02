-- Add cuotas column to Class table to store the number of monthly installments.
-- This is used for billing cap (max cycles) and for display purposes.
ALTER TABLE Class ADD COLUMN cuotas INTEGER DEFAULT NULL;
