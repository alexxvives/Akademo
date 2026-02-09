-- Migration 0054: Add demo data for LiveStreams and Assignments
-- Purpose: Complete demo data with active streams and homework assignments

-- ============================================================
-- 1. LIVE STREAMS (Past and Upcoming)
-- ============================================================

-- Past live stream for Programación Web
INSERT INTO LiveStream (
  id, classId, teacherId, status, title,
  startedAt, endedAt, zoomMeetingId, zoomLink, participantCount, createdAt
) VALUES (
  'demo-stream-web-past',
  'demo-class-web',
  'demo-teacher-user',
  'ENDED',
  'Repaso de JavaScript Moderno',
  datetime('now', '-3 days', '+10 hours'),
  datetime('now', '-3 days', '+11 hours 30 minutes'),
  '123456789',
  'https://zoom.us/j/demo123456789',
  12,
  datetime('now', '-4 days')
);

-- Upcoming live stream for Matemáticas
INSERT INTO LiveStream (
  id, classId, teacherId, status, title,
  startedAt, zoomMeetingId, zoomLink, createdAt
) VALUES (
  'demo-stream-math-upcoming',
  'demo-class-math',
  'demo-teacher-user',
  'PENDING',
  'Resolución de Problemas de Integrales',
  datetime('now', '+2 days', '+15 hours'),
  '987654321',
  'https://zoom.us/j/demo987654321',
  datetime('now', '-1 day')
);

-- Currently LIVE stream for Diseño Gráfico
INSERT INTO LiveStream (
  id, classId, teacherId, status, title,
  startedAt, zoomMeetingId, zoomLink, participantCount, createdAt
) VALUES (
  'demo-stream-design-live',
  'demo-class-design',
  'demo-teacher-user',
  'LIVE',
  'Técnicas Avanzadas de Photoshop',
  datetime('now', '-25 minutes'),
  '555888999',
  'https://zoom.us/j/demo555888999',
  8,
  datetime('now', '-2 hours')
);

-- ============================================================
-- 2. ASSIGNMENTS (Homework Tasks)
-- ============================================================
-- REMOVED: Old hardcoded assignments replaced by generateDemoAssignments() in demo-data.ts
-- These were causing duplicate ejercicios to appear after visiting payments page
