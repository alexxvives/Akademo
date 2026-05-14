export interface VideoItem {
  id: string;
  title: string;
  durationSeconds: number | null;
  createdAt: string;
  lessonId: string | null;
  lessonTitle: string | null;
  classId: string;
  className: string;
  bunnyGuid: string;
  bunnyStatus: number | null;
  fileName: string | null;
  fileSize: number | null;
  source: 'lesson' | 'recording';
}

export interface DocumentItem {
  id: string;
  title: string;
  createdAt: string;
  lessonId: string;
  lessonTitle: string;
  classId: string;
  className: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
}

export interface ClassOption {
  id: string;
  name: string;
  startDate?: string;
  academyId?: string;
  academyName?: string;
}

export interface ArchivedVideoItem {
  id: string;
  academyId: string;
  classId: string | null;
  className: string | null;
  title: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  storageKey: string;
  durationSeconds: number | null;
  uploadedById: string;
  uploaderName: string | null;
  createdAt: string;
  lessonId: string | null;
  liveStreamId: string | null;
}

export type Tab = 'videos' | 'documents' | 'archived';
