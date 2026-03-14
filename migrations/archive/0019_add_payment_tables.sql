-- Add Payment table to track all financial transactions
-- Two types of payments:
-- 1. STUDENT_TO_ACADEMY: Students paying for enrollment/subscriptions
-- 2. ACADEMY_TO_PLATFORM: Academies paying platform fees

CREATE TABLE IF NOT EXISTS Payment (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('STUDENT_TO_ACADEMY', 'ACADEMY_TO_PLATFORM')),
  
  -- Payer info
  payerId TEXT NOT NULL,  -- User.id for students, Academy.ownerId for academies
  payerType TEXT NOT NULL CHECK(payerType IN ('STUDENT', 'ACADEMY')),
  payerName TEXT NOT NULL,
  payerEmail TEXT NOT NULL,
  
  -- Receiver info (for STUDENT_TO_ACADEMY payments)
  receiverId TEXT,  -- Academy.id for student payments
  receiverName TEXT,
  
  -- Payment details
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  
  -- External payment provider info
  stripePaymentId TEXT,
  stripeCheckoutSessionId TEXT,
  paymentMethod TEXT,  -- 'stripe', 'paypal', etc.
  
  -- Context
  classId TEXT,  -- For student enrollments
  description TEXT,
  metadata TEXT,  -- JSON for additional data
  
  -- Timestamps
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  completedAt TEXT,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_payment_payer ON Payment(payerId, payerType);
CREATE INDEX IF NOT EXISTS idx_payment_receiver ON Payment(receiverId);
CREATE INDEX IF NOT EXISTS idx_payment_status ON Payment(status);
CREATE INDEX IF NOT EXISTS idx_payment_type ON Payment(type);
CREATE INDEX IF NOT EXISTS idx_payment_created ON Payment(createdAt DESC);
