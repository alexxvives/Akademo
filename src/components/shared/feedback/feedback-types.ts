import type { ClassFeedback } from '../FeedbackView';

export interface Academy {
  id: string;
  name: string;
}

export interface ClassOption {
  id: string;
  name: string;
  academyId: string;
}

export interface FeedbackPageProps {
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
}

export interface ClassDataItem {
  id: string;
  name: string;
  teacherName?: string;
  teacherFirstName?: string;
  teacherLastName?: string;
  university?: string;
  carrera?: string;
  startDate?: string;
}

export interface FeedbackDataReturn {
  loading: boolean;
  classes: ClassFeedback[];
  academyName: string;
  paymentStatus: string;
  academies: Academy[];
  allClasses: ClassOption[];
  selectedAcademy: string;
  selectedClass: string;
  setSelectedAcademy: (value: string) => void;
  setSelectedClass: (value: string) => void;
  filteredClasses: ClassFeedback[];
  filteredClassOptions: ClassOption[];
  handleRatingsViewed: (ratingIds: string[]) => Promise<void>;
  isAcademy: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  activePeriodId: string;
  isClassInPeriod: (startDate?: string | null) => boolean;
}
