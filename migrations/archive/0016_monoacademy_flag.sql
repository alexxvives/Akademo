-- Add monoacademy flag to Academy and Teacher tables
-- When set to 1, indicates academy owner is also the only teacher

ALTER TABLE Academy ADD COLUMN monoacademy INTEGER DEFAULT 0;
ALTER TABLE Teacher ADD COLUMN monoacademy INTEGER DEFAULT 0;
