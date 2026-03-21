import type { ClassBreakdownItem } from '../StudentsProgressTable';

export type { ClassBreakdownItem };

export interface Class {
  id: string;
  name: string;
  academyId?: string;
  university?: string | null;
  carrera?: string | null;
  startDate?: string | null;
}

export interface Academy {
  id: string;
  name: string;
}

export interface StudentsProgressPageProps {
  role: 'TEACHER' | 'ACADEMY' | 'ADMIN';
}

export interface DemoStudentAggregate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  classes: string[];
  classIds: string[];
  lastLoginAt?: string | null;
  watchTimeBase: number;
  perClassTeachers: string[];
}

export interface StudentProgressApiRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  className: string;
  classId: string;
  teacherName?: string | null;
  totalWatchTime?: number | null;
  lessonsCompleted?: number | null;
  totalLessons?: number | null;
  lastActive?: string | null;
  enrollmentId?: string | null;
  paymentFrequency?: string | null;
  monthlyPrice?: number | null;
  oneTimePrice?: number | null;
  classStartDate?: string | null;
  enrolledAt?: string | null;
  totalPaid?: number | null;
  suspicionCount?: number | null;
}

export interface StudentProgressAggregate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  classes: string[];
  classIds: string[];
  teacherNames: string[];
  totalWatchTime: number;
  lessonsCompleted: number;
  totalLessons: number;
  lastActive?: string | null;
  enrollmentIds: string[];
  perClassRecords: ClassBreakdownItem[];
  suspicionCount: number;
}
