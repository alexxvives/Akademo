-- Fix demo student payment states:
-- 1. Programación Web: document signed, payment PENDING (not paid yet)
-- 2. Física Cuántica: no payment (student hasn't signed document yet)

-- Change web payment status from PAID to PENDING
UPDATE Payment SET status = 'PENDING', completedAt = NULL WHERE id = 'demo-pay-web';

-- Delete physics payment (student hasn't signed, so shouldn't have paid)
DELETE FROM Payment WHERE id = 'demo-pay-physics';
