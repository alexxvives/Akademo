-- ============================================================
-- Demo Users Migration
-- Creates 3 demo accounts for platform showcasing:
--   academia@akademo-edu.com (ACADEMY)
--   profesor@akademo-edu.com (TEACHER)
--   estudiante@akademo-edu.com (STUDENT)
-- Password for all: @Akademo1z2x
-- ============================================================

-- 1. Create Demo Users
-- Password hash: bcrypt('Akademo1z2x', 10)
INSERT OR IGNORE INTO User (id, email, password, firstName, lastName, role, createdAt)
VALUES
  ('demo-academy-user', 'academia@akademo-edu.com', '$2a$10$/drerRLNqXW6gmOCBRVuhekw5iHYZcLC1.zqMxlTEGUQrq1C65f8e', 'Academia', 'Demo', 'ACADEMY', datetime('now')),
  ('demo-teacher-user', 'profesor@akademo-edu.com', '$2a$10$/drerRLNqXW6gmOCBRVuhekw5iHYZcLC1.zqMxlTEGUQrq1C65f8e', 'Profesor', 'Demo', 'TEACHER', datetime('now')),
  ('demo-student-user', 'estudiante@akademo-edu.com', '$2a$10$/drerRLNqXW6gmOCBRVuhekw5iHYZcLC1.zqMxlTEGUQrq1C65f8e', 'Estudiante', 'Demo', 'STUDENT', datetime('now'));

-- 2. Create Demo Academy (PAID so all features are visible)
INSERT OR IGNORE INTO Academy (id, name, description, ownerId, createdAt, paymentStatus, feedbackEnabled, allowMultipleTeachers)
VALUES (
  'demo-academy-id',
  'Academia Demo AKADEMO',
  'Academia de demostración para explorar todas las funcionalidades de la plataforma AKADEMO. Incluye clases, profesores, estudiantes y contenido de ejemplo.',
  'demo-academy-user',
  datetime('now'),
  'PAID',
  1,
  1
);

-- 3. Link Teacher to Academy
INSERT OR IGNORE INTO Teacher (id, userId, academyId, createdAt)
VALUES ('demo-teacher-record', 'demo-teacher-user', 'demo-academy-id', datetime('now'));

-- 4. Create Demo Classes (matching demo-data.ts)
INSERT OR IGNORE INTO Class (id, name, slug, description, academyId, teacherId, createdAt, oneTimePrice)
VALUES
  ('demo-class-web', 'Programación Web', 'programacion-web', 'Aprende React, Next.js y TypeScript desde cero hasta nivel avanzado', 'demo-academy-id', 'demo-teacher-user', datetime('now', '-30 days'), 49.99),
  ('demo-class-math', 'Matemáticas Avanzadas', 'matematicas-avanzadas', 'Cálculo diferencial e integral para universitarios', 'demo-academy-id', 'demo-teacher-user', datetime('now', '-25 days'), 39.99),
  ('demo-class-design', 'Diseño Gráfico', 'diseno-grafico', 'Domina Adobe Creative Suite: Photoshop, Illustrator y más', 'demo-academy-id', 'demo-teacher-user', datetime('now', '-20 days'), 59.99),
  ('demo-class-physics', 'Física Cuántica', 'fisica-cuantica', 'Mecánica cuántica y sus aplicaciones modernas', 'demo-academy-id', 'demo-teacher-user', datetime('now', '-15 days'), 44.99);

-- 5. Enroll Demo Student in all classes (APPROVED + paid)
INSERT OR IGNORE INTO ClassEnrollment (id, classId, userId, status, enrolledAt, approvedAt, paymentFrequency)
VALUES
  ('demo-enroll-web', 'demo-class-web', 'demo-student-user', 'APPROVED', datetime('now', '-28 days'), datetime('now', '-27 days'), 'ONE_TIME'),
  ('demo-enroll-math', 'demo-class-math', 'demo-student-user', 'APPROVED', datetime('now', '-23 days'), datetime('now', '-22 days'), 'ONE_TIME'),
  ('demo-enroll-design', 'demo-class-design', 'demo-student-user', 'APPROVED', datetime('now', '-18 days'), datetime('now', '-17 days'), 'ONE_TIME'),
  ('demo-enroll-physics', 'demo-class-physics', 'demo-student-user', 'APPROVED', datetime('now', '-13 days'), datetime('now', '-12 days'), 'ONE_TIME');

-- 6. Create Lessons for each class
-- Programación Web: 4 lessons
INSERT OR IGNORE INTO Lesson (id, title, description, classId, maxWatchTimeMultiplier, watermarkIntervalMins, createdAt, releaseDate)
VALUES
  ('demo-lesson-web-1', 'Introducción al Curso', 'Bienvenida y configuración del entorno de desarrollo', 'demo-class-web', 2.0, 5, datetime('now', '-29 days'), datetime('now', '-29 days')),
  ('demo-lesson-web-2', 'Variables y Tipos de Datos', 'TypeScript fundamentals: tipos primitivos, interfaces y enums', 'demo-class-web', 2.0, 5, datetime('now', '-26 days'), datetime('now', '-26 days')),
  ('demo-lesson-web-3', 'Funciones y Scope', 'Funciones arrow, closures y el scope en JavaScript/TypeScript', 'demo-class-web', 2.0, 5, datetime('now', '-22 days'), datetime('now', '-22 days')),
  ('demo-lesson-web-4', 'Arrays y Objetos', 'Manipulación avanzada de arrays y objetos en TypeScript', 'demo-class-web', 2.0, 5, datetime('now', '-18 days'), datetime('now', '-18 days'));

-- Matemáticas Avanzadas: 3 lessons
INSERT OR IGNORE INTO Lesson (id, title, description, classId, maxWatchTimeMultiplier, watermarkIntervalMins, createdAt, releaseDate)
VALUES
  ('demo-lesson-math-1', 'Límites y Continuidad', 'Concepto de límite, propiedades y cálculo de límites', 'demo-class-math', 2.0, 5, datetime('now', '-24 days'), datetime('now', '-24 days')),
  ('demo-lesson-math-2', 'Derivadas', 'Reglas de derivación y aplicaciones prácticas', 'demo-class-math', 2.0, 5, datetime('now', '-20 days'), datetime('now', '-20 days')),
  ('demo-lesson-math-3', 'Integrales', 'Integral definida e indefinida, técnicas de integración', 'demo-class-math', 2.0, 5, datetime('now', '-16 days'), datetime('now', '-16 days'));

-- Diseño Gráfico: 2 lessons
INSERT OR IGNORE INTO Lesson (id, title, description, classId, maxWatchTimeMultiplier, watermarkIntervalMins, createdAt, releaseDate)
VALUES
  ('demo-lesson-design-1', 'Introducción a Photoshop', 'Herramientas básicas y flujo de trabajo', 'demo-class-design', 2.0, 5, datetime('now', '-19 days'), datetime('now', '-19 days')),
  ('demo-lesson-design-2', 'Diseño de Logotipos', 'Principios de diseño y creación de logos en Illustrator', 'demo-class-design', 2.0, 5, datetime('now', '-14 days'), datetime('now', '-14 days'));

-- Física Cuántica: 2 lessons
INSERT OR IGNORE INTO Lesson (id, title, description, classId, maxWatchTimeMultiplier, watermarkIntervalMins, createdAt, releaseDate)
VALUES
  ('demo-lesson-physics-1', 'Principios de Mecánica Cuántica', 'Dualidad onda-partícula y principio de incertidumbre', 'demo-class-physics', 2.0, 5, datetime('now', '-14 days'), datetime('now', '-14 days')),
  ('demo-lesson-physics-2', 'Ecuación de Schrödinger', 'Resolución y aplicaciones de la ecuación fundamental', 'demo-class-physics', 2.0, 5, datetime('now', '-10 days'), datetime('now', '-10 days'));

-- 7. Create additional demo students enrolled in classes (for realistic student counts)
-- 10 extra students across classes
INSERT OR IGNORE INTO User (id, email, password, firstName, lastName, role, createdAt)
VALUES
  ('demo-student-02', 'estudiantedemo02@demo.akademo.com', '$2a$10$/drerRLNqXW6gmOCBRVuhekw5iHYZcLC1.zqMxlTEGUQrq1C65f8e', 'María', 'García', 'STUDENT', datetime('now', '-20 days')),
  ('demo-student-03', 'estudiantedemo03@demo.akademo.com', '$2a$10$/drerRLNqXW6gmOCBRVuhekw5iHYZcLC1.zqMxlTEGUQrq1C65f8e', 'Carlos', 'Rodríguez', 'STUDENT', datetime('now', '-19 days')),
  ('demo-student-04', 'estudiantedemo04@demo.akademo.com', '$2a$10$/drerRLNqXW6gmOCBRVuhekw5iHYZcLC1.zqMxlTEGUQrq1C65f8e', 'Ana', 'Martínez', 'STUDENT', datetime('now', '-18 days')),
  ('demo-student-05', 'estudiantedemo05@demo.akademo.com', '$2a$10$/drerRLNqXW6gmOCBRVuhekw5iHYZcLC1.zqMxlTEGUQrq1C65f8e', 'Luis', 'López', 'STUDENT', datetime('now', '-17 days')),
  ('demo-student-06', 'estudiantedemo06@demo.akademo.com', '$2a$10$/drerRLNqXW6gmOCBRVuhekw5iHYZcLC1.zqMxlTEGUQrq1C65f8e', 'Carmen', 'Sánchez', 'STUDENT', datetime('now', '-16 days')),
  ('demo-student-07', 'estudiantedemo07@demo.akademo.com', '$2a$10$/drerRLNqXW6gmOCBRVuhekw5iHYZcLC1.zqMxlTEGUQrq1C65f8e', 'José', 'Pérez', 'STUDENT', datetime('now', '-15 days')),
  ('demo-student-08', 'estudiantedemo08@demo.akademo.com', '$2a$10$/drerRLNqXW6gmOCBRVuhekw5iHYZcLC1.zqMxlTEGUQrq1C65f8e', 'Laura', 'Gómez', 'STUDENT', datetime('now', '-14 days')),
  ('demo-student-09', 'estudiantedemo09@demo.akademo.com', '$2a$10$/drerRLNqXW6gmOCBRVuhekw5iHYZcLC1.zqMxlTEGUQrq1C65f8e', 'Pedro', 'Díaz', 'STUDENT', datetime('now', '-13 days')),
  ('demo-student-10', 'estudiantedemo10@demo.akademo.com', '$2a$10$/drerRLNqXW6gmOCBRVuhekw5iHYZcLC1.zqMxlTEGUQrq1C65f8e', 'Isabel', 'Fernández', 'STUDENT', datetime('now', '-12 days')),
  ('demo-student-11', 'estudiantedemo11@demo.akademo.com', '$2a$10$/drerRLNqXW6gmOCBRVuhekw5iHYZcLC1.zqMxlTEGUQrq1C65f8e', 'Diego', 'Torres', 'STUDENT', datetime('now', '-11 days'));

-- Enroll extra students across classes for realistic counts
INSERT OR IGNORE INTO ClassEnrollment (id, classId, userId, status, enrolledAt, approvedAt, paymentFrequency)
VALUES
  -- Programación Web (4 extra students = 5 total)
  ('demo-enroll-extra-01', 'demo-class-web', 'demo-student-02', 'APPROVED', datetime('now', '-18 days'), datetime('now', '-17 days'), 'ONE_TIME'),
  ('demo-enroll-extra-02', 'demo-class-web', 'demo-student-03', 'APPROVED', datetime('now', '-17 days'), datetime('now', '-16 days'), 'ONE_TIME'),
  ('demo-enroll-extra-03', 'demo-class-web', 'demo-student-04', 'APPROVED', datetime('now', '-16 days'), datetime('now', '-15 days'), 'ONE_TIME'),
  ('demo-enroll-extra-04', 'demo-class-web', 'demo-student-05', 'APPROVED', datetime('now', '-15 days'), datetime('now', '-14 days'), 'ONE_TIME'),
  -- Matemáticas (3 extra students = 4 total)
  ('demo-enroll-extra-05', 'demo-class-math', 'demo-student-06', 'APPROVED', datetime('now', '-14 days'), datetime('now', '-13 days'), 'ONE_TIME'),
  ('demo-enroll-extra-06', 'demo-class-math', 'demo-student-07', 'APPROVED', datetime('now', '-13 days'), datetime('now', '-12 days'), 'ONE_TIME'),
  ('demo-enroll-extra-07', 'demo-class-math', 'demo-student-08', 'APPROVED', datetime('now', '-12 days'), datetime('now', '-11 days'), 'ONE_TIME'),
  -- Diseño Gráfico (3 extra students = 4 total)
  ('demo-enroll-extra-08', 'demo-class-design', 'demo-student-02', 'APPROVED', datetime('now', '-16 days'), datetime('now', '-15 days'), 'ONE_TIME'),
  ('demo-enroll-extra-09', 'demo-class-design', 'demo-student-09', 'APPROVED', datetime('now', '-11 days'), datetime('now', '-10 days'), 'ONE_TIME'),
  ('demo-enroll-extra-10', 'demo-class-design', 'demo-student-10', 'APPROVED', datetime('now', '-10 days'), datetime('now', '-9 days'), 'ONE_TIME'),
  -- Física Cuántica (2 extra students = 3 total)
  ('demo-enroll-extra-11', 'demo-class-physics', 'demo-student-03', 'APPROVED', datetime('now', '-10 days'), datetime('now', '-9 days'), 'ONE_TIME'),
  ('demo-enroll-extra-12', 'demo-class-physics', 'demo-student-11', 'APPROVED', datetime('now', '-9 days'), datetime('now', '-8 days'), 'ONE_TIME');

-- 8. Create Payment records for the demo student enrollments
INSERT OR IGNORE INTO Payment (id, type, payerId, payerType, payerName, payerEmail, receiverId, receiverName, amount, currency, status, paymentMethod, classId, description, createdAt, completedAt)
VALUES
  ('demo-pay-web', 'STUDENT_TO_ACADEMY', 'demo-student-user', 'STUDENT', 'Estudiante Demo', 'estudianteDEMO@akademo-edu.com', 'demo-academy-id', 'Academia Demo AKADEMO', 49.99, 'EUR', 'PAID', 'stripe', 'demo-class-web', 'Matrícula: Programación Web', datetime('now', '-27 days'), datetime('now', '-27 days')),
  ('demo-pay-math', 'STUDENT_TO_ACADEMY', 'demo-student-user', 'STUDENT', 'Estudiante Demo', 'estudianteDEMO@akademo-edu.com', 'demo-academy-id', 'Academia Demo AKADEMO', 39.99, 'EUR', 'PAID', 'cash', 'demo-class-math', 'Matrícula: Matemáticas Avanzadas', datetime('now', '-22 days'), datetime('now', '-22 days')),
  ('demo-pay-design', 'STUDENT_TO_ACADEMY', 'demo-student-user', 'STUDENT', 'Estudiante Demo', 'estudianteDEMO@akademo-edu.com', 'demo-academy-id', 'Academia Demo AKADEMO', 59.99, 'EUR', 'PAID', 'bizum', 'demo-class-design', 'Matrícula: Diseño Gráfico', datetime('now', '-17 days'), datetime('now', '-17 days')),
  ('demo-pay-physics', 'STUDENT_TO_ACADEMY', 'demo-student-user', 'STUDENT', 'Estudiante Demo', 'estudianteDEMO@akademo-edu.com', 'demo-academy-id', 'Academia Demo AKADEMO', 44.99, 'EUR', 'PAID', 'stripe', 'demo-class-physics', 'Matrícula: Física Cuántica', datetime('now', '-12 days'), datetime('now', '-12 days'));

-- 9. Add some lesson ratings from the demo student
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

-- 10. Create some notifications for demo users
INSERT OR IGNORE INTO Notification (id, userId, type, title, message, isRead, createdAt)
VALUES
  ('demo-notif-1', 'demo-academy-user', 'enrollment_request', 'Nueva solicitud de matrícula', 'Estudiante Demo ha solicitado inscribirse en Programación Web', 1, datetime('now', '-28 days')),
  ('demo-notif-2', 'demo-academy-user', 'payment_received', 'Pago recibido', 'Se ha recibido un pago de 49.99€ por Programación Web', 1, datetime('now', '-27 days')),
  ('demo-notif-3', 'demo-academy-user', 'enrollment_request', 'Nueva solicitud de matrícula', 'María García ha solicitado inscribirse en Programación Web', 0, datetime('now', '-2 days')),
  ('demo-notif-4', 'demo-teacher-user', 'lesson_rating', 'Nueva valoración', 'Un estudiante ha valorado tu lección "Introducción al Curso" con 5 estrellas', 1, datetime('now', '-25 days')),
  ('demo-notif-5', 'demo-teacher-user', 'enrollment_approved', 'Estudiante aprobado', 'Estudiante Demo ha sido aprobado en Programación Web', 0, datetime('now', '-3 days')),
  ('demo-notif-6', 'demo-student-user', 'enrollment_approved', 'Matrícula aprobada', 'Tu solicitud para Programación Web ha sido aprobada', 1, datetime('now', '-27 days')),
  ('demo-notif-7', 'demo-student-user', 'new_lesson', 'Nueva lección disponible', 'Se ha publicado "Arrays y Objetos" en Programación Web', 0, datetime('now', '-18 days'));
