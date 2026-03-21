export interface StudentGrade {
  studentId: string;
  studentName: string;
  studentEmail: string;
  assignmentId: string;
  assignmentTitle: string;
  score: number;
  maxScore: number;
  gradedAt: string;
  className: string;
  assignmentUploadIds?: string;
  assignmentUploadId?: string;
  submissionUploadId?: string;
  assignmentStoragePath?: string;
  submissionStoragePath?: string;
}

export interface StudentAverage {
  studentId: string;
  studentName: string;
  averageGrade: number;
  totalAssignments: number;
}

export interface ClassSummary {
  id: string;
  name: string;
  university?: string | null;
  carrera?: string | null;
  startDate?: string | null;
}

export interface Academy {
  id: string;
  name: string;
}

export interface AssignmentSummary {
  id: string;
  title: string;
  maxScore: number;
  className?: string | null;
  attachmentIds?: string;
  uploadId?: string | null;
}

export interface AssignmentDetail {
  attachmentStoragePath?: string | null;
  submissions?: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  gradedAt?: string | null;
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number;
  uploadId?: string | null;
  submissionStoragePath?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface GradesPageProps {
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
}
