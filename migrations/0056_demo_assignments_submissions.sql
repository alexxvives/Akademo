-- Demo Assignment Submissions with Plantilla_Clase.pdf
-- Created: 2026-02-07
-- Purpose: Add Upload records and AssignmentSubmission records for demo accounts

-- Upload records for Plantilla_Clase.pdf (simulating student submissions)
INSERT INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, storageType, createdAt) VALUES
('demo-upload-pdf-1', 'Plantilla_Clase_MariaGarcia.pdf', 245760, 'application/pdf', 'assignments/demo-student-02/Plantilla_Clase_MariaGarcia.pdf', 'demo-student-02', 'r2', datetime('now', '-5 days')),
('demo-upload-pdf-2', 'Plantilla_Clase_CarlosRodriguez.pdf', 312450, 'application/pdf', 'assignments/demo-student-03/Plantilla_Clase_CarlosRodriguez.pdf', 'demo-student-03', 'r2', datetime('now', '-3 days')),
('demo-upload-pdf-3', 'Plantilla_Clase_AnaLopez.pdf', 289120, 'application/pdf', 'assignments/demo-student-04/Plantilla_Clase_AnaLopez.pdf', 'demo-student-04', 'r2', datetime('now', '-1 day')),
('demo-upload-pdf-4', 'Plantilla_Clase_JuanPerez.pdf', 267890, 'application/pdf', 'assignments/demo-student-05/Plantilla_Clase_JuanPerez.pdf', 'demo-student-05', 'r2', datetime('now', '-4 days')),
('demo-upload-pdf-5', 'Plantilla_Clase_LauraSanchez.pdf', 298340, 'application/pdf', 'assignments/demo-student-06/Plantilla_Clase_LauraSanchez.pdf', 'demo-student-06', 'r2', datetime('now', '-2 days'));

-- Assignment submissions (graded and ungraded)
INSERT INTO AssignmentSubmission (id, assignmentId, studentId, uploadId, version, score, feedback, submittedAt, gradedAt, gradedBy, createdAt, updatedAt) VALUES
-- Graded submissions for overdue assignment (demo-assign-web-1)
('demo-sub-web-1', 'demo-assign-web-1', 'demo-student-02', 'demo-upload-pdf-1', 1, 9.5, 'Excelente trabajo. La calculadora funciona perfectamente y el código está bien estructurado.', datetime('now', '-5 days'), datetime('now', '-3 days'), 'demo-teacher-user', datetime('now', '-5 days'), datetime('now', '-3 days')),
('demo-sub-web-2', 'demo-assign-web-1', 'demo-student-03', 'demo-upload-pdf-2', 1, 7.5, 'Buen intento, pero falta validación de inputs. Revisar manejo de errores.', datetime('now', '-4 days'), datetime('now', '-2 days'), 'demo-teacher-user', datetime('now', '-4 days'), datetime('now', '-2 days')),
('demo-sub-web-3', 'demo-assign-web-1', 'demo-student-04', 'demo-upload-pdf-3', 1, 8.0, 'Bien hecho. El diseño es limpio y funcional.', datetime('now', '-3 days'), datetime('now', '-1 day'), 'demo-teacher-user', datetime('now', '-3 days'), datetime('now', '-1 day')),

-- Graded submission for physics assignment (demo-assign-physics-1)
('demo-sub-physics-1', 'demo-assign-physics-1', 'demo-student-05', 'demo-upload-pdf-4', 1, 9.0, 'Excelente resolución de los problemas. Metodología clara.', datetime('now', '-4 days'), datetime('now', '-2 days'), 'demo-teacher-user', datetime('now', '-4 days'), datetime('now', '-2 days')),

-- Ungraded submission for current assignment (demo-assign-math-1) - waiting for teacher to grade
('demo-sub-math-1', 'demo-assign-math-1', 'demo-student-06', 'demo-upload-pdf-5', 1, NULL, NULL, datetime('now', '-2 days'), NULL, NULL, datetime('now', '-2 days'), datetime('now', '-2 days'));
