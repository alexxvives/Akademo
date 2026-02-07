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

-- Assignment 1: Web Programming - Overdue
INSERT INTO Assignment (
  id, classId, teacherId, title, description, dueDate, maxScore, createdAt, updatedAt
) VALUES (
  'demo-assign-web-1',
  'demo-class-web',
  'demo-teacher-user',
  'Proyecto: Calculadora JavaScript',
  'Crear una calculadora funcional usando HTML, CSS y JavaScript vanilla. Debe incluir las 4 operaciones básicas y tener un diseño responsive.',
  datetime('now', '-5 days'),
  100,
  datetime('now', '-14 days'),
  datetime('now', '-14 days')
);

-- Assignment 2: Math - Currently due soon
INSERT INTO Assignment (
  id, classId, teacherId, title, description, dueDate, maxScore, createdAt, updatedAt
) VALUES (
  'demo-assign-math-1',
  'demo-class-math',
  'demo-teacher-user',
  'Ejercicios de Derivadas',
  'Resolver los ejercicios 1-20 del capítulo 3. Mostrar todo el procedimiento paso a paso.',
  datetime('now', '+3 days'),
  50,
  datetime('now', '-7 days'),
  datetime('now', '-7 days')
);

-- Assignment 3: Design - Future assignment
INSERT INTO Assignment (
  id, classId, teacherId, title, description, dueDate, maxScore, createdAt, updatedAt
) VALUES (
  'demo-assign-design-1',
  'demo-class-design',
  'demo-teacher-user',
  'Diseño de Logo Corporativo',
  'Diseñar un logo profesional para una empresa ficticia. Entregar en formato .PSD y .PNG con diferentes variaciones de color.',
  datetime('now', '+10 days'),
  100,
  datetime('now', '-2 days'),
  datetime('now', '-2 days')
);

-- Assignment 4: Physics - Overdue
INSERT INTO Assignment (
  id, classId, teacherId, title, description, dueDate, maxScore, createdAt, updatedAt
) VALUES (
  'demo-assign-physics-1',
  'demo-class-physics',
  'demo-teacher-user',
  'Problemas de Mecánica Cuántica',
  'Resolver problemas 5, 7, 12 y 15 del libro de texto. Incluir diagramas y explicaciones.',
  datetime('now', '-2 days'),
  75,
  datetime('now', '-12 days'),
  datetime('now', '-12 days')
);
