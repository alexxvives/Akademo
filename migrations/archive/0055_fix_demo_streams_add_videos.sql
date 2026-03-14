-- Migration 0055: Fix demo LiveStream statuses, add Videos and watch progress
-- Purpose: Match frontend expectations for stream status and add video watch data

-- ============================================================
-- 1. FIX LIVESTREAM STATUSES AND PARTICIPANT COUNT
-- ============================================================
-- Frontend expects: 'active', 'scheduled', 'ended' (not 'LIVE', 'PENDING', 'ENDED')

UPDATE LiveStream SET status = 'ended' WHERE id = 'demo-stream-web-past';
UPDATE LiveStream SET status = 'scheduled', participantCount = 30 WHERE id = 'demo-stream-math-upcoming';
UPDATE LiveStream SET status = 'active' WHERE id = 'demo-stream-design-live';

-- Add recording ID to ended stream so it shows "Disponible" in Grabación column
UPDATE LiveStream SET recordingId = 'demo-recording-web-past' WHERE id = 'demo-stream-web-past';

-- ============================================================
-- 2. CREATE UPLOAD RECORDS FOR VIDEOS
-- ============================================================
-- These are required by foreign key constraints for Video table

INSERT INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, bunnyGuid, bunnyStatus, storageType, createdAt) VALUES
('demo-upload-video-1', 'intro-curso.mp4', 45678900, 'video/mp4', 'demo/videos/intro-curso.mp4', 'demo-teacher-user', 'demo-bunny-guid-1', 4, 'bunny', datetime('now', '-15 days')),
('demo-upload-video-2', 'variables-tipos.mp4', 38912340, 'video/mp4', 'demo/videos/variables-tipos.mp4', 'demo-teacher-user', 'demo-bunny-guid-2', 4, 'bunny', datetime('now', '-12 days')),
('demo-upload-video-3', 'funciones-scope.mp4', 52341200, 'video/mp4', 'demo/videos/funciones-scope.mp4', 'demo-teacher-user', 'demo-bunny-guid-3', 4, 'bunny', datetime('now', '-10 days')),
('demo-upload-video-4', 'arrays-objetos.mp4', 48723400, 'video/mp4', 'demo/videos/arrays-objetos.mp4', 'demo-teacher-user', 'demo-bunny-guid-4', 4, 'bunny', datetime('now', '-8 days')),
('demo-upload-video-5', 'limites-continuidad.mp4', 51234800, 'video/mp4', 'demo/videos/limites-continuidad.mp4', 'demo-teacher-user', 'demo-bunny-guid-5', 4, 'bunny', datetime('now', '-13 days')),
('demo-upload-video-6', 'derivadas.mp4', 42890100, 'video/mp4', 'demo/videos/derivadas.mp4', 'demo-teacher-user', 'demo-bunny-guid-6', 4, 'bunny', datetime('now', '-9 days')),
('demo-upload-video-7', 'integrales.mp4', 47123600, 'video/mp4', 'demo/videos/integrales.mp4', 'demo-teacher-user', 'demo-bunny-guid-7', 4, 'bunny', datetime('now', '-7 days')),
('demo-upload-video-8', 'intro-photoshop.mp4', 58912300, 'video/mp4', 'demo/videos/intro-photoshop.mp4', 'demo-teacher-user', 'demo-bunny-guid-8', 4, 'bunny', datetime('now', '-11 days')),
('demo-upload-video-9', 'herramientas-basicas.mp4', 49234500, 'video/mp4', 'demo/videos/herramientas-basicas.mp4', 'demo-teacher-user', 'demo-bunny-guid-9', 4, 'bunny', datetime('now', '-6 days')),
('demo-upload-video-10', 'intro-cuantica.mp4', 65723400, 'video/mp4', 'demo/videos/intro-cuantica.mp4', 'demo-teacher-user', 'demo-bunny-guid-10', 4, 'bunny', datetime('now', '-14 days')),
('demo-upload-video-11', 'incertidumbre.mp4', 59812300, 'video/mp4', 'demo/videos/incertidumbre.mp4', 'demo-teacher-user', 'demo-bunny-guid-11', 4, 'bunny', datetime('now', '-5 days'));

-- ============================================================
-- 3. CREATE VIDEO RECORDS FOR LESSONS
-- ============================================================
-- Videos are needed for VideoPlayState to work properly

INSERT INTO Video (id, title, lessonId, uploadId, durationSeconds, createdAt) VALUES 
('demo-video-web-1', 'Introducción al Curso - Video', 'demo-lesson-web-1', 'demo-upload-video-1', 2847, datetime('now', '-15 days')),
('demo-video-web-2', 'Variables y Tipos de Datos - Video', 'demo-lesson-web-2', 'demo-upload-video-2', 2240, datetime('now', '-12 days')),
('demo-video-web-3', 'Funciones y Scope - Video', 'demo-lesson-web-3', 'demo-upload-video-3', 3420, datetime('now', '-10 days')),
('demo-video-web-4', 'Arrays y Objetos - Video', 'demo-lesson-web-4', 'demo-upload-video-4', 3012, datetime('now', '-8 days')),
('demo-video-math-1', 'Límites y Continuidad - Video', 'demo-lesson-math-1', 'demo-upload-video-5', 3124, datetime('now', '-13 days')),
('demo-video-math-2', 'Derivadas - Video', 'demo-lesson-math-2', 'demo-upload-video-6', 2480, datetime('now', '-9 days')),
('demo-video-math-3', 'Integrales - Video', 'demo-lesson-math-3', 'demo-upload-video-7', 2890, datetime('now', '-7 days')),
('demo-video-design-1', 'Introducción a Photoshop - Video', 'demo-lesson-design-1', 'demo-upload-video-8', 3650, datetime('now', '-11 days')),
('demo-video-design-2', 'Herramientas Básicas - Video', 'demo-lesson-design-2', 'demo-upload-video-9', 2940, datetime('now', '-6 days')),
('demo-video-physics-1', 'Introducción a la Mecánica Cuántica - Video', 'demo-lesson-physics-1', 'demo-upload-video-10', 4120, datetime('now', '-14 days')),
('demo-video-physics-2', 'El Principio de Incertidumbre - Video', 'demo-lesson-physics-2', 'demo-upload-video-11', 3580, datetime('now', '-5 days'));

-- ============================================================
-- 4. CREATE VIDEOPLAYSTATE RECORDS (Watch Progress)
-- ============================================================
-- This provides "Videos Vistos" and "Tiempo Total" data

-- Demo Student (estudiantedemo@akademo-edu.com)
INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, lastWatchedAt, status, createdAt, updatedAt) VALUES
('demo-progress-s1-v1', 'demo-video-web-1', 'demo-student-user', 2847, 2847, datetime('now', '-5 days'), 'COMPLETED', datetime('now', '-12 days'), datetime('now', '-5 days')),
('demo-progress-s1-v2', 'demo-video-web-2', 'demo-student-user', 1456, 1456, datetime('now', '-2 days'), 'ACTIVE', datetime('now', '-3 days'), datetime('now', '-2 days')),
('demo-progress-s1-v5', 'demo-video-math-1', 'demo-student-user', 3124, 3124, datetime('now', '-8 days'), 'COMPLETED', datetime('now', '-10 days'), datetime('now', '-8 days')),
('demo-progress-s1-v8', 'demo-video-design-1', 'demo-student-user', 1825, 1825, datetime('now', '-4 days'), 'ACTIVE', datetime('now', '-6 days'), datetime('now', '-4 days'));

-- Student 2 (demo-student-2)
INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, lastWatchedAt, status, createdAt, updatedAt) VALUES
('demo-progress-s2-v1', 'demo-video-web-1', 'demo-student-2', 2847, 2847, datetime('now', '-6 days'), 'COMPLETED', datetime('now', '-8 days'), datetime('now', '-6 days')),
('demo-progress-s2-v2', 'demo-video-web-2', 'demo-student-2', 892, 892, datetime('now', '-1 day'), 'ACTIVE', datetime('now', '-4 days'), datetime('now', '-1 day')),
('demo-progress-s2-v3', 'demo-video-web-3', 'demo-student-2', 3420, 3420, datetime('now', '-2 days'), 'COMPLETED', datetime('now', '-5 days'), datetime('now', '-2 days'));

-- Student 3 (demo-student-3) - Very active
INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, lastWatchedAt, status, createdAt, updatedAt) VALUES
('demo-progress-s3-v1', 'demo-video-web-1', 'demo-student-3', 2847, 2847, datetime('now', '-7 days'), 'COMPLETED', datetime('now', '-9 days'), datetime('now', '-7 days')),
('demo-progress-s3-v2', 'demo-video-web-2', 'demo-student-3', 2240, 2240, datetime('now', '-5 days'), 'COMPLETED', datetime('now', '-6 days'), datetime('now', '-5 days')),
('demo-progress-s3-v3', 'demo-video-web-3', 'demo-student-3', 3420, 3420, datetime('now', '-3 days'), 'COMPLETED', datetime('now', '-4 days'), datetime('now', '-3 days')),
('demo-progress-s3-v4', 'demo-video-web-4', 'demo-student-3', 2108, 2108, datetime('now', '-1 day'), 'ACTIVE', datetime('now', '-2 days'), datetime('now', '-1 day'));

-- Student 4 (demo-student-4) - Math focused
INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, lastWatchedAt, status, createdAt, updatedAt) VALUES
('demo-progress-s4-v5', 'demo-video-math-1', 'demo-student-4', 3124, 3124, datetime('now', '-6 days'), 'COMPLETED', datetime('now', '-9 days'), datetime('now', '-6 days')),
('demo-progress-s4-v6', 'demo-video-math-2', 'demo-student-4', 2480, 2480, datetime('now', '-3 days'), 'COMPLETED', datetime('now', '-4 days'), datetime('now', '-3 days')),
('demo-progress-s4-v7', 'demo-video-math-3', 'demo-student-4', 1567, 1567, datetime('now', '-12 hours'), 'ACTIVE', datetime('now', '-3 days'), datetime('now', '-12 hours'));

-- Student 5 (demo-student-5) - Mix of classes
INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, lastWatchedAt, status, createdAt, updatedAt) VALUES
('demo-progress-s5-v1', 'demo-video-web-1', 'demo-student-5', 2847, 2847, datetime('now', '-10 days'), 'COMPLETED', datetime('now', '-12 days'), datetime('now', '-10 days')),
('demo-progress-s5-v5', 'demo-video-math-1', 'demo-student-5', 3124, 3124, datetime('now', '-7 days'), 'COMPLETED', datetime('now', '-9 days'), datetime('now', '-7 days')),
('demo-progress-s5-v6', 'demo-video-math-2', 'demo-student-5', 1240, 1240, datetime('now', '-2 days'), 'ACTIVE', datetime('now', '-5 days'), datetime('now', '-2 days'));

-- Student 6 (demo-student-6) - Design focus
INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, lastWatchedAt, status, createdAt, updatedAt) VALUES
('demo-progress-s6-v8', 'demo-video-design-1', 'demo-student-6', 3650, 3650, datetime('now', '-4 days'), 'COMPLETED', datetime('now', '-8 days'), datetime('now', '-4 days')),
('demo-progress-s6-v9', 'demo-video-design-2', 'demo-student-6', 2940, 2940, datetime('now', '-1 day'), 'COMPLETED', datetime('now', '-3 days'), datetime('now', '-1 day'));

-- Student 7 (demo-student-7) - Just started
INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, lastWatchedAt, status, createdAt, updatedAt) VALUES
('demo-progress-s7-v1', 'demo-video-web-1', 'demo-student-7', 1423, 1423, datetime('now', '-1 day'), 'ACTIVE', datetime('now', '-2 days'), datetime('now', '-1 day'));

-- Student 8 (demo-student-8) - Physics student
INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, lastWatchedAt, status, createdAt, updatedAt) VALUES
('demo-progress-s8-v10', 'demo-video-physics-1', 'demo-student-8', 4120, 4120, datetime('now', '-5 days'), 'COMPLETED', datetime('now', '-8 days'), datetime('now', '-5 days')),
('demo-progress-s8-v11', 'demo-video-physics-2', 'demo-student-8', 2680, 2680, datetime('now', '-2 days'), 'ACTIVE', datetime('now', '-3 days'), datetime('now', '-2 days'));

-- Student 9 (demo-student-9) - Multi-class learner
INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, lastWatchedAt, status, createdAt, updatedAt) VALUES
('demo-progress-s9-v1', 'demo-video-web-1', 'demo-student-9', 2847, 2847, datetime('now', '-11 days'), 'COMPLETED', datetime('now', '-13 days'), datetime('now', '-11 days')),
('demo-progress-s9-v2', 'demo-video-web-2', 'demo-student-9', 2240, 2240, datetime('now', '-8 days'), 'COMPLETED', datetime('now', '-9 days'), datetime('now', '-8 days')),
('demo-progress-s9-v5', 'demo-video-math-1', 'demo-student-9', 3124, 3124, datetime('now', '-6 days'), 'COMPLETED', datetime('now', '-7 days'), datetime('now', '-6 days'));

-- Student 10 (demo-student-10) - Occasional viewer
INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, lastWatchedAt, status, createdAt, updatedAt) VALUES
('demo-progress-s10-v8', 'demo-video-design-1', 'demo-student-10', 1825, 1825, datetime('now', '-3 days'), 'ACTIVE', datetime('now', '-5 days'), datetime('now', '-3 days'));

-- ============================================================
-- SUMMARY
-- ============================================================
-- This migration:
-- - Fixes LiveStream status values to match frontend (active, scheduled, ended)
-- - Updates participant count for scheduled stream to 30
-- - Adds recordingId to ended stream (shows "Disponible")
-- - Creates 11 Upload records for video files (Bunny Stream)
-- - Creates 11 Video records for lessons (with realistic durations)
-- - Creates 25 VideoPlayState records showing watch progress for all 10 students
-- 
-- This provides data for:
-- - Videos Vistos (watched video count per student)
-- - Tiempo Total (total watch time per student)
-- - Stream page columns: Estado, Duración, Grabación, Lección
