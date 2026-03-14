-- D1-backed distributed rate limiting table
-- Replaces in-memory Map (per-isolate) with persistent cross-edge storage
CREATE TABLE IF NOT EXISTS RateLimit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,        -- e.g. "login:<ip>" or "reset:<email>"
  windowStart INTEGER NOT NULL, -- Unix timestamp (seconds) of window start
  count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(key, windowStart)
);

CREATE INDEX IF NOT EXISTS idx_ratelimit_key ON RateLimit(key);
CREATE INDEX IF NOT EXISTS idx_ratelimit_cleanup ON RateLimit(windowStart);
