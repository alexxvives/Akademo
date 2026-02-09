-- Migration 0058: Delete old demo assignment records
-- Purpose: Remove old assignment IDs (demo-assign-*) that conflict with new generateDemoAssignments() IDs (demo-a*)
-- Context: Migration 0054 created assignments with old IDs that are now duplicated by the TypeScript demo data generator

-- Delete old assignment submissions first (foreign key constraint)
DELETE FROM AssignmentSubmission 
WHERE assignmentId IN ('demo-assign-web-1', 'demo-assign-math-1', 'demo-assign-design-1', 'demo-assign-physics-1');

-- Delete old assignment records
DELETE FROM Assignment 
WHERE id IN ('demo-assign-web-1', 'demo-assign-math-1', 'demo-assign-design-1', 'demo-assign-physics-1');

-- Note: The new demo assignments use IDs demo-a1, demo-a2, demo-a3, etc. from generateDemoAssignments()
-- These are generated on-the-fly and don't persist in the database for unpaid academies
