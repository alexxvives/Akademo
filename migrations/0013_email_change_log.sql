-- Track all email changes made by users for audit purposes
CREATE TABLE IF NOT EXISTS UserEmailChangeLog (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  oldEmail TEXT NOT NULL,
  newEmail TEXT NOT NULL,
  changedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);
