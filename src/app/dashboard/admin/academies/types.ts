export interface Academy {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
  paymentStatus?: string;
  dailyEnabled?: number;
  teacherCount: number;
  studentCount: number;
  enrollmentCount: number;
  classCount: number;
  createdAt: string;
}

export interface BillingRecord {
  id: string;
  academyId: string;
  month: number;
  year: number;
  studentCount: number;
  enrollmentCount: number;
  teacherCount: number;
  pricePerEnrollment: number;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
}

export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
