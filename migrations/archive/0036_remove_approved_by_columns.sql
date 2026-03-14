-- Remove approvedBy columns from Payment table
-- These are redundant since only academy owners can approve payments
-- and that information is already in the academy relationship

-- Note: SQLite doesn't support DROP COLUMN directly
-- We need to recreate the table without these columns

-- Create new table without approvedBy columns
CREATE TABLE Payment_new (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payerId TEXT NOT NULL,
  payerType TEXT NOT NULL,
  payerName TEXT NOT NULL,
  payerEmail TEXT NOT NULL,
  receiverId TEXT,
  receiverName TEXT,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'PENDING',
  stripePaymentId TEXT,
  stripeCheckoutSessionId TEXT,
  paymentMethod TEXT,
  classId TEXT,
  description TEXT,
  metadata TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  completedAt TEXT,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copy data from old table
INSERT INTO Payment_new 
SELECT 
  id, type, payerId, payerType, payerName, payerEmail, 
  receiverId, receiverName, amount, currency, status,
  stripePaymentId, stripeCheckoutSessionId, paymentMethod,
  classId, description, metadata, createdAt, completedAt, updatedAt
FROM Payment;

-- Drop old table
DROP TABLE Payment;

-- Rename new table
ALTER TABLE Payment_new RENAME TO Payment;
