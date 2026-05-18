'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { generateDemoStudentLessons, generateDemoClasses } from '@/lib/demo-data';
import type { Video, Lesson, Topic, ClassData, ActiveStream } from './types';
import type { StudentAssignment } from './StudentTopicsLessonsTypes';

export function useClassPageData() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = params.id as string;
  const lessonParam = searchParams.get('lesson');
  const watchVideoId = searchParams.get('watch');
  const { user } = useAuth();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonRating, setLessonRating] = useState<number | null>(null);
  const [ratingHover, setRatingHover] = useState<number>(0);
  const [activeStream, setActiveStream] = useState<ActiveStream | null>(null);
  const [showRatingSuccess, setShowRatingSuccess] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [tempRating, setTempRating] = useState<number | null>(null);
  const [academyFeedbackEnabled, setAcademyFeedbackEnabled] = useState<boolean>(true);
  const [isDemo, setIsDemo] = useState(false);
  const [accessLocked, setAccessLocked] = useState(false);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);

  const loadData = async () => {
    try {
      const demoClasses = generateDemoClasses();
      const demoClass = demoClasses.find(c => c.id === classId || c.name.toLowerCase().replace(/\s+/g, '-') === classId);

      if (demoClass) {
        let isDemoAcademy = false;
        try {
          const academiesRes = await apiClient('/academies');
          const academiesResult = await academiesRes.json();
          if (academiesResult.success && Array.isArray(academiesResult.data) && academiesResult.data.length > 0) {
            isDemoAcademy = academiesResult.data[0].paymentStatus === 'NOT PAID';
          }
        } catch { /* fallback */ }

        if (isDemoAcademy || classId.startsWith('demo-')) {
          setIsDemo(true);
          setClassData({
            id: demoClass.id,
            name: demoClass.name,
            description: demoClass.description,
            startDate: demoClass.startDate,
            academy: { name: 'Academia Demo', id: 'demo-academy-1' },
          });
          setAcademyFeedbackEnabled(true);
          const demoLessons = generateDemoStudentLessons(demoClass.id);
          setLessons(demoLessons as unknown as Lesson[]);
          setTopics([]);
          setLoading(false);
          return;
        }
      }

      const classRes = await apiClient(`/classes/${classId}`);
      const classResult = await classRes.json();

      if (!classResult.success) {
        console.error('[Student Class] Failed to load class:', classResult.error);
        setLoading(false);
        return;
      }

      setClassData(classResult.data);

      if (classResult.data.accessLocked === true) {
        setAccessLocked(true);
        setLoading(false);
        return;
      }

      if (classResult.data.academy?.id) {
        try {
          const academyRes = await apiClient(`/academies/${classResult.data.academy.id}`);
          const academyResult = await academyRes.json();
          if (academyResult.success && academyResult.data) {
            setAcademyFeedbackEnabled(academyResult.data.feedbackEnabled !== 0);
          }
        } catch (error) {
          console.error('[Student Class] Failed to load academy:', error);
        }
      }

      const resolvedClassId = classResult.data.id;
      const [lessonsRes, topicsRes, assignmentsRes] = await Promise.all([
        apiClient(`/lessons?classId=${resolvedClassId}`),
        apiClient(`/topics?classId=${resolvedClassId}`),
        apiClient(`/assignments?classId=${resolvedClassId}`),
      ]);
      const [lessonsResult, topicsResult, assignmentsResult] = await Promise.all([
        lessonsRes.json(),
        topicsRes.json(),
        assignmentsRes.json(),
      ]);

      if (topicsResult.success) setTopics(topicsResult.data || []);
      if (lessonsResult.success) setLessons(lessonsResult.data);
      if (assignmentsResult.success) setAssignments(assignmentsResult.data || []);
    } catch (error) {
      console.error('[Student Class] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    if (!classData?.id) return;
    const checkStream = async () => {
      try {
        const res = await apiClient('/live/active');
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          const stream = result.data.find((s: ActiveStream) => s.classId === classData.id);
          setActiveStream(stream || null);
        }
      } catch (error) {
        console.error('Failed to check streams:', error);
      }
    };
    checkStream();
    const interval = setInterval(checkStream, 30000);
    return () => clearInterval(interval);
  }, [classData?.id]);

  useEffect(() => {
    if (lessons.length === 0) return;
    if (lessonParam) {
      const reloadLessonData = async () => {
        if (isDemo) {
          const lesson = lessons.find(l => l.id === lessonParam);
          if (lesson) {
            setSelectedLesson(lesson);
            setLessonRating(null);
            if (watchVideoId) {
              const video = lesson.videos.find(v => v.id === watchVideoId);
              if (video) setSelectedVideo(video);
            } else if (lesson.videos.length > 0) {
              setSelectedVideo(lesson.videos[0]);
            }
          }
          return;
        }
        try {
          const res = await apiClient(`/lessons/${lessonParam}`);
          const result = await res.json();
          if (result.success && result.data) {
            const freshLesson = result.data;
            setLessons(prev => prev.map(l => l.id === lessonParam ? freshLesson : l));
            setSelectedLesson(freshLesson);
            apiClient(`/ratings?lessonId=${freshLesson.id}`)
              .then(res => res.ok ? res.json() : null)
              .then(data => setLessonRating(data?.data?.rating ?? null))
              .catch(() => setLessonRating(null));
            if (watchVideoId) {
              const video = freshLesson.videos.find((v: Video) => v.id === watchVideoId);
              if (video) setSelectedVideo(video);
              else console.warn('[URL Params] Video not found in lesson:', watchVideoId);
            } else if (freshLesson.videos.length > 0) {
              setSelectedVideo(freshLesson.videos[0]);
            }
          }
        } catch (error) {
          console.error('[URL Params] Failed to reload lesson:', error);
          const lesson = lessons.find(l => l.id === lessonParam);
          if (lesson) {
            setSelectedLesson(lesson);
            if (watchVideoId) {
              const video = lesson.videos.find(v => v.id === watchVideoId);
              if (video) setSelectedVideo(video);
            } else if (lesson.videos.length > 0) {
              setSelectedVideo(lesson.videos[0]);
            }
          }
        }
      };
      reloadLessonData();
    } else {
      setSelectedLesson(null);
      setSelectedVideo(null);
      setLessonRating(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonParam, watchVideoId, lessons.length]);

  return {
    classId, user, classData, lessons, topics, assignments,
    expandedTopics, setExpandedTopics,
    selectedLesson, setSelectedLesson, setLessons,
    selectedVideo, setSelectedVideo,
    loading, lessonRating, setLessonRating,
    ratingHover, setRatingHover,
    activeStream, showRatingSuccess, setShowRatingSuccess,
    feedbackText, setFeedbackText,
    tempRating, setTempRating,
    academyFeedbackEnabled, isDemo, accessLocked,
    router, loadData,
  };
}
