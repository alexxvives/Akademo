-- Add unread valoraciones (ratings) to demo data
-- These will show as highlighted/unread in the teacher's valoraciones view

INSERT INTO LessonRating (id, lessonId, studentId, rating, comment, isRead, createdAt) VALUES
-- Recent unread ratings from different students
('demo-rating-unread-1', 'demo-lesson-web-4', 'demo-student-02', 5, 'Excelente explicación sobre arrays y objetos. Todo muy claro!', 0, datetime('now', '-2 hours')),
('demo-rating-unread-2', 'demo-lesson-math-3', 'demo-student-03', 4, 'Las integrales son complicadas pero la clase ayudó mucho', 0, datetime('now', '-5 hours')),
('demo-rating-unread-3', 'demo-lesson-design-2', 'demo-student-04', 5, 'Me encantó la parte de diseño de logos, muy práctico', 0, datetime('now', '-1 day')),
('demo-rating-unread-4', 'demo-lesson-web-3', 'demo-student-05', 3, 'El tema de funciones y scope me costó un poco seguirlo', 0, datetime('now', '-1 day')),
('demo-rating-unread-5', 'demo-lesson-physics-1', 'demo-student-06', 5, 'Temática muy interesante, bien explicado', 0, datetime('now', '-2 days')),
('demo-rating-unread-6', 'demo-lesson-math-2', 'demo-student-07', 4, 'Buena clase sobre derivadas', 0, datetime('now', '-3 days')),
('demo-rating-unread-7', 'demo-lesson-web-2', 'demo-student-08', 5, 'Variables y tipos de datos súper bien explicados!', 0, datetime('now', '-3 days'));
