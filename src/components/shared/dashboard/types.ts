// ─── Dashboard shared types ───

export interface Academy {
  id: string; name: string; ownerName: string; ownerEmail: string;
  status: string; paymentStatus?: string; teacherCount: number;
  studentCount: number; classCount: number; createdAt: string;
}

export interface Class {
  id: string; name: string; slug?: string | null; description: string | null;
  academyId?: string; academyName: string; teacherFirstName?: string;
  teacherLastName?: string; enrollmentCount: number; createdAt?: string;
  startDate?: string;
}

export interface EnrolledStudent {
  id: string; name: string; email: string; classId: string; className: string;
  academyId?: string; lessonsCompleted?: number; totalLessons?: number;
  lastActive?: string | null;
}

export interface PendingEnrollment {
  id: string;
  student: { id: string; firstName: string; lastName: string; email: string };
  class: { id: string; name: string; academyId?: string };
  enrolledAt: string;
}

export interface RatingsData {
  overall: { averageRating: number | null; totalRatings: number; ratedLessons: number };
  lessons: Array<{
    lessonId: string; lessonTitle: string; className: string; classId: string;
    academyId?: string; averageRating: number | null; ratingCount: number;
  }>;
}

export interface StreamRecord {
  classId?: string | null; participantCount?: number | null;
  startedAt?: string | null; endedAt?: string | null; createdAt?: string | null;
  academyId?: string; dailyRoomName?: string | null; zoomMeetingId?: string | null;
}

export interface ProgressRecord {
  id: string; firstName: string; lastName: string; email: string;
  classId: string; className: string; academyId?: string;
  lessonsCompleted?: number | null; totalLessons?: number | null;
  lastActive?: string | null; totalWatchTime?: number | null;
}

export interface PaymentHistoryItem {
  paymentStatus?: string | null; paymentAmount?: number | null;
  paymentMethod?: string | null; classId?: string | null;
}

export interface EnrollmentRecord {
  student: { id: string; firstName: string; lastName: string; email: string };
}

export interface DashboardPageProps { role: 'ACADEMY' | 'ADMIN'; }

export interface StudentPaymentStatus {
  alDia: number; atrasados: number; total: number;
  uniqueAlDia?: number; uniqueAtrasados?: number; uniqueTotal?: number;
}

export interface StreamStats {
  avgParticipants: number; total: number; totalHours: number;
  totalMinutes: number; dailyCoHours: number; dailyCoMinutes: number;
}

export interface PaymentStats {
  totalPaid: number; transferenciaCount: number;
  cashCount: number; stripeCount: number;
}
