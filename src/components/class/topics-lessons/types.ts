export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  releaseDate: string;
  topicId: string | null;
  topicName?: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videoCount: number;
  documentCount: number;
  studentsWatching?: number;
  studentsAccessed?: number;
  avgProgress?: number;
  avgRating?: number;
  ratingCount?: number;
  firstVideoBunnyGuid?: string;
  firstVideoUpload?: { bunnyGuid?: string };
  isTranscoding?: number;
  isUploading?: boolean;
  uploadProgress?: number;
}

export interface Topic {
  id: string;
  name: string;
  classId: string;
  orderIndex: number;
  lessonCount: number;
}

export interface StudentVideoTime {
  videoId: string;
  videoTitle: string;
  totalWatchTimeSeconds: number;
  maxWatchTimeSeconds: number;
  status: string;
}

export interface StudentTimeData {
  studentId: string;
  studentName: string;
  videos: StudentVideoTime[];
}

export interface TopicsLessonsListProps {
  lessons: Lesson[];
  topics: Topic[];
  classId: string;
  totalStudents: number;
  expandTopicId?: string | null;
  highlightLessonId?: string | null;
  paymentStatus?: string;
  onSelectLesson: (lesson: Lesson) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onRescheduleLesson: (lesson: Lesson) => void;
  onTopicsChange: () => void;
  onTopicsUpdate?: (topics: Topic[] | ((prev: Topic[]) => Topic[])) => void;
  onLessonsUpdate?: (lessons: Lesson[] | ((prev: Lesson[]) => Lesson[])) => void;
  onLessonMove: (lessonId: string, topicId: string | null) => void;
  onToggleRelease: (lesson: Lesson) => void;
}
