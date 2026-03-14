-- Remove payment-related columns from ClassEnrollment
-- All payment logic should use Payment table only

-- Create new ClassEnrollment table without payment columns
CREATE TABLE ClassEnrollment_new (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  userId TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  enrolledAt TEXT NOT NULL,
  approvedAt TEXT,
  documentSigned INTEGER DEFAULT 0,
  paymentFrequency TEXT DEFAULT 'ONE_TIME',
  nextPaymentDue TEXT DEFAULT NULL,
  UNIQUE(classId, userId)
);

-- Copy data (excluding payment columns)
INSERT INTO ClassEnrollment_new 
SELECT 
  id, classId, userId, status, enrolledAt, approvedAt,
  documentSigned, paymentFrequency, nextPaymentDue
FROM ClassEnrollment;

-- Drop old table and rename
DROP TABLE ClassEnrollment;
ALTER TABLE ClassEnrollment_new RENAME TO ClassEnrollment;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_enrollment_class ON ClassEnrollment(classId);
CREATE INDEX IF NOT EXISTS idx_enrollment_user ON ClassEnrollment(userId);
CREATE INDEX IF NOT EXISTS idx_enrollment_status ON ClassEnrollment(status);
