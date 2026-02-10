-- ============================================================
-- RESTORE Demo Data (accidentally deleted)
-- Re-inserts all demo data rows from migrations 0053-0059
-- paymentStatus set to 'NOT PAID' for demo mode (hardcoded data)
-- ============================================================

-- 1. Academy row (THE CRITICAL ONE)
INSERT OR IGNORE INTO Academy (id, name, description, ownerId, createdAt, paymentStatus, feedbackEnabled, allowMultipleTeachers)
VALUES (
  'demo-academy-id',
  'Academia Demo',
  'Academia de demostración para explorar todas las funcionalidades de la plataforma AKADEMO. Incluye clases, profesores, estudiantes y contenido de ejemplo.',
  'demo-academy-user',
  datetime('now'),
  'NOT PAID',
  1,
  1
);

-- 2. Teacher link
INSERT OR IGNORE INTO Teacher (id, userId, academyId, createdAt)
VALUES ('demo-teacher-record', 'demo-teacher-user', 'demo-academy-id', datetime('now'));

-- 3. Classes
INSERT OR IGNORE INTO Class (id, name, slug, description, academyId, teacherId, createdAt, oneTimePrice)
VALUES
  ('demo-class-web', 'Programación Web', 'programacion-web', 'Aprende React, Next.js y TypeScript desde cero hasta nivel avanzado', 'demo-academy-id', 'demo-teacher-user', datetime('now', '-30 days'), 49.99),
  ('demo-class-math', 'Matemáticas Avanzadas', 'matematicas-avanzadas', 'Cálculo diferencial e integral para universitarios', 'demo-academy-id', 'demo-teacher-user', datetime('now', '-25 days'), 39.99),
  ('demo-class-design', 'Diseño Gráfico', 'diseno-grafico', 'Domina Adobe Creative Suite: Photoshop, Illustrator y más', 'demo-academy-id', 'demo-teacher-user', datetime('now', '-20 days'), 59.99),
  ('demo-class-physics', 'Física Cuántica', 'fisica-cuantica', 'Mecánica cuántica y sus aplicaciones modernas', 'demo-academy-id', 'demo-teacher-user', datetime('now', '-15 days'), 44.99);

-- 4. ClassEnrollments (demo student + extras)
INSERT OR IGNORE INTO ClassEnrollment (id, classId, userId, status, enrolledAt, approvedAt, paymentFrequency)
VALUES
  ('demo-enroll-web', 'demo-class-web', 'demo-student-user', 'APPROVED', datetime('now', '-28 days'), datetime('now', '-27 days'), 'ONE_TIME'),
  ('demo-enroll-math', 'demo-class-math', 'demo-student-user', 'APPROVED', datetime('now', '-23 days'), datetime('now', '-22 days'), 'ONE_TIME'),
  ('demo-enroll-design', 'demo-class-design', 'demo-student-user', 'APPROVED', datetime('now', '-18 days'), datetime('now', '-17 days'), 'ONE_TIME'),
  ('demo-enroll-physics', 'demo-class-physics', 'demo-student-user', 'APPROVED', datetime('now', '-13 days'), datetime('now', '-12 days'), 'ONE_TIME'),
  ('demo-enroll-extra-01', 'demo-class-web', 'demo-student-02', 'APPROVED', datetime('now', '-18 days'), datetime('now', '-17 days'), 'ONE_TIME'),
  ('demo-enroll-extra-02', 'demo-class-web', 'demo-student-03', 'APPROVED', datetime('now', '-17 days'), datetime('now', '-16 days'), 'ONE_TIME'),
  ('demo-enroll-extra-03', 'demo-class-web', 'demo-student-04', 'APPROVED', datetime('now', '-16 days'), datetime('now', '-15 days'), 'ONE_TIME'),
  ('demo-enroll-extra-04', 'demo-class-web', 'demo-student-05', 'APPROVED', datetime('now', '-15 days'), datetime('now', '-14 days'), 'ONE_TIME'),
  ('demo-enroll-extra-05', 'demo-class-math', 'demo-student-06', 'APPROVED', datetime('now', '-14 days'), datetime('now', '-13 days'), 'ONE_TIME'),
  ('demo-enroll-extra-06', 'demo-class-math', 'demo-student-07', 'APPROVED', datetime('now', '-13 days'), datetime('now', '-12 days'), 'ONE_TIME'),
  ('demo-enroll-extra-07', 'demo-class-math', 'demo-student-08', 'APPROVED', datetime('now', '-12 days'), datetime('now', '-11 days'), 'ONE_TIME'),
  ('demo-enroll-extra-08', 'demo-class-design', 'demo-student-02', 'APPROVED', datetime('now', '-16 days'), datetime('now', '-15 days'), 'ONE_TIME'),
  ('demo-enroll-extra-09', 'demo-class-design', 'demo-student-09', 'APPROVED', datetime('now', '-11 days'), datetime('now', '-10 days'), 'ONE_TIME'),
  ('demo-enroll-extra-10', 'demo-class-design', 'demo-student-10', 'APPROVED', datetime('now', '-10 days'), datetime('now', '-9 days'), 'ONE_TIME'),
  ('demo-enroll-extra-11', 'demo-class-physics', 'demo-student-03', 'APPROVED', datetime('now', '-10 days'), datetime('now', '-9 days'), 'ONE_TIME'),
  ('demo-enroll-extra-12', 'demo-class-physics', 'demo-student-11', 'APPROVED', datetime('now', '-9 days'), datetime('now', '-8 days'), 'ONE_TIME');

-- 5. Lessons
INSERT OR IGNORE INTO Lesson (id, title, description, classId, maxWatchTimeMultiplier, watermarkIntervalMins, createdAt, releaseDate)
VALUES
  ('demo-lesson-web-1', 'Introducción al Curso', 'Bienvenida y configuración del entorno de desarrollo', 'demo-class-web', 2.0, 5, datetime('now', '-29 days'), datetime('now', '-29 days')),
  ('demo-lesson-web-2', 'Variables y Tipos de Datos', 'TypeScript fundamentals: tipos primitivos, interfaces y enums', 'demo-class-web', 2.0, 5, datetime('now', '-26 days'), datetime('now', '-26 days')),
  ('demo-lesson-web-3', 'Funciones y Scope', 'Funciones arrow, closures y el scope en JavaScript/TypeScript', 'demo-class-web', 2.0, 5, datetime('now', '-22 days'), datetime('now', '-22 days')),
  ('demo-lesson-web-4', 'Arrays y Objetos', 'Manipulación avanzada de arrays y objetos en TypeScript', 'demo-class-web', 2.0, 5, datetime('now', '-18 days'), datetime('now', '-18 days')),
  ('demo-lesson-math-1', 'Límites y Continuidad', 'Concepto de límite, propiedades y cálculo de límites', 'demo-class-math', 2.0, 5, datetime('now', '-24 days'), datetime('now', '-24 days')),
  ('demo-lesson-math-2', 'Derivadas', 'Reglas de derivación y aplicaciones prácticas', 'demo-class-math', 2.0, 5, datetime('now', '-20 days'), datetime('now', '-20 days')),
  ('demo-lesson-math-3', 'Integrales', 'Integral definida e indefinida, técnicas de integración', 'demo-class-math', 2.0, 5, datetime('now', '-16 days'), datetime('now', '-16 days')),
  ('demo-lesson-design-1', 'Introducción a Photoshop', 'Herramientas básicas y flujo de trabajo', 'demo-class-design', 2.0, 5, datetime('now', '-19 days'), datetime('now', '-19 days')),
  ('demo-lesson-design-2', 'Diseño de Logotipos', 'Principios de diseño y creación de logos en Illustrator', 'demo-class-design', 2.0, 5, datetime('now', '-14 days'), datetime('now', '-14 days')),
  ('demo-lesson-physics-1', 'Principios de Mecánica Cuántica', 'Dualidad onda-partícula y principio de incertidumbre', 'demo-class-physics', 2.0, 5, datetime('now', '-14 days'), datetime('now', '-14 days')),
  ('demo-lesson-physics-2', 'Ecuación de Schrödinger', 'Resolución y aplicaciones de la ecuación fundamental', 'demo-class-physics', 2.0, 5, datetime('now', '-10 days'), datetime('now', '-10 days'));

-- 6. LiveStreams (from 0054 + 0055 fixes)
INSERT OR IGNORE INTO LiveStream (id, classId, teacherId, status, title, startedAt, endedAt, zoomMeetingId, zoomLink, participantCount, recordingId, createdAt)
VALUES
  ('demo-stream-web-past', 'demo-class-web', 'demo-teacher-user', 'ended', 'Repaso de JavaScript Moderno', datetime('now', '-3 days', '+10 hours'), datetime('now', '-3 days', '+11 hours 30 minutes'), '123456789', 'https://zoom.us/j/demo123456789', 12, 'demo-recording-web-past', datetime('now', '-4 days'));

INSERT OR IGNORE INTO LiveStream (id, classId, teacherId, status, title, startedAt, zoomMeetingId, zoomLink, participantCount, createdAt)
VALUES
  ('demo-stream-math-upcoming', 'demo-class-math', 'demo-teacher-user', 'scheduled', 'Resolución de Problemas de Integrales', datetime('now', '+2 days', '+15 hours'), '987654321', 'https://zoom.us/j/demo987654321', 30, datetime('now', '-1 day'));

INSERT OR IGNORE INTO LiveStream (id, classId, teacherId, status, title, startedAt, zoomMeetingId, zoomLink, participantCount, createdAt)
VALUES
  ('demo-stream-design-live', 'demo-class-design', 'demo-teacher-user', 'active', 'Técnicas Avanzadas de Photoshop', datetime('now', '-25 minutes'), '555888999', 'https://zoom.us/j/demo555888999', 8, datetime('now', '-2 hours'));

-- 7. Payments
INSERT OR IGNORE INTO Payment (id, type, payerId, payerType, payerName, payerEmail, receiverId, receiverName, amount, currency, status, paymentMethod, classId, description, createdAt, completedAt)
VALUES
  ('demo-pay-web', 'STUDENT_TO_ACADEMY', 'demo-student-user', 'STUDENT', 'Estudiante Demo', 'estudiante@akademo-edu.com', 'demo-academy-id', 'Academia Demo', 49.99, 'EUR', 'PAID', 'stripe', 'demo-class-web', 'Matrícula: Programación Web', datetime('now', '-27 days'), datetime('now', '-27 days')),
  ('demo-pay-math', 'STUDENT_TO_ACADEMY', 'demo-student-user', 'STUDENT', 'Estudiante Demo', 'estudiante@akademo-edu.com', 'demo-academy-id', 'Academia Demo', 39.99, 'EUR', 'PAID', 'cash', 'demo-class-math', 'Matrícula: Matemáticas Avanzadas', datetime('now', '-22 days'), datetime('now', '-22 days')),
  ('demo-pay-design', 'STUDENT_TO_ACADEMY', 'demo-student-user', 'STUDENT', 'Estudiante Demo', 'estudiante@akademo-edu.com', 'demo-academy-id', 'Academia Demo', 59.99, 'EUR', 'PAID', 'bizum', 'demo-class-design', 'Matrícula: Diseño Gráfico', datetime('now', '-17 days'), datetime('now', '-17 days')),
  ('demo-pay-physics', 'STUDENT_TO_ACADEMY', 'demo-student-user', 'STUDENT', 'Estudiante Demo', 'estudiante@akademo-edu.com', 'demo-academy-id', 'Academia Demo', 44.99, 'EUR', 'PAID', 'stripe', 'demo-class-physics', 'Matrícula: Física Cuántica', datetime('now', '-12 days'), datetime('now', '-12 days'));

-- 8. LessonRatings (re-insert in case they were cascade-deleted)
INSERT OR IGNORE INTO LessonRating (id, lessonId, studentId, rating, createdAt)
VALUES
  ('demo-rating-1', 'demo-lesson-web-1', 'demo-student-user', 5, datetime('now', '-25 days')),
  ('demo-rating-2', 'demo-lesson-web-2', 'demo-student-user', 4, datetime('now', '-21 days')),
  ('demo-rating-3', 'demo-lesson-math-1', 'demo-student-user', 5, datetime('now', '-20 days')),
  ('demo-rating-4', 'demo-lesson-design-1', 'demo-student-user', 4, datetime('now', '-15 days')),
  ('demo-rating-5', 'demo-lesson-web-1', 'demo-student-02', 5, datetime('now', '-16 days')),
  ('demo-rating-6', 'demo-lesson-web-2', 'demo-student-03', 4, datetime('now', '-15 days')),
  ('demo-rating-7', 'demo-lesson-math-1', 'demo-student-06', 5, datetime('now', '-12 days')),
  ('demo-rating-8', 'demo-lesson-math-2', 'demo-student-07', 3, datetime('now', '-10 days')),
  ('demo-rating-9', 'demo-lesson-design-1', 'demo-student-09', 4, datetime('now', '-9 days')),
  ('demo-rating-10', 'demo-lesson-physics-1', 'demo-student-03', 5, datetime('now', '-8 days'));

-- 9. Notifications
INSERT OR IGNORE INTO Notification (id, userId, type, title, message, isRead, createdAt)
VALUES
  ('demo-notif-1', 'demo-academy-user', 'enrollment_request', 'Nueva solicitud de matrícula', 'Estudiante Demo ha solicitado inscribirse en Programación Web', 1, datetime('now', '-28 days')),
  ('demo-notif-2', 'demo-academy-user', 'payment_received', 'Pago recibido', 'Se ha recibido un pago de 49.99€ por Programación Web', 1, datetime('now', '-27 days')),
  ('demo-notif-3', 'demo-academy-user', 'enrollment_request', 'Nueva solicitud de matrícula', 'María García ha solicitado inscribirse en Programación Web', 0, datetime('now', '-2 days')),
  ('demo-notif-4', 'demo-teacher-user', 'lesson_rating', 'Nueva valoración', 'Un estudiante ha valorado tu lección "Introducción al Curso" con 5 estrellas', 1, datetime('now', '-25 days')),
  ('demo-notif-5', 'demo-teacher-user', 'enrollment_approved', 'Estudiante aprobado', 'Estudiante Demo ha sido aprobado en Programación Web', 0, datetime('now', '-3 days')),
  ('demo-notif-6', 'demo-student-user', 'enrollment_approved', 'Matrícula aprobada', 'Tu solicitud para Programación Web ha sido aprobada', 1, datetime('now', '-27 days')),
  ('demo-notif-7', 'demo-student-user', 'new_lesson', 'Nueva lección disponible', 'Se ha publicado "Arrays y Objetos" en Programación Web', 0, datetime('now', '-18 days'));

-- 10. Uploads for videos (from 0055)
INSERT OR IGNORE INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, bunnyGuid, bunnyStatus, storageType, createdAt) VALUES
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

-- 11. Videos (from 0055)
INSERT OR IGNORE INTO Video (id, title, lessonId, uploadId, durationSeconds, createdAt) VALUES
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

-- 12. VideoPlayState (from 0055)
INSERT OR IGNORE INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, lastWatchedAt, status, createdAt, updatedAt) VALUES
('demo-progress-s1-v1', 'demo-video-web-1', 'demo-student-user', 2847, 2847, datetime('now', '-5 days'), 'COMPLETED', datetime('now', '-12 days'), datetime('now', '-5 days')),
('demo-progress-s1-v2', 'demo-video-web-2', 'demo-student-user', 1456, 1456, datetime('now', '-2 days'), 'ACTIVE', datetime('now', '-3 days'), datetime('now', '-2 days')),
('demo-progress-s1-v5', 'demo-video-math-1', 'demo-student-user', 3124, 3124, datetime('now', '-8 days'), 'COMPLETED', datetime('now', '-10 days'), datetime('now', '-8 days')),
('demo-progress-s1-v8', 'demo-video-design-1', 'demo-student-user', 1825, 1825, datetime('now', '-4 days'), 'ACTIVE', datetime('now', '-6 days'), datetime('now', '-4 days'));

-- Payment requests (from 0057)
INSERT OR IGNORE INTO Payment (id, type, payerId, payerType, payerName, payerEmail, receiverId, receiverName, amount, currency, status, paymentMethod, classId, description, createdAt) VALUES
('demo-payment-request-1', 'enrollment', 'demo-student-07', 'STUDENT', 'José Pérez', 'jose.perez@estudiantes.com', 'demo-academy-01', 'Academia Demo', 39.99, 'EUR', 'PENDING', 'bizum', 'demo-class-math', 'Solicitud de pago pendiente', datetime('now', '-1 day')),
('demo-payment-request-2', 'enrollment', 'demo-student-08', 'STUDENT', 'Laura Gómez', 'laura.gomez@estudiantes.com', 'demo-academy-01', 'Academia Demo', 49.99, 'EUR', 'PENDING', 'cash', 'demo-class-web', 'Solicitud de pago pendiente', datetime('now', '-2 days')),
('demo-payment-request-3', 'enrollment', 'demo-student-09', 'STUDENT', 'Pedro Díaz', 'pedro.diaz@estudiantes.com', 'demo-academy-01', 'Academia Demo', 59.99, 'EUR', 'PENDING', 'bizum', 'demo-class-design', 'Solicitud de pago pendiente', datetime('now', '-3 days'));
