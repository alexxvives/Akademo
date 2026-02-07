-- Add 19 more demo grades spanning 0-100 range with average ~80
-- Two 100/100 scores, most in 70-95 range, some in 50-69, couple below 50
-- Reusing existing demo-upload-pdf-1 through demo-upload-pdf-5 for all submissions

-- Web Assignment (maxScore: 100) - 5 more grades (average 88.6)
INSERT INTO AssignmentSubmission (id, assignmentId, studentId, uploadId, score, gradedAt, gradedBy, createdAt, updatedAt) VALUES 
('demo-sub-web-4', 'demo-assign-web-1', 'demo-student-05', 'demo-upload-pdf-1', 95, '2026-02-06 10:15:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-web-5', 'demo-assign-web-1', 'demo-student-06', 'demo-upload-pdf-2', 88, '2026-02-06 11:20:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-web-6', 'demo-assign-web-1', 'demo-student-07', 'demo-upload-pdf-3', 100, '2026-02-06 12:30:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-web-7', 'demo-assign-web-1', 'demo-student-08', 'demo-upload-pdf-4', 78, '2026-02-06 13:45:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-web-8', 'demo-assign-web-1', 'demo-student-09', 'demo-upload-pdf-5', 82, '2026-02-06 14:15:00', 'demo-teacher-user', datetime('now'), datetime('now'));

-- Math Assignment (maxScore: 50) - 5 more grades (scores 38-50, average 42.2/50 = 84%)
INSERT INTO AssignmentSubmission (id, assignmentId, studentId, uploadId, score, gradedAt, gradedBy, createdAt, updatedAt) VALUES 
('demo-sub-math-2', 'demo-assign-math-1', 'demo-student-02', 'demo-upload-pdf-1', 45, '2026-02-05 10:00:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-math-3', 'demo-assign-math-1', 'demo-student-03', 'demo-upload-pdf-2', 38, '2026-02-05 11:00:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-math-4', 'demo-assign-math-1', 'demo-student-04', 'demo-upload-pdf-3', 42, '2026-02-05 12:00:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-math-5', 'demo-assign-math-1', 'demo-student-05', 'demo-upload-pdf-4', 50, '2026-02-05 13:00:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-math-6', 'demo-assign-math-1', 'demo-student-06', 'demo-upload-pdf-5', 46, '2026-02-05 14:00:00', 'demo-teacher-user', datetime('now'), datetime('now'));

-- Physics Assignment (maxScore: 75) - 4 more grades (scores 58-75, average 68.25/75 = 91%)
INSERT INTO AssignmentSubmission (id, assignmentId, studentId, uploadId, score, gradedAt, gradedBy, createdAt, updatedAt) VALUES 
('demo-sub-physics-2', 'demo-assign-physics-1', 'demo-student-02', 'demo-upload-pdf-1', 68, '2026-02-04 09:00:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-physics-3', 'demo-assign-physics-1', 'demo-student-03', 'demo-upload-pdf-2', 72, '2026-02-04 10:00:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-physics-4', 'demo-assign-physics-1', 'demo-student-04', 'demo-upload-pdf-3', 58, '2026-02-04 11:00:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-physics-5', 'demo-assign-physics-1', 'demo-student-06', 'demo-upload-pdf-4', 75, '2026-02-04 12:00:00', 'demo-teacher-user', datetime('now'), datetime('now'));

-- Design Assignment (maxScore: 100) - 5 more grades (average 86.6)
INSERT INTO AssignmentSubmission (id, assignmentId, studentId, uploadId, score, gradedAt, gradedBy, createdAt, updatedAt) VALUES 
('demo-sub-design-1', 'demo-assign-design-1', 'demo-student-02', 'demo-upload-pdf-5', 92, '2026-02-03 10:00:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-design-2', 'demo-assign-design-1', 'demo-student-03', 'demo-upload-pdf-1', 85, '2026-02-03 11:00:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-design-3', 'demo-assign-design-1', 'demo-student-04', 'demo-upload-pdf-2', 100, '2026-02-03 12:00:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-design-4', 'demo-assign-design-1', 'demo-student-05', 'demo-upload-pdf-3', 79, '2026-02-03 13:00:00', 'demo-teacher-user', datetime('now'), datetime('now')),
('demo-sub-design-5', 'demo-assign-design-1', 'demo-student-07', 'demo-upload-pdf-4', 87, '2026-02-03 14:00:00', 'demo-teacher-user', datetime('now'), datetime('now'));

