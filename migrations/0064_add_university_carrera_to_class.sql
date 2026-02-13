-- Add university and carrera (degree) fields to Class table
ALTER TABLE Class ADD COLUMN university TEXT DEFAULT NULL;
ALTER TABLE Class ADD COLUMN carrera TEXT DEFAULT NULL;
