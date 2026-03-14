-- Add back documentSigned column to ClassEnrollment
-- This column was accidentally removed in migration 0010_restructure_database_corrected.sql
-- but it's a vital feature for legal compliance and terms acceptance

ALTER TABLE ClassEnrollment ADD COLUMN documentSigned INTEGER DEFAULT 0;

-- documentSigned: 0 = not signed, 1 = signed
-- Students need BOTH documentSigned=1 AND status='APPROVED' to access content
