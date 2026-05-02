-- Add DNI and guardian fields for underage students
ALTER TABLE User ADD COLUMN dni TEXT;
ALTER TABLE User ADD COLUMN isUnderage INTEGER NOT NULL DEFAULT 0;
ALTER TABLE User ADD COLUMN guardianName TEXT;
ALTER TABLE User ADD COLUMN guardianDni TEXT;
