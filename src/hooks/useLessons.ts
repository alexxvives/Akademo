'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import type { LessonSummary, LessonDetail, ApiResponse } from '@/types';

interface UseLessonsOptions {
  classId: string;
  autoFetch?: boolean;
  pollInterval?: number; // For transcoding status polling
}

interface UseLessonsReturn {
  lessons: LessonSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getLesson: (lessonId: string) => Promise<LessonDetail | null>;
  selectedLesson: LessonDetail | null;
  selectLesson: (lessonId: string) => Promise<void>;
  clearSelection: () => void;
  hasTranscoding: boolean;
}

/**
 * Hook for managing lessons data for a class
 */
export function useLessons({
  classId,
  autoFetch = true,
  pollInterval,
}: UseLessonsOptions): UseLessonsReturn {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonDetail | null>(null);

  const fetchLessons = useCallback(async (checkTranscoding = false): Promise<void> => {
    if (!classId) return;

    try {
      setError(null);
      const url = checkTranscoding 
        ? `/lessons?classId=${classId}&checkTranscoding=true`
        : `/lessons?classId=${classId}`;
      
      const res = await apiClient(url);
      const result: ApiResponse<LessonSummary[]> = await res.json();
      
      if (result.success && result.data) {
        setLessons(prev => {
          // Preserve client-side upload state when updating
          return result.data!.map(serverLesson => {
            const localLesson = prev.find(l => l.id === serverLesson.id);
            if (localLesson?.isUploading) {
              return { 
                ...serverLesson, 
                isUploading: true, 
                uploadProgress: localLesson.uploadProgress 
              };
            }
            return serverLesson;
          });
        });
      } else {
        setError(result.error || 'Error loading lessons');
      }
    } catch (e) {
      console.error('[useLessons] Error:', e);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const getLesson = useCallback(async (lessonId: string): Promise<LessonDetail | null> => {
    try {
      const res = await apiClient(`/lessons/${lessonId}`);
      const result: ApiResponse<LessonDetail> = await res.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (e) {
      console.error('[useLessons] Error fetching lesson:', e);
      return null;
    }
  }, []);

  const selectLesson = useCallback(async (lessonId: string): Promise<void> => {
    const lesson = await getLesson(lessonId);
    setSelectedLesson(lesson);
  }, [getLesson]);

  const clearSelection = useCallback(() => {
    setSelectedLesson(null);
  }, []);

  const refetch = useCallback(() => fetchLessons(true), [fetchLessons]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && classId) {
      fetchLessons();
    }
  }, [autoFetch, classId, fetchLessons]);

  // Poll for transcoding status
  const hasTranscoding = useMemo(
    () => lessons.some(l => l.isTranscoding === 1),
    [lessons]
  );

  useEffect(() => {
    if (!hasTranscoding || !pollInterval) return;

    const interval = setInterval(() => {
      fetchLessons(true);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [hasTranscoding, pollInterval, fetchLessons]);

  return {
    lessons,
    loading,
    error,
    refetch,
    getLesson,
    selectedLesson,
    selectLesson,
    clearSelection,
    hasTranscoding,
  };
}

export default useLessons;
