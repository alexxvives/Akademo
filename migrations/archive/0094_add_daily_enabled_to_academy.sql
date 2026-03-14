-- Add dailyEnabled flag to Academy table
-- Controls whether an academy can use Daily.co integrated video conferencing
-- Default: 0 (disabled) — admin must explicitly enable per academy
ALTER TABLE Academy ADD COLUMN dailyEnabled INTEGER DEFAULT 0;
