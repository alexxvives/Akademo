-- Add nextPaymentDue to Payment table for recurring payments
-- This tracks when the next payment is due for monthly subscriptions

ALTER TABLE Payment ADD COLUMN nextPaymentDue TEXT DEFAULT NULL;

-- Add billing cycle tracking
ALTER TABLE Payment ADD COLUMN billingCycleStart TEXT DEFAULT NULL;
ALTER TABLE Payment ADD COLUMN billingCycleEnd TEXT DEFAULT NULL;
