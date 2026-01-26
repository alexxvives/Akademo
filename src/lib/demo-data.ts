// Demo data generator for unpaid academies
// Shows sample data to help academies visualize the platform before purchasing

export const DEMO_VIDEO_URL = "https://www.youtube.com/watch?v=2lAe1cqCOXo"; // 1-hour timer video
export const DEMO_VIDEO_GUID = "912efe98-e6af-4c29-ada3-2617f0ff6674";

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
  duration?: number;
  recordingId: string;
  classId: string;
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

export function generateDemoStudents(count: number = 100): DemoStudent[] {
  const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Laura', 'Miguel', 'Isabel', 'Pedro', 'Sofía', 'Diego', 'Elena', 'Javier'];
  const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Fernández', 'Torres', 'Díaz'];
  const classes = ['Programación Web', 'Matemáticas Avanzadas', 'Física Cuántica', 'Diseño Gráfico'];
  
  return Array.from({ length: count }, (_, i) => {
    let lastLoginAt: string | null;
    
    // Activity distribution: 30% active (<24h), 40% recent (<7d), 20% inactive (>7d), 10% never logged in
    const activityRoll = Math.random();
    if (activityRoll < 0.3) {
      // Active: last 24 hours
      lastLoginAt = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
    } else if (activityRoll < 0.7) {
      // Recent: 1-7 days ago
      lastLoginAt = new Date(Date.now() - (1 + Math.random() * 6) * 24 * 60 * 60 * 1000).toISOString();
    } else if (activityRoll < 0.9) {
      // Inactive: 7-30 days ago
      lastLoginAt = new Date(Date.now() - (7 + Math.random() * 23) * 24 * 60 * 60 * 1000).toISOString();
    } else {
      // Never logged in
      lastLoginAt = null;
    }
    
    return {
      id: `demo-s${i + 1}`,
      firstName: firstNames[i % firstNames.length],
      lastName: lastNames[Math.floor(i / firstNames.length) % lastNames.length],
      email: `estudiante${i + 1}@demo.com`,
      enrolledAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      className: classes[i % classes.length],
      lastLoginAt,
    };
  });
}

export function generateDemoRatings(count: number = 250): DemoRating[] {
  // 60% 5-star, 20% 4-star, 10% 3-star, 5% 2-star, 5% 1-star (more realistic)
  const ratings = [
    ...Array(Math.floor(count * 0.6)).fill(5),
    ...Array(Math.floor(count * 0.2)).fill(4),
    ...Array(Math.floor(count * 0.1)).fill(3),
    ...Array(Math.floor(count * 0.05)).fill(2),
    ...Array(Math.floor(count * 0.05)).fill(1),
    ...Array(Math.floor(count * 0.2)).fill(4),
    ...Array(Math.floor(count * 0.08)).fill(3),
    ...Array(Math.floor(count * 0.02)).fill(2),
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
  
  const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Laura'];
  const lastNames = ['García', 'Rodríguez', 'Martínez', 'López'];
  
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
      status: 'ENDED',
      duration: 75,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-class1',
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
      title: 'Repaso de Matemáticas - Ecuaciones Diferenciales',
      className: 'Matemáticas Avanzadas',
      teacherName: 'María García',
      participantCount: 22,
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
      status: 'ENDED',
      duration: 50,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-class2',
      participantsData: JSON.stringify({ totalRecords: 22, uniqueCount: 22, participants: [{ name: 'Ana Rodríguez', email: 'ana@example.com', duration: 3000 }] }),
    },
    {
      id: 'demo-stream3',
      title: 'Workshop - Diseño de Logotipos',
      className: 'Diseño Gráfico Profesional',
      teacherName: 'Ana Martínez',
      participantCount: 18,
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString(),
      status: 'ENDED',
      duration: 120,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-class3',
      participantsData: JSON.stringify({ totalRecords: 18, uniqueCount: 18, participants: [{ name: 'Luis Fernández', email: 'luis@example.com', duration: 7200 }] }),
    },
    {
      id: 'demo-stream4',
      title: 'Sesión de Consultas - Node.js Backend',
      className: 'Programación Web',
      teacherName: 'Carlos Rodríguez',
      participantCount: 28,
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      status: 'ENDED',
      duration: 45,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-class1',
      participantsData: JSON.stringify({ totalRecords: 28, uniqueCount: 28, participants: [{ name: 'Pedro Sánchez', email: 'pedro@example.com', duration: 2700 }] }),
    },
    {
      id: 'demo-stream5',
      title: 'Clase Especial - Teoría del Color',
      className: 'Diseño Gráfico Profesional',
      teacherName: 'Ana Martínez',
      participantCount: 31,
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 65 * 60 * 1000).toISOString(),
      status: 'ENDED',
      duration: 65,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-class3',
      participantsData: JSON.stringify({ totalRecords: 31, uniqueCount: 31, participants: [{ name: 'Laura Gómez', email: 'laura@example.com', duration: 3900 }] }),
    },
  ];
}

export function generateDemoClasses(): DemoClass[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'demo-c1',
      name: 'Programación Web Moderna',
      description: 'Aprende React, Next.js y TypeScript desde cero hasta nivel avanzado',
      teacherName: 'Carlos Rodríguez',
      teacherId: 'demo-t2',
      studentCount: 34,
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
      studentCount: 28,
      videoCount: 12,
      documentCount: 8,
      price: 39.99,
      currency: 'EUR',
      createdAt: now,
    },
    {
      id: 'demo-c3',
      name: 'Diseño Gráfico Profesional',
      description: 'Domina Adobe Creative Suite y crea diseños impactantes',
      teacherName: 'Ana Martínez',
      teacherId: 'demo-t3',
      studentCount: 22,
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
      studentCount: 16,
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
  const firstNames = ['Ana', 'Carlos', 'María', 'Luis', 'Carmen'];
  const lastNames = ['Torres', 'Ruiz', 'Morales', 'Hernández', 'Jiménez'];
  const classes = ['Programación Web', 'Matemáticas Avanzadas', 'Diseño Gráfico', 'Física Cuántica'];
  
  return Array.from({ length: 5 }, (_, i) => ({
    enrollmentId: `demo-payment-pending-${i + 1}`,
    studentFirstName: firstNames[i],
    studentLastName: lastNames[i],
    studentEmail: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@demo.com`,
    className: classes[i % classes.length],
    paymentAmount: [49.99, 39.99, 59.99, 44.99][i % 4],
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
    paymentStatus: 'PAID',
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateDemoStats() {
  const ratings = generateDemoRatings(250);
  const distribution = ratings.reduce((acc, r) => {
    acc[r.rating] = (acc[r.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
  
  return {
    totalStudents: 100,
    totalClasses: 4,
    totalTeachers: 5,
    totalRatings: 250,
    averageRating: +(totalRating / ratings.length).toFixed(1),
    ratingDistribution: distribution,
    recentRatings: ratings.slice(0, 100),
    totalStreams: 5,
    avgParticipants: 46,
    streamsThisMonth: 2,
    totalStreamHours: 7,
    totalStreamMinutes: 30,
  };
}

export function generateDemoStudentTimes(lessonId: string) {
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
