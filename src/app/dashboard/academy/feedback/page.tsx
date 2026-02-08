'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { FeedbackView, type ClassFeedback } from '@/components/shared';
import { generateDemoRatings, generateDemoClasses } from '@/lib/demo-data';

export default function AcademyFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassFeedback[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');

  useEffect(() => {
    loadAcademyName();
  }, []);

  const loadAcademyName = async () => {
    try {
      const res = await apiClient('/academies');
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const academy = result.data[0];
        setAcademyName(academy.name);
        const status = academy.paymentStatus || 'NOT PAID';
        setPaymentStatus(status);
        
        // If NOT PAID, show demo feedback using actual generated ratings distribution
        if (status === 'NOT PAID') {
          const demoClasses = generateDemoClasses();
          const demoRatings = generateDemoRatings(); // 307 ratings with distribution: 134★5, 71★4, 36★3, 40★2, 26★1
          
          // Allocate ratings across classes and lessons
          const ratingsPerClass = [77, 77, 77, 76]; // Split 307 ratings: Web=77, Math=77, Design=77, Physics=76
          let currentIdx = 0;
          
          const lessonsByClass: Record<string, any[]> = {
            'demo-c1': [ // Programación Web - 77 ratings across 6 lessons
              { id: 'demo-l1', title: 'Introducción a React', ratingCount: 13, startIdx: currentIdx },
              { id: 'demo-l2', title: 'Variables y Tipos', ratingCount: 13, startIdx: currentIdx += 13 },
              { id: 'demo-l3', title: 'Funciones y Scope', ratingCount: 13, startIdx: currentIdx += 13 },
              { id: 'demo-l4', title: 'Arrays y Objetos', ratingCount: 13, startIdx: currentIdx += 13 },
              { id: 'demo-l5', title: 'Programación Asíncrona', ratingCount: 13, startIdx: currentIdx += 13 },
              { id: 'demo-l6', title: 'React Hooks', ratingCount: 12, startIdx: currentIdx += 13 },
            ],
            'demo-c2': [ // Matemáticas - 77 ratings across 4 lessons
              { id: 'demo-l7', title: 'Límites y Continuidad', ratingCount: 20, startIdx: currentIdx += 12 },
              { id: 'demo-l8', title: 'Derivadas', ratingCount: 19, startIdx: currentIdx += 20 },
              { id: 'demo-l9', title: 'Integrales Definidas', ratingCount: 19, startIdx: currentIdx += 19 },
              { id: 'demo-l10', title: 'Series y Sucesiones', ratingCount: 19, startIdx: currentIdx += 19 },
            ],
            'demo-c3': [ // Diseño Gráfico - 77 ratings across 4 lessons
              { id: 'demo-l11', title: 'Principios de Diseño', ratingCount: 20, startIdx: currentIdx += 19 },
              { id: 'demo-l12', title: 'Photoshop Básico', ratingCount: 19, startIdx: currentIdx += 20 },
              { id: 'demo-l13', title: 'Tipografía', ratingCount: 19, startIdx: currentIdx += 19 },
              { id: 'demo-l14', title: 'Teoría del Color', ratingCount: 19, startIdx: currentIdx += 19 },
            ],
            'demo-c4': [ // Física Cuántica - 76 ratings across 3 lessons
              { id: 'demo-l15', title: 'Mecánica Cuántica', ratingCount: 26, startIdx: currentIdx += 19 },
              { id: 'demo-l16', title: 'Partículas y Ondas', ratingCount: 25, startIdx: currentIdx += 26 },
              { id: 'demo-l17', title: 'Dualidad Onda-Partícula', ratingCount: 25, startIdx: currentIdx += 25 },
            ],
          };
          
          setClasses(demoClasses.map(c => {
            const classLessons = lessonsByClass[c.id] || [];
            const totalRatings = classLessons.reduce((sum, l) => sum + l.ratingCount, 0);
            
            // Calculate actual average from generated ratings
            const classRatings = classLessons.flatMap(lesson => 
              demoRatings.slice(lesson.startIdx, lesson.startIdx + lesson.ratingCount)
            );
            const avgRating = classRatings.length > 0
              ? classRatings.reduce((sum, r) => sum + r.rating, 0) / classRatings.length
              : 4.0;
            
            return {
              id: c.id,
              name: c.name,
              teacherName: c.teacherName,
              totalRatings: totalRatings,
              averageRating: avgRating,
              topics: [
                {
                  id: `${c.id}-topic1`,
                  name: 'Lecciones',
                  totalRatings: totalRatings,
                  averageRating: avgRating,
                  lessons: classLessons.map(lesson => {
                    const lessonRatings = demoRatings.slice(lesson.startIdx, lesson.startIdx + lesson.ratingCount);
                    const lessonAvg = lessonRatings.reduce((sum, r) => sum + r.rating, 0) / lessonRatings.length;
                    
                    return {
                      id: lesson.id,
                      title: lesson.title,
                      totalRatings: lesson.ratingCount,
                      averageRating: lessonAvg,
                      ratings: lessonRatings.map(r => ({
                        id: r.id,
                        rating: r.rating,
                        studentName: r.studentName,
                        comment: r.comment,
                        createdAt: r.createdAt,
                      })),
                    };
                  }),
                },
              ],
            };
          }));
          setLoading(false);
          return;
        }
        
        // If PAID, load real feedback
        await loadFeedback();
      } else {
        // If API fails or returns empty, treat as demo account - use same logic as NOT PAID
        const demoClasses = generateDemoClasses();
        const demoRatings = generateDemoRatings();
        
        let currentIdx = 0;
        const lessonsByClass: Record<string, any[]> = {
          'demo-c1': [
            { id: 'demo-l1', title: 'Introducción a React', ratingCount: 13, startIdx: currentIdx },
            { id: 'demo-l2', title: 'Variables y Tipos', ratingCount: 13, startIdx: currentIdx += 13 },
            { id: 'demo-l3', title: 'Funciones y Scope', ratingCount: 13, startIdx: currentIdx += 13 },
            { id: 'demo-l4', title: 'Arrays y Objetos', ratingCount: 13, startIdx: currentIdx += 13 },
            { id: 'demo-l5', title: 'Programación Asíncrona', ratingCount: 13, startIdx: currentIdx += 13 },
            { id: 'demo-l6', title: 'React Hooks', ratingCount: 12, startIdx: currentIdx += 13 },
          ],
          'demo-c2': [
            { id: 'demo-l7', title: 'Límites y Continuidad', ratingCount: 20, startIdx: currentIdx += 12 },
            { id: 'demo-l8', title: 'Derivadas', ratingCount: 19, startIdx: currentIdx += 20 },
            { id: 'demo-l9', title: 'Integrales Definidas', ratingCount: 19, startIdx: currentIdx += 19 },
            { id: 'demo-l10', title: 'Series y Sucesiones', ratingCount: 19, startIdx: currentIdx += 19 },
          ],
          'demo-c3': [
            { id: 'demo-l11', title: 'Principios de Diseño', ratingCount: 20, startIdx: currentIdx += 19 },
            { id: 'demo-l12', title: 'Photoshop Básico', ratingCount: 19, startIdx: currentIdx += 20 },
            { id: 'demo-l13', title: 'Tipografía', ratingCount: 19, startIdx: currentIdx += 19 },
            { id: 'demo-l14', title: 'Teoría del Color', ratingCount: 19, startIdx: currentIdx += 19 },
          ],
          'demo-c4': [
            { id: 'demo-l15', title: 'Mecánica Cuántica', ratingCount: 26, startIdx: currentIdx += 19 },
            { id: 'demo-l16', title: 'Partículas y Ondas', ratingCount: 25, startIdx: currentIdx += 26 },
            { id: 'demo-l17', title: 'Dualidad Onda-Partícula', ratingCount: 25, startIdx: currentIdx += 25 },
          ],
        };
        
        setClasses(demoClasses.map(c => {
          const classLessons = lessonsByClass[c.id] || [];
          const totalRatings = classLessons.reduce((sum, l) => sum + l.ratingCount, 0);
          
          const classRatings = classLessons.flatMap(lesson => 
            demoRatings.slice(lesson.startIdx, lesson.startIdx + lesson.ratingCount)
          );
          const avgRating = classRatings.length > 0
            ? classRatings.reduce((sum, r) => sum + r.rating, 0) / classRatings.length
            : 4.0;
          
          return {
            id: c.id,
            name: c.name,
            academyName: academyName || 'Academy One',
            teacherName: c.teacherName,
            totalRatings: totalRatings,
            averageRating: avgRating,
            topics: [
              {
                id: `${c.id}-topic1`,
                name: 'Lecciones',
                totalRatings: totalRatings,
                averageRating: avgRating,
                lessons: classLessons.map(lesson => {
                  const lessonRatings = demoRatings.slice(lesson.startIdx, lesson.startIdx + lesson.ratingCount);
                  const lessonAvg = lessonRatings.reduce((sum, r) => sum + r.rating, 0) / lessonRatings.length;
                  
                  return {
                    id: lesson.id,
                    title: lesson.title,
                    totalRatings: lesson.ratingCount,
                    averageRating: lessonAvg,
                    ratings: lessonRatings.map(r => ({
                      id: r.id,
                      rating: r.rating,
                      studentName: r.studentName,
                      comment: r.comment,
                      createdAt: r.createdAt,
                    })),
                  };
                }),
              },
            ],
          };
        }));
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load academy name:', error);
      // On error, show demo data - use same logic as NOT PAID
      const demoClasses = generateDemoClasses();
      const demoRatings = generateDemoRatings();
      
      let currentIdx = 0;
      const lessonsByClass: Record<string, any[]> = {
        'demo-c1': [
          { id: 'demo-l1', title: 'Introducción a React', ratingCount: 13, startIdx: currentIdx },
          { id: 'demo-l2', title: 'Variables y Tipos', ratingCount: 13, startIdx: currentIdx += 13 },
          { id: 'demo-l3', title: 'Funciones y Scope', ratingCount: 13, startIdx: currentIdx += 13 },
          { id: 'demo-l4', title: 'Arrays y Objetos', ratingCount: 13, startIdx: currentIdx += 13 },
          { id: 'demo-l5', title: 'Programación Asíncrona', ratingCount: 13, startIdx: currentIdx += 13 },
          { id: 'demo-l6', title: 'React Hooks', ratingCount: 12, startIdx: currentIdx += 13 },
        ],
        'demo-c2': [
          { id: 'demo-l7', title: 'Límites y Continuidad', ratingCount: 20, startIdx: currentIdx += 12 },
          { id: 'demo-l8', title: 'Derivadas', ratingCount: 19, startIdx: currentIdx += 20 },
          { id: 'demo-l9', title: 'Integrales Definidas', ratingCount: 19, startIdx: currentIdx += 19 },
          { id: 'demo-l10', title: 'Series y Sucesiones', ratingCount: 19, startIdx: currentIdx += 19 },
        ],
        'demo-c3': [
          { id: 'demo-l11', title: 'Principios de Diseño', ratingCount: 20, startIdx: currentIdx += 19 },
          { id: 'demo-l12', title: 'Photoshop Básico', ratingCount: 19, startIdx: currentIdx += 20 },
          { id: 'demo-l13', title: 'Tipografía', ratingCount: 19, startIdx: currentIdx += 19 },
          { id: 'demo-l14', title: 'Teoría del Color', ratingCount: 19, startIdx: currentIdx += 19 },
        ],
        'demo-c4': [
          { id: 'demo-l15', title: 'Mecánica Cuántica', ratingCount: 26, startIdx: currentIdx += 19 },
          { id: 'demo-l16', title: 'Partículas y Ondas', ratingCount: 25, startIdx: currentIdx += 26 },
          { id: 'demo-l17', title: 'Dualidad Onda-Partícula', ratingCount: 25, startIdx: currentIdx += 25 },
        ],
      };
      
      setClasses(demoClasses.map(c => {
        const classLessons = lessonsByClass[c.id] || [];
        const totalRatings = classLessons.reduce((sum, l) => sum + l.ratingCount, 0);
        
        const classRatings = classLessons.flatMap(lesson => 
          demoRatings.slice(lesson.startIdx, lesson.startIdx + lesson.ratingCount)
        );
        const avgRating = classRatings.length > 0
          ? classRatings.reduce((sum, r) => sum + r.rating, 0) / classRatings.length
          : 4.0;
        
        return {
          id: c.id,
          name: c.name,
          teacherName: c.teacherName,
          totalRatings: totalRatings,
          averageRating: avgRating,
          topics: [
            {
              id: `${c.id}-topic1`,
              name: 'Lecciones',
              totalRatings: totalRatings,
              averageRating: avgRating,
              lessons: classLessons.map(lesson => {
                const lessonRatings = demoRatings.slice(lesson.startIdx, lesson.startIdx + lesson.ratingCount);
                const lessonAvg = lessonRatings.reduce((sum, r) => sum + r.rating, 0) / lessonRatings.length;
                
                return {
                  id: lesson.id,
                  title: lesson.title,
                  totalRatings: lesson.ratingCount,
                  averageRating: lessonAvg,
                  ratings: lessonRatings.map(r => ({
                    id: r.id,
                    rating: r.rating,
                    studentName: r.studentName,
                    comment: r.comment,
                    createdAt: r.createdAt,
                  })),
                };
              }),
            },
          ],
        };
      }));
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    try {
      // Load all academy classes first
      const classesRes = await apiClient('/academies/classes');
      const classesData = await classesRes.json();
      
      // Load ratings
      const ratingsRes = await apiClient('/ratings/teacher');
      const ratingsData = await ratingsRes.json();
      
      const allClasses: ClassFeedback[] = [];
      
      if (classesData.success && Array.isArray(classesData.data)) {
        for (const cls of classesData.data) {
          // Find matching ratings class
          const ratingClass = ratingsData.success && Array.isArray(ratingsData.data)
            ? ratingsData.data.find((rc: ClassFeedback) => rc.id === cls.id)
            : null;
          
          if (ratingClass) {
            // Use the rating class with data
            allClasses.push(ratingClass);
          } else {
            // Create empty class structure
            allClasses.push({
              id: cls.id,
              name: cls.name,
              teacherName: cls.teacherName || `${cls.teacherFirstName || ''} ${cls.teacherLastName || ''}`.trim(),
              totalRatings: 0,
              averageRating: 0,
              topics: []
            });
          }
        }
      }
      
      // Sort classes by average rating (highest first)
      allClasses.sort((a, b) => b.averageRating - a.averageRating);
      
      setClasses(allClasses);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

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