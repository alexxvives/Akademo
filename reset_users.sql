DELETE FROM User;
INSERT INTO User (id, email, password, firstName, lastName, role, createdAt, updatedAt) VALUES 
('teacher001', 'teacher@gmail.com', '$2a$10$GP102LikvgN8fPBJde1Xi.5A22prXQ3cS/VLmJFqY8809xxBl7nPy', 'Demo', 'Teacher', 'TEACHER', datetime('now'), datetime('now')),
('student001', 'student@gmail.com', '$2a$10$GP102LikvgN8fPBJde1Xi.5A22prXQ3cS/VLmJFqY8809xxBl7nPy', 'Demo', 'Student', 'STUDENT', datetime('now'), datetime('now')),
('admin001', 'admin@academyhive.com', '$2a$10$GP102LikvgN8fPBJde1Xi.5A22prXQ3cS/VLmJFqY8809xxBl7nPy', 'Admin', 'User', 'ADMIN', datetime('now'), datetime('now'));