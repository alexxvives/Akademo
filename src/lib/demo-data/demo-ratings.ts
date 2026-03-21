import { DEMO_RATINGS_COUNT, DEMO_STATS, DEMO_STREAMS } from './types';
import type { DemoRating } from './types';

export function generateDemoRatings(count: number = 35): DemoRating[] {
  const baseDate = new Date('2026-01-01T00:00:00.000Z');
  const students = [
    'Juan García', 'María López', 'Carlos Pérez', 'Ana Martínez', 'Luis Sánchez',
    'Carmen Díaz', 'José Gómez', 'Laura Torres', 'Miguel Ruiz', 'Isabel Castro',
    'Pedro Moreno', 'Sofía Romero', 'Diego Navarro', 'Elena Vega', 'Javier Silva',
    'Lucía Ortiz', 'Pablo Ramos', 'Valentina Cruz', 'Andrés Herrera', 'Beatriz Flores'
  ];
  
  const lessons = [
    'Introducción a React', 'Variables y Tipos', 'Funciones y Scope',
    'Arrays y Objetos', 'Programación Asíncrona', 'React Hooks',
    'Límites y Continuidad', 'Derivadas', 'Integrales Definidas', 'Series y Sucesiones',
    'Principios de Diseño', 'Photoshop Básico', 'Tipografía', 'Teoría del Color',
    'Mecánica Cuántica', 'Partículas y Ondas', 'Dualidad Onda-Partícula'
  ];
  
  const comments = {
    5: ['¡Excelente clase!', 'Muy bien explicado', 'Perfecto, lo entendí todo', 'Gran profesor', '¡Increíble contenido!'],
    4: ['Muy buena clase', 'Bien explicado', 'Buen contenido', 'Me gustó mucho'],
    3: ['Buena clase', 'Podría mejorar', 'Interesante', 'Está bien'],
    2: ['Regular', 'No me quedó claro', 'Un poco confuso'],
    1: ['Muy decepcionante', 'No entendí nada', 'Pérdida de tiempo', 'Necesita mejorar mucho'],
  };
  
  const ratings: DemoRating[] = [];
  let id = 1;
  
  const getClassId = (lessonIndex: number): string => {
    const idx = lessonIndex % lessons.length;
    if (idx <= 5) return 'demo-c1';
    if (idx <= 9) return 'demo-c2';
    if (idx <= 13) return 'demo-c3';
    return 'demo-c4';
  };

  const addRating = (rating: number, lessonIndex: number, studentIndex: number, daysAgo: number, viewed: boolean = true) => {
    const student = students[studentIndex % students.length];
    const [firstName, lastName] = student.split(' ');
    const commentList = comments[rating as keyof typeof comments];
    const comment = commentList[id % commentList.length];
    const createdAt = new Date(baseDate.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    
    ratings.push({
      id: `demo-r${id}`,
      rating,
      lessonTitle: lessons[lessonIndex % lessons.length],
      studentName: student,
      studentFirstName: firstName,
      studentLastName: lastName,
      comment,
      createdAt,
      viewed,
      classId: getClassId(lessonIndex),
    });
    id++;
  };
  
  const fiveStarLessons = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15];
  for (let i = 0; i < 15; i++) {
    addRating(5, fiveStarLessons[i], i, 30 - i, i < 10);
  }
  
  const fourStarLessons = [0, 1, 2, 3, 6, 7, 8, 10, 11, 14];
  for (let i = 0; i < 10; i++) {
    addRating(4, fourStarLessons[i], i + 5, 25 - i, i < 6);
  }
  
  const threeStarLessons = [0, 1, 2, 6, 7, 10];
  for (let i = 0; i < 6; i++) {
    addRating(3, threeStarLessons[i], i + 10, 20 - i * 2, i < 4);
  }
  
  const twoStarLessons = [1, 7, 11];
  for (let i = 0; i < 3; i++) {
    addRating(2, twoStarLessons[i], i + 15, 15 - i * 3, i < 2);
  }
  
  for (let i = 0; i < 1; i++) {
    addRating(1, 0, i, 10, true);
  }
  
  return ratings.slice(0, count);
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
  const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Laura', 'Pedro', 'Isabel', 'Miguel', 'Rosa', 'Antonio', 'Elena', 'Francisco', 'Sofía', 'David', 'Marta', 'Javier', 'Patricia'];
  const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Fernández'];
  
  const studentCount = 20;
  const videoDuration = 3600;
  const maxWatchTime = videoDuration * 2;
  
  const watchTimePatterns = [
    1.15, 0.95, 1.05, 0.80, 1.20,
    0.70, 1.10, 0.85, 0.95, 1.00,
    0.90, 1.08, 0.75, 1.12, 0.88,
    1.03, 0.92, 1.07, 0.98, 1.01,
  ];
  
  return Array.from({ length: studentCount }, (_, i) => {
    const watchedTime = Math.floor(maxWatchTime * watchTimePatterns[i]);
    const status = watchedTime >= maxWatchTime ? 'BLOCKED' : watchedTime > videoDuration * 0.9 ? 'COMPLETED' : 'ACTIVE';
    
    return {
      studentId: `demo-student-${i + 1}`,
      studentName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      videos: [
        {
          videoId: `demo-video-1`,
          videoTitle: 'Video Principal de la Lección',
          totalWatchTimeSeconds: status === 'BLOCKED' ? maxWatchTime : watchedTime,
          maxWatchTimeSeconds: maxWatchTime,
          status,
        }
      ]
    };
  });
}

export function generateDemoLessonRatings() {
  const lessonsData = [
    { lessonId: 'demo-l1', lessonTitle: 'Introducción a React', className: 'Programación Web', classId: 'demo-c1', averageRating: 4.8, ratingCount: 25 },
    { lessonId: 'demo-l2', lessonTitle: 'Variables y Tipos', className: 'Programación Web', classId: 'demo-c1', averageRating: 3.5, ratingCount: 23 },
    { lessonId: 'demo-l3', lessonTitle: 'Funciones y Scope', className: 'Programación Web', classId: 'demo-c1', averageRating: 4.7, ratingCount: 22 },
    { lessonId: 'demo-l4', lessonTitle: 'Arrays y Objetos', className: 'Programación Web', classId: 'demo-c1', averageRating: 2.1, ratingCount: 21 },
    { lessonId: 'demo-l5', lessonTitle: 'Programación Asíncrona', className: 'Programación Web', classId: 'demo-c1', averageRating: 5.0, ratingCount: 19 },
    { lessonId: 'demo-l6', lessonTitle: 'React Hooks', className: 'Programación Web', classId: 'demo-c1', averageRating: 4.2, ratingCount: 18 },
    { lessonId: 'demo-l7', lessonTitle: 'Límites y Continuidad', className: 'Matemáticas Avanzadas', classId: 'demo-c2', averageRating: 4.3, ratingCount: 18 },
    { lessonId: 'demo-l8', lessonTitle: 'Derivadas', className: 'Matemáticas Avanzadas', classId: 'demo-c2', averageRating: 1.8, ratingCount: 17 },
    { lessonId: 'demo-l9', lessonTitle: 'Integrales Definidas', className: 'Matemáticas Avanzadas', classId: 'demo-c2', averageRating: 4.9, ratingCount: 16 },
    { lessonId: 'demo-l10', lessonTitle: 'Series y Sucesiones', className: 'Matemáticas Avanzadas', classId: 'demo-c2', averageRating: 2.4, ratingCount: 15 },
    { lessonId: 'demo-l11', lessonTitle: 'Principios de Diseño', className: 'Diseño Gráfico', classId: 'demo-c3', averageRating: 4.9, ratingCount: 20 },
    { lessonId: 'demo-l12', lessonTitle: 'Photoshop Básico', className: 'Diseño Gráfico', classId: 'demo-c3', averageRating: 3.2, ratingCount: 19 },
    { lessonId: 'demo-l13', lessonTitle: 'Tipografía', className: 'Diseño Gráfico', classId: 'demo-c3', averageRating: 5.0, ratingCount: 18 },
    { lessonId: 'demo-l14', lessonTitle: 'Teoría del Color', className: 'Diseño Gráfico', classId: 'demo-c3', averageRating: 2.7, ratingCount: 17 },
    { lessonId: 'demo-l15', lessonTitle: 'Mecánica Cuántica', className: 'Física Cuántica', classId: 'demo-c4', averageRating: 4.5, ratingCount: 14 },
    { lessonId: 'demo-l16', lessonTitle: 'Partículas y Ondas', className: 'Física Cuántica', classId: 'demo-c4', averageRating: 1.9, ratingCount: 13 },
    { lessonId: 'demo-l17', lessonTitle: 'Dualidad Onda-Partícula', className: 'Física Cuántica', classId: 'demo-c4', averageRating: 3.8, ratingCount: 12 },
  ];

  return {
    overall: {
      averageRating: 3.8,
      totalRatings: 250,
      ratedLessons: 17,
    },
    lessons: lessonsData,
  };
}
