-- Seed classes and enrollments for testing
-- Run this migration to add test data

-- Create AcademyMemberships (teacher-academy relationships)
-- Teacher1 belongs to Academy1, Teacher2 belongs to Academy2
INSERT OR IGNORE INTO AcademyMembership (id, userId, academyId, status, requestedAt, approvedAt, createdAt, updatedAt) VALUES
('mem-001', 'teacher-001', 'acad-001', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mem-002', 'teacher-002', 'acad-002', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create test classes
-- Math 101 taught in Academy One
-- Science 101 taught in Academy Two
INSERT OR IGNORE INTO Class (id, name, description, academyId, defaultMaxWatchTimeMultiplier, createdAt, updatedAt) VALUES
('class-001', 'Math 101', 'Introduction to Mathematics', 'acad-001', 2.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('class-002', 'Science 101', 'Introduction to Science', 'acad-002', 2.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Enroll students in classes
-- Both students enrolled in Math 101 (Academy One, Teacher One)
-- Both students enrolled in Science 101 (Academy Two, Teacher Two)
INSERT OR IGNORE INTO ClassEnrollment (id, classId, studentId, status, requestedAt, approvedAt, enrolledAt, createdAt, updatedAt) VALUES
('enroll-001', 'class-001', 'student-001', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-002', 'class-001', 'student-002', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-003', 'class-002', 'student-001', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-004', 'class-002', 'student-002', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
