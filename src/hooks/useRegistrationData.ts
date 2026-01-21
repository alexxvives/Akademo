import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface Academy {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  teacherName?: string;
}

export function useRegistrationData(role: string, academyId: string) {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingAcademies, setLoadingAcademies] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    if (role === 'STUDENT' || role === 'TEACHER') {
      loadAcademies();
    }
  }, [role]);

  useEffect(() => {
    if (academyId && (role === 'STUDENT' || role === 'TEACHER')) {
      loadClasses(academyId);
    } else {
      setClasses([]);
    }
  }, [academyId, role]);

  const loadAcademies = async () => {
    setLoadingAcademies(true);
    try {
      const res = await apiClient('/academies');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAcademies(data.data);
      }
    } catch (err) {
      console.error('Failed to load academies:', err);
    } finally {
      setLoadingAcademies(false);
    }
  };

  const loadClasses = async (academyId: string) => {
    setLoadingClasses(true);
    try {
      const res = await apiClient(`/classes?academyId=${academyId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setClasses(data.data);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  return {
    academies,
    classes,
    loadingAcademies,
    loadingClasses,
  };
}
