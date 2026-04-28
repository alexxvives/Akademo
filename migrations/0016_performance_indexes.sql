-- 0014_performance_indexes.sql
-- Performance indexes identified from D1 query analytics (April 2026)

-- FIX 1: Orphan cleanup cron (handleOrphanCleanup) runs SELECT id FROM Upload WHERE storagePath = ?
-- for every R2 object — full table scan without this index.
-- Impact: query #3 in analytics, 57.33k rows read across 393 calls.
CREATE INDEX IF NOT EXISTS idx_upload_storagePath ON Upload(storagePath);

-- FIX 2: syncDerivedPendingPayments calls two correlated subqueries per enrolled student:
--   (a) SELECT p3.paymentMethod ... WHERE payerId=? AND classId=? AND type=? ORDER BY createdAt DESC LIMIT 1
--   (b) SELECT SUM(p2.amount) ... WHERE payerId=? AND classId=? AND status IN ('PAID','COMPLETED') AND type=?
-- The partial index idx_payment_pending_unique only covers status='PENDING'.
-- This composite covers both patterns via prefix matching.
CREATE INDEX IF NOT EXISTS idx_payment_payer_class_type
  ON Payment(payerId, classId, type, createdAt DESC);

-- FIX 3: payments_agg CTE in student progress queries:
--   SELECT payerId, classId, SUM(amount) FROM Payment
--   WHERE status IN ('PAID','COMPLETED') AND classId IN (academy_classIds)
-- idx_payment_classId exists (single col) but can't also filter status efficiently.
CREATE INDEX IF NOT EXISTS idx_payment_class_status_type
  ON Payment(classId, status, type);

-- FIX 4: VideoPlayState progress CTE — SQLite sometimes scans VPS first (full table)
-- instead of going Lesson->Video->VPS. A covering index on (videoId, studentId) means
-- the VPS side of the join never needs to touch the heap rows.
CREATE INDEX IF NOT EXISTS idx_playstate_video_student
  ON VideoPlayState(videoId, studentId, totalWatchTimeSeconds);
