export interface Video {
  id: string;
  title: string;
  description: string | null;
  durationSeconds: number | null;
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
  isTranscoding?: number;
  videoCount?: number;
  documentCount?: number;
  linkCount?: number;
  totalVideoDuration?: number;
  totalWatchedSeconds?: number;
}

export interface StudentAssignment {
  id: string;
  title: string;
  type: 'file' | 'quiz';
  topicId: string | null;
  dueDate: string | null;
}

export interface Topic {
  id: string;
  name: string;
  classId: string;
  orderIndex: number;
  lessonCount: number;
  quizCount?: number;
}

export interface StudentTopicsLessonsListProps {
  lessons: Lesson[];
  topics: Topic[];
  assignments: StudentAssignment[];
  expandedTopics: Set<string>;
  setExpandedTopics: React.Dispatch<React.SetStateAction<Set<string>>>;
  onSelectLesson: (lesson: Lesson) => void;
}

export interface LessonCardProps {
  lesson: Lesson;
  onSelectLesson: (lesson: Lesson) => void;
}

export interface TopicSectionProps {
  topicId: string | null;
  topicName: string;
  lessons: Lesson[];
  assignments: StudentAssignment[];
  isExpanded: boolean;
  onToggle: () => void;
  onSelectLesson: (lesson: Lesson) => void;
  quizCount?: number;
}
