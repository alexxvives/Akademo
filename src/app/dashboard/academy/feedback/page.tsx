'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { FeedbackView, type ClassFeedback } from '@/components/shared';
import { generateDemoRatings, generateDemoClasses } from '@/lib/demo-data';

type DemoRating = ReturnType<typeof generateDemoRatings>[number];

interface DemoLesson {
  id: string;
  title: string;
  ratingCount: number;
  startIdx: number;
}

interface DemoTopic {
  id: string;
  name: string;
  lessons: DemoLesson[];
}

interface LessonRatingItem {
  id: string;
  rating: number;
  studentName: string;
  comment: string | null;
  createdAt: string;
  isRead: boolean;
}

interface LessonFeedbackItem {
  id: string;
  title: string;
  totalRatings: number;
  averageRating: number;
  ratings: LessonRatingItem[];
}

export default function AcademyFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassFeedback[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');

  const loadFeedback = useCallback(async () => {
    try {
      // Load all academy classes first
      const classesRes = await apiClient('/academies/classes');
      const classesData = await classesRes.json();
      
      if (classesData.success && Array.isArray(classesData.data)) {
        const classesList = classesData.data;
        
        // Load all feedback for academy
        const feedbackRes = await apiClient('/academies/feedback');
        const feedbackData = await feedbackRes.json();
        
        if (feedbackData.success && feedbackData.data) {
          setClasses(feedbackData.data);
        } else {
          // If no feedback, create empty class structure
          const emptyClasses = classesList.map((cls: { id: string; name: string; teacherName?: string | null }) => ({
            id: cls.id,
            name: cls.name,
            teacherName: cls.teacherName || '',
            totalRatings: 0,
            averageRating: 0,
            topics: [],
          }));
          setClasses(emptyClasses);
        }
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAcademyName = useCallback(async () => {
    try {
      const res = await apiClient('/academies');
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const academy = result.data[0];
        setAcademyName(academy.name);
        const status = academy.paymentStatus || 'NOT PAID';
        setPaymentStatus(status);
        
        // If NOT PAID, show demo feedback using realistic ratings distribution
        if (status === 'NOT PAID') {
          const demoClasses = generateDemoClasses();
          const demoRatings = generateDemoRatings(); // 35 ratings total
          
          // Topics and lessons by class with realistic rating distribution
          let currentIdx = 0;
          
          const topicsByClass: Record<string, DemoTopic[]> = {
            'demo-c1': [ // Programación Web - 10 ratings across 2 of 8 lessons
              {
                id: 'demo-c1-t1',
                name: 'Fundamentos',
                lessons: [
                  { id: 'demo-l1', title: 'Introducción a React', ratingCount: 5, startIdx: currentIdx },
                  { id: 'demo-l2', title: 'Variables y Tipos', ratingCount: 0, startIdx: -1 },
                ]
              },
              {
                id: 'demo-c1-t2',
                name: 'Hooks y Estado',
                lessons: [
                  { id: 'demo-l3', title: 'useState y useEffect', ratingCount: 5, startIdx: currentIdx += 5 },
                  { id: 'demo-l4', title: 'Context API', ratingCount: 0, startIdx: -1 },
                ]
              },
              {
                id: 'demo-c1-t3',
                name: 'Routing',
                lessons: [
                  { id: 'demo-l5', title: 'React Router', ratingCount: 0, startIdx: -1 },
                  { id: 'demo-l6', title: 'Navegación Avanzada', ratingCount: 0, startIdx: -1 },
                ]
              },
            ],
            'demo-c2': [ // Matemáticas - 9 ratings across 3 of 9 lessons
              {
                id: 'demo-c2-t1',
                name: 'Cálculo Diferencial',
                lessons: [
                  { id: 'demo-l7', title: 'Límites', ratingCount: 3, startIdx: currentIdx += 5 },
                  { id: 'demo-l8', title: 'Continuidad', ratingCount: 0, startIdx: -1 },
                  { id: 'demo-l9', title: 'Derivadas', ratingCount: 3, startIdx: currentIdx += 3 },
                ]
              },
              {
                id: 'demo-c2-t2',
                name: 'Cálculo Integral',
                lessons: [
                  { id: 'demo-l10', title: 'Integrales Definidas', ratingCount: 0, startIdx: -1 },
                  { id: 'demo-l11', title: 'Integrales Indefinidas', ratingCount: 3, startIdx: currentIdx += 3 },
                ]
              },
              {
                id: 'demo-c2-t3',
                name: 'Series',
                lessons: [
                  { id: 'demo-l12', title: 'Sucesiones', ratingCount: 0, startIdx: -1 },
                  { id: 'demo-l13', title: 'Series Convergentes', ratingCount: 0, startIdx: -1 },
                ]
              },
              {
                id: 'demo-c2-t4',
                name: 'Aplicaciones',
                lessons: [
                  { id: 'demo-l14', title: 'Optimización', ratingCount: 0, startIdx: -1 },
                ]
              },
            ],
            'demo-c3': [ // Diseño Gráfico - 12 ratings across 3 of 7 lessons
              {
                id: 'demo-c3-t1',
                name: 'Teoría del Diseño',
                lessons: [
                  { id: 'demo-l15', title: 'Principios de Diseño', ratingCount: 4, startIdx: currentIdx += 3 },
                  { id: 'demo-l16', title: 'Composición', ratingCount: 0, startIdx: -1 },
                ]
              },
              {
                id: 'demo-c3-t2',
                name: 'Herramientas',
                lessons: [
                  { id: 'demo-l17', title: 'Photoshop Básico', ratingCount: 4, startIdx: currentIdx += 4 },
                  { id: 'demo-l18', title: 'Illustrator', ratingCount: 0, startIdx: -1 },
                ]
              },
              {
                id: 'demo-c3-t3',
                name: 'Tipografía y Color',
                lessons: [
                  { id: 'demo-l19', title: 'Tipografía', ratingCount: 4, startIdx: currentIdx += 4 },
                  { id: 'demo-l20', title: 'Teoría del Color', ratingCount: 0, startIdx: -1 },
                  { id: 'demo-l21', title: 'Paletas Cromáticas', ratingCount: 0, startIdx: -1 },
                ]
              },
            ],
            'demo-c4': [ // Física Cuántica - 4 ratings across 1 of 5 lessons
              {
                id: 'demo-c4-t1',
                name: 'Fundamentos Cuánticos',
                lessons: [
                  { id: 'demo-l22', title: 'Mecánica Cuántica Intro', ratingCount: 4, startIdx: currentIdx += 4 },
                  { id: 'demo-l23', title: 'Función de Onda', ratingCount: 0, startIdx: -1 },
                ]
              },
              {
                id: 'demo-c4-t2',
                name: 'Principios',
                lessons: [
                  { id: 'demo-l24', title: 'Dualidad Onda-Partícula', ratingCount: 0, startIdx: -1 },
                  { id: 'demo-l25', title: 'Principio de Incertidumbre', ratingCount: 0, startIdx: -1 },
                ]
              },
              {
                id: 'demo-c4-t3',
                name: 'Aplicaciones',
                lessons: [
                  { id: 'demo-l26', title: 'Computación Cuántica', ratingCount: 0, startIdx: -1 },
                ]
              },
            ],
          };
          
          setClasses(demoClasses.map(c => {
            const classTopics = topicsByClass[c.id] || [];
            
            // Calculate total ratings and average for entire class
            let totalRatings = 0;
            let totalScore = 0;
            
            const topics = classTopics.map(topic => {
              const lessonsWithRatings: LessonFeedbackItem[] = topic.lessons.map((lesson) => {
                if (lesson.ratingCount === 0 || lesson.startIdx === -1) {
                  // Lesson has no ratings
                  return {
                    id: lesson.id,
                    title: lesson.title,
                    totalRatings: 0,
                    averageRating: 0,
                    ratings: []
                  };
                }
                
                const lessonRatings: DemoRating[] = demoRatings.slice(lesson.startIdx, lesson.startIdx + lesson.ratingCount);
                const lessonScore = lessonRatings.reduce((sum, r) => sum + r.rating, 0);
                const lessonAvg = lessonScore / lessonRatings.length;
                
                totalRatings += lesson.ratingCount;
                totalScore += lessonScore;
                
                return {
                  id: lesson.id,
                  title: lesson.title,
                  totalRatings: lesson.ratingCount,
                  averageRating: lessonAvg,
                  ratings: lessonRatings.map((r) => ({
                    id: r.id,
                    rating: r.rating,
                    studentName: r.studentName,
                    comment: r.comment,
                    createdAt: r.createdAt,
                    isRead: r.viewed,
                  })),
                };
              });
              
              // Calculate topic average (only from lessons with ratings)
              const topicRatings = lessonsWithRatings.filter((l) => l.totalRatings > 0);
              const topicTotalRatings = topicRatings.reduce((sum, l) => sum + l.totalRatings, 0);
              const topicTotalScore = topicRatings.reduce((sum, l) => sum + (l.averageRating * l.totalRatings), 0);
              const topicAvg = topicTotalRatings > 0 ? topicTotalScore / topicTotalRatings : 0;
              
              return {
                id: topic.id,
                name: topic.name,
                totalRatings: topicTotalRatings,
                averageRating: topicAvg,
                lessons: lessonsWithRatings,
              };
            });

            const classAvg = totalRatings > 0 ? totalScore / totalRatings : 0;

            return {
              id: c.id,
              name: c.name,
              teacherName: c.teacherName || '',
              totalRatings,
              averageRating: classAvg,
              topics,
            };
          }));

          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading academy:', error);
    }
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    loadAcademyName();
  }, [loadAcademyName]);

  const handleRatingsViewed = async (ratingIds: string[]) => {
    if (ratingIds.length === 0) return;
    
    // Skip marking as read for demo mode
    if (paymentStatus === 'NOT PAID') {
      return;
    }
    
    try {
      await apiClient('/lessons/ratings/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratingIds }),
      });
      // Trigger badge update
      window.dispatchEvent(new CustomEvent('unreadReviewsChanged'));
      // Refresh feedback to update isRead status
      loadFeedback();
    } catch (error) {
      console.error('Failed to mark ratings as read:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Feedback de Estudiantes</h1>
        {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
      </div>

      <FeedbackView
        classes={classes}
        loading={loading}
        showClassFilter={false}
        onRatingsViewed={handleRatingsViewed}
      />
    </div>
  );
}