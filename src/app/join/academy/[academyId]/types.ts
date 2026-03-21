export interface Academy {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  ownerFirstName: string;
  ownerLastName: string;
}

export interface Class {
  id: string;
  name: string;
  description: string | null;
  teacherName: string;
}

export type AuthUser = Record<string, unknown>;
