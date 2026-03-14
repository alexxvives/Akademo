-- Add payment fields to ClassEnrollment table
-- This enables students to pay before accessing class content

-- Add payment status column
-- PENDING = enrollment created, no payment yet
-- CASH_PENDING = student claims cash payment, waiting for academy approval
-- PAID = payment confirmed (either Stripe or cash approved)
ALTER TABLE ClassEnrollment ADD COLUMN paymentStatus TEXT DEFAULT 'PENDING';

-- Add payment method column (cash, stripe, bizum)
ALTER TABLE ClassEnrollment ADD COLUMN paymentMethod TEXT DEFAULT NULL;

-- Add payment ID reference (links to Payment.id for Stripe/Bizum)
ALTER TABLE ClassEnrollment ADD COLUMN paymentId TEXT DEFAULT NULL;

-- Add payment amount column (class price)
ALTER TABLE ClassEnrollment ADD COLUMN paymentAmount REAL DEFAULT 0;

-- Add price field to Class table so academies can set class prices
ALTER TABLE Class ADD COLUMN price REAL DEFAULT 0;

-- Add currency field (default EUR for Spain)
ALTER TABLE Class ADD COLUMN currency TEXT DEFAULT 'EUR';

-- Add Stripe Connect account ID to Academy (for direct payments)
ALTER TABLE Academy ADD COLUMN stripeAccountId TEXT DEFAULT NULL;

-- Update existing enrollments to PAID (grandfather clause for existing students)
UPDATE ClassEnrollment SET paymentStatus = 'PAID' WHERE paymentStatus IS NULL OR paymentStatus = 'PENDING';
