-- Update existing demo ratings to mark some as unread (isRead=0)
-- This simulates new ratings that haven't been reviewed by the teacher

-- Mark 5 recent ratings as unread to show in notifications
UPDATE LessonRating SET isRead = 0, createdAt = '2026-02-07 08:30:00' WHERE id = 'demo-rating-5';
UPDATE LessonRating SET isRead = 0, createdAt = '2026-02-07 09:15:00' WHERE id = 'demo-rating-6';
UPDATE LessonRating SET isRead = 0, createdAt = '2026-02-07 10:00:00' WHERE id = 'demo-rating-10';
UPDATE LessonRating SET isRead = 0, createdAt = '2026-02-07 11:20:00' WHERE id = 'demo-rating-9';
UPDATE LessonRating SET isRead = 0, createdAt = '2026-02-07 12:45:00' WHERE id = 'demo-rating-8';

-- Add new demo ratings (some read, some unread)
INSERT INTO LessonRating (id, lessonId, studentId, rating, comment, isRead, createdAt) VALUES
('demo-rating-11', 'demo-lesson-design-2', 'demo-student-04', 5, 'Me encanta cómo explican Photoshop. Muy claro y práctico.', 0, '2026-02-07 14:00:00'),
('demo-rating-12', 'demo-lesson-math-3', 'demo-student-05', 4, 'Buena clase, aunque algunos ejercicios son bastante complicados.', 0, '2026-02-07 15:30:00'),
('demo-rating-13', 'demo-lesson-physics-2', 'demo-student-08', 5, '¡Excelente explicación de las leyes de Newton! Todo quedó clarísimo.', 1, '2026-02-06 16:00:00'),
('demo-rating-14', 'demo-lesson-web-1', 'demo-student-10', 3, 'Está bien pero me perdí en la parte de CSS Grid. Necesito repasarlo.', 1, '2026-02-05 17:00:00');
