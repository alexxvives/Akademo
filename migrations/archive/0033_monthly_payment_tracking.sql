-- Migration: Add monthly payment tracking for recurring cash/bizum enrollments

-- Add payment frequency tracking
ALTER TABLE ClassEnrollment ADD COLUMN paymentFrequency TEXT DEFAULT 'ONE_TIME'; -- ONE_TIME or MONTHLY

-- Add next payment due date for monthly recurring payments
ALTER TABLE ClassEnrollment ADD COLUMN nextPaymentDue TEXT DEFAULT NULL;

-- Set initial values for existing monthly enrollments
-- If student enrolled with monthly pricing, set next payment to 1 month from enrollment date
UPDATE ClassEnrollment 
SET paymentFrequency = 'MONTHLY',
    nextPaymentDue = date(enrolledAt, '+1 month')
WHERE paymentMethod IN ('cash', 'bizum')
AND classId IN (SELECT id FROM Class WHERE allowMonthly = 1)
AND paymentStatus = 'PAID';

-- For Stripe subscriptions, also mark as MONTHLY
UPDATE ClassEnrollment 
SET paymentFrequency = 'MONTHLY'
WHERE paymentMethod = 'stripe'
AND classId IN (SELECT id FROM Class WHERE allowMonthly = 1);
