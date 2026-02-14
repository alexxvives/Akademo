-- Add requireGrading column to Academy (whether teachers must grade exercises)
ALTER TABLE Academy ADD COLUMN requireGrading INTEGER DEFAULT 1;
