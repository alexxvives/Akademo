-- Migration: Remove unused columns from database
-- Date: 2026-01-26
-- Description: Cleanup unused columns including phone, status, updatedAt, and redundant LiveStream fields

-- Note: D1/SQLite doesn't support DROP COLUMN for columns with NOT NULL constraints
-- We need to recreate tables for LiveStream

-- Simple DROP COLUMN operations (these should work)
-- Remove unused columns from User
PRAGMA foreign_keys=off;

-- User table cleanup
CREATE TABLE User_new (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STUDENT',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  lastLoginAt TEXT
);

INSERT INTO User_new SELECT id, email, password, firstName, lastName, role, createdAt, lastLoginAt FROM User;
DROP TABLE User;
ALTER TABLE User_new RENAME TO User;

-- Academy table cleanup
CREATE TABLE Academy_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  description TEXT,
  ownerId TEXT,
  monoacademy INTEGER DEFAULT 0,
  paymentStatus TEXT DEFAULT 'NOT PAID',
  stripeAccountId TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  feedbackAnonymous INTEGER DEFAULT 0,
  defaultWatermarkIntervalMins INTEGER DEFAULT 5,
  defaultMaxWatchTimeMultiplier REAL DEFAULT 2.0
);

INSERT INTO Academy_new SELECT id, name, createdAt, description, ownerId, monoacademy, paymentStatus, stripeAccountId, address, phone, email, feedbackAnonymous, defaultWatermarkIntervalMins, defaultMaxWatchTimeMultiplier FROM Academy;
DROP TABLE Academy;
ALTER TABLE Academy_new RENAME TO Academy;

-- Teacher table cleanup
CREATE TABLE Teacher_new (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  monoacademy INTEGER DEFAULT 0
);

INSERT INTO Teacher_new SELECT id, userId, academyId, createdAt, status, monoacademy FROM Teacher;
DROP TABLE Teacher;
ALTER TABLE Teacher_new RENAME TO Teacher;

-- Class table cleanup
CREATE TABLE Class_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  academyId TEXT NOT NULL,
  teacherId TEXT,
  createdAt TEXT NOT NULL,
  feedbackEnabled BOOLEAN NOT NULL DEFAULT 1,
  whatsappGroupLink TEXT,
  price REAL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  zoomAccountId TEXT
);

INSERT INTO Class_new SELECT id, name, slug, description, academyId, teacherId, createdAt, feedbackEnabled, whatsappGroupLink, price, currency, zoomAccountId FROM Class;
DROP TABLE Class;
ALTER TABLE Class_new RENAME TO Class;

-- ClassEnrollment table cleanup
CREATE TABLE ClassEnrollment_new (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  userId TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  enrolledAt TEXT NOT NULL,
  approvedAt TEXT,
  paymentStatus TEXT DEFAULT 'PENDING',
  paymentMethod TEXT,
  paymentId TEXT,
  paymentAmount REAL DEFAULT 0,
  approvedBy TEXT,
  approvedByName TEXT,
  UNIQUE(classId, userId)
);

INSERT INTO ClassEnrollment_new SELECT id, classId, userId, status, enrolledAt, approvedAt, paymentStatus, paymentMethod, paymentId, paymentAmount, approvedBy, approvedByName FROM ClassEnrollment;
DROP TABLE ClassEnrollment;
ALTER TABLE ClassEnrollment_new RENAME TO ClassEnrollment;

-- Lesson table cleanup
CREATE TABLE Lesson_new (
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

INSERT INTO Lesson_new SELECT id, title, description, classId, maxWatchTimeMultiplier, watermarkIntervalMins, createdAt, releaseDate, topicId FROM Lesson;
DROP TABLE Lesson;
ALTER TABLE Lesson_new RENAME TO Lesson;

-- Video table cleanup
CREATE TABLE Video_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  lessonId TEXT NOT NULL,
  uploadId TEXT NOT NULL,
  durationSeconds INTEGER,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO Video_new SELECT id, title, lessonId, uploadId, durationSeconds, createdAt FROM Video;
DROP TABLE Video;
ALTER TABLE Video_new RENAME TO Video;

-- Document table cleanup
CREATE TABLE Document_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  lessonId TEXT NOT NULL,
  uploadId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO Document_new SELECT id, title, lessonId, uploadId, createdAt FROM Document;
DROP TABLE Document;
ALTER TABLE Document_new RENAME TO Document;

-- LiveStream table cleanup (remove roomName and roomUrl)
CREATE TABLE LiveStream_new (
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
  participantsData TEXT
);

INSERT INTO LiveStream_new SELECT id, classId, teacherId, status, title, startedAt, endedAt, recordingId, createdAt, zoomLink, zoomMeetingId, zoomStartUrl, participantCount, participantsFetchedAt, participantsData FROM LiveStream;
DROP TABLE LiveStream;
ALTER TABLE LiveStream_new RENAME TO LiveStream;

-- LessonRating table cleanup
CREATE TABLE LessonRating_new (
  id TEXT PRIMARY KEY,
  lessonId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  rating INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  comment TEXT
);

INSERT INTO LessonRating_new SELECT id, lessonId, studentId, rating, createdAt, comment FROM LessonRating;
DROP TABLE LessonRating;
ALTER TABLE LessonRating_new RENAME TO LessonRating;

-- Payment table cleanup
CREATE TABLE Payment_new (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payerId TEXT NOT NULL,
  payerType TEXT NOT NULL,
  payerName TEXT NOT NULL,
  payerEmail TEXT NOT NULL,
  receiverId TEXT,
  receiverName TEXT,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'PENDING',
  stripePaymentId TEXT,
  stripeCheckoutSessionId TEXT,
  paymentMethod TEXT,
  classId TEXT,
  description TEXT,
  metadata TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  completedAt TEXT
);

INSERT INTO Payment_new SELECT id, type, payerId, payerType, payerName, payerEmail, receiverId, receiverName, amount, currency, status, stripePaymentId, stripeCheckoutSessionId, paymentMethod, classId, description, metadata, createdAt, completedAt FROM Payment;
DROP TABLE Payment;
ALTER TABLE Payment_new RENAME TO Payment;

-- Topic table cleanup
CREATE TABLE Topic_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  classId TEXT NOT NULL,
  orderIndex INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO Topic_new SELECT id, name, classId, orderIndex, createdAt FROM Topic;
DROP TABLE Topic;
ALTER TABLE Topic_new RENAME TO Topic;

PRAGMA foreign_keys=on;

-- Note: Keeping updatedAt for ZoomAccount (OAuth token refresh tracking)
-- Note: Keeping updatedAt for VideoPlayState (active progress tracking)
