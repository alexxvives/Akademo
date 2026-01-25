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
        
        // If NOT PAID, show demo feedback
        if (status === 'NOT PAID') {
          const demoClasses = generateDemoClasses();
          const demoRatings = generateDemoRatings(250);
          
          setClasses(demoClasses.map(c => ({
            id: c.id,
            name: c.name,
            teacherName: c.teacherName,
            totalRatings: Math.floor(Math.random() * 50) + 20,
            averageRating: 4.3 + Math.random() * 0.7,
            topics: [
              {
                id: `${c.id}-topic1`,
                name: 'Introducción y Fundamentos',
                totalRatings: 25,
                averageRating: 4.5,
                lessons: [
                  {
                    id: `${c.id}-l1`,
                    title: 'Lección 1: Introducción',
                    totalRatings: 15,
                    averageRating: 4.6,
                    ratings: demoRatings.slice(0, 15).map(r => ({
                      id: r.id,
                      rating: r.rating,
                      studentName: r.studentName,
                      comment: r.comment,
                      createdAt: r.createdAt,
                    })),
                  },
                ],
              },
            ],
          })));
          setLoading(false);
          return;
        }
        
        // If PAID, load real feedback
        await loadFeedback();
      }
    } catch (error) {
      console.error('Failed to load academy name:', error);
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