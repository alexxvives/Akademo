export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  academyLogoUrl?: string | null;
  academyName?: string | null;
  academyId?: string | null;
}

export interface JoinClass {
  id: string;
  name: string;
  description: string | null;
  academyName: string;
}

export type AuthUser = Record<string, unknown>;

export interface JoinFormData {
  email: string;
  password: string;
  fullName: string;
  dni: string;
  isUnderage: boolean;
  guardianName: string;
  guardianDni: string;
}
