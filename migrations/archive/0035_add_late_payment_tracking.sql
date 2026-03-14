-- Add fields to track payment delays and overdue amounts
-- Supports late payment tracking for monthly subscriptions

-- Track if enrollment has late payments
ALTER TABLE ClassEnrollment ADD COLUMN hasLatePayment INTEGER DEFAULT 0;

-- Track total amount overdue (for late monthly payments)
ALTER TABLE ClassEnrollment ADD COLUMN overdueAmount REAL DEFAULT 0;

-- Track last payment reminder sent (to avoid spam)
ALTER TABLE ClassEnrollment ADD COLUMN lastReminderSent TEXT DEFAULT NULL;
