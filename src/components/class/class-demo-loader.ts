import type { ClassData, Lesson, Topic } from './types';

interface DemoClassResult {
  classData: ClassData;
  lessons: Lesson[];
  topics: Topic[];
}

export async function loadDemoClassData(classId: string): Promise<DemoClassResult | null> {
  const { generateDemoClasses, generateDemoLessons } = await import('@/lib/demo-data');
  const demoClasses = generateDemoClasses();
  const demoLessons = generateDemoLessons();

  const normalizeSlug = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const urlSlug = normalizeSlug(decodeURIComponent(classId));
  const demoClass = demoClasses.find(c => {
    const classSlug = normalizeSlug(c.name);
    return c.id === classId || classSlug === urlSlug;
  });

  if (!demoClass) return null;

  const demoStudentsForClass = Array.from({ length: demoClass.studentCount || 30 }, (_, i) => {
    let lastLoginAt: string | null;
    const activityRoll = Math.random();
    if (activityRoll < 0.3) {
      lastLoginAt = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
    } else if (activityRoll < 0.7) {
      lastLoginAt = new Date(Date.now() - (1 + Math.random() * 6) * 24 * 60 * 60 * 1000).toISOString();
    } else if (activityRoll < 0.9) {
      lastLoginAt = new Date(Date.now() - (7 + Math.random() * 23) * 24 * 60 * 60 * 1000).toISOString();
    } else {
      lastLoginAt = null;
    }
    return {
      id: `demo-enrollment-${demoClass.id}-${i + 1}`,
      student: {
        id: `demo-student-${i + 1}`,
        firstName: ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Laura', 'Pedro', 'Isabel'][i % 10],
        lastName: ['García', 'Rodríguez', 'Martínez', 'López', 'Sánchez'][i % 5],
        email: `estudiante${i + 1}@demo.com`,
        lastLoginAt,
      },
      enrolledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'APPROVED',
    };
  });

  const classData: ClassData = {
    id: demoClass.id,
    name: demoClass.name,
    description: demoClass.description,
    whatsappGroupLink: demoClass.whatsappGroupLink || null,
    feedbackEnabled: 1,
    academy: { id: 'demo-academy', name: 'Mi Academia Demo' },
    enrollments: demoStudentsForClass,
  };

  const classLessons = demoLessons
    .filter(l => l.classId === demoClass.id)
    .map(l => {
      let topicId: string | null = null;
      if (demoClass.id === 'demo-c1') {
        topicId = (l.id === 'demo-l1' || l.id === 'demo-l2') ? 'demo-c1-t1' : 'demo-c1-t2';
      } else if (demoClass.id === 'demo-c2') {
        topicId = (l.id === 'demo-l5') ? 'demo-c2-t1' : (l.id === 'demo-l6') ? 'demo-c2-t1' : 'demo-c2-t2';
      } else if (demoClass.id === 'demo-c3') {
        topicId = 'demo-c3-t1';
      }
      return {
        id: l.id, title: l.title, description: 'Lección de demostración con video de 1 hora',
        releaseDate: l.createdAt, topicId, maxWatchTimeMultiplier: 2.0, watermarkIntervalMins: 5,
        videoCount: 1, documentCount: l.documents?.length || 0,
        avgRating: 4.5 + Math.random() * 0.5, ratingCount: Math.floor(Math.random() * 20) + 5,
        firstVideoBunnyGuid: l.videoGuid,
        videos: [{ id: `${l.id}-video`, title: l.title, bunnyGuid: l.videoGuid, durationSeconds: l.duration, createdAt: l.createdAt }],
        documents: (l.documents || []).map((doc: { title: string; url: string }, di: number) => ({
          id: `${l.id}-doc-${di}`, title: doc.title, description: null,
          upload: { storagePath: doc.url, fileName: doc.title + '.pdf', mimeType: 'application/pdf' },
        })),
      } as unknown as Lesson;
    });

  const demoTopicsMap: Record<string, Topic[]> = {
    'demo-c1': [
      { id: 'demo-c1-t1', name: 'Fundamentos', classId: 'demo-c1', orderIndex: 0, lessonCount: 2 },
      { id: 'demo-c1-t2', name: 'Hooks y Estado', classId: 'demo-c1', orderIndex: 1, lessonCount: 2 },
      { id: 'demo-c1-t3', name: 'Routing', classId: 'demo-c1', orderIndex: 2, lessonCount: 0 },
    ],
    'demo-c2': [
      { id: 'demo-c2-t1', name: 'Cálculo Diferencial', classId: 'demo-c2', orderIndex: 0, lessonCount: 2 },
      { id: 'demo-c2-t2', name: 'Cálculo Integral', classId: 'demo-c2', orderIndex: 1, lessonCount: 1 },
      { id: 'demo-c2-t3', name: 'Series', classId: 'demo-c2', orderIndex: 2, lessonCount: 0 },
      { id: 'demo-c2-t4', name: 'Aplicaciones', classId: 'demo-c2', orderIndex: 3, lessonCount: 0 },
    ],
    'demo-c3': [
      { id: 'demo-c3-t1', name: 'Teoría del Diseño', classId: 'demo-c3', orderIndex: 0, lessonCount: 1 },
      { id: 'demo-c3-t2', name: 'Herramientas', classId: 'demo-c3', orderIndex: 1, lessonCount: 0 },
      { id: 'demo-c3-t3', name: 'Tipografía y Color', classId: 'demo-c3', orderIndex: 2, lessonCount: 0 },
    ],
    'demo-c4': [
      { id: 'demo-c4-t1', name: 'Fundamentos Cuánticos', classId: 'demo-c4', orderIndex: 0, lessonCount: 0 },
      { id: 'demo-c4-t2', name: 'Principios', classId: 'demo-c4', orderIndex: 1, lessonCount: 0 },
      { id: 'demo-c4-t3', name: 'Aplicaciones', classId: 'demo-c4', orderIndex: 2, lessonCount: 0 },
    ],
  };

  return {
    classData,
    lessons: classLessons,
    topics: demoTopicsMap[demoClass.id] || [],
  };
}
