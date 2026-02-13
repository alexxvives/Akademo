-- Drop unused columns from ClassEnrollment table
-- These columns were never used in production:
-- - nextPaymentDue: Billing tracking is handled by Payment table
-- - stripeSubscriptionId: Stripe Connect not implemented

-- Note: SQLite doesn't support DROP COLUMN directly in older versions
-- Need to recreate the table without these columns

-- Create new table structure
CREATE TABLE ClassEnrollment_new (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  userId TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  enrolledAt TEXT NOT NULL,
  approvedAt TEXT,
  approverId TEXT,
  paymentFrequency TEXT NOT NULL DEFAULT 'ONE_TIME',
  documentSigned INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE(classId, userId)
);

-- Copy data from old table
INSERT INTO ClassEnrollment_new (
  id, classId, userId, status, enrolledAt, approvedAt, approverId, 
  paymentFrequency, documentSigned, createdAt, updatedAt
)
SELECT 
  id, classId, userId, status, enrolledAt, approvedAt, approverId,
  paymentFrequency, documentSigned, createdAt, updatedAt
FROM ClassEnrollment;

-- Drop old table
DROP TABLE ClassEnrollment;

-- Rename new table
ALTER TABLE ClassEnrollment_new RENAME TO ClassEnrollment;

-- Recreate indexes if any
CREATE INDEX IF NOT EXISTS idx_classenrollment_classid ON ClassEnrollment(classId);
CREATE INDEX IF NOT EXISTS idx_classenrollment_userid ON ClassEnrollment(userId);
CREATE INDEX IF NOT EXISTS idx_classenrollment_status ON ClassEnrollment(status);
