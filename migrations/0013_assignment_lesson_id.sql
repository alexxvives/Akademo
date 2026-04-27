-- Add optional lessonId to Assignment for linking exercises to specific lessons
ALTER TABLE Assignment ADD COLUMN lessonId TEXT REFERENCES Lesson(id);
