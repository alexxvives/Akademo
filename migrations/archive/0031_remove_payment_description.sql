-- Remove unnecessary columns from Payment table
-- Keep only essential columns for tracking

-- Remove description (can be inferred from metadata/context)
ALTER TABLE Payment DROP COLUMN description;

-- Keep completedAt - Important to distinguish when payment was registered vs completed
-- Keep metadata - Essential for linking to enrollments and storing approval info
-- Keep createdAt - Essential audit trail
