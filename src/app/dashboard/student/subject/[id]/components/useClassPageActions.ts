'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { apiClient } from '@/lib/api-client';
import type { Video, Lesson } from './types';

interface ActionDeps {
  classId: string;
  isDemo: boolean;
  selectedLesson: Lesson | null;
  router: AppRouterInstance;
  loadData: () => Promise<void>;
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  setSelectedLesson: React.Dispatch<React.SetStateAction<Lesson | null>>;
  setSelectedVideo: React.Dispatch<React.SetStateAction<Video | null>>;
  setLessonRating: React.Dispatch<React.SetStateAction<number | null>>;
  setExpandedTopics: React.Dispatch<React.SetStateAction<Set<string>>>;
  setShowRatingSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setTempRating: React.Dispatch<React.SetStateAction<number | null>>;
  setFeedbackText: React.Dispatch<React.SetStateAction<string>>;
  showRatingSuccess: boolean;
  feedbackText: string;
  tempRating: number | null;
}

export function useClassPageActions(deps: ActionDeps) {
  const {
    classId, isDemo, selectedLesson, router, loadData,
    setLessons, setSelectedLesson, setSelectedVideo,
    setLessonRating, setExpandedTopics,
    setShowRatingSuccess, setTempRating, setFeedbackText,
    showRatingSuccess, feedbackText, tempRating: _tempRating,
  } = deps;

  const selectLesson = async (lesson: Lesson) => {
    const isReleased = new Date(lesson.releaseDate) <= new Date();
    if (!isReleased) return;

    if (!isDemo) {
      try {
        const res = await apiClient(`/ratings?lessonId=${lesson.id}`);
        if (res.ok) {
          const data = await res.json();
          setLessonRating(data.data?.rating ?? null);
        } else {
          setLessonRating(null);
        }
      } catch {
        setLessonRating(null);
      }
    } else {
      setLessonRating(null);
    }

    router.push(`/dashboard/student/subject/${classId}?lesson=${lesson.id}`);
  };

  const goBackToLessons = async () => {
    if (selectedLesson && selectedLesson.topicId) {
      setExpandedTopics(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedLesson.topicId!);
        return newSet;
      });
    }
    router.push(`/dashboard/student/subject/${classId}`);
    setSelectedLesson(null);
    setSelectedVideo(null);
    setLessonRating(null);
    await loadData();
  };

  const selectVideoInLesson = async (video: Video) => {
    if (!selectedLesson) return;

    if (isDemo) {
      setSelectedVideo(video);
      router.push(`/dashboard/student/subject/${classId}?lesson=${selectedLesson.id}&watch=${video.id}`);
      return;
    }

    try {
      const res = await apiClient(`/lessons/${selectedLesson.id}`);
      const result = await res.json();
      if (result.success && result.data) {
        setLessons(prev => prev.map(l => l.id === selectedLesson.id ? result.data : l));
        setSelectedLesson(result.data);
        const updatedVideo = result.data.videos.find((v: Video) => v.id === video.id);
        if (updatedVideo) setSelectedVideo(updatedVideo);
      }
    } catch (error) {
      console.error('[Video Switch] Failed to reload lesson:', error);
    }

    router.push(`/dashboard/student/subject/${classId}?lesson=${selectedLesson.id}&watch=${video.id}`);
  };

  const submitRating = async (rating: number) => {
    if (!selectedLesson || showRatingSuccess) return;

    if (isDemo) {
      setLessonRating(rating);
      setShowRatingSuccess(true);
      setTempRating(null);
      setFeedbackText('');
      setTimeout(() => setShowRatingSuccess(false), 2000);
      return;
    }

    try {
      const res = await apiClient('/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          rating,
          feedback: feedbackText || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLessonRating(rating);
        setShowRatingSuccess(true);
        setTempRating(null);
        setFeedbackText('');
        window.dispatchEvent(new CustomEvent('unreadReviewsChanged'));
        setTimeout(() => setShowRatingSuccess(false), 2000);
      } else {
        console.error('Failed to submit rating:', data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }
  };

  const handleStarClick = (rating: number) => {
    if (showRatingSuccess) return;
    setTempRating(rating);
  };

  return { selectLesson, goBackToLessons, selectVideoInLesson, submitRating, handleStarClick };
}
