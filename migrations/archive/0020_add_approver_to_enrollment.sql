-- Add approver tracking to ClassEnrollment table
ALTER TABLE ClassEnrollment ADD COLUMN approvedBy TEXT;
ALTER TABLE ClassEnrollment ADD COLUMN approvedByName TEXT;
