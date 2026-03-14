-- Migration: Add payment method settings and flexible class pricing

-- Add payment method settings to Academy table
ALTER TABLE Academy ADD COLUMN allowedPaymentMethods TEXT DEFAULT '["stripe","cash","bizum"]';

-- Add flexible pricing to Class table
ALTER TABLE Class ADD COLUMN monthlyPrice REAL DEFAULT NULL;
ALTER TABLE Class ADD COLUMN oneTimePrice REAL DEFAULT NULL;
ALTER TABLE Class ADD COLUMN allowMonthly INTEGER DEFAULT 0;
ALTER TABLE Class ADD COLUMN allowOneTime INTEGER DEFAULT 1;

-- Migrate existing prices: if price exists, set as oneTimePrice and enable it
UPDATE Class SET oneTimePrice = price, allowOneTime = 1 WHERE price IS NOT NULL AND price > 0;

-- Note: Keep existing 'price' column for backward compatibility during transition
