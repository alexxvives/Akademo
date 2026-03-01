-- =================================================================
-- Migration 0079: Restore ALL destroyed indexes + add new indexes
-- =================================================================
-- Migration 0027_cleanup_unused_columns.sql rebuilt 12 tables using
-- CREATE TABLE _new → INSERT → DROP → RENAME, destroying ALL indexes.
-- Subsequent migrations (0036, etc.) also destroyed indexes.
-- This migration restores all missing indexes and adds new ones
-- identified from query pattern analysis.
--
-- Safe to run: uses CREATE INDEX IF NOT EXISTS throughout.
-- =================================================================

-- ===========================
-- CRITICAL: Auth & Core (P0)
-- ===========================

-- User.email — used in every login/auth lookup
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);

-- Academy.ownerId — every ACADEMY role query starts with this
CREATE INDEX IF NOT EXISTS idx_academy_owner ON Academy(ownerId);

-- Class.slug — public URL resolution + uniqueness constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_slug ON Class(slug);

-- ===========================
-- CRITICAL: FK Lookups (P0)
-- ===========================

-- Class.academyId — Academy→Classes (every academy dashboard)
CREATE INDEX IF NOT EXISTS idx_class_academy ON Class(academyId);

-- Class.teacherId — Teacher's classes list
CREATE INDEX IF NOT EXISTS idx_class_teacher ON Class(teacherId);

-- Lesson.classId — Lesson listing per class
CREATE INDEX IF NOT EXISTS idx_lesson_class ON Lesson(classId);

-- Lesson.topicId — Lessons by topic
CREATE INDEX IF NOT EXISTS idx_lesson_topicId ON Lesson(topicId);

-- Video.lessonId — Videos per lesson
CREATE INDEX IF NOT EXISTS idx_video_lesson ON Video(lessonId);

-- Video.uploadId — Video→Upload JOIN
CREATE INDEX IF NOT EXISTS idx_video_upload ON Video(uploadId);

-- ===========================
-- HIGH: Payment & Streaming (P1)
-- ===========================

-- Payment indexes (destroyed by 0027 + 0036)
CREATE INDEX IF NOT EXISTS idx_payment_payer ON Payment(payerId, payerType);
CREATE INDEX IF NOT EXISTS idx_payment_receiver ON Payment(receiverId);
CREATE INDEX IF NOT EXISTS idx_payment_status ON Payment(status);
CREATE INDEX IF NOT EXISTS idx_payment_type ON Payment(type);
CREATE INDEX IF NOT EXISTS idx_payment_created ON Payment(createdAt DESC);
-- NEW: Stripe webhook lookups
CREATE INDEX IF NOT EXISTS idx_payment_classId ON Payment(classId);
CREATE INDEX IF NOT EXISTS idx_payment_stripe_session ON Payment(stripeCheckoutSessionId);

-- LiveStream indexes (destroyed by 0027)
CREATE INDEX IF NOT EXISTS idx_livestream_class ON LiveStream(classId);
CREATE INDEX IF NOT EXISTS idx_livestream_teacher ON LiveStream(teacherId);
CREATE INDEX IF NOT EXISTS idx_livestream_status ON LiveStream(status);
-- NEW: Zoom webhook lookups
CREATE INDEX IF NOT EXISTS idx_livestream_zoom_meeting ON LiveStream(zoomMeetingId);
-- NEW: Calendar→stream linkage
CREATE INDEX IF NOT EXISTS idx_livestream_calendar_event ON LiveStream(calendarEventId);

-- ===========================
-- MEDIUM: Supporting Tables (P2)
-- ===========================

-- Teacher indexes (may never have existed)
CREATE INDEX IF NOT EXISTS idx_teacher_userId ON Teacher(userId);
CREATE INDEX IF NOT EXISTS idx_teacher_academyId ON Teacher(academyId);

-- Document indexes (destroyed by 0027)
CREATE INDEX IF NOT EXISTS idx_document_lesson ON Document(lessonId);
CREATE INDEX IF NOT EXISTS idx_document_upload ON Document(uploadId);

-- LessonRating indexes (destroyed by 0027)
CREATE INDEX IF NOT EXISTS idx_lesson_rating_lesson ON LessonRating(lessonId);
CREATE INDEX IF NOT EXISTS idx_lesson_rating_student ON LessonRating(studentId);

-- Topic index (destroyed by 0027)
CREATE INDEX IF NOT EXISTS idx_topic_classId ON Topic(classId);

-- Upload indexes (may still exist, IF NOT EXISTS is safe)
CREATE INDEX IF NOT EXISTS idx_upload_uploader ON Upload(uploadedById);
CREATE INDEX IF NOT EXISTS idx_upload_bunny_guid ON Upload(bunnyGuid);

-- VideoPlayState indexes (may still exist)
CREATE INDEX IF NOT EXISTS idx_playstate_video ON VideoPlayState(videoId);
CREATE INDEX IF NOT EXISTS idx_playstate_student ON VideoPlayState(studentId);

-- DeviceSession index
CREATE INDEX IF NOT EXISTS idx_session_user ON DeviceSession(userId);

-- Notification indexes (likely still exist, safe to re-create)
CREATE INDEX IF NOT EXISTS idx_notification_user ON Notification(userId);
CREATE INDEX IF NOT EXISTS idx_notification_unread ON Notification(userId, isRead);

-- Class.zoomAccountId
CREATE INDEX IF NOT EXISTS idx_class_zoom_account ON Class(zoomAccountId);

-- LoginEvent (new table from 0071, may need index)
CREATE INDEX IF NOT EXISTS idx_login_event_userId ON LoginEvent(userId);
