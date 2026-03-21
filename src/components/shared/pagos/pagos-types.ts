import type { generateDemoPendingPayments, generateDemoPaymentHistory } from '@/lib/demo-data';

export interface PendingPayment {
  enrollmentId: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentAmount: number;
  currency: string;
  enrolledAt: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  classId: string;
  className: string;
  academyId: string;
  academyName: string;
  teacherName?: string;
}

export interface PaymentHistory {
  enrollmentId: string;
  paymentId?: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  className: string;
  classId: string;
  paymentAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  approvedByName?: string;
  approvedAt: string;
  teacherName?: string;
  createdAt?: string;
  updatedAt?: string;
  academyId?: string;
  academyName?: string;
}

export type DemoPendingPayment = ReturnType<typeof generateDemoPendingPayments>[number];
export type DemoHistoryPayment = ReturnType<typeof generateDemoPaymentHistory>[number];

export interface PaymentHistoryResponse {
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    status: string;
    paymentDate: string;
    dueDate: string;
    className: string;
  }>;
  totalPaid: number;
  totalDue: number;
  paymentFrequency: 'MONTHLY' | 'ONE_TIME';
  enrollmentDate: string;
  classId?: string;
}

export interface Academy {
  id: string;
  name: string;
}

export interface PagosPageProps {
  role: 'ACADEMY' | 'ADMIN';
}

export interface SelectedStudent {
  studentId: string;
  name: string;
  email: string;
  className: string;
  enrollmentDate: string;
  paymentData?: PaymentHistoryResponse | null;
  classId?: string;
}

export interface RegisterForm {
  studentId: string;
  classId: string;
  amount: string;
  paymentMethod: 'cash' | 'transferencia';
  status: 'PAID' | 'PENDING';
}
