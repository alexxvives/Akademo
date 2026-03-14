-- Add status columns for approval workflows
-- Academy owners need admin approval
-- Teachers need academy owner approval

-- Add status to Academy table for academy owner approvals
ALTER TABLE Academy ADD COLUMN status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- Add status to Teacher table for teacher approvals by academy owners
ALTER TABLE Teacher ADD COLUMN status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- Update existing records to APPROVED (already active)
UPDATE Academy SET status = 'APPROVED';
UPDATE Teacher SET status = 'APPROVED';
