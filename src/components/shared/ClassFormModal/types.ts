import React from 'react';

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
  provider?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  teacherId: string | null;
  monthlyPrice?: number | null;
  oneTimePrice?: number | null;
  zoomAccountId?: string | null;
  whatsappGroupLink?: string | null;
  maxStudents?: number | null;
  startDate?: string | null;
  description: string | null;
  university?: string | null;
  carrera?: string | null;
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

export interface ClassFormModalProps {
  mode: 'create' | 'edit';
  formData: ClassFormData;
  setFormData: React.Dispatch<React.SetStateAction<ClassFormData>>;
  teachers: Teacher[];
  zoomAccounts: ZoomAccount[];
  classes: ClassItem[];
  editingClass: ClassItem | null;
  saving: boolean;
  error: string;
  paymentOptionsError: boolean;
  isDemo: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}
