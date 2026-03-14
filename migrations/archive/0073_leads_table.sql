-- Lead capture table for pricing page form submissions
CREATE TABLE IF NOT EXISTS Lead (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  academyName TEXT,
  monthlyEnrollments TEXT,
  teacherCount TEXT,
  subjectCount TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_lead_status ON Lead(status);
-- Index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_lead_created ON Lead(createdAt DESC);
