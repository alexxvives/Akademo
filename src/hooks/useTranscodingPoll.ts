'use client';

import { useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

/**
 * Hook to poll for transcoding status updates for lessons.
 * Automatically polls when any lesson has isTranscoding = 1.
 * 
 * @param lessons - Current lessons array (must have id, isTranscoding, isUploading, uploadProgress)
 * @param classId - The actual class UUID (not slug)
 * @param setLessons - State setter for lessons
 * @param pollInterval - Polling interval in milliseconds (default: 10000)
 */
export function useTranscodingPoll(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lessons: any[],
  classId: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setLessons: React.Dispatch<React.SetStateAction<any[]>>,
  pollInterval = 10000
) {
  useEffect(() => {
    const hasTranscoding = lessons.some(l => l.isTranscoding === 1);
    if (!hasTranscoding || !classId) return;

    const interval = setInterval(async () => {
      try {
        const lessonsRes = await apiClient(`/lessons?classId=${classId}&checkTranscoding=true`);
        const lessonsResult = await lessonsRes.json();
        
        if (lessonsResult.success && lessonsResult.data) {
          // Preserve local upload state when updating from server
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setLessons((prev: any[]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newLessons = lessonsResult.data.map((serverLesson: any) => {
              const localLesson = prev.find(l => l.id === serverLesson.id);
              if (localLesson?.isUploading) {
                return { ...serverLesson, isUploading: true, uploadProgress: localLesson.uploadProgress };
              }
              return serverLesson;
            });
            return newLessons;
          });
        }
      } catch (e) {
        console.error('Failed to poll transcoding status:', e);
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [lessons, classId, setLessons, pollInterval]);
}
