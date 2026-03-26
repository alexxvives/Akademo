-- Migration: 0006_audit_log.sql
-- AuditLog table for tracking privileged and destructive admin actions
-- Referenced by writeAuditLog() in workers/akademo-api/src/lib/audit.ts

CREATE TABLE IF NOT EXISTS AuditLog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actorId TEXT NOT NULL,
  actorRole TEXT NOT NULL,
  action TEXT NOT NULL,
  targetType TEXT,
  targetId TEXT,
  meta TEXT,
  ip TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (actorId) REFERENCES "User"(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON AuditLog(actorId);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON AuditLog(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON AuditLog(createdAt);
