'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { FeedbackView, type ClassFeedback } from '@/components/shared';
import { generateDemoFeedbackData } from '@/lib/demo-data';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import { SkeletonFeedback } from '@/components/ui/SkeletonLoader';

interface Academy {
  id: string;
  name: string;
}

interface ClassOption {
  id: string;
  name: string;
  academyId: string;
}

interface FeedbackPageProps {
  role: 'ACADEMY' | 'ADMIN';
}

export function FeedbackPage({ role }: FeedbackPageProps) {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassFeedback[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');

  // Admin-only state
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [allClasses, setAllClasses] = useState<ClassOption[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      if (role === 'ACADEMY') {
        await loadAcademyData();
      } else {
        await loadAdminData();
      }
    } catch (error) {
      console.error('Failed to load feedback data:', error);
      setClasses([]);
      setLoading(false);
    }
  };

  const loadAcademyData = async () => {
    try {
      const res = await apiClient('/academies');
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const academy = result.data[0];
        setAcademyName(academy.name);
        const status = academy.paymentStatus || 'NOT PAID';
        setPaymentStatus(status);

        if (status === 'NOT PAID') {
          const { classFeedback } = generateDemoFeedbackData();
          setClasses(classFeedback);
          setLoading(false);
          return;
        }

        await loadFeedbackWithClasses();
      } else {
        setClasses([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load academy data:', error);
      setClasses([]);
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [academiesRes, classesRes] = await Promise.all([
        apiClient('/academies'),
        apiClient('/classes'),
      ]);
      const [academiesResult, classesResult] = await Promise.all([
        academiesRes.json(),
        classesRes.json(),
      ]);

      if (academiesResult.success && Array.isArray(academiesResult.data)) {
        setAcademies(academiesResult.data);
      }
      if (classesResult.success && Array.isArray(classesResult.data)) {
        setAllClasses(classesResult.data);
      }

      await loadRatings();
    } catch (error) {
      console.error('Error loading admin feedback data:', error);
      setLoading(false);
    }
  };

  const loadFeedbackWithClasses = async () => {
    try {
      const [classesRes, ratingsRes] = await Promise.all([
        apiClient('/academies/classes'),
        apiClient('/ratings/teacher'),
      ]);
      const [classesData, ratingsData] = await Promise.all([
        classesRes.json(),
        ratingsRes.json(),
      ]);

      const allFeedback: ClassFeedback[] = [];
      if (classesData.success && Array.isArray(classesData.data)) {
        for (const cls of classesData.data) {
          const ratingClass =
            ratingsData.success && Array.isArray(ratingsData.data)
              ? ratingsData.data.find((rc: ClassFeedback) => rc.id === cls.id)
              : null;

          if (ratingClass) {
            allFeedback.push({
              ...ratingClass,
              university: cls.university,
              carrera: cls.carrera,
            });
          } else {
            allFeedback.push({
              id: cls.id,
              name: cls.name,
              teacherName:
                cls.teacherName ||
                `${cls.teacherFirstName || ''} ${cls.teacherLastName || ''}`.trim(),
              university: cls.university,
              carrera: cls.carrera,
              totalRatings: 0,
              averageRating: 0,
              topics: [],
            });
          }
        }
      }

      allFeedback.sort((a, b) => b.averageRating - a.averageRating);
      setClasses(allFeedback);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    try {
      const res = await apiClient('/ratings/teacher');
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingsViewed = async (ratingIds: string[]) => {
    if (ratingIds.length === 0) return;
    if (paymentStatus === 'NOT PAID') return;

    try {
      await apiClient('/lessons/ratings/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratingIds }),
      });
      window.dispatchEvent(new CustomEvent('unreadReviewsChanged'));
      if (role === 'ACADEMY') {
        loadFeedbackWithClasses();
      } else {
        loadRatings();
      }
    } catch (error) {
      console.error('Failed to mark ratings as read:', error);
    }
  };

  // Filtering
  const filteredClasses = useMemo(() => {
    let result = classes;
    if (role === 'ADMIN') {
      if (selectedAcademy !== 'all') {
        result = result.filter((c) => c.academyId === selectedAcademy);
      }
    }
    if (selectedClass !== 'all') {
      result = result.filter((c) => c.id === selectedClass);
    }
    return result;
  }, [role, classes, selectedAcademy, selectedClass]);

  const filteredClassOptions = useMemo(() => {
    if (selectedAcademy === 'all') return [];
    return allClasses.filter((c) => c.academyId === selectedAcademy);
  }, [allClasses, selectedAcademy]);

  if (loading) {
    return <SkeletonFeedback />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {role === 'ACADEMY' ? 'Valoraciones de Estudiantes' : 'Feedback de Estudiantes'}
          </h1>
          {role === 'ACADEMY' && academyName && (
            <p className="text-sm text-gray-500 mt-1">{academyName}</p>
          )}
          {role === 'ADMIN' && (
            <p className="text-gray-600 text-sm mt-1">Todas las academias</p>
          )}
        </div>

        {/* Academy class filter */}
        {role === 'ACADEMY' && classes.length > 1 && (
          <ClassSearchDropdown
            classes={classes}
            value={selectedClass}
            onChange={setSelectedClass}
            allLabel="Todas las asignaturas"
            className="w-56"
          />
        )}

        {/* Admin filters */}
        {role === 'ADMIN' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {selectedAcademy !== 'all' && filteredClassOptions.length > 0 && (
              <ClassSearchDropdown
                classes={filteredClassOptions}
                value={selectedClass}
                onChange={setSelectedClass}
                allLabel="Todas las clases"
                className="w-56"
              />
            )}

            <AcademySearchDropdown
              academies={academies}
              value={selectedAcademy}
              onChange={(value) => {
                setSelectedAcademy(value);
                setSelectedClass('all');
              }}
              allLabel="Todas las academias"
              allValue="all"
              className="w-56"
            />
          </div>
        )}
      </div>

      <FeedbackView
        classes={filteredClasses}
        loading={loading}
        showClassFilter={false}
        onRatingsViewed={handleRatingsViewed}
      />
    </div>
  );
}
