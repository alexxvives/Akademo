-- Migration 0086: Drop dead columns
-- Payment.billingCycleStart: written on every payment INSERT but never returned
-- in any SELECT query or displayed in any UI. billingCycleEnd and nextPaymentDue
-- cover everything the UI needs.
ALTER TABLE Payment DROP COLUMN billingCycleStart;
