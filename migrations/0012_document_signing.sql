-- Migration: Add document signing requirement for class enrollment
-- Students must sign a consent document AND get teacher approval to access class content

-- Add documentSigned column to ClassEnrollment
ALTER TABLE ClassEnrollment ADD COLUMN documentSigned INTEGER DEFAULT 0;

-- documentSigned: 0 = not signed, 1 = signed
-- Students need BOTH documentSigned=1 AND status='APPROVED' to access content
