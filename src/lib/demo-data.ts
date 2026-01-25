// Demo data generator for unpaid academies
// Shows sample data to help academies visualize the platform before purchasing

export const DEMO_VIDEO_URL = "https://www.youtube.com/watch?v=2lAe1cqCOXo"; // 1-hour timer video
export const DEMO_VIDEO_GUID = "demo-1hour-timer";

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
  
  return Array.from({ length: count }, (_, i) => ({
    id: `demo-s${i + 1}`,
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[Math.floor(i / firstNames.length) % lastNames.length],
    email: `estudiante${i + 1}@demo.com`,
    enrolledAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    className: classes[i % classes.length],
  }));
}

export function generateDemoRatings(count: number = 250): DemoRating[] {
  // 70% 5-star, 20% 4-star, 8% 3-star, 2% 2-star
  const ratings = [
    ...Array(Math.floor(count * 0.7)).fill(5),
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
      participantCount: 45,
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
      status: 'ENDED',
      duration: 90,
    },
    {
      id: 'demo-stream2',
      title: 'Repaso de Matemáticas - Ecuaciones Diferenciales',
      className: 'Matemáticas Avanzadas',
      teacherName: 'María García',
      participantCount: 67,
      startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString(),
      status: 'ENDED',
      duration: 120,
    },
    {
      id: 'demo-stream3',
      title: 'Taller Práctico - Diseño UI/UX con Figma',
      className: 'Diseño Gráfico',
      teacherName: 'Ana Martínez',
      participantCount: 38,
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 75 * 60 * 1000).toISOString(),
      status: 'ENDED',
      duration: 75,
    },
    {
      id: 'demo-stream4',
      title: 'Sesión de Dudas - Física Cuántica',
      className: 'Física Cuántica',
      teacherName: 'Luis López',
      participantCount: 29,
      startedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      status: 'ENDED',
      duration: 60,
    },
    {
      id: 'demo-stream5',
      title: 'Proyecto Final - Aplicación Web Completa',
      className: 'Programación Web',
      teacherName: 'Carlos Rodríguez',
      participantCount: 52,
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 105 * 60 * 1000).toISOString(),
      status: 'ENDED',
      duration: 105,
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
  return [
    { id: 'demo-l1', title: 'Introducción al Curso', classId: 'demo-c1', className: 'Programación Web', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now },
    { id: 'demo-l2', title: 'Variables y Tipos de Datos', classId: 'demo-c1', className: 'Programación Web', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now },
    { id: 'demo-l3', title: 'Funciones y Scope', classId: 'demo-c1', className: 'Programación Web', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now },
    { id: 'demo-l4', title: 'Arrays y Objetos', classId: 'demo-c1', className: 'Programación Web', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now },
    { id: 'demo-l5', title: 'Límites y Continuidad', classId: 'demo-c2', className: 'Matemáticas', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now },
    { id: 'demo-l6', title: 'Derivadas', classId: 'demo-c2', className: 'Matemáticas', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now },
    { id: 'demo-l7', title: 'Integrales Definidas', classId: 'demo-c2', className: 'Matemáticas', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now },
    { id: 'demo-l8', title: 'Principios de Diseño', classId: 'demo-c3', className: 'Diseño Gráfico', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now },
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
  
  return Array.from({ length: 20 }, (_, i) => ({
    enrollmentId: `demo-payment-history-${i + 1}`,
    studentFirstName: firstNames[i % firstNames.length],
    studentLastName: lastNames[i % lastNames.length],
    studentEmail: `estudiante${i + 1}@demo.com`,
    className: classes[i % classes.length],
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

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
