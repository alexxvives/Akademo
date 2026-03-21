export interface TeacherClass {
  id?: string;
  name: string;
  studentCount?: number;
  revenue?: number;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  academyName?: string;
  classCount: number;
  studentCount: number;
  totalRevenue?: number;
  classes: TeacherClass[];
  createdAt: string;
}

export interface ClassSummary {
  id: string;
  name: string;
  university?: string | null;
  carrera?: string | null;
  startDate?: string | null;
}

export interface Academy {
  id: string;
  name: string;
}

export interface TeachersPageProps {
  role: 'ACADEMY' | 'ADMIN';
}
