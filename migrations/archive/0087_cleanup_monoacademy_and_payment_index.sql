-- Remove monoacademy flag columns (feature removed, project not yet deployed)
ALTER TABLE Academy DROP COLUMN monoacademy;
ALTER TABLE Teacher DROP COLUMN monoacademy;

-- Prevent duplicate PENDING Payment rows for the same (payerId, classId) pair.
-- Without this, two simultaneous requests (e.g. double-click, race between tabs,
-- or concurrent autoCreate calls) can both pass the SELECT ... WHERE status='PENDING'
-- check before either INSERT commits, resulting in two PENDING rows that confuse
-- the payment flow until the next page load.
-- SQLite partial unique index: only enforces uniqueness when status = 'PENDING'.
-- PAID, COMPLETED, REJECTED rows are unaffected (payment history is preserved).
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_pending_payer_class
  ON Payment(payerId, classId)
  WHERE status = 'PENDING';
