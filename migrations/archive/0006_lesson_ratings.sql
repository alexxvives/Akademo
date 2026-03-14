-- Lesson ratings table for students to rate lessons
CREATE TABLE IF NOT EXISTS LessonRating (
  id TEXT PRIMARY KEY,
  lessonId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lessonId) REFERENCES Lesson(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(lessonId, studentId)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lesson_rating_lesson ON LessonRating(lessonId);
CREATE INDEX IF NOT EXISTS idx_lesson_rating_student ON LessonRating(studentId);
