-- Set all existing classes to 10 EUR monthly price
UPDATE Class 
SET price = 10.00, currency = 'EUR'
WHERE price IS NULL OR price = 0;
