-- Add stripeSubscriptionId column to ClassEnrollment for recurring payments
ALTER TABLE ClassEnrollment ADD COLUMN stripeSubscriptionId TEXT;
