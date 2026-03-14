-- Add payment status column to Academy table
ALTER TABLE Academy ADD COLUMN paymentStatus TEXT DEFAULT 'NOT PAID';

-- Set existing academies to NOT PAID
UPDATE Academy SET paymentStatus = 'NOT PAID' WHERE paymentStatus IS NULL;
