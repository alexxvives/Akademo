'use client';

import { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUploadWarning } from '@/hooks/useUploadWarning';
import { useTranscodingPoll } from '@/hooks/useTranscodingPoll';
import { loadDemoClassData } from './class-demo-loader';
import type { Topic, Lesson, LessonDetail, LessonVideo, PendingEnrollment, LiveClass, StreamRecording, ClassData, LessonFeedback, LessonFormData } from './types';
import type { TopicAssignment } from './topics-lessons/types';

const DEFAULT_FORM_DATA = () => {
  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  return {
    title: '', description: '', externalUrl: '',
    releaseDate: today,
    releaseTime: new Date().toTimeString().slice(0, 5),
    publishImmediately: true, publishMode: 'immediate' as const,
    availableFromDate: today, availableFromTime: '09:00',
    availableUntilDate: today, availableUntilTime: '21:00',
    maxWatchTimeMultiplier: 2.0, watermarkIntervalMins: 5,
    topicId: '' as string, videos: [] as { file: File; title: string; description: string; duration: number }[],
    documents: [] as { file: File; title: string; description: string }[], selectedStreamRecordings: [] as string[],
    links: [] as { title: string; url: string }[],
  };
};

export function useClassDetail(role: 'academy' | 'teacher' | 'admin') {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = params?.id as string;
  const basePath = `/dashboard/${role}`;
  const { user: currentUser } = useAuth();

  // Core state
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [assignments, setAssignments] = useState<TopicAssignment[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonDetail | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<LessonVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonFeedback, setLessonFeedback] = useState<LessonFeedback[]>([]);
  const [highlightLessonId, setHighlightLessonId] = useState<string | null>(null);

  // Form state
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonMedia, setEditingLessonMedia] = useState<{
    videos: Array<{ id: string; title: string; durationSeconds: number | null; bunnyGuid?: string }>;
    documents: Array<{ id: string; title: string; fileName: string; storagePath: string }>;
    links: Array<{ id: string; title: string; url: string; orderIndex: number }>;
  } | null>(null);
  const [lessonFormData, setLessonFormData] = useState<LessonFormData>(DEFAULT_FORM_DATA());
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [uploadETA, setUploadETA] = useState(0);
  const activeUploadRef = useRef<XMLHttpRequest | AbortController | null>(null);
  const uploadStartTimeRef = useRef<number>(0);
  const lastProgressRef = useRef<{ loaded: number; time: number }>({ loaded: 0, time: 0 });

  // UI state
  const [showStreamNameModal, setShowStreamNameModal] = useState(false);
  const [streamNameInput, setStreamNameInput] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reschedulingLesson, setReschedulingLesson] = useState<Lesson | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [expandTopicId, setExpandTopicId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && classId) {
      return sessionStorage.getItem(`topic_expand_${classId}`) || null;
    }
    return null;
  });
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Data state
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [creatingStream, setCreatingStream] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');
  const [feedbackEnabled, setFeedbackEnabled] = useState<boolean>(true);
  const [academyDefaults, setAcademyDefaults] = useState({ maxWatchTimeMultiplier: 2.0, watermarkIntervalMins: 5 });
  const [availableStreamRecordings, setAvailableStreamRecordings] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);

  // Upload warning
  useUploadWarning(uploading);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & { akademoUploading?: boolean }).akademoUploading = uploading;
    }
  }, [uploading]);

  // Transcoding poll
  useTranscodingPoll(lessons, classData?.id, setLessons);

  // Persist topic expand state
  useEffect(() => {
    if (classId) sessionStorage.setItem(`topic_expand_${classId}`, expandTopicId ?? '');
  }, [expandTopicId, classId]);

  // --- Data Loading Functions ---
  const loadLessonFeedback = async (lessonId: string) => {
    if (lessonId.startsWith('demo-')) { setLessonFeedback([]); return; }
    try {
      const res = await apiClient(`/lessons/${lessonId}/ratings`);
      const result = await res.json();
      if (result.success && result.data) setLessonFeedback(result.data);
    } catch { setLessonFeedback([]); }
  };

  const loadAvailableStreamRecordings = async (): Promise<StreamRecording[] | null> => {
    try {
      const response = await apiClient(`/live/history?t=${Date.now()}`, {
        cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      });
      const result = await response.json();
      if (result.success && result.data) {
        const recordingsForClass = (result.data || []).filter((stream: StreamRecording) => {
          const matchClass = stream.classId === classId || stream.classSlug === classId || stream.classDeleted;
          const hasRecording = (stream.status === 'ended' || (stream.recordingId && stream.recordingId.length > 5));
          const notUsed = !stream.validRecordingId;
          const bunnyReady = stream.bunnyStatus === null || stream.bunnyStatus === undefined || (stream.bunnyStatus >= 4 && stream.bunnyStatus !== 6);
          return matchClass && hasRecording && notUsed && bunnyReady;
        });
        setAvailableStreamRecordings(recordingsForClass);
        return recordingsForClass;
      }
    } catch (error) { console.error('Error loading stream recordings:', error); }
    return null;
  };

  const loadLessonDetail = async (lessonId: string): Promise<LessonDetail | null> => {
    if (lessonId.startsWith('demo-') && paymentStatus === 'NOT PAID') {
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) {
        const detailLesson: LessonDetail = {
          id: lesson.id, title: lesson.title, description: lesson.description, externalUrl: null,
          releaseDate: lesson.releaseDate, maxWatchTimeMultiplier: lesson.maxWatchTimeMultiplier,
          watermarkIntervalMins: lesson.watermarkIntervalMins, videos: lesson.videos || [], documents: lesson.documents || [],
        };
        setSelectedLesson(detailLesson);
        loadLessonFeedback(lessonId);
        return detailLesson;
      }
      return null;
    }
    try {
      const res = await apiClient(`/lessons/${lessonId}`);
      const result = await res.json();
      if (result.success) { setSelectedLesson(result.data); loadLessonFeedback(lessonId); return result.data; }
    } catch (e) { console.error(e); }
    return null;
  };

  const loadLiveClasses = async () => {
    try {
      const id = classData?.id;
      if (!id) return;
      const res = await apiClient(`/live?classId=${id}`);
      const result = await res.json();
      if (result.success) setLiveClasses((result.data || []).filter((s: LiveClass) => s.status === 'active' || s.status === 'scheduled'));
    } catch (e) { console.error('Failed to load live classes:', e); }
  };

  const loadData = async () => {
    try {
      if (role === 'academy' || role === 'teacher') {
        const academiesRes = await apiClient('/academies');
        const academiesResult = await academiesRes.json();
        let currentPaymentStatus = 'NOT PAID';
        let currentFeedbackEnabled = true;
        if (academiesResult.success && Array.isArray(academiesResult.data) && academiesResult.data.length > 0) {
          currentPaymentStatus = academiesResult.data[0].paymentStatus || 'NOT PAID';
          currentFeedbackEnabled = academiesResult.data[0].feedbackEnabled !== 0;
        }
        setPaymentStatus(currentPaymentStatus);
        setFeedbackEnabled(currentFeedbackEnabled);

        if (currentPaymentStatus === 'NOT PAID') {
          const demoResult = await loadDemoClassData(classId);
          if (demoResult) {
            setClassData(demoResult.classData);
            setLessons(demoResult.lessons);
            setTopics(demoResult.topics);
            setPendingEnrollments([]);
            setLoading(false);
            return;
          }
        }
      }

      const classRes = await apiClient(`/classes/${classId}`);
      const classResult = await classRes.json();
      if (!classResult.success) throw new Error('Failed to load class');
      setClassData(classResult.data);
      const actualClassId = classResult.data.id;

      try {
        const academyRes = await apiClient(`/academies/${classResult.data.academyId}`);
        const academyResult = await academyRes.json();
        if (academyResult.success && academyResult.data) {
          const defaults = { maxWatchTimeMultiplier: academyResult.data.defaultMaxWatchTimeMultiplier ?? 2.0, watermarkIntervalMins: academyResult.data.defaultWatermarkIntervalMins ?? 5 };
          setAcademyDefaults(defaults);
          if (role === 'teacher') { if (academyResult.data.paymentStatus) setPaymentStatus(academyResult.data.paymentStatus); setFeedbackEnabled(academyResult.data.feedbackEnabled !== 0); }
          setLessonFormData(prev => ({
            ...prev,
            maxWatchTimeMultiplier: prev.maxWatchTimeMultiplier === 2.0 ? defaults.maxWatchTimeMultiplier : prev.maxWatchTimeMultiplier,
            watermarkIntervalMins: prev.watermarkIntervalMins === 5 ? defaults.watermarkIntervalMins : prev.watermarkIntervalMins,
          }));
        }
      } catch (e) { console.error('Failed to load academy defaults:', e); }

      const [lessonsRes, topicsRes, pendingRes, assignmentsRes] = await Promise.all([
        apiClient(`/lessons?classId=${actualClassId}`), apiClient(`/topics?classId=${actualClassId}`), apiClient('/enrollments/pending'),
        apiClient(`/assignments?classId=${actualClassId}`),
      ]);
      const [lessonsResult, topicsResult, pendingResult, assignmentsResult] = await Promise.all([lessonsRes.json(), topicsRes.json(), pendingRes.json(), assignmentsRes.json()]);
      if (lessonsResult.success) setLessons(lessonsResult.data || []);
      if (topicsResult.success) setTopics(topicsResult.data || []);
      if (assignmentsResult.success) setAssignments(assignmentsResult.data || []);
      if (pendingResult.success) {
        setPendingEnrollments((pendingResult.data || []).filter((e: PendingEnrollment) => e.classId === actualClassId));
      }
      const enrollmentsRes = await apiClient(`/enrollments?classId=${actualClassId}`);
      const enrollmentsResult = await enrollmentsRes.json();
      if (enrollmentsResult.success && Array.isArray(enrollmentsResult.data)) {
        setClassData(prev => ({ ...prev!, enrollments: enrollmentsResult.data }));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return {
    router, searchParams, classId, basePath, currentUser,
    classData, setClassData, lessons, setLessons, topics, setTopics, assignments, setAssignments,
    selectedLesson, setSelectedLesson, selectedVideo, setSelectedVideo,
    loading, lessonFeedback, highlightLessonId, setHighlightLessonId,
    showLessonForm, setShowLessonForm, editingLessonId, setEditingLessonId,
    editingLessonMedia, setEditingLessonMedia, lessonFormData, setLessonFormData,
    uploading, setUploading, uploadProgress, setUploadProgress, uploadSpeed, setUploadSpeed, uploadETA, setUploadETA,
    activeUploadRef, uploadStartTimeRef, lastProgressRef,
    showStreamNameModal, setShowStreamNameModal, streamNameInput, setStreamNameInput,
    showRescheduleModal, setShowRescheduleModal, reschedulingLesson, setReschedulingLesson,
    rescheduleDate, setRescheduleDate, rescheduleTime, setRescheduleTime,
    expandTopicId, setExpandTopicId, showPendingRequests, setShowPendingRequests,
    copiedLink, setCopiedLink,
    pendingEnrollments, setPendingEnrollments, liveClasses, setLiveClasses,
    creatingStream, setCreatingStream, paymentStatus, setPaymentStatus,
    feedbackEnabled, academyDefaults, availableStreamRecordings, setAvailableStreamRecordings,
    loadData, loadLiveClasses, loadLessonDetail, loadLessonFeedback, loadAvailableStreamRecordings,
  };
}

export type ClassDetailState = ReturnType<typeof useClassDetail>;
