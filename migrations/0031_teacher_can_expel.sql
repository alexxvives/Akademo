-- Migration: Allow academies to grant teachers the ability to expel students
ALTER TABLE Academy ADD COLUMN teachersCanExpel INTEGER DEFAULT 0;
