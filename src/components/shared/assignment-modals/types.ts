import type { QuizQuestionForm } from '@/components/shared/QuizQuestionBuilder';

export interface Class { id: string; name: string; }

export interface Assignment {
  id: string; title: string; description?: string; dueDate?: string; maxScore: number;
  submissionCount: number; gradedCount: number; attachmentName?: string; className?: string;
  academyName?: string; createdAt: string; classId?: string;
  uploadId?: string; attachmentIds?: string; type?: string;
  topicId?: string | null; lessonId?: string | null;
}

export interface Submission {
  id: string; studentName: string; studentEmail: string; submissionFileName: string;
  submissionFileSize: number; submittedAt: string; score?: number; feedback?: string;
  gradedAt?: string; downloadedAt?: string; uploadId: string; version?: number;
}

export interface AssignmentModalsProps {
  classes: Class[];
  paymentStatus: string;
  selectedAssignment: Assignment | null;
  // Create
  showCreateModal: boolean;
  setShowCreateModal: (v: boolean) => void;
  selectedClassForCreate: string;
  setSelectedClassForCreate: (v: string) => void;
  selectedLessonForCreate?: string;
  setSelectedLessonForCreate?: (v: string) => void;
  selectedTopicForCreate?: string;
  setSelectedTopicForCreate?: (v: string) => void;
  newTitle: string; setNewTitle: (v: string) => void;
  newDescription: string; setNewDescription: (v: string) => void;
  newDueDate: string; setNewDueDate: (v: string) => void;
  uploadFiles: File[]; setUploadFiles: (v: File[]) => void;
  uploadProgress: number;
  creating: boolean;
  handleCreateAssignment: (e: React.FormEvent) => void;
  resetForm: () => void;
  // Quiz
  assignmentType: 'file' | 'quiz';
  setAssignmentType: (v: 'file' | 'quiz') => void;
  quizQuestions: QuizQuestionForm[];
  setQuizQuestions: (q: QuizQuestionForm[]) => void;
  // Edit
  showEditModal: boolean;
  setShowEditModal: (v: boolean) => void;
  editClassId?: string; setEditClassId?: (v: string) => void;
  editTopicId?: string; setEditTopicId?: (v: string) => void;
  editLessonId?: string; setEditLessonId?: (v: string) => void;
  editTitle: string; setEditTitle: (v: string) => void;
  editDescription: string; setEditDescription: (v: string) => void;
  editDueDate: string; setEditDueDate: (v: string) => void;
  editUploadFiles: File[]; setEditUploadFiles: (v: File[]) => void;
  editQuizQuestions: QuizQuestionForm[]; setEditQuizQuestions: (q: QuizQuestionForm[]) => void;
  updating: boolean;
  handleUpdateAssignment: (e: React.FormEvent) => void;
  // Submissions
  showSubmissionsModal: boolean;
  setShowSubmissionsModal: (v: boolean) => void;
  submissions: Submission[];
  handleBulkDownload: (onlyNew: boolean) => void;
  downloadSingleSubmission: (sub: Submission) => void;
  openGradeModal: (sub: Submission) => void;
  // Grade
  showGradeModal: boolean;
  setShowGradeModal: (v: boolean) => void;
  selectedSubmission: Submission | null;
  gradeScore: number; setGradeScore: (v: number) => void;
  gradeFeedback: string; setGradeFeedback: (v: string) => void;
  handleGradeSubmission: (e: React.FormEvent) => void;
  requireGrading?: boolean;
}
