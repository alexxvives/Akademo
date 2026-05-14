-- Migration: Add lessonId to ArchivedVideo so videos can be restored to their original lesson
ALTER TABLE ArchivedVideo ADD COLUMN lessonId TEXT REFERENCES Lesson(id) ON DELETE SET NULL;
