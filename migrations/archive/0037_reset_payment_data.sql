-- Reset all payment data for clean testing
-- This migration:
-- 1. Deletes all Payment records
-- 2. Resets all ClassEnrollment payment fields to unpaid state

-- Delete all payments
DELETE FROM Payment;

-- Reset all enrollment payment statuses
UPDATE ClassEnrollment SET
  paymentStatus = 'PENDING',
  paymentMethod = NULL,
  paymentId = NULL,
  paymentAmount = 0,
  stripeSubscriptionId = NULL,
  nextPaymentDue = NULL;

-- Optional: Reset Academy payment status if needed
UPDATE Academy SET
  paymentStatus = 'NOT PAID'
WHERE paymentStatus IS NOT NULL;
