'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import type { ClassFeedback } from '../FeedbackView';
import { generateDemoFeedbackData } from '@/lib/demo-data';
import { usePeriod } from '@/contexts/PeriodContext';
import type { Academy, ClassOption, FeedbackPageProps, FeedbackDataReturn } from './feedback-types';
import { mergeClassesWithRatings } from './feedback-utils';

export function useFeedbackData(role: FeedbackPageProps['role']): FeedbackDataReturn {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassFeedback[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [allClasses, setAllClasses] = useState<ClassOption[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');

  const isAcademy = role === 'ACADEMY';
  const isTeacher = role === 'TEACHER';
  const isAdmin = role === 'ADMIN';
  const { activePeriodId, isClassInPeriod } = usePeriod();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      if (isAcademy) {
        await loadAcademyData();
      } else if (isTeacher) {
        await loadTeacherData();
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

  const loadTeacherData = async () => {
    try {
      const res = await apiClient('/teacher/academy');
      const result = await res.json() as { data?: { academy?: { name?: string; paymentStatus?: string } } };
      if (result.data?.academy) {
        const academy = result.data.academy;
        setAcademyName(academy.name || '');
        const status = academy.paymentStatus || 'NOT PAID';
        setPaymentStatus(status);

        if (status === 'NOT PAID') {
          const { classFeedback } = generateDemoFeedbackData();
          setClasses(classFeedback);
          setLoading(false);
          return;
        }

        await loadTeacherFeedback();
      } else {
        setClasses([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load teacher data:', error);
      setClasses([]);
      setLoading(false);
    }
  };

  const loadTeacherFeedback = async () => {
    try {
      const [classesRes, ratingsRes] = await Promise.all([
        apiClient('/classes'),
        apiClient('/ratings/teacher'),
      ]);
      const [classesData, ratingsData] = await Promise.all([
        classesRes.json(),
        ratingsRes.json(),
      ]);
      setClasses(mergeClassesWithRatings(classesData, ratingsData));
    } catch (error) {
      console.error('Failed to load teacher feedback:', error);
    } finally {
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
      setClasses(mergeClassesWithRatings(classesData, ratingsData));
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
      if (isAcademy) {
        loadFeedbackWithClasses();
      } else if (isTeacher) {
        loadTeacherFeedback();
      } else {
        loadRatings();
      }
    } catch (error) {
      console.error('Failed to mark ratings as read:', error);
    }
  };

  const filteredClasses = useMemo(() => {
    let result = classes;
    if (isAdmin) {
      if (selectedAcademy !== 'all') {
        result = result.filter((c) => c.academyId === selectedAcademy);
      }
    } else if (activePeriodId !== 'all') {
      result = result.filter((c) => isClassInPeriod(c.startDate));
    }
    if (selectedClass !== 'all') {
      result = result.filter((c) => c.id === selectedClass);
    }
    return result;
  }, [isAdmin, classes, selectedAcademy, selectedClass, activePeriodId, isClassInPeriod]);

  const filteredClassOptions = useMemo(() => {
    if (selectedAcademy === 'all') return [];
    return allClasses.filter((c) => c.academyId === selectedAcademy);
  }, [allClasses, selectedAcademy]);

  return {
    loading,
    classes,
    academyName,
    paymentStatus,
    academies,
    allClasses,
    selectedAcademy,
    selectedClass,
    setSelectedAcademy,
    setSelectedClass,
    filteredClasses,
    filteredClassOptions,
    handleRatingsViewed,
    isAcademy,
    isTeacher,
    isAdmin,
    activePeriodId,
    isClassInPeriod,
  };
}
