-- Audit log for privileged / destructive actions
-- Used to track: admin deletions, approval decisions, billing changes, Zoom assignment
CREATE TABLE IF NOT EXISTS AuditLog (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  actorId     TEXT    NOT NULL,                                    -- User.id performing the action
  actorRole   TEXT    NOT NULL,                                    -- ADMIN / ACADEMY / TEACHER
  action      TEXT    NOT NULL,                                    -- e.g. ADMIN_DELETE_USER
  targetType  TEXT,                                               -- e.g. User / Academy / ClassEnrollment
  targetId    TEXT,                                               -- id of the affected entity
  meta        TEXT,                                               -- JSON blob with extra context
  ip          TEXT,                                               -- CF-Connecting-IP
  createdAt   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_auditlog_actor   ON AuditLog(actorId);
CREATE INDEX IF NOT EXISTS idx_auditlog_action  ON AuditLog(action);
CREATE INDEX IF NOT EXISTS idx_auditlog_created ON AuditLog(createdAt DESC);
