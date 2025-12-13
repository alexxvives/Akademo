-- Seed users with hashed password "password"
-- Note: bcrypt hash for "password" = $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKbPuKvYTm

INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt) VALUES
('academy-001', 'academy1@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKbPuKvYTm', 'Academy', 'One', 'ACADEMY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('academy-002', 'academy2@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKbPuKvYTm', 'Academy', 'Two', 'ACADEMY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('teacher-001', 'teacher1@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKbPuKvYTm', 'Teacher', 'One', 'TEACHER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('teacher-002', 'teacher2@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKbPuKvYTm', 'Teacher', 'Two', 'TEACHER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-001', 'student1@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKbPuKvYTm', 'Student', 'One', 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-002', 'student2@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKbPuKvYTm', 'Student', 'Two', 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Update existing admin user to use new email
UPDATE users SET email = 'admin@academo.com' WHERE email = 'admin@academyhive.com';

-- Create sample academies owned by academy users
INSERT INTO Academy (id, name, description, ownerId, createdAt, updatedAt) VALUES
('acad-001', 'Academy One Institution', 'First test academy', 'academy-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('acad-002', 'Academy Two Institution', 'Second test academy', 'academy-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
