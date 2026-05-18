import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Lesson, StudentTimeData } from './types';

export function useStudentTimes(isDisabled: boolean) {
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedLessonForTime, setSelectedLessonForTime] = useState<Lesson | null>(null);
  const [isLoadingStudentTimes, setIsLoadingStudentTimes] = useState(false);
  const [timeSearchQuery, setTimeSearchQuery] = useState('');
  const [studentTimesData, setStudentTimesData] = useState<StudentTimeData[]>([]);

  const handleManageStudentTimes = async (lesson: Lesson) => {
    setSelectedLessonForTime(lesson);
    setShowTimeModal(true);
    setIsLoadingStudentTimes(true);
    setStudentTimesData([]);

    try {
      if (isDisabled) {
        const { generateDemoStudentTimes } = await import('@/lib/demo-data');
        const demoData = generateDemoStudentTimes(lesson.id);
        setStudentTimesData(demoData);
        setIsLoadingStudentTimes(false);
        return;
      }

      const res = await apiClient(`/lessons/${lesson.id}/student-times`);
      const result = await res.json();
      if (result.success) {
        setStudentTimesData(result.data || []);
      }
    } catch (err) {
      console.error('Failed to load student times:', err);
      alert('Error al cargar tiempos de estudiantes');
    } finally {
      setIsLoadingStudentTimes(false);
    }
  };

  const handleUpdateStudentTime = async (studentId: string, videoId: string, newTimeSeconds: number) => {
    try {
      const res = await apiClient(`/videos/progress/admin-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          videoId,
          totalWatchTimeSeconds: newTimeSeconds,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setStudentTimesData(prev => prev.map(student => {
          if (student.studentId !== studentId) return student;
          return {
            ...student,
            videos: student.videos.map(video => {
              if (video.videoId !== videoId) return video;
              return {
                ...video,
                totalWatchTimeSeconds: newTimeSeconds,
                status: newTimeSeconds >= video.maxWatchTimeSeconds ? 'BLOCKED' : 'ACTIVE',
              };
            }),
          };
        }));
      } else {
        alert(result.error || 'Error al actualizar tiempo');
      }
    } catch (error) {
      console.error('Failed to update student time:', error);
      alert('Error al actualizar tiempo');
    }
  };

  const handleAddExtension = async (studentId: string, videoId: string, extraMinutes: number, validFrom: string, validUntil: string) => {
    try {
      const res = await apiClient('/videos/extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, studentId, extraMinutes, validFrom, validUntil }),
      });
      const result = await res.json();
      if (!result.success) {
        alert(result.error || 'Error al añadir tiempo extra');
        return;
      }
      // Reload student times to reflect the new extension
      if (selectedLessonForTime) {
        await handleManageStudentTimes(selectedLessonForTime);
      }
    } catch (error) {
      console.error('Failed to add extension:', error);
      alert('Error al añadir tiempo extra');
    }
  };

  const handleDeleteExtension = async (extensionId: string) => {
    try {
      const res = await apiClient(`/videos/extensions/${extensionId}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) {
        alert(result.error || 'Error al eliminar extensión');
        return;
      }
      if (selectedLessonForTime) {
        await handleManageStudentTimes(selectedLessonForTime);
      }
    } catch (error) {
      console.error('Failed to delete extension:', error);
      alert('Error al eliminar extensión');
    }
  };

  const closeTimeModal = () => {
    setShowTimeModal(false);
    setSelectedLessonForTime(null);
    setStudentTimesData([]);
    setTimeSearchQuery('');
  };

  return {
    showTimeModal,
    selectedLessonForTime,
    isLoadingStudentTimes,
    timeSearchQuery,
    setTimeSearchQuery,
    studentTimesData,
    handleManageStudentTimes,
    handleUpdateStudentTime,
    handleAddExtension,
    handleDeleteExtension,
    closeTimeModal,
  };
}
