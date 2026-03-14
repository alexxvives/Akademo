-- Fix existing enrollments that have PENDING paymentStatus but should be CASH_PENDING for paid classes
-- This migration updates all enrollments where:
-- 1. Class has a price > 0
-- 2. paymentStatus is 'PENDING' (old default)
-- 3. Status is 'APPROVED'
-- Result: Set paymentStatus = 'CASH_PENDING', paymentMethod = 'cash', paymentAmount = class.price

UPDATE ClassEnrollment
SET 
  paymentStatus = 'CASH_PENDING',
  paymentMethod = 'cash',
  paymentAmount = (SELECT price FROM Class WHERE Class.id = ClassEnrollment.classId),
  updatedAt = datetime('now')
WHERE 
  paymentStatus = 'PENDING'
  AND status = 'APPROVED'
  AND classId IN (SELECT id FROM Class WHERE price > 0);

-- Also fix free classes (price = 0) to have paymentStatus = 'PAID'
UPDATE ClassEnrollment
SET 
  paymentStatus = 'PAID',
  updatedAt = datetime('now')
WHERE 
  paymentStatus = 'PENDING'
  AND status = 'APPROVED'
  AND classId IN (SELECT id FROM Class WHERE price = 0 OR price IS NULL);
