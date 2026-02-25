-- Migration 0077: Academy billing tracking
CREATE TABLE IF NOT EXISTS AcademyBilling (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  month INTEGER NOT NULL,   -- 1‑12
  year INTEGER NOT NULL,
  studentCount INTEGER DEFAULT 0,
  enrollmentCount INTEGER DEFAULT 0,
  teacherCount INTEGER DEFAULT 0,
  pricePerEnrollment REAL DEFAULT 0.0,
  notes TEXT,
  paidAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES Academy(id) ON DELETE CASCADE,
  UNIQUE(academyId, month, year)
);
