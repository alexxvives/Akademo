export interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  studentName: string;
  isRead?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  totalRatings: number;
  averageRating: number;
  ratings: Rating[];
}

export interface Topic {
  id: string;
  name: string;
  totalRatings: number;
  averageRating: number;
  lessons: Lesson[];
}

export interface ClassFeedback {
  id: string;
  name: string;
  academyId?: string;
  academyName?: string;
  teacherName?: string;
  university?: string | null;
  carrera?: string | null;
  startDate?: string | null;
  totalRatings: number;
  averageRating: number;
  topics: Topic[];
}

export interface FeedbackViewProps {
  classes: ClassFeedback[];
  loading: boolean;
  selectedClass?: string;
  onClassFilterChange?: (classId: string) => void;
  showClassFilter?: boolean;
  onRatingsViewed?: (ratingIds: string[]) => void;
}
