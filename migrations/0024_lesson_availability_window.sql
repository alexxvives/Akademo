-- Add availability window to Lesson so teachers can restrict when students can watch
-- availableFrom: students cannot access the lesson before this datetime (ISO string)
-- availableUntil: students cannot access the lesson after this datetime (ISO string)
-- Both are optional; if null, no restriction applies for that bound.
ALTER TABLE Lesson ADD COLUMN availableFrom TEXT;
ALTER TABLE Lesson ADD COLUMN availableUntil TEXT;
