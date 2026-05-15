export interface Topic {
  id: string;
  name: string;
  classId: string;
  orderIndex: number;
  lessonCount: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  releaseDate: string;
  availableFrom?: string | null;
  availableUntil?: string | null;
  topicId: string | null;
  topicName?: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videoCount: number;
  documentCount: number;
  videos?: LessonDetail['videos'];
  documents?: LessonDetail['documents'];
  studentsWatching?: number;
  avgProgress?: number;
  avgRating?: number;
  ratingCount?: number;
  firstVideoBunnyGuid?: string;
  firstVideoUpload?: { bunnyGuid?: string };
  isTranscoding?: number;
  isUploading?: boolean;
  uploadProgress?: number;
  createdAt?: string;
}

export interface LessonLink {
  id: string;
  title: string;
  url: string;
  orderIndex: number;
}

export interface LessonDetail {
  id: string;
  title: string;
  description: string | null;
  externalUrl: string | null;
  releaseDate: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  topicId?: string | null;
  videos: Array<{
    id: string;
    title: string;
    description: string | null;
    durationSeconds: number | null;
    upload?: { storageType?: string; bunnyGuid?: string };
    bunnyGuid?: string;
  }>;
  documents: Array<{ id: string; title: string; description: string | null; allowDownload?: number | boolean; upload: { storagePath: string; fileName: string; mimeType?: string } }>;
  links?: LessonLink[];
}

export interface LessonDetailResponse {
  id: string;
  title: string;
  description: string | null;
  externalUrl: string | null;
  releaseDate: string;
  availableFrom?: string | null;
  availableUntil?: string | null;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  topicId?: string | null;
  videos?: Array<{ id: string; title?: string; durationSeconds: number | null; upload?: { bunnyGuid?: string; storageType?: string } }>;
  documents?: Array<{ id: string; title?: string; allowDownload?: number | boolean; upload?: { fileName?: string; storagePath?: string } }>;
  links?: Array<{ id: string; title: string; url: string; orderIndex: number }>;
}

export interface LessonVideo {
  id: string;
  title: string;
  durationSeconds: number | null;
  upload?: { storageType?: string; bunnyGuid?: string };
  bunnyGuid?: string;
}

export interface PendingEnrollment {
  id: string;
  classId: string;
  enrolledAt: string;
  student: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface LiveClass {
  id: string;
  title: string;
  status: string;
  zoomLink?: string;
  zoomStartUrl?: string;
  zoomMeetingId?: string | null;
  joinUrl?: string;
  startUrl?: string;
  createdAt?: string;
  participantCount?: number;
  dailyRoomUrl?: string;
  dailyRoomName?: string;
}

export interface StreamRecording {
  id: string;
  title?: string;
  classId?: string;
  classSlug?: string;
  status?: string;
  recordingId?: string;
  validRecordingId?: string;
  classDeleted?: boolean;
  bunnyStatus?: number | null;
}

export interface AnalyticsData {
  videos?: Array<unknown>;
  studentEngagement?: Array<{ totalWatchTime?: number }>;
}

export interface ClassData {
  id: string;
  name: string;
  description: string | null;
  whatsappGroupLink?: string | null;
  feedbackEnabled?: number;
  academy: { id: string; name: string };
  enrollments: Array<{
    id: string;
    student: { id: string; firstName: string; lastName: string; email: string; lastLoginAt?: string | null; suspicionCount?: number };
    enrolledAt: string;
    status: string;
  }>;
}

export interface LessonFormData {
  title: string;
  description: string;
  externalUrl: string;
  releaseDate: string;
  releaseTime: string;
  publishImmediately: boolean;
  // 'window' mode: lesson is visible only between availableFrom and availableUntil
  publishMode: 'immediate' | 'scheduled' | 'window';
  availableFromDate: string;
  availableFromTime: string;
  availableUntilDate: string;
  availableUntilTime: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  topicId: string;
  videos: { file: File; title: string; description: string; duration: number }[];
  documents: { file: File; title: string; description: string; allowDownload?: boolean }[];
  selectedStreamRecordings: string[];
  links: { title: string; url: string }[];
}

export interface EditingLessonMedia {
  videos: Array<{ id: string; title: string; durationSeconds: number | null; bunnyGuid?: string }>;
  documents: Array<{ id: string; title: string; fileName: string; storagePath: string; allowDownload?: boolean }>;
  links: Array<{ id: string; title: string; url: string; orderIndex: number }>;
}

export interface LessonFeedback {
  id: string;
  rating: number;
  comment: string;
  studentName: string;
  createdAt: string;
}
