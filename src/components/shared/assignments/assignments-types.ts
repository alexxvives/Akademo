import type { QuizQuestionForm } from '../QuizQuestionBuilder';

export interface Class {
  id: string;
  name: string;
  academyId?: string;
  academyName?: string;
  startDate?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxScore: number;
  submissionCount: number;
  gradedCount: number;
  attachmentName?: string;
  className?: string;
  academyName?: string;
  createdAt: string;
  classId?: string;
  uploadId?: string;
  attachmentIds?: string;
  solutionUploadId?: string;
  type?: 'file' | 'quiz';
  topicId?: string | null;
  topicName?: string | null;
}

export interface Submission {
  id: string;
  studentName: string;
  studentEmail: string;
  submissionFileName: string;
  submissionFileSize: number;
  submittedAt: string;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  downloadedAt?: string;
  uploadId: string;
  version?: number;
}

export interface Academy {
  id: string;
  name: string;
}

export interface AssignmentsPageProps {
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
}

export function getDueDateColor(dueDate?: string) {
  if (!dueDate) return 'text-gray-500';
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'text-gray-500';
  if (diffDays <= 1) return 'text-red-600 font-semibold';
  if (diffDays <= 5) return 'text-orange-600 font-medium';
  return 'text-gray-900';
}

export function getFileCount(a: Assignment) {
  if (a.attachmentIds && a.attachmentIds.trim()) return a.attachmentIds.split(',').filter(id => id.trim()).length;
  if (a.uploadId) return 1;
  return 0;
}

export type { QuizQuestionForm };
