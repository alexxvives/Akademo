-- Add releaseDate to assignments (null = always visible, sentinel date = hidden)
ALTER TABLE Assignment ADD COLUMN releaseDate TEXT;
