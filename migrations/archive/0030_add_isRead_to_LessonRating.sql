-- Add isRead field to LessonRating table for tracking new valoraciones
ALTER TABLE LessonRating ADD COLUMN isRead INTEGER DEFAULT 0;

-- Existing ratings are considered read
UPDATE LessonRating SET isRead = 1;
