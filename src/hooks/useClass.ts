'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { ClassWithEnrollment, ApiResponse } from '@/types';

interface UseClassOptions {
  classId: string;
  autoFetch?: boolean;
}

interface UseClassReturn {
  classData: ClassWithEnrollment | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing a single class's data
 */
export function useClass({ classId, autoFetch = true }: UseClassOptions): UseClassReturn {
  const [classData, setClassData] = useState<ClassWithEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClass = useCallback(async (): Promise<void> => {
    if (!classId) return;

    try {
      setLoading(true);
      setError(null);
      
      const res = await apiClient(`/classes/${classId}`);
      const result: ApiResponse<ClassWithEnrollment> = await res.json();
      
      if (result.success && result.data) {
        setClassData(result.data);
      } else {
        setError(result.error || 'Error loading class');
      }
    } catch (e) {
      console.error('[useClass] Error:', e);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (autoFetch && classId) {
      fetchClass();
    }
  }, [autoFetch, classId, fetchClass]);

  return {
    classData,
    loading,
    error,
    refetch: fetchClass,
  };
}

export default useClass;
