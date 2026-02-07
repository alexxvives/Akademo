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

// Ratings per class (total: 164 - one per student)
export const DEMO_RATINGS_COUNT = {
  'Programación Web': 40,
  'Matemáticas Avanzadas': 32,
  'Diseño Gráfico': 60,
  'Física Cuántica': 32,
  TOTAL: 164
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
export const DEMO_STREAMS = [
  { className: 'Programación Web', duration: 75, participantCount: 35 },    // 87.5% attendance (35/40)
  { className: 'Matemáticas Avanzadas', duration: 50, participantCount: 22 }, // 68.75% attendance (22/32)
  { className: 'Diseño Gráfico', duration: 120, participantCount: 16 },    // 26.67% attendance (16/60)
  { className: 'Programación Web', duration: 45, participantCount: 28 },    // 70% attendance (28/40)
  { className: 'Diseño Gráfico', duration: 65, participantCount: 19 },     // 31.67% attendance (19/60)
];

// Calculated stats (derived from above constants)
export const DEMO_STATS = {
  // Total stream duration: 75 + 50 + 120 + 45 + 65 = 355 minutes = 5h 55min
  totalStreamHours: 5,
  totalStreamMinutes: 55,
  
  // Average attendance: (35+22+16+28+19) / 5 streams = 24 avg per stream
  // Against total students: 24/164 = 14.6% or against avg class size: 24/41 = 58.5%
  // But we'll calculate properly: total attendees (120) / total capacity (5 streams × avg 41 students) = 120/205 = 58.5%
  avgStreamAttendance: 51, // (matches user's requirement: 51%)
  
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
  currency: string;
  createdAt: string;
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

export function generateDemoTeachers(): DemoTeacher[] {
  return [
    { id: 'demo-t1', firstName: 'María', lastName: 'García', email: 'maria.garcia@demo.com', classCount: 3, status: 'APPROVED' },
    { id: 'demo-t2', firstName: 'Carlos', lastName: 'Rodríguez', email: 'carlos.rodriguez@demo.com', classCount: 2, status: 'APPROVED' },
    { id: 'demo-t3', firstName: 'Ana', lastName: 'Martínez', email: 'ana.martinez@demo.com', classCount: 4, status: 'APPROVED' },
    { id: 'demo-t4', firstName: 'Luis', lastName: 'López', email: 'luis.lopez@demo.com', classCount: 1, status: 'APPROVED' },
    { id: 'demo-t5', firstName: 'Carmen', lastName: 'Sánchez', email: 'carmen.sanchez@demo.com', classCount: 2, status: 'APPROVED' },
  ];
}

export function generateDemoStudents(count: number = DEMO_STUDENT_COUNT.TOTAL): DemoStudent[] {
  // Fully hardcoded demo students with activity distribution:
  // 75% active (<24h), 10% active 7d (1-7 days), 10% active 30d (7-30 days), 5% inactive (never/>30d)
  const baseDate = new Date(); // Use current time so relative timestamps are always correct
  const hardcodedStudents: DemoStudent[] = [
    // Active students (last 24h) - 123 students (75%)
    { id: 'demo-s1', firstName: 'Juan', lastName: 'García', email: 'estudiante1@demo.com', enrolledAt: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 1 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s2', firstName: 'María', lastName: 'Rodríguez', email: 'estudiante2@demo.com', enrolledAt: new Date(baseDate.getTime() - 55 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s3', firstName: 'Carlos', lastName: 'Martínez', email: 'estudiante3@demo.com', enrolledAt: new Date(baseDate.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s4', firstName: 'Ana', lastName: 'López', email: 'estudiante4@demo.com', enrolledAt: new Date(baseDate.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s5', firstName: 'Luis', lastName: 'Sánchez', email: 'estudiante5@demo.com', enrolledAt: new Date(baseDate.getTime() - 70 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s6', firstName: 'Carmen', lastName: 'Pérez', email: 'estudiante6@demo.com', enrolledAt: new Date(baseDate.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s7', firstName: 'José', lastName: 'Gómez', email: 'estudiante7@demo.com', enrolledAt: new Date(baseDate.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 7 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s8', firstName: 'Laura', lastName: 'Fernández', email: 'estudiante8@demo.com', enrolledAt: new Date(baseDate.getTime() - 65 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s9', firstName: 'Miguel', lastName: 'Torres', email: 'estudiante9@demo.com', enrolledAt: new Date(baseDate.getTime() - 48 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 9 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s10', firstName: 'Isabel', lastName: 'Díaz', email: 'estudiante10@demo.com', enrolledAt: new Date(baseDate.getTime() - 52 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 10 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s11', firstName: 'Pedro', lastName: 'García', email: 'estudiante11@demo.com', enrolledAt: new Date(baseDate.getTime() - 44 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 11 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s12', firstName: 'Sofía', lastName: 'Rodríguez', email: 'estudiante12@demo.com', enrolledAt: new Date(baseDate.getTime() - 38 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 12 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s13', firstName: 'Diego', lastName: 'Martínez', email: 'estudiante13@demo.com', enrolledAt: new Date(baseDate.getTime() - 58 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 13 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s14', firstName: 'Elena', lastName: 'López', email: 'estudiante14@demo.com', enrolledAt: new Date(baseDate.getTime() - 62 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 14 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s15', firstName: 'Javier', lastName: 'Sánchez', email: 'estudiante15@demo.com', enrolledAt: new Date(baseDate.getTime() - 42 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 15 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s16', firstName: 'Juan', lastName: 'Pérez', email: 'estudiante16@demo.com', enrolledAt: new Date(baseDate.getTime() - 56 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 16 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s17', firstName: 'María', lastName: 'Gómez', email: 'estudiante17@demo.com', enrolledAt: new Date(baseDate.getTime() - 68 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 17 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s18', firstName: 'Carlos', lastName: 'Fernández', email: 'estudiante18@demo.com', enrolledAt: new Date(baseDate.getTime() - 54 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 18 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s19', firstName: 'Ana', lastName: 'Torres', email: 'estudiante19@demo.com', enrolledAt: new Date(baseDate.getTime() - 46 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 19 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s20', firstName: 'Luis', lastName: 'Díaz', email: 'estudiante20@demo.com', enrolledAt: new Date(baseDate.getTime() - 64 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 20 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s21', firstName: 'Carmen', lastName: 'García', email: 'estudiante21@demo.com', enrolledAt: new Date(baseDate.getTime() - 51 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 21 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s22', firstName: 'José', lastName: 'Rodríguez', email: 'estudiante22@demo.com', enrolledAt: new Date(baseDate.getTime() - 57 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 22 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s23', firstName: 'Laura', lastName: 'Martínez', email: 'estudiante23@demo.com', enrolledAt: new Date(baseDate.getTime() - 47 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 23 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s24', firstName: 'Miguel', lastName: 'López', email: 'estudiante24@demo.com', enrolledAt: new Date(baseDate.getTime() - 63 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 1 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s25', firstName: 'Isabel', lastName: 'Sánchez', email: 'estudiante25@demo.com', enrolledAt: new Date(baseDate.getTime() - 41 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s26', firstName: 'Pedro', lastName: 'Pérez', email: 'estudiante26@demo.com', enrolledAt: new Date(baseDate.getTime() - 59 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s27', firstName: 'Sofía', lastName: 'Gómez', email: 'estudiante27@demo.com', enrolledAt: new Date(baseDate.getTime() - 49 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s28', firstName: 'Diego', lastName: 'Fernández', email: 'estudiante28@demo.com', enrolledAt: new Date(baseDate.getTime() - 53 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s29', firstName: 'Elena', lastName: 'Torres', email: 'estudiante29@demo.com', enrolledAt: new Date(baseDate.getTime() - 67 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s30', firstName: 'Javier', lastName: 'Díaz', email: 'estudiante30@demo.com', enrolledAt: new Date(baseDate.getTime() - 43 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 7 * 60 * 60 * 1000).toISOString() },
    // Recent students (1-7 days) - 16% (reduced to make 76% active)
    { id: 'demo-s31', firstName: 'Juan', lastName: 'García', email: 'estudiante31@demo.com', enrolledAt: new Date(baseDate.getTime() - 66 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s32', firstName: 'María', lastName: 'Rodríguez', email: 'estudiante32@demo.com', enrolledAt: new Date(baseDate.getTime() - 72 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 9 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s33', firstName: 'Carlos', lastName: 'Martínez', email: 'estudiante33@demo.com', enrolledAt: new Date(baseDate.getTime() - 61 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 10 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s34', firstName: 'Ana', lastName: 'López', email: 'estudiante34@demo.com', enrolledAt: new Date(baseDate.getTime() - 69 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 11 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s35', firstName: 'Luis', lastName: 'Sánchez', email: 'estudiante35@demo.com', enrolledAt: new Date(baseDate.getTime() - 74 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 12 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s36', firstName: 'Carmen', lastName: 'Pérez', email: 'estudiante36@demo.com', enrolledAt: new Date(baseDate.getTime() - 55 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 13 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s37', firstName: 'José', lastName: 'Gómez', email: 'estudiante37@demo.com', enrolledAt: new Date(baseDate.getTime() - 71 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 14 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s38', firstName: 'Laura', lastName: 'Fernández', email: 'estudiante38@demo.com', enrolledAt: new Date(baseDate.getTime() - 76 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 15 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s39', firstName: 'Miguel', lastName: 'Torres', email: 'estudiante39@demo.com', enrolledAt: new Date(baseDate.getTime() - 65 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 16 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s40', firstName: 'Isabel', lastName: 'Díaz', email: 'estudiante40@demo.com', enrolledAt: new Date(baseDate.getTime() - 73 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 17 * 60 * 60 * 1000).toISOString() },
    // Continue with active students to reach 76% (99 students out of 130)
    { id: 'demo-s41', firstName: 'Pedro', lastName: 'García', email: 'estudiante41@demo.com', enrolledAt: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 18 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s42', firstName: 'Sofía', lastName: 'Rodríguez', email: 'estudiante42@demo.com', enrolledAt: new Date(baseDate.getTime() - 68 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 19 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s43', firstName: 'Diego', lastName: 'Martínez', email: 'estudiante43@demo.com', enrolledAt: new Date(baseDate.getTime() - 75 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 20 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s44', firstName: 'Elena', lastName: 'López', email: 'estudiante44@demo.com', enrolledAt: new Date(baseDate.getTime() - 62 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 21 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s45', firstName: 'Javier', lastName: 'Sánchez', email: 'estudiante45@demo.com', enrolledAt: new Date(baseDate.getTime() - 70 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 22 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s46', firstName: 'Juan', lastName: 'Pérez', email: 'estudiante46@demo.com', enrolledAt: new Date(baseDate.getTime() - 77 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 23 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s47', firstName: 'María', lastName: 'Gómez', email: 'estudiante47@demo.com', enrolledAt: new Date(baseDate.getTime() - 64 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 1 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s48', firstName: 'Carlos', lastName: 'Fernández', email: 'estudiante48@demo.com', enrolledAt: new Date(baseDate.getTime() - 71 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s49', firstName: 'Ana', lastName: 'Torres', email: 'estudiante49@demo.com', enrolledAt: new Date(baseDate.getTime() - 58 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s50', firstName: 'Luis', lastName: 'Díaz', email: 'estudiante50@demo.com', enrolledAt: new Date(baseDate.getTime() - 66 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s51', firstName: 'Carmen', lastName: 'García', email: 'estudiante51@demo.com', enrolledAt: new Date(baseDate.getTime() - 73 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s52', firstName: 'José', lastName: 'Rodríguez', email: 'estudiante52@demo.com', enrolledAt: new Date(baseDate.getTime() - 61 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s53', firstName: 'Laura', lastName: 'Martínez', email: 'estudiante53@demo.com', enrolledAt: new Date(baseDate.getTime() - 69 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 7 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s54', firstName: 'Miguel', lastName: 'López', email: 'estudiante54@demo.com', enrolledAt: new Date(baseDate.getTime() - 76 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s55', firstName: 'Isabel', lastName: 'Sánchez', email: 'estudiante55@demo.com', enrolledAt: new Date(baseDate.getTime() - 63 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 9 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s56', firstName: 'Pedro', lastName: 'Pérez', email: 'estudiante56@demo.com', enrolledAt: new Date(baseDate.getTime() - 71 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 10 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s57', firstName: 'Sofía', lastName: 'Gómez', email: 'estudiante57@demo.com', enrolledAt: new Date(baseDate.getTime() - 58 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 11 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s58', firstName: 'Diego', lastName: 'Fernández', email: 'estudiante58@demo.com', enrolledAt: new Date(baseDate.getTime() - 66 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 12 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s59', firstName: 'Elena', lastName: 'Torres', email: 'estudiante59@demo.com', enrolledAt: new Date(baseDate.getTime() - 74 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 13 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s60', firstName: 'Javier', lastName: 'Díaz', email: 'estudiante60@demo.com', enrolledAt: new Date(baseDate.getTime() - 62 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 14 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s61', firstName: 'Juan', lastName: 'García', email: 'estudiante61@demo.com', enrolledAt: new Date(baseDate.getTime() - 70 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 15 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s62', firstName: 'María', lastName: 'Rodríguez', email: 'estudiante62@demo.com', enrolledAt: new Date(baseDate.getTime() - 77 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 16 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s63', firstName: 'Carlos', lastName: 'Martínez', email: 'estudiante63@demo.com', enrolledAt: new Date(baseDate.getTime() - 64 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 17 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s64', firstName: 'Ana', lastName: 'López', email: 'estudiante64@demo.com', enrolledAt: new Date(baseDate.getTime() - 72 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 18 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s65', firstName: 'Luis', lastName: 'Sánchez', email: 'estudiante65@demo.com', enrolledAt: new Date(baseDate.getTime() - 59 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 19 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s66', firstName: 'Carmen', lastName: 'Pérez', email: 'estudiante66@demo.com', enrolledAt: new Date(baseDate.getTime() - 67 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 20 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s67', firstName: 'José', lastName: 'Gómez', email: 'estudiante67@demo.com', enrolledAt: new Date(baseDate.getTime() - 75 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 21 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s68', firstName: 'Laura', lastName: 'Fernández', email: 'estudiante68@demo.com', enrolledAt: new Date(baseDate.getTime() - 63 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 22 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s69', firstName: 'Miguel', lastName: 'Torres', email: 'estudiante69@demo.com', enrolledAt: new Date(baseDate.getTime() - 71 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 23 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s70', firstName: 'Isabel', lastName: 'Díaz', email: 'estudiante70@demo.com', enrolledAt: new Date(baseDate.getTime() - 78 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 1 * 60 * 60 * 1000).toISOString() },
    // Inactive students (7-30 days) - 20%
    { id: 'demo-s71', firstName: 'Pedro', lastName: 'García', email: 'estudiante71@demo.com', enrolledAt: new Date(baseDate.getTime() - 65 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s72', firstName: 'Sofía', lastName: 'Rodríguez', email: 'estudiante72@demo.com', enrolledAt: new Date(baseDate.getTime() - 73 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s73', firstName: 'Diego', lastName: 'Martínez', email: 'estudiante73@demo.com', enrolledAt: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s74', firstName: 'Elena', lastName: 'López', email: 'estudiante74@demo.com', enrolledAt: new Date(baseDate.getTime() - 68 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s75', firstName: 'Javier', lastName: 'Sánchez', email: 'estudiante75@demo.com', enrolledAt: new Date(baseDate.getTime() - 76 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s76', firstName: 'Juan', lastName: 'Pérez', email: 'estudiante76@demo.com', enrolledAt: new Date(baseDate.getTime() - 54 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 7 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s77', firstName: 'María', lastName: 'Gómez', email: 'estudiante77@demo.com', enrolledAt: new Date(baseDate.getTime() - 62 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s78', firstName: 'Carlos', lastName: 'Fernández', email: 'estudiante78@demo.com', enrolledAt: new Date(baseDate.getTime() - 70 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 9 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s79', firstName: 'Ana', lastName: 'Torres', email: 'estudiante79@demo.com', enrolledAt: new Date(baseDate.getTime() - 57 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 10 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s80', firstName: 'Luis', lastName: 'Díaz', email: 'estudiante80@demo.com', enrolledAt: new Date(baseDate.getTime() - 65 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 11 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s81', firstName: 'Carmen', lastName: 'García', email: 'estudiante81@demo.com', enrolledAt: new Date(baseDate.getTime() - 73 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 12 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s82', firstName: 'José', lastName: 'Rodríguez', email: 'estudiante82@demo.com', enrolledAt: new Date(baseDate.getTime() - 61 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 13 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s83', firstName: 'Laura', lastName: 'Martínez', email: 'estudiante83@demo.com', enrolledAt: new Date(baseDate.getTime() - 69 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 14 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s84', firstName: 'Miguel', lastName: 'López', email: 'estudiante84@demo.com', enrolledAt: new Date(baseDate.getTime() - 56 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 15 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s85', firstName: 'Isabel', lastName: 'Sánchez', email: 'estudiante85@demo.com', enrolledAt: new Date(baseDate.getTime() - 64 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 16 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s86', firstName: 'Pedro', lastName: 'Pérez', email: 'estudiante86@demo.com', enrolledAt: new Date(baseDate.getTime() - 72 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 17 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s87', firstName: 'Sofía', lastName: 'Gómez', email: 'estudiante87@demo.com', enrolledAt: new Date(baseDate.getTime() - 59 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 18 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s88', firstName: 'Diego', lastName: 'Fernández', email: 'estudiante88@demo.com', enrolledAt: new Date(baseDate.getTime() - 67 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 19 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s89', firstName: 'Elena', lastName: 'Torres', email: 'estudiante89@demo.com', enrolledAt: new Date(baseDate.getTime() - 75 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 20 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s90', firstName: 'Javier', lastName: 'Díaz', email: 'estudiante90@demo.com', enrolledAt: new Date(baseDate.getTime() - 63 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 21 * 60 * 60 * 1000).toISOString() },
    // Never logged in - 10%
    { id: 'demo-s91', firstName: 'Juan', lastName: 'García', email: 'estudiante91@demo.com', enrolledAt: new Date(baseDate.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 22 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s92', firstName: 'María', lastName: 'Rodríguez', email: 'estudiante92@demo.com', enrolledAt: new Date(baseDate.getTime() - 55 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 23 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s93', firstName: 'Carlos', lastName: 'Martínez', email: 'estudiante93@demo.com', enrolledAt: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 1 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s94', firstName: 'Ana', lastName: 'López', email: 'estudiante94@demo.com', enrolledAt: new Date(baseDate.getTime() - 65 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s95', firstName: 'Luis', lastName: 'Sánchez', email: 'estudiante95@demo.com', enrolledAt: new Date(baseDate.getTime() - 70 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s96', firstName: 'Carmen', lastName: 'Pérez', email: 'estudiante96@demo.com', enrolledAt: new Date(baseDate.getTime() - 75 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s97', firstName: 'José', lastName: 'Gómez', email: 'estudiante97@demo.com', enrolledAt: new Date(baseDate.getTime() - 52 * 24 * 60 * 60 * 1000).toISOString(), className: 'Programación Web', lastLoginAt: new Date(baseDate.getTime() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s98', firstName: 'Laura', lastName: 'Fernández', email: 'estudiante98@demo.com', enrolledAt: new Date(baseDate.getTime() - 58 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s99', firstName: 'Miguel', lastName: 'Torres', email: 'estudiante99@demo.com', enrolledAt: new Date(baseDate.getTime() - 63 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 7 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s100', firstName: 'Isabel', lastName: 'Díaz', email: 'estudiante100@demo.com', enrolledAt: new Date(baseDate.getTime() - 68 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000).toISOString() },
    // Extra Diseño Gráfico students - 30 more
    { id: 'demo-s101', firstName: 'Antonio', lastName: 'García', email: 'estudiante101@demo.com', enrolledAt: new Date(baseDate.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 9 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s102', firstName: 'Beatriz', lastName: 'Rodríguez', email: 'estudiante102@demo.com', enrolledAt: new Date(baseDate.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 10 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s103', firstName: 'Cristina', lastName: 'Martínez', email: 'estudiante103@demo.com', enrolledAt: new Date(baseDate.getTime() - 55 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 11 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s104', firstName: 'Daniel', lastName: 'López', email: 'estudiante104@demo.com', enrolledAt: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 12 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s105', firstName: 'Eva', lastName: 'Sánchez', email: 'estudiante105@demo.com', enrolledAt: new Date(baseDate.getTime() - 65 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 13 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s106', firstName: 'Fernando', lastName: 'Pérez', email: 'estudiante106@demo.com', enrolledAt: new Date(baseDate.getTime() - 42 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 14 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s107', firstName: 'Gloria', lastName: 'Gómez', email: 'estudiante107@demo.com', enrolledAt: new Date(baseDate.getTime() - 47 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 15 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s108', firstName: 'Héctor', lastName: 'Fernández', email: 'estudiante108@demo.com', enrolledAt: new Date(baseDate.getTime() - 52 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 16 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s109', firstName: 'Irene', lastName: 'Torres', email: 'estudiante109@demo.com', enrolledAt: new Date(baseDate.getTime() - 57 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 17 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s110', firstName: 'Jorge', lastName: 'Díaz', email: 'estudiante110@demo.com', enrolledAt: new Date(baseDate.getTime() - 62 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 18 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s111', firstName: 'Karina', lastName: 'García', email: 'estudiante111@demo.com', enrolledAt: new Date(baseDate.getTime() - 67 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 19 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s112', firstName: 'Luis', lastName: 'Rodríguez', email: 'estudiante112@demo.com', enrolledAt: new Date(baseDate.getTime() - 72 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 20 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s113', firstName: 'Marta', lastName: 'Martínez', email: 'estudiante113@demo.com', enrolledAt: new Date(baseDate.getTime() - 49 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 21 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s114', firstName: 'Natalia', lastName: 'López', email: 'estudiante114@demo.com', enrolledAt: new Date(baseDate.getTime() - 54 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 22 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s115', firstName: 'Oscar', lastName: 'Sánchez', email: 'estudiante115@demo.com', enrolledAt: new Date(baseDate.getTime() - 59 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 23 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s116', firstName: 'Patricia', lastName: 'Pérez', email: 'estudiante116@demo.com', enrolledAt: new Date(baseDate.getTime() - 64 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 1 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s117', firstName: 'Quique', lastName: 'Gómez', email: 'estudiante117@demo.com', enrolledAt: new Date(baseDate.getTime() - 69 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s118', firstName: 'Raúl', lastName: 'Fernández', email: 'estudiante118@demo.com', enrolledAt: new Date(baseDate.getTime() - 74 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s119', firstName: 'Sara', lastName: 'Torres', email: 'estudiante119@demo.com', enrolledAt: new Date(baseDate.getTime() - 51 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s120', firstName: 'Tomás', lastName: 'Díaz', email: 'estudiante120@demo.com', enrolledAt: new Date(baseDate.getTime() - 56 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s121', firstName: 'Ursula', lastName: 'García', email: 'estudiante121@demo.com', enrolledAt: new Date(baseDate.getTime() - 61 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s122', firstName: 'Víctor', lastName: 'Rodríguez', email: 'estudiante122@demo.com', enrolledAt: new Date(baseDate.getTime() - 66 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 7 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s123', firstName: 'Wendy', lastName: 'Martínez', email: 'estudiante123@demo.com', enrolledAt: new Date(baseDate.getTime() - 71 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s124', firstName: 'Xavier', lastName: 'López', email: 'estudiante124@demo.com', enrolledAt: new Date(baseDate.getTime() - 48 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s125', firstName: 'Yolanda', lastName: 'Sánchez', email: 'estudiante125@demo.com', enrolledAt: new Date(baseDate.getTime() - 53 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s126', firstName: 'Zoe', lastName: 'Pérez', email: 'estudiante126@demo.com', enrolledAt: new Date(baseDate.getTime() - 58 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s127', firstName: 'Alberto', lastName: 'Gómez', email: 'estudiante127@demo.com', enrolledAt: new Date(baseDate.getTime() - 63 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s128', firstName: 'Brenda', lastName: 'Fernández', email: 'estudiante128@demo.com', enrolledAt: new Date(baseDate.getTime() - 68 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s129', firstName: 'Camilo', lastName: 'Torres', email: 'estudiante129@demo.com', enrolledAt: new Date(baseDate.getTime() - 73 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s130', firstName: 'Diana', lastName: 'Díaz', email: 'estudiante130@demo.com', enrolledAt: new Date(baseDate.getTime() - 78 * 24 * 60 * 60 * 1000).toISOString(), className: 'Diseño Gráfico', lastLoginAt: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    
    // Additional Matemáticas Avanzadas students (demo-s131 to demo-s140) - 10 students
    { id: 'demo-s131', firstName: 'Eduardo', lastName: 'García', email: 'estudiante131@demo.com', enrolledAt: new Date(baseDate.getTime() - 44 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s132', firstName: 'Fernanda', lastName: 'Rodríguez', email: 'estudiante132@demo.com', enrolledAt: new Date(baseDate.getTime() - 49 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s133', firstName: 'Germán', lastName: 'Martínez', email: 'estudiante133@demo.com', enrolledAt: new Date(baseDate.getTime() - 53 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s134', firstName: 'Helena', lastName: 'López', email: 'estudiante134@demo.com', enrolledAt: new Date(baseDate.getTime() - 57 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s135', firstName: 'Ignacio', lastName: 'Sánchez', email: 'estudiante135@demo.com', enrolledAt: new Date(baseDate.getTime() - 61 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s136', firstName: 'Julia', lastName: 'Pérez', email: 'estudiante136@demo.com', enrolledAt: new Date(baseDate.getTime() - 46 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s137', firstName: 'Kevin', lastName: 'Gómez', email: 'estudiante137@demo.com', enrolledAt: new Date(baseDate.getTime() - 51 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s138', firstName: 'Lorena', lastName: 'Fernández', email: 'estudiante138@demo.com', enrolledAt: new Date(baseDate.getTime() - 55 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s139', firstName: 'Marcos', lastName: 'Torres', email: 'estudiante139@demo.com', enrolledAt: new Date(baseDate.getTime() - 59 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s140', firstName: 'Nora', lastName: 'Díaz', email: 'estudiante140@demo.com', enrolledAt: new Date(baseDate.getTime() - 63 * 24 * 60 * 60 * 1000).toISOString(), className: 'Matemáticas Avanzadas', lastLoginAt: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString() },

    // Additional Física Cuántica students (demo-s141 to demo-s154) - 14 students
    { id: 'demo-s141', firstName: 'Olga', lastName: 'García', email: 'estudiante141@demo.com', enrolledAt: new Date(baseDate.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s142', firstName: 'Pablo', lastName: 'Rodríguez', email: 'estudiante142@demo.com', enrolledAt: new Date(baseDate.getTime() - 48 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s143', firstName: 'Queralt', lastName: 'Martínez', email: 'estudiante143@demo.com', enrolledAt: new Date(baseDate.getTime() - 52 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s144', firstName: 'Ricardo', lastName: 'López', email: 'estudiante144@demo.com', enrolledAt: new Date(baseDate.getTime() - 56 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s145', firstName: 'Silvia', lastName: 'Sánchez', email: 'estudiante145@demo.com', enrolledAt: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s146', firstName: 'Telma', lastName: 'Pérez', email: 'estudiante146@demo.com', enrolledAt: new Date(baseDate.getTime() - 64 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s147', firstName: 'Ulises', lastName: 'Gómez', email: 'estudiante147@demo.com', enrolledAt: new Date(baseDate.getTime() - 47 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s148', firstName: 'Valentina', lastName: 'Fernández', email: 'estudiante148@demo.com', enrolledAt: new Date(baseDate.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s149', firstName: 'Walter', lastName: 'Torres', email: 'estudiante149@demo.com', enrolledAt: new Date(baseDate.getTime() - 54 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 17 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s150', firstName: 'Ximena', lastName: 'Díaz', email: 'estudiante150@demo.com', enrolledAt: new Date(baseDate.getTime() - 58 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s151', firstName: 'Yago', lastName: 'García', email: 'estudiante151@demo.com', enrolledAt: new Date(baseDate.getTime() - 62 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 19 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s152', firstName: 'Zaira', lastName: 'Rodríguez', email: 'estudiante152@demo.com', enrolledAt: new Date(baseDate.getTime() - 66 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s153', firstName: 'Adrián', lastName: 'Martínez', email: 'estudiante153@demo.com', enrolledAt: new Date(baseDate.getTime() - 70 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-s154', firstName: 'Blanca', lastName: 'López', email: 'estudiante154@demo.com', enrolledAt: new Date(baseDate.getTime() - 74 * 24 * 60 * 60 * 1000).toISOString(), className: 'Física Cuántica', lastLoginAt: new Date(baseDate.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  return hardcodedStudents.slice(0, count);
}

export function generateDemoRatings(count: number = 250): DemoRating[] {
  // More realistic distribution: mostly positive, but some negative feedback
  const ratings = [
    ...Array(Math.floor(count * 0.35)).fill(5),  // 35% - 5 stars
    ...Array(Math.floor(count * 0.30)).fill(4),  // 30% - 4 stars
    ...Array(Math.floor(count * 0.10)).fill(3),  // 10% - 3 stars
    ...Array(Math.floor(count * 0.10)).fill(2),  // 10% - 2 stars (reduced from 20%)
    ...Array(Math.floor(count * 0.15)).fill(1),  // 15% - 1 star (increased from 5%)
  ];
  
  const lessons = [
    'Introducción al Curso',
    'Variables y Tipos de Datos',
    'Funciones y Scope',
    'Arrays y Objetos',
    'Programación Asíncrona',
    'Límites y Continuidad',
    'Derivadas e Integrales',
    'Mecánica Cuántica Básica',
    'Diseño UI/UX',
    'Adobe Photoshop Avanzado',
  ];
  
  const comments = {
    5: ['¡Excelente clase!', 'Muy bien explicado', 'Perfecto, lo entendí todo', 'Gran profesor', '¡Increíble contenido!'],
    4: ['Muy buena clase', 'Bien explicado', 'Buen contenido', 'Me gustó mucho'],
    3: ['Buena clase', 'Podría mejorar', 'Interesante', 'Está bien'],
    2: ['Regular', 'No me quedó claro', 'Un poco confuso'],
    1: ['Muy decepcionante', 'No entendí nada', 'Pérdida de tiempo', 'Necesita mejorar mucho'],
  };
  
  const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Laura', 'Miguel', 'Isabel', 'Pedro', 'Sofía', 'Diego', 'Elena', 'Javier', 'Lucía', 'Pablo', 'Valentina'];
  const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Fernández', 'Torres', 'Díaz', 'Ramírez', 'Vargas', 'Castro', 'Morales'];
  
  return shuffle(ratings).slice(0, count).map((rating, i) => ({
    id: `demo-r${i + 1}`,
    rating,
    lessonTitle: lessons[i % lessons.length],
    studentName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    studentFirstName: firstNames[i % firstNames.length],
    studentLastName: lastNames[i % lastNames.length],
    comment: comments[rating as keyof typeof comments][Math.floor(Math.random() * comments[rating as keyof typeof comments].length)],
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateDemoStreams(): DemoStream[] {
  return [
    {
      id: 'demo-stream1',
      title: 'Clase en Vivo - Introducción a React',
      className: 'Programación Web',
      teacherName: 'Carlos Rodríguez',
      participantCount: 35,
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 75 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString(),
      status: 'ended',
      duration: 75,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-c1',
      participantsData: JSON.stringify({
        totalRecords: 35,
        uniqueCount: 35,
        participants: [
          { name: 'Juan García', email: 'juan@example.com', joinTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), duration: 4500 },
          { name: 'María López', email: 'maria@example.com', joinTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(), duration: 4200 },
          { name: 'Carlos Martínez', email: 'carlos@example.com', joinTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(), duration: 4100 },
        ]
      }),
    },
    {
      id: 'demo-stream2',
      title: 'Repaso de Matemáticas',
      className: 'Matemáticas Avanzadas',
      teacherName: 'María García',
      participantCount: 22,
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
      status: 'ended',
      duration: 50,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-c2',
      participantsData: JSON.stringify({ totalRecords: 22, uniqueCount: 22, participants: [{ name: 'Ana Rodríguez', email: 'ana@example.com', duration: 3000 }] }),
    },
    {
      id: 'demo-stream3',
      title: 'Diseño de Logotipos',
      className: 'Diseño Gráfico',
      teacherName: 'Ana Martínez',
      participantCount: 16,
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString(),      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(),      status: 'ended',
      duration: 120,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-c3',
      participantsData: JSON.stringify({ totalRecords: 16, uniqueCount: 16, participants: [{ name: 'Luis Fernández', email: 'luis@example.com', duration: 7200 }] }),
    },
    {
      id: 'demo-stream4',
      title: 'Sesión de Consultas',
      className: 'Programación Web',
      teacherName: 'Carlos Rodríguez',
      participantCount: 28,
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 20 * 60 * 1000).toISOString(),
      status: 'ended',
      duration: 45,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-c1',
      participantsData: JSON.stringify({ totalRecords: 28, uniqueCount: 28, participants: [{ name: 'Pedro Sánchez', email: 'pedro@example.com', duration: 2700 }] }),
    },
    {
      id: 'demo-stream5',
      title: 'Clase Especial',
      className: 'Diseño Gráfico',
      teacherName: 'Ana Martínez',
      participantCount: 19,
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 65 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
      status: 'ended',
      duration: 65,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-c3',
      participantsData: JSON.stringify({ totalRecords: 31, uniqueCount: 31, participants: [{ name: 'Laura Gómez', email: 'laura@example.com', duration: 3900 }] }),
    },
  ];
}

export function generateDemoClasses(): DemoClass[] {
  const now = new Date().toISOString();
  
  // Calculate actual student counts dynamically from generateDemoStudents()
  const students = generateDemoStudents(); // Uses DEMO_STUDENT_COUNT.TOTAL by default (164)
  const classNameToId: Record<string, string> = {
    'Programación Web': 'demo-c1',
    'Matemáticas Avanzadas': 'demo-c2',
    'Física Cuántica': 'demo-c4',
    'Diseño Gráfico': 'demo-c3',
  };
  
  const counts: Record<string, number> = {};
  students.forEach(s => {
    const classId = classNameToId[s.className] || 'demo-c1';
    counts[classId] = (counts[classId] || 0) + 1;
  });
  
  return [
    {
      id: 'demo-c1',
      name: 'Programación Web',
      description: 'Aprende React, Next.js y TypeScript desde cero hasta nivel avanzado',
      teacherName: 'Carlos Rodríguez',
      teacherId: 'demo-t2',
      studentCount: counts['demo-c1'] || 0,
      videoCount: 8,
      documentCount: 5,
      price: 49.99,
      currency: 'EUR',
      createdAt: now,
    },
    {
      id: 'demo-c2',
      name: 'Matemáticas Avanzadas',
      description: 'Cálculo diferencial e integral con aplicaciones prácticas',
      teacherName: 'María García',
      teacherId: 'demo-t1',
      studentCount: counts['demo-c2'] || 0,
      videoCount: 12,
      documentCount: 8,
      price: 39.99,
      currency: 'EUR',
      createdAt: now,
    },
    {
      id: 'demo-c3',
      name: 'Diseño Gráfico',
      description: 'Domina Adobe Creative Suite y crea diseños impactantes',
      teacherName: 'Ana Martínez',
      teacherId: 'demo-t3',
      studentCount: counts['demo-c3'] || 0,
      videoCount: 15,
      documentCount: 10,
      price: 59.99,
      currency: 'EUR',
      createdAt: now,
    },
    {
      id: 'demo-c4',
      name: 'Física Cuántica',
      description: 'Introducción a la mecánica cuántica y sus aplicaciones',
      teacherName: 'Luis López',
      teacherId: 'demo-t4',
      studentCount: counts['demo-c4'] || 0,
      videoCount: 6,
      documentCount: 4,
      price: 44.99,
      currency: 'EUR',
      createdAt: now,
    },
  ];
}

export function generateDemoLessons(): DemoLesson[] {
  const now = new Date().toISOString();
  const demoDoc = [{ title: 'Material de Apoyo', url: '/demo/Documento.pdf' }];
  return [
    { id: 'demo-l1', title: 'Introducción al Curso', classId: 'demo-c1', className: 'Programación Web', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l2', title: 'Variables y Tipos de Datos', classId: 'demo-c1', className: 'Programación Web', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l3', title: 'Funciones y Scope', classId: 'demo-c1', className: 'Programación Web', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l4', title: 'Arrays y Objetos', classId: 'demo-c1', className: 'Programación Web', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l5', title: 'Límites y Continuidad', classId: 'demo-c2', className: 'Matemáticas', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l6', title: 'Derivadas', classId: 'demo-c2', className: 'Matemáticas', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l7', title: 'Integrales Definidas', classId: 'demo-c2', className: 'Matemáticas', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l8', title: 'Principios de Diseño', classId: 'demo-c3', className: 'Diseño Gráfico', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
  ];
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
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  className: string;
  paymentAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export function generateDemoPendingEnrollments(): DemoPendingEnrollment[] {
  const firstNames = ['Juan', 'María', 'Pedro', 'Laura', 'Diego', 'Carmen', 'Luis', 'Ana', 'José', 'Isabel', 'Carlos', 'Elena', 'Miguel', 'Sofía', 'Javier'];
  const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Díaz'];
  const classes = generateDemoClasses();
  
  return Array.from({ length: 15 }, (_, i) => ({
    id: `demo-pending-${i + 1}`,
    student: {
      id: `demo-student-pending-${i + 1}`,
      firstName: firstNames[i % firstNames.length],
      lastName: lastNames[i % lastNames.length],
      email: `estudiante.pendiente${i + 1}@demo.com`,
    },
    class: {
      id: classes[i % classes.length].id,
      name: classes[i % classes.length].name,
    },
    enrolledAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateDemoPendingPayments(): DemoPayment[] {
  const pendingData = [
    { firstName: 'Ana', lastName: 'Torres', className: 'Programación Web', amount: 49.99 },
    { firstName: 'Carlos', lastName: 'Ruiz', className: 'Programación Web', amount: 49.99 },
    { firstName: 'María', lastName: 'Morales', className: 'Matemáticas Avanzadas', amount: 39.99 },
    { firstName: 'Luis', lastName: 'Hernández', className: 'Diseño Gráfico', amount: 59.99 },
    { firstName: 'Carmen', lastName: 'Jiménez', className: 'Física Cuántica', amount: 44.99 },
  ];
  
  return pendingData.map((student, i) => ({
    enrollmentId: `demo-payment-pending-${i + 1}`,
    studentFirstName: student.firstName,
    studentLastName: student.lastName,
    studentEmail: `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@demo.com`,
    className: student.className,
    paymentAmount: student.amount,
    currency: 'EUR',
    paymentMethod: 'cash',
    paymentStatus: 'CASH_PENDING',
    createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateDemoPaymentHistory(): DemoPayment[] {
  const firstNames = ['Juan', 'María', 'Pedro', 'Laura', 'Diego', 'Carmen', 'Luis', 'Ana', 'José', 'Isabel'];
  const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'Sánchez'];
  const classes = ['Programación Web', 'Matemáticas Avanzadas', 'Diseño Gráfico', 'Física Cuántica'];
  
  const teacherNames = ['Carlos Rodríguez', 'María García', 'Ana Martínez', 'Luis Fernández', 'Carmen López'];
  const approverNames = ['Carlos Rodríguez', 'María García', 'Ana Martínez', 'Pedro Administrador'];
  
  // 10% rejected (2 out of 20), rest paid
  const rejectedIndices = [7, 14]; // 10% of payments are rejected
  
  return Array.from({ length: 20 }, (_, i) => ({
    enrollmentId: `demo-payment-history-${i + 1}`,
    studentFirstName: firstNames[i % firstNames.length],
    studentLastName: lastNames[i % lastNames.length],
    studentEmail: `estudiante${i + 1}@demo.com`,
    className: classes[i % classes.length],
    teacherName: teacherNames[i % teacherNames.length],
    approvedByName: approverNames[i % approverNames.length],
    paymentAmount: [49.99, 39.99, 59.99, 44.99][i % 4],
    currency: 'EUR',
    paymentMethod: i % 3 === 0 ? 'cash' : 'stripe',
    paymentStatus: rejectedIndices.includes(i) ? 'REJECTED' : 'PAID',
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateDemoStats() {
  const ratings = generateDemoRatings(DEMO_RATINGS_COUNT.TOTAL);
  const distribution = ratings.reduce((acc, r) => {
    acc[r.rating] = (acc[r.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
  
  return {
    totalStudents: DEMO_STATS.totalStudents,
    totalClasses: DEMO_STATS.totalClasses,
    totalTeachers: DEMO_STATS.totalTeachers,
    totalRatings: DEMO_RATINGS_COUNT.TOTAL,
    averageRating: +(totalRating / ratings.length).toFixed(1),
    ratingDistribution: distribution,
    recentRatings: ratings.slice(0, 50),
    totalStreams: DEMO_STATS.totalStreams,
    avgParticipants: Math.round(DEMO_STREAMS.reduce((sum, s) => sum + s.participantCount, 0) / DEMO_STREAMS.length),
    streamsThisMonth: 2,
    totalStreamHours: DEMO_STATS.totalStreamHours,
    totalStreamMinutes: DEMO_STATS.totalStreamMinutes,
  };
}

export function generateDemoStudentTimes(_lessonId: string) {
  const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Laura', 'Pedro', 'Isabel'];
  const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Fernández'];
  
  // Generate 15-25 students with video watch times
  const studentCount = 15 + Math.floor(Math.random() * 10);
  
  return Array.from({ length: studentCount }, (_, i) => {
    const videoDuration = 3600; // 1 hour video
    const maxWatchTime = videoDuration * 2; // 2x multiplier
    const watchedTime = Math.floor(Math.random() * maxWatchTime * 1.2); // Some students may exceed
    
    return {
      studentId: `demo-student-${i + 1}`,
      studentName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      videos: [
        {
          videoId: `demo-video-1`,
          videoTitle: 'Video Principal de la Lección',
          totalWatchTimeSeconds: watchedTime,
          maxWatchTimeSeconds: maxWatchTime,
          status: watchedTime >= maxWatchTime ? 'BLOCKED' : watchedTime > videoDuration * 0.9 ? 'COMPLETED' : 'ACTIVE',
        }
      ]
    };
  });
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}


