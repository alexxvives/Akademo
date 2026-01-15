/**
 * Database Types for AKADEMO
 * D1 (SQLite) specific types for Cloudflare Workers
 */

/**
 * D1 Database interface
 */
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

/**
 * D1 Prepared Statement interface
 */
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

/**
 * D1 Query Result
 */
export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: {
    duration: number;
    changes?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

/**
 * D1 Exec Result
 */
export interface D1ExecResult {
  count: number;
  duration: number;
}

/**
 * Database row types (raw D1 results)
 */
export interface UserRow {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified: number;
  createdAt: string;
  updatedAt: string;
}

export interface AcademyRow {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassRow {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  academyId: string;
  teacherId: string;
  feedbackEnabled: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonRow {
  id: string;
  title: string;
  description: string | null;
  externalUrl: string | null;
  releaseDate: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  classId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadRow {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string | null;
  bunnyGuid: string | null;
  bunnyStatus: number | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveStreamRow {
  id: string;
  title: string;
  classId: string;
  teacherId: string;
  status: string;
  zoomMeetingId: string | null;
  zoomLink: string | null;
  recordingId: string | null;
  participantCount: number | null;
  participantsFetchedAt: string | null;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface NotificationRow {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: string | null;
  read: number;
  createdAt: string;
}

export interface ClassEnrollmentRow {
  id: string;
  classId: string;
  userId: string;
  status: string;
  documentSigned: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherRow {
  id: string;
  userId: string;
  academyId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
