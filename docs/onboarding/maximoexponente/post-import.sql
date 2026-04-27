-- ⚠️  ALREADY APPLIED — 2026-04-17 (maximo exponente migration)
-- Do NOT run again. This creates COMPLETED payment records for legacy enrolled students.
-- Running it again is safe (NOT EXISTS guard) but unnecessary.
--
-- AKADEMO post-import migration SQL
-- Generated: 2026-04-17T15:43:02.387Z
-- Run with: npx wrangler d1 execute akademo-db --remote --file=scripts/post-import.sql

-- 1. Approve all enrollments for migrated legacy courses
UPDATE ClassEnrollment
SET status = 'APPROVED', approvedAt = '2026-04-17'
WHERE classId IN (
  SELECT id FROM Class WHERE name IN ('Biofísica',
    'Biología',
    'Biología 2ºC',
    'Biología Enfermería',
    'Biología Odontología',
    'Bioquímica Enfermería',
    'Bioquímica Veterinaria 1ºC',
    'Bioquímica Veterinaria 2º C',
    'Cálculo Avanzado de Estructuras (Máster)',
    'Cría',
    'Cría 2º Cuatrimestre',
    'Estadística Medicina',
    'Física para Veterinarios',
    'Fisiología',
    'Fisiología Vet 1ºC',
    'Fisiología Veterinaria  2ºC',
    'Genética (Veterinaria)',
    'Histología',
    'Inmunología (Veterinaria)',
    'Microbiología 2ºC (Veterinaria)',
    'Microbiología Veterinaria',
    'Preparación al parto',
    'Prueba',
    'Química Ingeniería Industrial')
);

-- 2. Create a COMPLETED payment record for each approved enrollment
-- (amount=0 because we don't know what they originally paid in Moodle)
INSERT INTO Payment (id, type, payerId, payerType, payerName, payerEmail, receiverId, amount, currency, status, paymentMethod, classId, description, createdAt, completedAt)
SELECT
  lower(hex(randomblob(16))),
  'STUDENT_TO_ACADEMY',
  ce.userId,
  'STUDENT',
  u.firstName || ' ' || u.lastName,
  u.email,
  c.academyId,
  0,
  'EUR',
  'COMPLETED',
  'migration',
  ce.classId,
  'Migrated from Moodle — payment already collected',
  '2026-04-17',
  '2026-04-17'
FROM ClassEnrollment ce
JOIN User u ON u.id = ce.userId
JOIN Class c ON c.id = ce.classId
WHERE ce.status = 'APPROVED'
  AND c.name IN ('Biofísica',
    'Biología',
    'Biología 2ºC',
    'Biología Enfermería',
    'Biología Odontología',
    'Bioquímica Enfermería',
    'Bioquímica Veterinaria 1ºC',
    'Bioquímica Veterinaria 2º C',
    'Cálculo Avanzado de Estructuras (Máster)',
    'Cría',
    'Cría 2º Cuatrimestre',
    'Estadística Medicina',
    'Física para Veterinarios',
    'Fisiología',
    'Fisiología Vet 1ºC',
    'Fisiología Veterinaria  2ºC',
    'Genética (Veterinaria)',
    'Histología',
    'Inmunología (Veterinaria)',
    'Microbiología 2ºC (Veterinaria)',
    'Microbiología Veterinaria',
    'Preparación al parto',
    'Prueba',
    'Química Ingeniería Industrial')
  AND NOT EXISTS (
    SELECT 1 FROM Payment p WHERE p.classId = ce.classId AND p.payerId = ce.userId AND p.paymentMethod = 'migration'
  );