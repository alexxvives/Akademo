-- =============================================================================
-- BASELINE SCHEMA
-- Captured from production akademo-db on 2025-07-11
-- This file represents the full current schema state.
-- All previous migration files (0001–0098) are archived in migrations/archive/
-- =============================================================================

CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STUDENT',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  lastLoginAt TEXT,
  suspicionCount INTEGER DEFAULT 0,
  suspicionWarning INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Academy" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  description TEXT,
  ownerId TEXT,
  paymentStatus TEXT DEFAULT 'NOT PAID',
  stripeAccountId TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  defaultWatermarkIntervalMins INTEGER DEFAULT 5,
  defaultMaxWatchTimeMultiplier REAL DEFAULT 2.0,
  logoUrl TEXT,
  allowedPaymentMethods TEXT DEFAULT '["stripe","cash","bizum"]',
  allowMultipleTeachers INTEGER DEFAULT 0,
  feedbackEnabled INTEGER DEFAULT 1,
  requireGrading INTEGER DEFAULT 1,
  hiddenMenuItems TEXT DEFAULT '[]',
  restrictStreamAccess INTEGER DEFAULT 0,
  dailyEnabled INTEGER DEFAULT 0,
  transferenciaIban TEXT,
  bizumPhone TEXT
);

CREATE TABLE IF NOT EXISTS "Teacher" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS "Class" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  academyId TEXT NOT NULL,
  teacherId TEXT,
  createdAt TEXT NOT NULL,
  whatsappGroupLink TEXT,
  zoomAccountId TEXT,
  monthlyPrice REAL DEFAULT NULL,
  oneTimePrice REAL DEFAULT NULL,
  startDate TEXT DEFAULT NULL,
  maxStudents INTEGER DEFAULT NULL,
  university TEXT DEFAULT NULL,
  carrera TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS "ClassEnrollment" (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  userId TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  enrolledAt TEXT NOT NULL,
  approvedAt TEXT,
  documentSigned INTEGER DEFAULT 0,
  paymentFrequency TEXT DEFAULT 'ONE_TIME',
  nextPaymentDue TEXT DEFAULT NULL,
  stripeSubscriptionId TEXT DEFAULT NULL,
  UNIQUE(classId, userId)
);

CREATE TABLE IF NOT EXISTS "Lesson" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  classId TEXT NOT NULL,
  maxWatchTimeMultiplier REAL NOT NULL DEFAULT 2.0,
  watermarkIntervalMins INTEGER NOT NULL DEFAULT 5,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  releaseDate TEXT DEFAULT CURRENT_TIMESTAMP,
  topicId TEXT
);

CREATE TABLE IF NOT EXISTS "Topic" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  classId TEXT NOT NULL,
  orderIndex INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "Video" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  lessonId TEXT NOT NULL,
  uploadId TEXT NOT NULL,
  durationSeconds INTEGER,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "Document" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  lessonId TEXT NOT NULL,
  uploadId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "Upload" (
  id TEXT PRIMARY KEY NOT NULL,
  fileName TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  mimeType TEXT NOT NULL,
  storagePath TEXT NOT NULL,
  uploadedById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  bunnyGuid TEXT,
  bunnyStatus INTEGER DEFAULT NULL,
  storageType TEXT DEFAULT 'r2'
);

CREATE TABLE IF NOT EXISTS "LessonRating" (
  id TEXT PRIMARY KEY,
  lessonId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  rating INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  comment TEXT,
  isRead INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "LiveStream" (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  teacherId TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  title TEXT,
  startedAt DATETIME,
  endedAt DATETIME,
  recordingId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  zoomLink TEXT,
  zoomMeetingId TEXT,
  zoomStartUrl TEXT,
  participantCount INTEGER,
  participantsFetchedAt TEXT,
  zoomPassword TEXT,
  scheduledAt TEXT,
  calendarEventId TEXT,
  location TEXT,
  currentCount INTEGER DEFAULT 0,
  dailyRoomName TEXT,
  dailyRoomUrl TEXT
);

CREATE TABLE IF NOT EXISTS "Payment" (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payerId TEXT NOT NULL,
  receiverId TEXT,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'PENDING',
  stripePaymentId TEXT,
  stripeCheckoutSessionId TEXT,
  paymentMethod TEXT,
  classId TEXT,
  metadata TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  completedAt TEXT,
  nextPaymentDue TEXT DEFAULT NULL,
  billingCycleEnd TEXT DEFAULT NULL,
  payerType TEXT DEFAULT 'STUDENT',
  payerName TEXT DEFAULT '',
  payerEmail TEXT DEFAULT '',
  receiverName TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS VideoPlayState (
  id TEXT PRIMARY KEY NOT NULL,
  videoId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  totalWatchTimeSeconds REAL NOT NULL DEFAULT 0,
  lastPositionSeconds REAL NOT NULL DEFAULT 0,
  sessionStartTime TEXT,
  lastWatchedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  suspiciousCompletion INTEGER DEFAULT 0,
  completedAt TEXT,
  FOREIGN KEY (videoId) REFERENCES Video(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE(videoId, studentId)
);

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
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE(userId, deviceFingerprint)
);

CREATE TABLE IF NOT EXISTS VerificationCode (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  attempts INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ZoomAccount (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  accountName TEXT NOT NULL,
  accessToken TEXT NOT NULL,
  refreshToken TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  accountId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  provider TEXT DEFAULT 'zoom',
  FOREIGN KEY (academyId) REFERENCES Academy(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS AcademyBilling (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  month INTEGER NOT NULL,
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

CREATE TABLE IF NOT EXISTS Assignment (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  teacherId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  dueDate TEXT,
  maxScore REAL DEFAULT 100,
  uploadId TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  attachmentIds TEXT DEFAULT '[]',
  solutionUploadId TEXT,
  FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE,
  FOREIGN KEY (teacherId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadId) REFERENCES Upload(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS AssignmentAttachment (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  uploadId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assignmentId) REFERENCES Assignment(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadId) REFERENCES Upload(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AssignmentSubmission" (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  uploadId TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  score REAL,
  feedback TEXT,
  submittedAt TEXT NOT NULL DEFAULT (datetime('now')),
  gradedAt TEXT,
  gradedBy TEXT,
  downloadedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assignmentId) REFERENCES Assignment(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadId) REFERENCES Upload(id) ON DELETE CASCADE,
  FOREIGN KEY (gradedBy) REFERENCES User(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS CalendarScheduledEvent (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  createdBy TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('physicalClass', 'scheduledStream')),
  eventDate TEXT NOT NULL,
  notes TEXT,
  classId TEXT,
  location TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  startTime TEXT,
  zoomLink TEXT
);

CREATE TABLE IF NOT EXISTS DailyTestRoom (
  id TEXT PRIMARY KEY,
  roomName TEXT NOT NULL,
  roomUrl TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt TEXT NOT NULL,
  recordingId TEXT,
  recordingStatus TEXT DEFAULT 'none'
);

CREATE TABLE IF NOT EXISTS Lead (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  academyName TEXT,
  monthlyEnrollments TEXT,
  teacherCount TEXT,
  subjectCount TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS LoginEvent (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  ipAddress TEXT,
  country TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS RateLimit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  windowStart INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(key, windowStart)
);
