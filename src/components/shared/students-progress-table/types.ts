export interface ClassBreakdownItem {
  className: string;
  classId: string;
  teacherName?: string;
  totalWatchTime: number;
  videosWatched: number;
  totalVideos: number;
  lastActive: string | null;
  enrollmentId?: string;
  enrollmentStatus?: string;
  paymentStatus?: 'UP_TO_DATE' | 'BEHIND' | 'FREE';
  monthsBehind?: number;
}

export interface StudentProgress {
  id: string;
  name: string;
  email: string;
  className: string;
  classId?: string;
  teacherName?: string;
  totalWatchTime: number;
  videosWatched: number;
  totalVideos: number;
  lastActive: string | null;
  enrollmentId?: string;
  enrollmentStatus?: string;
  classBreakdown?: ClassBreakdownItem[];
  paymentStatus?: 'UP_TO_DATE' | 'BEHIND' | 'FREE';
  monthsBehind?: number;
  suspicionCount?: number;
}

export interface StudentsProgressTableProps {
  students: StudentProgress[];
  loading: boolean;
  searchQuery: string;
  selectedClass: string;
  showTeacherColumn?: boolean;
  showBanButton?: boolean;
  disableBanButton?: boolean;
  onBanStudent?: (enrollmentId: string) => void;
  onReadmitStudent?: (enrollmentId: string) => void;
  onAlertStudent?: (studentId: string, studentName: string) => void;
}

export interface VisibleColumns {
  asignatura: boolean;
  videosVistos: boolean;
  tiempoTotal: boolean;
  ultimaActividad: boolean;
  pagos: boolean;
  sospechas: boolean;
  acciones: boolean;
}

export const COLUMN_LABELS: Record<string, string> = {
  asignatura: 'Asignatura',
  videosVistos: 'Videos Vistos',
  tiempoTotal: 'Tiempo Total',
  ultimaActividad: 'Última Actividad',
  pagos: 'Pagos',
  sospechas: 'Sospechas',
  acciones: 'Acciones',
};
