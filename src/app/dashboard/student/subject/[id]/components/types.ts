export interface Video {
  id: string;
  title: string;
  description: string | null;
  durationSeconds: number | null;
  bunnyGuid?: string;
  playStates: Array<{
    totalWatchTimeSeconds: number;
    sessionStartTime: string | null;
  }>;
  upload?: {
    storageType?: string;
    bunnyGuid?: string;
    storagePath?: string;
  };
}

export interface Document {
  id: string;
  title: string;
  description: string | null;
  allowDownload?: number | boolean;
  upload: {
    fileName: string;
    storagePath: string;
    mimeType?: string;
  };
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  releaseDate: string;
  topicId: string | null;
  topicName?: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videos: Video[];
  documents: Document[];
  firstVideoBunnyGuid?: string | null;
  videoCount?: number;
  documentCount?: number;
  totalVideoDuration?: number;
  totalWatchedSeconds?: number;
  links?: LessonLink[];
}

export interface LessonLink {
  id: string;
  title: string;
  url: string;
  orderIndex: number;
}

export interface Topic {
  id: string;
  name: string;
  classId: string;
  orderIndex: number;
  lessonCount: number;
  quizCount?: number;
}

export interface ClassData {
  id: string;
  name: string;
  description: string | null;
  startDate?: string | null;
  academy: {
    name: string;
    id: string;
  };
}

export interface ActiveStream {
  id: string;
  classId: string;
  title: string;
  zoomLink: string;
  status: string;
  className: string;
  teacherName: string;
}
