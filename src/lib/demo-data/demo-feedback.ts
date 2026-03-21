import type { DemoFeedbackTopic } from './types';
import { generateDemoClasses } from './demo-classes';
import { generateDemoRatings } from './demo-ratings';

export function generateDemoFeedbackData(): { classFeedback: Array<{ id: string; name: string; teacherName: string; university?: string | null; carrera?: string | null; totalRatings: number; averageRating: number; topics: Array<{ id: string; name: string; totalRatings: number; averageRating: number; lessons: Array<{ id: string; title: string; totalRatings: number; averageRating: number; ratings: Array<{ id: string; rating: number; studentName: string; comment: string | null; createdAt: string; isRead: boolean }> }> }> }> } {
  const demoClasses = generateDemoClasses();
  const demoRatings = generateDemoRatings();

  let currentIdx = 0;

  const topicsByClass: Record<string, DemoFeedbackTopic[]> = {
    'demo-c1': [
      { id: 'demo-c1-t1', name: 'Fundamentos', lessons: [
        { id: 'demo-l1', title: 'Introducción a React', ratingCount: 5, startIdx: currentIdx },
        { id: 'demo-l2', title: 'Variables y Tipos', ratingCount: 0, startIdx: -1 },
      ]},
      { id: 'demo-c1-t2', name: 'Hooks y Estado', lessons: [
        { id: 'demo-l3', title: 'useState y useEffect', ratingCount: 3, startIdx: currentIdx += 5 },
        { id: 'demo-l4', title: 'Context API', ratingCount: 0, startIdx: -1 },
      ]},
      { id: 'demo-c1-t3', name: 'Routing', lessons: [
        { id: 'demo-l5', title: 'React Router', ratingCount: 0, startIdx: -1 },
        { id: 'demo-l6', title: 'Navegación Avanzada', ratingCount: 0, startIdx: -1 },
      ]},
      { id: 'demo-c1-sin-tema', name: 'Sin tema', lessons: [
        { id: 'demo-l1-st', title: 'Proyecto Final', ratingCount: 2, startIdx: currentIdx += 3 },
      ]},
    ],
    'demo-c2': [
      { id: 'demo-c2-t1', name: 'Cálculo Diferencial', lessons: [
        { id: 'demo-l7', title: 'Límites', ratingCount: 3, startIdx: currentIdx += 2 },
        { id: 'demo-l8', title: 'Continuidad', ratingCount: 0, startIdx: -1 },
        { id: 'demo-l9', title: 'Derivadas', ratingCount: 3, startIdx: currentIdx += 3 },
      ]},
      { id: 'demo-c2-t2', name: 'Cálculo Integral', lessons: [
        { id: 'demo-l10', title: 'Integrales Definidas', ratingCount: 0, startIdx: -1 },
        { id: 'demo-l11', title: 'Integrales Indefinidas', ratingCount: 3, startIdx: currentIdx += 3 },
      ]},
      { id: 'demo-c2-t3', name: 'Series', lessons: [
        { id: 'demo-l12', title: 'Sucesiones', ratingCount: 0, startIdx: -1 },
        { id: 'demo-l13', title: 'Series Convergentes', ratingCount: 0, startIdx: -1 },
      ]},
      { id: 'demo-c2-t4', name: 'Aplicaciones', lessons: [
        { id: 'demo-l14', title: 'Optimización', ratingCount: 0, startIdx: -1 },
      ]},
      { id: 'demo-c2-sin-tema', name: 'Sin tema', lessons: [
        { id: 'demo-l7-st', title: 'Repaso General', ratingCount: 0, startIdx: -1 },
      ]},
    ],
    'demo-c3': [
      { id: 'demo-c3-t1', name: 'Teoría del Diseño', lessons: [
        { id: 'demo-l15', title: 'Principios de Diseño', ratingCount: 4, startIdx: currentIdx += 3 },
        { id: 'demo-l16', title: 'Composición', ratingCount: 0, startIdx: -1 },
      ]},
      { id: 'demo-c3-t2', name: 'Herramientas', lessons: [
        { id: 'demo-l17', title: 'Photoshop Básico', ratingCount: 4, startIdx: currentIdx += 4 },
        { id: 'demo-l18', title: 'Illustrator', ratingCount: 0, startIdx: -1 },
      ]},
      { id: 'demo-c3-t3', name: 'Tipografía y Color', lessons: [
        { id: 'demo-l19', title: 'Tipografía', ratingCount: 4, startIdx: currentIdx += 4 },
        { id: 'demo-l20', title: 'Teoría del Color', ratingCount: 0, startIdx: -1 },
        { id: 'demo-l21', title: 'Paletas Cromáticas', ratingCount: 0, startIdx: -1 },
      ]},
      { id: 'demo-c3-sin-tema', name: 'Sin tema', lessons: [
        { id: 'demo-l15-st', title: 'Ejercicio Libre', ratingCount: 0, startIdx: -1 },
      ]},
    ],
    'demo-c4': [
      { id: 'demo-c4-t1', name: 'Fundamentos Cuánticos', lessons: [
        { id: 'demo-l22', title: 'Mecánica Cuántica Intro', ratingCount: 4, startIdx: currentIdx += 4 },
        { id: 'demo-l23', title: 'Función de Onda', ratingCount: 0, startIdx: -1 },
      ]},
      { id: 'demo-c4-t2', name: 'Principios', lessons: [
        { id: 'demo-l24', title: 'Dualidad Onda-Partícula', ratingCount: 0, startIdx: -1 },
        { id: 'demo-l25', title: 'Principio de Incertidumbre', ratingCount: 0, startIdx: -1 },
      ]},
      { id: 'demo-c4-t3', name: 'Aplicaciones', lessons: [
        { id: 'demo-l26', title: 'Computación Cuántica', ratingCount: 0, startIdx: -1 },
      ]},
      { id: 'demo-c4-sin-tema', name: 'Sin tema', lessons: [
        { id: 'demo-l22-st', title: 'Laboratorio Virtual', ratingCount: 0, startIdx: -1 },
      ]},
    ],
  };

  const classFeedback = demoClasses.map(c => {
    const classTopics = topicsByClass[c.id] || [];

    let totalRatings = 0;
    let totalScore = 0;

    const topics = classTopics.map(topic => {
      const lessonsResult = topic.lessons.map(lesson => {
        const lessonRatings = lesson.ratingCount > 0 && lesson.startIdx >= 0
          ? demoRatings.slice(lesson.startIdx, lesson.startIdx + lesson.ratingCount).map((r, ri) => {
              totalRatings++;
              totalScore += r.rating;
              return {
                id: `demo-rating-${lesson.id}-${ri}`,
                rating: r.rating,
                studentName: r.studentName,
                comment: r.comment,
                createdAt: r.createdAt,
                isRead: r.viewed,
              };
            })
          : [];
        
        const avg = lessonRatings.length > 0
          ? lessonRatings.reduce((sum, lr) => sum + lr.rating, 0) / lessonRatings.length
          : 0;

        return {
          id: lesson.id,
          title: lesson.title,
          totalRatings: lessonRatings.length,
          averageRating: +avg.toFixed(1),
          ratings: lessonRatings,
        };
      });

      const topicLessonsWithRatings = lessonsResult.filter(l => l.totalRatings > 0);
      const topicTotalRatings = topicLessonsWithRatings.reduce((sum, l) => sum + l.totalRatings, 0);
      const topicTotalScore = topicLessonsWithRatings.reduce((sum, l) => sum + (l.averageRating * l.totalRatings), 0);

      return {
        id: topic.id,
        name: topic.name,
        totalRatings: topicTotalRatings,
        averageRating: topicTotalRatings > 0 ? +(topicTotalScore / topicTotalRatings).toFixed(1) : 0,
        lessons: lessonsResult,
      };
    });

    return {
      id: c.id,
      name: c.name,
      teacherName: c.teacherName,
      university: c.university,
      carrera: c.carrera,
      totalRatings,
      averageRating: totalRatings > 0 ? +(totalScore / totalRatings).toFixed(1) : 0,
      topics,
    };
  });

  return { classFeedback };
}
