-- Create AcademicYear table for managing academic periods per academy
CREATE TABLE IF NOT EXISTS AcademicYear (
  id TEXT PRIMARY KEY NOT NULL,
  academyId TEXT NOT NULL,
  name TEXT NOT NULL,
  startDate TEXT NOT NULL,
  endDate TEXT,
  isCurrent INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES Academy(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_academic_year_academy ON AcademicYear(academyId);
