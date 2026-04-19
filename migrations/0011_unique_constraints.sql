-- 0011_unique_constraints.sql
-- Add UNIQUE indexes to prevent race-condition duplicates

-- Prevent duplicate slugs on classes (concurrent class creation race)
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_slug ON Class(slug);

-- Prevent duplicate PENDING payments for the same student+class (double-click race)
-- Partial index: only enforced when status = 'PENDING'
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_pending_unique
  ON Payment(payerId, classId) WHERE status = 'PENDING';

-- Prevent duplicate Teacher records for the same user+academy (bulk import re-run)
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_user_academy
  ON Teacher(userId, academyId);
