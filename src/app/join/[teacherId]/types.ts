export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  academyLogoUrl?: string | null;
  academyName?: string | null;
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
}
