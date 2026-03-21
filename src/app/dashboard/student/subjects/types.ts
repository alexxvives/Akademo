export interface EnrolledClass {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  academyName: string;
  teacherFirstName?: string;
  teacherLastName?: string;
  videoCount: number;
  documentCount: number;
  lessonCount: number;
  studentCount: number;
  createdAt: string;
  startDate?: string | null;
  enrollmentStatus?: 'PENDING' | 'APPROVED';
  documentSigned: number;
  whatsappGroupLink?: string;
  university?: string | null;
  carrera?: string | null;
  paymentStatus?: string;
  paymentMethod?: string;
  price?: number;
  currency?: string;
  allowMonthly?: number;
  allowOneTime?: number;
  monthlyPrice?: number;
  oneTimePrice?: number;
  maxStudents?: number;
  firstPaymentAmount?: number;
  missedCycles?: number;
}

export interface ActiveStream {
  id: string;
  classId: string;
  title: string;
  zoomLink: string;
  className: string;
  teacherName: string;
}
