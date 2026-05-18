-- Assignment ratings: students rate exercises/quizzes after completing them
CREATE TABLE IF NOT EXISTS AssignmentRating (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL REFERENCES Assignment(id) ON DELETE CASCADE,
  studentId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  createdAt TEXT NOT NULL,
  UNIQUE(assignmentId, studentId)
);
