'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { FeedbackView, type ClassFeedback } from '@/components/shared';

export default function TeacherFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassFeedback[]>([]);

  useEffect(() => {
    loadFeedback();
  }, []);

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
    try {
      await apiClient('/lessons/ratings/mark-read', {
        method: 'POST',
        body: JSON.stringify({ ratingIds }),
        headers: { 'Content-Type': 'application/json' }
      });
      // Trigger badge update
      window.dispatchEvent(new CustomEvent('unreadReviewsChanged'));
    } catch (error) {
      console.error('Failed to mark ratings as read:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Feedback de Estudiantes</h1>
        <p className="text-sm text-gray-500 mt-1">
          {classes.length > 0 && classes[0].academyName ? classes[0].academyName : 'Akademo'}
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
