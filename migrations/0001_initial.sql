-- Migration for Academy Hive on Cloudflare D1
-- Created: 2024-11-30

-- Users table
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STUDENT',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Academy table
CREATE TABLE IF NOT EXISTS Academy (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  ownerId TEXT NOT NULL,
  defaultMaxWatchTimeMultiplier REAL DEFAULT 2.0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ownerId) REFERENCES User(id) ON DELETE CASCADE
);

-- Academy Membership table
CREATE TABLE IF NOT EXISTS AcademyMembership (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  requestedAt TEXT NOT NULL DEFAULT (datetime('now')),
  approvedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (academyId) REFERENCES Academy(id) ON DELETE CASCADE,
  UNIQUE(userId, academyId)
);

-- Class table
CREATE TABLE IF NOT EXISTS Class (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  academyId TEXT NOT NULL,
  defaultMaxWatchTimeMultiplier REAL DEFAULT 2.0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES Academy(id) ON DELETE CASCADE
);

-- Class Enrollment table
CREATE TABLE IF NOT EXISTS ClassEnrollment (
  id TEXT PRIMARY KEY NOT NULL,
  classId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  enrolledAt TEXT NOT NULL DEFAULT (datetime('now')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(classId, studentId)
);

-- Upload table (metadata for R2 objects)
CREATE TABLE IF NOT EXISTS Upload (
  id TEXT PRIMARY KEY NOT NULL,
  fileName TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  mimeType TEXT NOT NULL,
  storageType TEXT NOT NULL,
  storagePath TEXT NOT NULL,
  uploadedById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (uploadedById) REFERENCES User(id) ON DELETE CASCADE
);

-- Document table
CREATE TABLE IF NOT EXISTS Document (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  classId TEXT NOT NULL,
  uploadId TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadId) REFERENCES Upload(id) ON DELETE CASCADE
);

-- Video table
CREATE TABLE IF NOT EXISTS Video (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  classId TEXT NOT NULL,
  uploadId TEXT NOT NULL UNIQUE,
  durationSeconds INTEGER,
  maxWatchTimeMultiplier REAL DEFAULT 2.0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadId) REFERENCES Upload(id) ON DELETE CASCADE
);

-- Video Play State table
CREATE TABLE IF NOT EXISTS VideoPlayState (
  id TEXT PRIMARY KEY NOT NULL,
  videoId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  totalWatchTimeSeconds REAL NOT NULL DEFAULT 0,
  lastPositionSeconds REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  sessionStartTime TEXT,
  lastWatchedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (videoId) REFERENCES Video(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(videoId, studentId)
);

-- Device Session table
CREATE TABLE IF NOT EXISTS DeviceSession (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  deviceFingerprint TEXT NOT NULL,
  userAgent TEXT,
  ipHash TEXT,
  browser TEXT,
  os TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  lastActiveAt TEXT NOT NULL DEFAULT (datetime('now')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(userId, deviceFingerprint)
);

-- Platform Settings table
CREATE TABLE IF NOT EXISTS PlatformSettings (
  id TEXT PRIMARY KEY NOT NULL DEFAULT 'platform_settings',
  defaultMaxWatchTimeMultiplier REAL NOT NULL DEFAULT 2.0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Billing Config table
CREATE TABLE IF NOT EXISTS BillingConfig (
  id TEXT PRIMARY KEY NOT NULL,
  academyId TEXT NOT NULL UNIQUE,
  stripeCustomerId TEXT,
  stripeSubscriptionId TEXT,
  stripePriceId TEXT,
  pricePerStudentPerMonth REAL NOT NULL DEFAULT 1.0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES Academy(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_academy_owner ON Academy(ownerId);
CREATE INDEX IF NOT EXISTS idx_membership_user ON AcademyMembership(userId);
CREATE INDEX IF NOT EXISTS idx_membership_academy ON AcademyMembership(academyId);
CREATE INDEX IF NOT EXISTS idx_class_academy ON Class(academyId);
CREATE INDEX IF NOT EXISTS idx_enrollment_class ON ClassEnrollment(classId);
CREATE INDEX IF NOT EXISTS idx_enrollment_student ON ClassEnrollment(studentId);
CREATE INDEX IF NOT EXISTS idx_video_class ON Video(classId);
CREATE INDEX IF NOT EXISTS idx_playstate_video ON VideoPlayState(videoId);
CREATE INDEX IF NOT EXISTS idx_playstate_student ON VideoPlayState(studentId);
CREATE INDEX IF NOT EXISTS idx_session_user ON DeviceSession(userId);

-- Insert default platform settings
INSERT OR IGNORE INTO PlatformSettings (id, defaultMaxWatchTimeMultiplier) 
VALUES ('platform_settings', 2.0);
