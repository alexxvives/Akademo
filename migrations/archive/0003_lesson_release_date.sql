-- Add releaseDate to Lesson table
ALTER TABLE Lesson ADD COLUMN releaseDate TEXT DEFAULT CURRENT_TIMESTAMP;

-- Update existing lessons to have releaseDate set to their createdAt
UPDATE Lesson SET releaseDate = createdAt WHERE releaseDate IS NULL;
