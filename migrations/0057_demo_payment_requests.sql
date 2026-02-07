-- Demo Payment Requests (will reset on logout)
-- Created: 2026-02-07
-- Purpose: Add requested payments that show in demo pagos page, restored on logout

-- Payment requests (PENDING status - waiting for academy approval)
INSERT INTO Payment (id, type, payerId, payerType, payerName, payerEmail, receiverId, receiverName, amount, currency, status, paymentMethod, classId, description, createdAt) VALUES
('demo-payment-request-1', 'enrollment', 'demo-student-07', 'STUDENT', 'José Pérez', 'jose.perez@estudiantes.com', 'demo-academy-01', 'Academia Demo', 39.99, 'EUR', 'PENDING', 'bizum', 'demo-class-math', 'Solicitud de pago pendiente', datetime('now', '-1 day')),
('demo-payment-request-2', 'enrollment', 'demo-student-08', 'STUDENT', 'Laura Gómez', 'laura.gomez@estudiantes.com', 'demo-academy-01', 'Academia Demo', 49.99, 'EUR', 'PENDING', 'cash', 'demo-class-web', 'Solicitud de pago pendiente', datetime('now', '-2 days')),
('demo-payment-request-3', 'enrollment', 'demo-student-09', 'STUDENT', 'Pedro Díaz', 'pedro.diaz@estudiantes.com', 'demo-academy-01', 'Academia Demo', 59.99, 'EUR', 'PENDING', 'bizum', 'demo-class-design', 'Solicitud de pago pendiente', datetime('now', '-3 days'));

-- Note: These payments are deleted and re-inserted on logout for demo accounts (see workers/akademo-api/src/routes/auth.ts)
