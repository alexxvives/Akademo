-- Prevent duplicate PENDING payments for the same student+class pair.
-- SQLite partial index: only applies to rows WHERE status = 'PENDING'.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_pending_unique
  ON Payment(payerId, classId) WHERE status = 'PENDING';
