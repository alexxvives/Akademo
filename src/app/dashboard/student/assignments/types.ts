export interface Class {
  id: string;
  name: string;
  university?: string | null;
  carrera?: string | null;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxScore: number;
  type?: string;
  attachmentName?: string;
  submissionId?: string;
  submittedAt?: string;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  createdAt: string;
  className?: string;
  classId?: string;
  topicName?: string;
  uploadId?: string;
  attachmentIds?: string;
  submissionUploadId?: string;
  submissionStoragePath?: string;
  quizAttemptId?: string;
  quizScore?: number;
  quizTotalQuestions?: number;
  quizCorrectAnswers?: number;
  feedbackMode?: string;
}
