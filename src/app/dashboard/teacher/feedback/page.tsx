'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { FeedbackView, type ClassFeedback } from '@/components/shared';
import { generateDemoFeedbackData } from '@/lib/demo-data';

export default function TeacherFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassFeedback[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      // Check if teacher is in a demo (NOT PAID) academy
      const academyRes = await apiClient('/teacher/academy');
      const academyResult = await academyRes.json();
      const status = academyResult.data?.academy?.paymentStatus || 'PAID';
      const name = academyResult.data?.academy?.name || '';
      setAcademyName(name);

      if (status === 'NOT PAID') {
        // Use shared demo feedback data (same source as academy dashboard)
        setIsDemoMode(true);
        const { classFeedback } = generateDemoFeedbackData();
        setClasses(classFeedback);
        setLoading(false);
        return;
      }

      // Load real feedback
      await loadFeedback();
    } catch {
      // Fallback: try loading academy name from requests
      try {
        const res = await apiClient('/requests/teacher');
        const result = await res.json();
        if (Array.isArray(result) && result.length > 0) {
          setAcademyName(result[0].academyName || '');
        }
      } catch { /* ignore */ }
      await loadFeedback();
    }
  };

  const loadFeedback = async () => {
    try {
      // Load all classes first
      const classesRes = await apiClient('/classes');
      const classesData = await classesRes.json();
      
      // Load ratings
      const ratingsRes = await apiClient('/ratings/teacher');
      const ratingsData = await ratingsRes.json();
      
      const allClasses: ClassFeedback[] = [];
      
      if (classesData.success && Array.isArray(classesData.data)) {
        for (const cls of classesData.data) {
          const ratingClass = ratingsData.success && Array.isArray(ratingsData.data)
            ? ratingsData.data.find((rc: ClassFeedback) => rc.id === cls.id)
            : null;
          
          if (ratingClass) {
            allClasses.push(ratingClass);
          } else {
            allClasses.push({
              id: cls.id,
              name: cls.name,
              academyName: cls.academy?.name,
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

  const handleRatingsViewed = async (ratingIds: string[]) => {
    if (ratingIds.length === 0 || isDemoMode) return;
    
    try {
      await apiClient('/lessons/ratings/mark-read', {
        method: 'POST',
        body: JSON.stringify({ ratingIds }),
        headers: { 'Content-Type': 'application/json' }
      });
      window.dispatchEvent(new CustomEvent('unreadReviewsChanged'));
    } catch (error) {
      console.error('Failed to mark ratings as read:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Valoraciones de Estudiantes</h1>
        <p className="text-sm text-gray-500 mt-1">
          {academyName || ''}
        </p>
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