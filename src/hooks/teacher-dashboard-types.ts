export interface Academy {
  id: string;
  name: string;
  description: string | null;
}

export interface Membership {
  id: string;
  status: string;
  academyName: string;
  academyDescription: string | null;
  requestedAt: string;
}

export interface Class {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  academyName: string;
  enrollmentCount: number;
  students?: Student[];
  zoomAccountName?: string | null;
  videoCount?: number;
  documentCount?: number;
  university?: string | null;
  carrera?: string | null;
}

export interface Student {
  id: string;
  name: string;
  email: string;
}

export interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  classId: string;
  className: string;
  lessonsCompleted?: number;
  totalLessons?: number;
  lastActive: string | null;
  totalWatchTime?: number;
}

export interface PendingEnrollment {
  id: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  class: {
    id: string;
    name: string;
  };
  enrolledAt: string;
}

export interface RatingsData {
  overall: {
    averageRating: number | null;
    totalRatings: number;
    ratedLessons: number;
  };
  lessons: Array<{
    lessonId: string;
    lessonTitle: string;
    className: string;
    classId: string;
    averageRating: number | null;
    ratingCount: number;
  }>;
}

export interface StreamStats {
  total: number;
  avgParticipants: number;
  thisMonth: number;
  totalHours: number;
  totalMinutes: number;
}

export interface ClassWatchTime {
  hours: number;
  minutes: number;
}

export interface PaymentStatusCounts {
  alDia: number;
  atrasados: number;
  uniqueAlDia: number;
  uniqueAtrasados: number;
}
