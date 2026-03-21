// Demo data generator for unpaid academies
// Shows sample data to help academies visualize the platform before purchasing

// ============================================
// SINGLE SOURCE OF TRUTH - ALL DEMO CONSTANTS
// ============================================

export const DEMO_VIDEO_URL = "https://www.youtube.com/watch?v=2lAe1cqCOXo"; // 1-hour timer video
export const DEMO_VIDEO_GUID = "912efe98-e6af-4c29-ada3-2617f0ff6674";

// Students per class (total: 164)
export const DEMO_STUDENT_COUNT = {
  'Programación Web': 40,
  'Matemáticas Avanzadas': 32,
  'Diseño Gráfico': 60,
  'Física Cuántica': 32,
  TOTAL: 164
};

// Ratings per class (total: 35 - realistic distribution across select lessons)
export const DEMO_RATINGS_COUNT = {
  'Programación Web': 10,  // 2 lessons with 5 ratings each
  'Matemáticas Avanzadas': 9,  // 3 lessons with 3 ratings each
  'Diseño Gráfico': 12,  // 3 lessons with 4 ratings each
  'Física Cuántica': 4,  // 1 lesson with 4 ratings
  TOTAL: 35
};

// Lessons per class (total: 8 lessons)
export const DEMO_LESSONS_PER_CLASS = {
  'Programación Web': 4,    // demo-l1 to demo-l4
  'Matemáticas Avanzadas': 3, // demo-l5 to demo-l7
  'Diseño Gráfico': 1,       // demo-l8
  'Física Cuántica': 0,      // No lessons yet
  TOTAL: 8
};

// Streams (total: 5 streams)
// NOTE: participantCount MUST be <= unique student count per class after email+classId dedup:
//   Programación Web: ~15 unique, Matemáticas: ~28, Diseño Gráfico: ~47, Física Cuántica: ~30
export const DEMO_STREAMS = [
  { className: 'Programación Web', duration: 75, participantCount: 11 },    // 73% attendance (11/15)
  { className: 'Matemáticas Avanzadas', duration: 50, participantCount: 20 }, // 71% attendance (20/28)
  { className: 'Diseño Gráfico', duration: 120, participantCount: 32 },    // 68% attendance (32/47)
  { className: 'Programación Web', duration: 45, participantCount: 10 },    // 67% attendance (10/15)
  { className: 'Diseño Gráfico', duration: 65, participantCount: 35 },     // 74% attendance (35/47)
];

// Calculated stats (derived from above constants)
export const DEMO_STATS = {
  // Total stream duration: 75 + 50 + 120 + 45 + 65 = 355 minutes = 5h 55min
  totalStreamHours: 5,
  totalStreamMinutes: 55,
  
  // Average attendance per stream: (11+20+32+10+35) / 5 = 21.6
  avgStreamAttendance: 70, // Per-class avg: ~70%
  
  // Average lesson progress: 41%
  avgLessonProgress: 41,
  
  // Total class hours: 8 lessons × 1 hour = 8 hours, but user wants 15h 45min
  // So we have 8 lessons × ~118 minutes each = 15h 44min ≈ 15h 45min
  totalClassHours: 15,
  totalClassMinutes: 45,
  
  totalStudents: 164,
  totalClasses: 4,
  totalTeachers: 5,
  totalLessons: 8,
  totalStreams: 5,
};

export interface DemoTeacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  classCount: number;
  status?: string;
}

export interface DemoStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  enrolledAt: string;
  className: string;
  lastLoginAt: string | null;
}

export interface DemoRating {
  id: string;
  rating: number;
  lessonTitle: string;
  studentName: string;
  studentFirstName: string;
  studentLastName: string;
  comment: string;
  createdAt: string;
  viewed: boolean; // Track if rating has been viewed by academy
  classId: string;
}

export interface DemoStream {
  id: string;
  title: string;
  className: string;
  teacherName: string;
  participantCount: number;
  startedAt: string;
  endedAt: string;
  status: string;
  duration: number; // Duration in minutes (required)
  recordingId: string;
  classId: string;
  createdAt: string; // When stream was created
  participantsData?: string; // JSON string with participant details
}

export interface DemoZoomAccount {
  id: string;
  accountName: string;
  accountId: string;
}

export interface DemoClass {
  id: string;
  name: string;
  description: string;
  teacherName: string;
  teacherId: string;
  studentCount: number;
  videoCount: number;
  documentCount: number;
  price: number;
  monthlyPrice?: number | null;
  oneTimePrice?: number | null;
  currency: string;
  createdAt: string;
  startDate?: string;
  avgRating?: number; // Average rating to match valoraciones page
  zoomAccountId?: string | null;
  zoomAccountName?: string | null;
  whatsappGroupLink?: string | null;
  maxStudents?: number | null;
  university?: string | null;
  carrera?: string | null;
}

export interface DemoLesson {
  id: string;
  title: string;
  classId: string;
  className: string;
  videoGuid: string;
  duration: number;
  createdAt: string;
  documents?: Array<{ title: string; url: string }>;
}

export interface DemoPendingEnrollment {
  id: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  class: {
    id: string;
    name: string;
  };
  enrolledAt: string;
}

export interface DemoPayment {
  enrollmentId: string;
  studentId?: string;
  classId?: string;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  className: string;
  paymentAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  enrolledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DEMO ASSIGNMENTS & SUBMISSIONS
// ============================================

export interface DemoAssignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submissionCount: number;
  gradedCount: number;
  className: string;
  classId: string;
  createdAt: string;
  attachmentIds?: string; // Comma-separated upload IDs
  attachmentName?: string; // Display name for attachment
}

export interface DemoSubmission {
  id: string;
  assignmentId: string;
  studentName: string;
  studentEmail: string;
  submissionFileName: string;
  submissionFileSize: number;
  submittedAt: string;
  fileUrl?: string; // URL to demo PDF file
  score?: number;
  feedback?: string;
  gradedAt?: string;
  downloadedAt?: string; // Track if teacher has seen/downloaded submission
  version: number; // Submission version (if student resubmitted)
}

// ============================================
// SHARED DEMO DATA: Feedback/Valoraciones Topics Structure
// Used by BOTH academy and teacher feedback pages
// ============================================
export interface DemoFeedbackTopic {
  id: string;
  name: string;
  lessons: { id: string; title: string; ratingCount: number; startIdx: number }[];
}
