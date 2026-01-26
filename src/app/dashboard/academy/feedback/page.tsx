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
        
        // If NOT PAID, show demo feedback with realistic varied data
        if (status === 'NOT PAID') {
          const demoClasses = generateDemoClasses();
          const demoRatings = generateDemoRatings(250);
          
          // Match the dashboard lesson structure with varied ratings
          const lessonsByClass: Record<string, any[]> = {
            'demo-c1': [
              { id: 'demo-l1', title: 'Introducción a React', avgRating: 4.8, ratingCount: 25, startIdx: 0 },
              { id: 'demo-l2', title: 'Variables y Tipos', avgRating: 3.5, ratingCount: 23, startIdx: 25 },
              { id: 'demo-l3', title: 'Funciones y Scope', avgRating: 4.7, ratingCount: 22, startIdx: 48 },
              { id: 'demo-l4', title: 'Arrays y Objetos', avgRating: 2.1, ratingCount: 21, startIdx: 70 },
              { id: 'demo-l5', title: 'Programación Asíncrona', avgRating: 5.0, ratingCount: 19, startIdx: 91 },
              { id: 'demo-l6', title: 'React Hooks', avgRating: 4.2, ratingCount: 18, startIdx: 110 },
            ],
            'demo-c2': [
              { id: 'demo-l7', title: 'Límites y Continuidad', avgRating: 4.3, ratingCount: 18, startIdx: 128 },
              { id: 'demo-l8', title: 'Derivadas', avgRating: 1.8, ratingCount: 17, startIdx: 146 },
              { id: 'demo-l9', title: 'Integrales Definidas', avgRating: 4.9, ratingCount: 16, startIdx: 163 },
              { id: 'demo-l10', title: 'Series y Sucesiones', avgRating: 2.4, ratingCount: 15, startIdx: 179 },
            ],
            'demo-c3': [
              { id: 'demo-l11', title: 'Principios de Diseño', avgRating: 4.9, ratingCount: 20, startIdx: 194 },
              { id: 'demo-l12', title: 'Photoshop Básico', avgRating: 3.2, ratingCount: 19, startIdx: 214 },
              { id: 'demo-l13', title: 'Tipografía', avgRating: 5.0, ratingCount: 18, startIdx: 233 },
              { id: 'demo-l14', title: 'Teoría del Color', avgRating: 2.7, ratingCount: 17, startIdx: 251 },
            ],
            'demo-c4': [
              { id: 'demo-l15', title: 'Mecánica Cuántica', avgRating: 4.5, ratingCount: 14, startIdx: 268 },
              { id: 'demo-l16', title: 'Partículas y Ondas', avgRating: 1.9, ratingCount: 13, startIdx: 282 },
              { id: 'demo-l17', title: 'Dualidad Onda-Partícula', avgRating: 3.8, ratingCount: 12, startIdx: 295 },
            ],
          };
          
          setClasses(demoClasses.map(c => {
            const classLessons = lessonsByClass[c.id] || [];
            const totalRatings = classLessons.reduce((sum, l) => sum + l.ratingCount, 0);
            const avgRating = classLessons.length > 0 
              ? classLessons.reduce((sum, l) => sum + l.avgRating * l.ratingCount, 0) / totalRatings 
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
                  lessons: classLessons.map(lesson => ({
                    id: lesson.id,
                    title: lesson.title,
                    totalRatings: lesson.ratingCount,
                    averageRating: lesson.avgRating,
                    ratings: demoRatings.slice(lesson.startIdx, lesson.startIdx + lesson.ratingCount).map(r => ({
                      id: r.id,
                      rating: r.rating,
                      studentName: r.studentName,
                      comment: r.comment,
                      createdAt: r.createdAt,
                    })),
                  })),
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
        // If API fails or returns empty, treat as demo account
        const demoClasses = generateDemoClasses();
        const demoRatings = generateDemoRatings(250);
        
        const lessonsByClass: Record<string, any[]> = {
          'demo-c1': [
            { id: 'demo-l1', title: 'Introducción a React', avgRating: 4.8, ratingCount: 25, startIdx: 0 },
            { id: 'demo-l2', title: 'Variables y Tipos', avgRating: 3.5, ratingCount: 23, startIdx: 25 },
            { id: 'demo-l3', title: 'Funciones y Scope', avgRating: 4.7, ratingCount: 22, startIdx: 48 },
            { id: 'demo-l4', title: 'Arrays y Objetos', avgRating: 2.1, ratingCount: 21, startIdx: 70 },
            { id: 'demo-l5', title: 'Programación Asíncrona', avgRating: 5.0, ratingCount: 19, startIdx: 91 },
            { id: 'demo-l6', title: 'React Hooks', avgRating: 4.2, ratingCount: 18, startIdx: 110 },
          ],
          'demo-c2': [
            { id: 'demo-l7', title: 'Límites y Continuidad', avgRating: 4.3, ratingCount: 18, startIdx: 128 },
            { id: 'demo-l8', title: 'Derivadas', avgRating: 1.8, ratingCount: 17, startIdx: 146 },
            { id: 'demo-l9', title: 'Integrales Definidas', avgRating: 4.9, ratingCount: 16, startIdx: 163 },
            { id: 'demo-l10', title: 'Series y Sucesiones', avgRating: 2.4, ratingCount: 15, startIdx: 179 },
          ],
          'demo-c3': [
            { id: 'demo-l11', title: 'Principios de Diseño', avgRating: 4.9, ratingCount: 20, startIdx: 194 },
            { id: 'demo-l12', title: 'Photoshop Básico', avgRating: 3.2, ratingCount: 19, startIdx: 214 },
            { id: 'demo-l13', title: 'Tipografía', avgRating: 5.0, ratingCount: 18, startIdx: 233 },
            { id: 'demo-l14', title: 'Teoría del Color', avgRating: 2.7, ratingCount: 17, startIdx: 251 },
          ],
          'demo-c4': [
            { id: 'demo-l15', title: 'Mecánica Cuántica', avgRating: 4.5, ratingCount: 14, startIdx: 268 },
            { id: 'demo-l16', title: 'Partículas y Ondas', avgRating: 1.9, ratingCount: 13, startIdx: 282 },
            { id: 'demo-l17', title: 'Dualidad Onda-Partícula', avgRating: 3.8, ratingCount: 12, startIdx: 295 },
          ],
        };
        
        setClasses(demoClasses.map(c => {
          const classLessons = lessonsByClass[c.id] || [];
          const totalRatings = classLessons.reduce((sum, l) => sum + l.ratingCount, 0);
          const avgRating = classLessons.length > 0 
            ? classLessons.reduce((sum, l) => sum + l.avgRating * l.ratingCount, 0) / totalRatings 
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
                lessons: classLessons.map(lesson => ({
                  id: lesson.id,
                  title: lesson.title,
                  totalRatings: lesson.ratingCount,
                  averageRating: lesson.avgRating,
                  ratings: demoRatings.slice(lesson.startIdx, lesson.startIdx + lesson.ratingCount).map(r => ({
                    id: r.id,
                    rating: r.rating,
                    studentName: r.studentName,
                    comment: r.comment,
                    createdAt: r.createdAt,
                  })),
                })),
              },
            ],
          };
        }));
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load academy name:', error);
      // On error, also show demo data as fallback
      const demoClasses = generateDemoClasses();
      const demoRatings = generateDemoRatings(250);
      
      const lessonsByClass: Record<string, any[]> = {
        'demo-c1': [
          { id: 'demo-l1', title: 'Introducción a React', avgRating: 4.8, ratingCount: 25, startIdx: 0 },
          { id: 'demo-l2', title: 'Variables y Tipos', avgRating: 3.5, ratingCount: 23, startIdx: 25 },
          { id: 'demo-l3', title: 'Funciones y Scope', avgRating: 4.7, ratingCount: 22, startIdx: 48 },
          { id: 'demo-l4', title: 'Arrays y Objetos', avgRating: 2.1, ratingCount: 21, startIdx: 70 },
          { id: 'demo-l5', title: 'Programación Asíncrona', avgRating: 5.0, ratingCount: 19, startIdx: 91 },
          { id: 'demo-l6', title: 'React Hooks', avgRating: 4.2, ratingCount: 18, startIdx: 110 },
        ],
        'demo-c2': [
          { id: 'demo-l7', title: 'Límites y Continuidad', avgRating: 4.3, ratingCount: 18, startIdx: 128 },
          { id: 'demo-l8', title: 'Derivadas', avgRating: 1.8, ratingCount: 17, startIdx: 146 },
          { id: 'demo-l9', title: 'Integrales Definidas', avgRating: 4.9, ratingCount: 16, startIdx: 163 },
          { id: 'demo-l10', title: 'Series y Sucesiones', avgRating: 2.4, ratingCount: 15, startIdx: 179 },
        ],
        'demo-c3': [
          { id: 'demo-l11', title: 'Principios de Diseño', avgRating: 4.9, ratingCount: 20, startIdx: 194 },
          { id: 'demo-l12', title: 'Photoshop Básico', avgRating: 3.2, ratingCount: 19, startIdx: 214 },
          { id: 'demo-l13', title: 'Tipografía', avgRating: 5.0, ratingCount: 18, startIdx: 233 },
          { id: 'demo-l14', title: 'Teoría del Color', avgRating: 2.7, ratingCount: 17, startIdx: 251 },
        ],
        'demo-c4': [
          { id: 'demo-l15', title: 'Mecánica Cuántica', avgRating: 4.5, ratingCount: 14, startIdx: 268 },
          { id: 'demo-l16', title: 'Partículas y Ondas', avgRating: 1.9, ratingCount: 13, startIdx: 282 },
          { id: 'demo-l17', title: 'Dualidad Onda-Partícula', avgRating: 3.8, ratingCount: 12, startIdx: 295 },
        ],
      };
      
      setClasses(demoClasses.map(c => {
        const classLessons = lessonsByClass[c.id] || [];
        const totalRatings = classLessons.reduce((sum, l) => sum + l.ratingCount, 0);
        const avgRating = classLessons.length > 0 
          ? classLessons.reduce((sum, l) => sum + l.avgRating * l.ratingCount, 0) / totalRatings 
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
              lessons: classLessons.map(lesson => ({
                id: lesson.id,
                title: lesson.title,
                totalRatings: lesson.ratingCount,
                averageRating: lesson.avgRating,
                ratings: demoRatings.slice(lesson.startIdx, lesson.startIdx + lesson.ratingCount).map(r => ({
                  id: r.id,
                  rating: r.rating,
                  studentName: r.studentName,
                  comment: r.comment,
                  createdAt: r.createdAt,
                })),
              })),
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
      
      setClasses(allClasses);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
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
      />
    </div>
  );
}