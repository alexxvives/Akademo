-- Rename 'bizum' payment method to 'transferencia'
UPDATE Payment SET paymentMethod = 'transferencia' WHERE paymentMethod = 'bizum';
