-- Add 25+ pending payments for demo data (monthly payments)
-- This simulates monthly payment system with payments from different months

-- January 2026 Monthly Payments (5 payments)
INSERT INTO Payment (id, type, payerId, receiverId, amount, currency, status, paymentMethod, classId, payerName, payerEmail, billingCycleStart, billingCycleEnd, nextPaymentDue, createdAt) VALUES
('demo-payment-jan-web-1', 'STUDENT_TO_ACADEMY', 'demo-student-02', 'demo-academy', 49.99, 'EUR', 'PENDING', 'cash', 'demo-class-web', 'María García', 'maria.garcia@demo.com', '2026-01-01', '2026-01-31', '2026-02-01', '2026-01-28 10:00:00'),
('demo-payment-jan-math-1', 'STUDENT_TO_ACADEMY', 'demo-student-03', 'demo-academy', 39.99, 'EUR', 'PENDING', 'bizum', 'demo-class-math', 'Carlos Rodríguez', 'carlos.rodriguez@demo.com', '2026-01-01', '2026-01-31', '2026-02-01', '2026-01-28 11:00:00'),
('demo-payment-jan-design-1', 'STUDENT_TO_ACADEMY', 'demo-student-04', 'demo-academy', 59.99, 'EUR', 'PENDING', 'cash', 'demo-class-design', 'Ana Martínez', 'ana.martinez@demo.com', '2026-01-01', '2026-01-31', '2026-02-01', '2026-01-28 12:00:00'),
('demo-payment-jan-physics-1', 'STUDENT_TO_ACADEMY', 'demo-student-05', 'demo-academy', 44.99, 'EUR', 'PENDING', 'bizum', 'demo-class-physics', 'Luis López', 'luis.lopez@demo.com', '2026-01-01', '2026-01-31', '2026-02-01', '2026-01-28 13:00:00'),
('demo-payment-jan-web-2', 'STUDENT_TO_ACADEMY', 'demo-student-06', 'demo-academy', 49.99, 'EUR', 'PENDING', 'cash', 'demo-class-web', 'Carmen Sánchez', 'carmen.sanchez@demo.com', '2026-01-01', '2026-01-31', '2026-02-01', '2026-01-28 14:00:00');

-- December 2025 Monthly Payments (5 payments)
INSERT INTO Payment (id, type, payerId, receiverId, amount, currency, status, paymentMethod, classId, payerName, payerEmail, billingCycleStart, billingCycleEnd, nextPaymentDue, createdAt) VALUES
('demo-payment-dec-web-1', 'STUDENT_TO_ACADEMY', 'demo-student-07', 'demo-academy', 49.99, 'EUR', 'PENDING', 'bizum', 'demo-class-web', 'José Pérez', 'jose.perez@demo.com', '2025-12-01', '2025-12-31', '2026-01-01', '2025-12-28 10:00:00'),
('demo-payment-dec-math-1', 'STUDENT_TO_ACADEMY', 'demo-student-08', 'demo-academy', 39.99, 'EUR', 'PENDING', 'cash', 'demo-class-math', 'Laura Gómez', 'laura.gomez@demo.com', '2025-12-01', '2025-12-31', '2026-01-01', '2025-12-28 11:00:00'),
('demo-payment-dec-design-1', 'STUDENT_TO_ACADEMY', 'demo-student-09', 'demo-academy', 59.99, 'EUR', 'PENDING', 'bizum', 'demo-class-design', 'Pedro Díaz', 'pedro.diaz@demo.com', '2025-12-01', '2025-12-31', '2026-01-01', '2025-12-28 12:00:00'),
('demo-payment-dec-physics-1', 'STUDENT_TO_ACADEMY', 'demo-student-10', 'demo-academy', 44.99, 'EUR', 'PENDING', 'cash', 'demo-class-physics', 'Isabel Fernández', 'isabel.fernandez@demo.com', '2025-12-01', '2025-12-31', '2026-01-01', '2025-12-28 13:00:00'),
('demo-payment-dec-web-2', 'STUDENT_TO_ACADEMY', 'demo-student-11', 'demo-academy', 49.99, 'EUR', 'PENDING', 'bizum', 'demo-class-web', 'Diego Torres', 'diego.torres@demo.com', '2025-12-01', '2025-12-31', '2026-01-01', '2025-12-28 14:00:00');

-- November 2025 Monthly Payments (5 payments)
INSERT INTO Payment (id, type, payerId, receiverId, amount, currency, status, paymentMethod, classId, payerName, payerEmail, billingCycleStart, billingCycleEnd, nextPaymentDue, createdAt) VALUES
('demo-payment-nov-web-1', 'STUDENT_TO_ACADEMY', 'demo-student-02', 'demo-academy', 49.99, 'EUR', 'CASH_PENDING', 'cash', 'demo-class-web', 'María García', 'maria.garcia@demo.com', '2025-11-01', '2025-11-30', '2025-12-01', '2025-11-28 10:00:00'),
('demo-payment-nov-math-1', 'STUDENT_TO_ACADEMY', 'demo-student-03', 'demo-academy', 39.99, 'EUR', 'CASH_PENDING', 'cash', 'demo-class-math', 'Carlos Rodríguez', 'carlos.rodriguez@demo.com', '2025-11-01', '2025-11-30', '2025-12-01', '2025-11-28 11:00:00'),
('demo-payment-nov-design-1', 'STUDENT_TO_ACADEMY', 'demo-student-04', 'demo-academy', 59.99, 'EUR', 'CASH_PENDING', 'cash', 'demo-class-design', 'Ana Martínez', 'ana.martinez@demo.com', '2025-11-01', '2025-11-30', '2025-12-01', '2025-11-28 12:00:00'),
('demo-payment-nov-physics-1', 'STUDENT_TO_ACADEMY', 'demo-student-05', 'demo-academy', 44.99, 'EUR', 'CASH_PENDING', 'cash', 'demo-class-physics', 'Luis López', 'luis.lopez@demo.com', '2025-11-01', '2025-11-30', '2025-12-01', '2025-11-28 13:00:00'),
('demo-payment-nov-web-2', 'STUDENT_TO_ACADEMY', 'demo-student-06', 'demo-academy', 49.99, 'EUR', 'CASH_PENDING', 'cash', 'demo-class-web', 'Carmen Sánchez', 'carmen.sanchez@demo.com', '2025-11-01', '2025-11-30', '2025-12-01', '2025-11-28 14:00:00');

-- October 2025 Monthly Payments (5 payments)
INSERT INTO Payment (id, type, payerId, receiverId, amount, currency, status, paymentMethod, classId, payerName, payerEmail, billingCycleStart, billingCycleEnd, nextPaymentDue, createdAt) VALUES
('demo-payment-oct-web-1', 'STUDENT_TO_ACADEMY', 'demo-student-07', 'demo-academy', 49.99, 'EUR', 'PENDING', 'bizum', 'demo-class-web', 'José Pérez', 'jose.perez@demo.com', '2025-10-01', '2025-10-31', '2025-11-01', '2025-10-28 10:00:00'),
('demo-payment-oct-math-1', 'STUDENT_TO_ACADEMY', 'demo-student-08', 'demo-academy', 39.99, 'EUR', 'PENDING', 'cash', 'demo-class-math', 'Laura Gómez', 'laura.gomez@demo.com', '2025-10-01', '2025-10-31', '2025-11-01', '2025-10-28 11:00:00'),
('demo-payment-oct-design-1', 'STUDENT_TO_ACADEMY', 'demo-student-09', 'demo-academy', 59.99, 'EUR', 'PENDING', 'bizum', 'demo-class-design', 'Pedro Díaz', 'pedro.diaz@demo.com', '2025-10-01', '2025-10-31', '2025-11-01', '2025-10-28 12:00:00'),
('demo-payment-oct-physics-1', 'STUDENT_TO_ACADEMY', 'demo-student-10', 'demo-academy', 44.99, 'EUR', 'PENDING', 'cash', 'demo-class-physics', 'Isabel Fernández', 'isabel.fernandez@demo.com', '2025-10-01', '2025-10-31', '2025-11-01', '2025-10-28 13:00:00'),
('demo-payment-oct-web-2', 'STUDENT_TO_ACADEMY', 'demo-student-11', 'demo-academy', 49.99, 'EUR', 'PENDING', 'bizum', 'demo-class-web', 'Diego Torres', 'diego.torres@demo.com', '2025-10-01', '2025-10-31', '2025-11-01', '2025-10-28 14:00:00');

-- September 2025 Monthly Payments (5 payments)
INSERT INTO Payment (id, type, payerId, receiverId, amount, currency, status, paymentMethod, classId, payerName, payerEmail, billingCycleStart, billingCycleEnd, nextPaymentDue, createdAt) VALUES
('demo-payment-sep-web-1', 'STUDENT_TO_ACADEMY', 'demo-student-02', 'demo-academy', 49.99, 'EUR', 'CASH_PENDING', 'cash', 'demo-class-web', 'María García', 'maria.garcia@demo.com', '2025-09-01', '2025-09-30', '2025-10-01', '2025-09-28 10:00:00'),
('demo-payment-sep-math-1', 'STUDENT_TO_ACADEMY', 'demo-student-03', 'demo-academy', 39.99, 'EUR', 'CASH_PENDING', 'cash', 'demo-class-math', 'Carlos Rodríguez', 'carlos.rodriguez@demo.com', '2025-09-01', '2025-09-30', '2025-10-01', '2025-09-28 11:00:00'),
('demo-payment-sep-design-1', 'STUDENT_TO_ACADEMY', 'demo-student-04', 'demo-academy', 59.99, 'EUR', 'CASH_PENDING', 'cash', 'demo-class-design', 'Ana Martínez', 'ana.martinez@demo.com', '2025-09-01', '2025-09-30', '2025-10-01', '2025-09-28 12:00:00'),
('demo-payment-sep-physics-1', 'STUDENT_TO_ACADEMY', 'demo-student-05', 'demo-academy', 44.99, 'EUR', 'CASH_PENDING', 'cash', 'demo-class-physics', 'Luis López', 'luis.lopez@demo.com', '2025-09-01', '2025-09-30', '2025-10-01', '2025-09-28 13:00:00'),
('demo-payment-sep-web-2', 'STUDENT_TO_ACADEMY', 'demo-student-06', 'demo-academy', 49.99, 'EUR', 'CASH_PENDING', 'cash', 'demo-class-web', 'Carmen Sánchez', 'carmen.sanchez@demo.com', '2025-09-01', '2025-09-30', '2025-10-01', '2025-09-28 14:00:00');

-- August 2025 Monthly Payments (3 partial month payments)
INSERT INTO Payment (id, type, payerId, receiverId, amount, currency, status, paymentMethod, classId, payerName, payerEmail, billingCycleStart, billingCycleEnd, nextPaymentDue, createdAt) VALUES
('demo-payment-aug-web-1', 'STUDENT_TO_ACADEMY', 'demo-student-07', 'demo-academy', 49.99, 'EUR', 'PENDING', 'bizum', 'demo-class-web', 'José Pérez', 'jose.perez@demo.com', '2025-08-01', '2025-08-31', '2025-09-01', '2025-08-28 10:00:00'),
('demo-payment-aug-math-1', 'STUDENT_TO_ACADEMY', 'demo-student-08', 'demo-academy', 39.99, 'EUR', 'PENDING', 'cash', 'demo-class-math', 'Laura Gómez', 'laura.gomez@demo.com', '2025-08-01', '2025-08-31', '2025-09-01', '2025-08-28 11:00:00'),
('demo-payment-aug-design-1', 'STUDENT_TO_ACADEMY', 'demo-student-09', 'demo-academy', 59.99, 'EUR', 'PENDING', 'bizum', 'demo-class-design', 'Pedro Díaz', 'pedro.diaz@demo.com', '2025-08-01', '2025-08-31', '2025-09-01', '2025-08-28 12:00:00');
