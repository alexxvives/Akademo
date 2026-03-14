-- Migration 0040: Clean up deprecated Class pricing columns
-- Remove redundant price/currency columns and allowMonthly/allowOneTime flags
-- Now we only use monthlyPrice and oneTimePrice (NULL = not available)

-- Drop deprecated columns
ALTER TABLE Class DROP COLUMN price;
ALTER TABLE Class DROP COLUMN currency;
ALTER TABLE Class DROP COLUMN allowMonthly;
ALTER TABLE Class DROP COLUMN allowOneTime;
