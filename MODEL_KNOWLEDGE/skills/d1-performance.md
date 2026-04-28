# Skill: D1 Query Performance

Use this when D1 row reads are high, queries are slow, or daily limits are exceeded.

## Context
Cloudflare D1 free plan: **5M rows read/day** (soft limit — no hard block but billing threshold).
As of April 2026: 16.49M reads in one day triggered by two root causes (see below).

## Root Causes of High Row Reads

### Anti-pattern 1: N+1 queries in a loop
```typescript
// ❌ WRONG — 1 query per enrollment = 300+ queries for large academies
for (const enrollment of enrollments) {
  const payment = await db.prepare('SELECT ... FROM Payment WHERE payerId = ?')
    .bind(enrollment.userId).first();
}

// ✅ CORRECT — 1 batch query for all
const payments = await db
  .prepare('SELECT payerId, classId, ... FROM Payment WHERE receiverId = ?')
  .bind(academyId).all();
const paymentMap = new Map(payments.results.map(p => [`${p.payerId}::${p.classId}`, p]));
// then: paymentMap.get(`${enrollment.userId}::${enrollment.classId}`)
```

### Anti-pattern 2: Correlated subqueries per row
```sql
-- ❌ WRONG — subquery runs once per enrollment row
SELECT ce.*, 
  (SELECT SUM(amount) FROM Payment WHERE payerId = ce.userId AND classId = ce.classId) as totalPaid
FROM ClassEnrollment ce

-- ✅ CORRECT — one GROUP BY query, join in memory
SELECT payerId, classId, SUM(amount) as totalPaid
FROM Payment
WHERE ... GROUP BY payerId, classId
```

### Anti-pattern 3: CTE join order (VideoPlayState is large)
```sql
-- ❌ WRONG — starts from large VPS table, filters classId last
FROM VideoPlayState vps
JOIN Video v ON v.id = vps.videoId
JOIN Lesson l ON l.id = v.lessonId
WHERE l.classId IN (...)

-- ✅ CORRECT — starts from small Lesson set, uses idx_lesson_class first
FROM Lesson l
JOIN Video v ON v.lessonId = l.id
JOIN VideoPlayState vps ON vps.videoId = v.id
WHERE l.classId IN (...)
```

### Anti-pattern 4: Missing index on lookup column
```sql
-- ❌ WRONG — full table scan if no index on storagePath
SELECT id FROM Upload WHERE storagePath = ?

-- ✅ CORRECT — create index first
CREATE INDEX idx_upload_storagePath ON Upload(storagePath);
```

## Index Checklist

Before writing a query that filters/joins on a column, verify an index exists:
```powershell
npx wrangler d1 execute akademo-db --remote --command="SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='TableName' ORDER BY name"
```

Key composite indexes already in prod:
- `Payment(payerId, classId, type, createdAt DESC)` — pending sync lookups
- `Payment(classId, status, type)` — payments_agg CTE
- `Upload(storagePath)` — orphan cleanup cron
- `VideoPlayState(videoId, studentId, totalWatchTimeSeconds)` — lesson progress CTE

## Diagnosis Workflow

1. Check D1 Analytics in Cloudflare dashboard (Workers & Pages → D1 → akademo-db → Insights)
2. Sort queries by **rows read** — the top 3 queries account for ~80% of reads
3. Check the query text for: full table scans, missing WHERE index, correlated subqueries, loop patterns
4. Fix with: batch queries + in-memory Maps, join order change, or new composite index

## When to Add a Migration vs Fix Code

| Problem | Fix |
|---------|-----|
| Missing index on a column used in WHERE/JOIN | New migration: `CREATE INDEX IF NOT EXISTS ...` |
| N+1 queries in a loop | Refactor code to batch queries |
| Correlated subquery per row | Replace with GROUP BY + left join in memory |
| CTE scanning wrong table first | Reorder FROM/JOIN chain in the CTE |

## Migration Template for Indexes
```sql
-- migrations/XXXX_description_indexes.sql
CREATE INDEX IF NOT EXISTS idx_tablename_column ON TableName(column);

-- Composite index for multi-column WHERE
CREATE INDEX IF NOT EXISTS idx_tablename_col1_col2 ON TableName(col1, col2, col3);

-- Partial index (SQLite) — smaller, only for specific status
CREATE INDEX IF NOT EXISTS idx_payment_pending ON Payment(payerId, classId) WHERE status = 'PENDING';
```

Apply individually (NEVER batch):
```powershell
npx wrangler d1 execute akademo-db --remote --file=migrations/XXXX_description_indexes.sql
```
