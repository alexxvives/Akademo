export interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ZoomAccount {
  id: string;
  accountName: string;
  accountId: string;
}

export interface TeacherApiItem {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface Class {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  academyId?: string;
  academyName?: string;
  teacherName: string | null;
  teacherEmail?: string | null;
  teacherId: string | null;
  teacherFirstName?: string;
  teacherLastName?: string;
  studentCount: number;
  videoCount: number;
  lessonCount: number;
  documentCount: number;
  avgRating?: number | null;
  createdAt?: string;
  monthlyPrice?: number | null;
  oneTimePrice?: number | null;
  zoomAccountId?: string | null;
  zoomAccountName?: string | null;
  whatsappGroupLink?: string | null;
  maxStudents?: number | null;
  startDate?: string | null;
  university?: string | null;
  carrera?: string | null;
  activeStreamCount?: number;
  assignmentCount?: number;
}

export interface Academy {
  id: string;
  name: string;
}

export interface ClassFormData {
  name: string;
  description: string;
  teacherId: string;
  monthlyPrice: string;
  oneTimePrice: string;
  allowMonthly: boolean;
  allowOneTime: boolean;
  price: string;
  numCobros: string;
  zoomAccountId: string;
  whatsappGroupLink: string;
  maxStudents: string;
  startDate: string;
  university: string;
  carrera: string;
}

export const emptyForm: ClassFormData = {
  name: '',
  description: '',
  teacherId: '',
  monthlyPrice: '',
  oneTimePrice: '',
  allowMonthly: false,
  allowOneTime: false,
  price: '',
  numCobros: '',
  zoomAccountId: '',
  whatsappGroupLink: '',
  maxStudents: '',
  startDate: '',
  university: '',
  carrera: '',
};

export interface ClassesPageProps {
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
}
