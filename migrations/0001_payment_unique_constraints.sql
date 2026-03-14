-- Add unique indexes on Payment to prevent duplicate records from webhook race conditions
-- stripePaymentId is used as idempotency key for invoice.payment_succeeded
-- stripeCheckoutSessionId is used as idempotency key for checkout.session.completed

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_stripe_payment_id
  ON Payment(stripePaymentId) WHERE stripePaymentId IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_stripe_checkout_session_id
  ON Payment(stripeCheckoutSessionId) WHERE stripeCheckoutSessionId IS NOT NULL;
