'use client';

import { useEffect, useState, useRef } from 'react';
import { apiClient, API_BASE_URL } from '@/lib/api-client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import { PageLoader } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { multipartUpload } from '@/lib/multipart-upload';
import { uploadToBunny } from '@/lib/bunny-upload';
import { getBunnyThumbnailUrl } from '@/lib/bunny-stream';
import ConfirmModal from '@/components/ConfirmModal';

// Import components
import ClassHeader from './components/ClassHeader';
import PendingEnrollments from './components/PendingEnrollments';
import LessonsList from './components/LessonsList';
import TopicsLessonsList from './components/TopicsLessonsList';
import StudentsList from './components/StudentsList';

interface Topic {
  id: string;
  name: string;
  classId: string;
  orderIndex: number;
  lessonCount: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  releaseDate: string;
  topicId: string | null;
  topicName?: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videoCount: number;
  documentCount: number;
  studentsWatching?: number;
  avgProgress?: number;
  avgRating?: number;
  ratingCount?: number;
  firstVideoBunnyGuid?: string;
  firstVideoUpload?: { bunnyGuid?: string };
  isTranscoding?: number;
  isUploading?: boolean;
  uploadProgress?: number;
}

interface LessonDetail {
  id: string;
  title: string;
  description: string | null;
  externalUrl: string | null;
  releaseDate: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videos: Array<{ id: string; title: string; description: string | null; durationSeconds: number | null }>;
  documents: Array<{ id: string; title: string; description: string | null; upload: { storagePath: string; fileName: string; mimeType?: string } }>;
}

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  academy: { id: string; name: string };
  enrollments: Array<{
    id: string;
    student: { id: string; firstName: string; lastName: string; email: string };
    enrolledAt: string;
    status: string;
  }>;
}

export default function TeacherClassPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = params?.id as string;
  const lessonParam = searchParams.get('lesson');
  const watchVideoId = searchParams.get('watch');
  const actionParam = searchParams.get('action');
  
  // Use cached auth hook instead of fetching /auth/me manually
  const { user: currentUser, isAcademy } = useAuth();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonDetail | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lessonFeedback, setLessonFeedback] = useState<Array<{ id: string; rating: number; comment: string; studentName: string; createdAt: string }>>([]);

  // Form states
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonMedia, setEditingLessonMedia] = useState<{
    videos: Array<{ id: string; title: string; durationSeconds: number | null; bunnyGuid?: string }>;
    documents: Array<{ id: string; title: string; fileName: string; storagePath: string }>;
  } | null>(null);
  const [showStreamNameModal, setShowStreamNameModal] = useState(false);
  const [streamNameInput, setStreamNameInput] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reschedulingLesson, setReschedulingLesson] = useState<Lesson | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0); // bytes per second
  const [uploadETA, setUploadETA] = useState(0); // seconds remaining
  const activeUploadRef = useRef<XMLHttpRequest | null>(null);
  const uploadStartTimeRef = useRef<number>(0);
  const lastProgressRef = useRef<{loaded: number, time: number}>({loaded: 0, time: 0});
  const [expandTopicId, setExpandTopicId] = useState<string | null>(null);
  const [academyDefaults, setAcademyDefaults] = useState({ maxWatchTimeMultiplier: 2.0, watermarkIntervalMins: 5 });
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    description: '',
    externalUrl: '',
    releaseDate: new Date().toISOString().split('T')[0],
    releaseTime: '00:00',
    publishImmediately: true,
    maxWatchTimeMultiplier: 2.0,
    watermarkIntervalMins: 5,
    topicId: '' as string,
    videos: [] as { file: File; title: string; description: string; duration: number }[],
    documents: [] as { file: File; title: string; description: string }[],
    selectedStreamRecordings: [] as string[],
  });
  const [availableStreamRecordings, setAvailableStreamRecordings] = useState<Array<{id: string; title: string; createdAt: string}>>([]);

  // Analytics
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Pending Enrollments
  const [pendingEnrollments, setPendingEnrollments] = useState<any[]>([]);
  const [showPendingRequests, setShowPendingRequests] = useState(false);

  // Live Classes (Zoom)
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [creatingStream, setCreatingStream] = useState(false);
  const [streamFormData, setStreamFormData] = useState({
    title: '',
  });
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');

  useEffect(() => {
    if (classId) {
      loadData();
      loadLiveClasses();
    }
  }, [classId]);

  // Poll for transcoding status updates
  useEffect(() => {
    const hasTranscoding = lessons.some(l => l.isTranscoding === 1);
    if (!hasTranscoding || !classData?.id) return;

    const interval = setInterval(async () => {
      try {
        // Use checkTranscoding=true to update Bunny status before returning lessons
        // Use classData.id (actual UUID) instead of classId from URL (could be slug)
        const lessonsRes = await apiClient(`/lessons?classId=${classData.id}&checkTranscoding=true`);
        const lessonsResult = await lessonsRes.json();
        if (lessonsResult.success && lessonsResult.data) {
          // Preserve local upload state when updating from server
          setLessons(prev => {
            const newLessons = lessonsResult.data.map((serverLesson: Lesson) => {
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
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [lessons, classData?.id]);

  // Handle URL params for lesson/video selection
  useEffect(() => {
    if (lessons.length === 0) return;

    if (lessonParam) {
      loadLessonDetail(lessonParam).then(lesson => {
        if (lesson) {
          if (watchVideoId) {
            const video = lesson.videos.find((v: any) => v.id === watchVideoId);
            if (video) {
              setSelectedVideo(video);
            }
          } else if (lesson.videos.length > 0) {
            setSelectedVideo(lesson.videos[0]);
          }
        }
      });
    } else {
      setSelectedLesson(null);
      setSelectedVideo(null);
    }
  }, [lessonParam, watchVideoId, lessons]);

  // Handle createFromStream param from streams table
  useEffect(() => {
    const createFromStreamId = searchParams.get('createFromStream');
    if (createFromStreamId) {
      // Load stream recordings and open modal
      loadAvailableStreamRecordings().then((recordings) => {
        setShowLessonForm(true);
        setEditingLessonId(null);
        // Auto-select the recording from this stream
        if (recordings && recordings.length > 0) {
          const matchingStream = recordings.find((r: any) => r.id === createFromStreamId);
          if (matchingStream) {
            setLessonFormData(prev => ({
              ...prev,
              selectedStreamRecordings: [matchingStream.id],
              title: matchingStream.title || 'Nueva Lección'
            }));
          }
        }
      });
    }
  }, [searchParams]);

  // Handle action param for create lesson modal
  useEffect(() => {
    if (actionParam === 'create' || actionParam === 'create-lesson') {
      const recordingId = searchParams.get('recordingId');
      const streamTitle = searchParams.get('streamTitle');
      
      setShowLessonForm(true);
      setEditingLessonId(null);
      loadAvailableStreamRecordings().then((recordings) => {
        // If recordingId and streamTitle are provided, find the stream by recordingId and pre-select it
        if (recordingId && streamTitle && recordings) {
          // Find the stream that has this recordingId
          const matchingStream = recordings.find((r: any) => r.recordingId === recordingId);
          if (matchingStream) {
            console.log('[Debug] Found matching stream:', matchingStream);
            setLessonFormData(prev => ({
              ...prev,
              selectedStreamRecording: matchingStream.id, // Use stream.id as the value
              title: decodeURIComponent(streamTitle),
            }));
          } else {
            console.log('[Debug] No matching stream found for recordingId:', recordingId);
          }
        }
      });
    }
  }, [actionParam]);

  const loadAvailableStreamRecordings = async () => {
    try {
      const response = await apiClient(`/live/history?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const result = await response.json();
      console.log('[Debug] History response:', result);
      console.log('[Debug] Current Class ID:', classId);
      
      if (result.success && result.data) {
        // Filter streams that:
        // 1. Belong to this class
        // 2. Have ended status OR have a valid recording ID (even if status is weird)
        const recordingsForClass = result.data.filter((s: any) => {
          // Check both classId and classSlug
          const matchClass = s.classId === classId || s.classSlug === classId;
          const hasRecording = (s.status === 'ended' || (s.recordingId && s.recordingId.length > 5));
          console.log(`[Debug] Stream ${s.id}: ClassMatch=${matchClass} (${s.classId} vs ${classId}), HasRec=${hasRecording}, Status=${s.status}, RecId=${s.recordingId}`);
          return matchClass && hasRecording;
        });
        console.log('[Debug] Filtered recordings:', recordingsForClass);
        setAvailableStreamRecordings(recordingsForClass);
        return recordingsForClass; // Return the recordings for the useEffect
      }
    } catch (error) {
      console.error('Error loading stream recordings:', error);
    }
    return null;
  };

  // Warn user when trying to close/refresh browser during upload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = 'Hay un video subiendo. Si cierras el navegador, se cancelará la subida.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploading]);

  // Block navigation during active upload using popstate
  useEffect(() => {
    if (!uploading) return;

    // Intercept browser back/forward buttons
    const handlePopState = (e: PopStateEvent) => {
      if (uploading) {
        const confirmLeave = window.confirm(
          '⚠️ ADVERTENCIA: Hay un video subiendo.\n\n' +
          'Si sales de esta página, la subida se cancelará y el video NO se guardará.\n\n' +
          '¿Estás seguro de que quieres salir?'
        );
        if (!confirmLeave) {
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // Push initial state to allow interception
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [uploading]);

  // Intercept link clicks during upload
  useEffect(() => {
    if (!uploading) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.href && !anchor.href.includes(window.location.pathname)) {
        e.preventDefault();
        e.stopPropagation();
        
        const confirmLeave = window.confirm(
          '⚠️ ADVERTENCIA: Hay un video subiendo.\n\n' +
          'Si sales de esta página, la subida se cancelará y el video NO se guardará.\n\n' +
          '¿Estás seguro de que quieres salir?'
        );
        
        if (confirmLeave) {
          window.location.href = anchor.href;
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [uploading]);

  const loadLessonFeedback = async (lessonId: string) => {
    // Skip API call for demo lessons
    if (lessonId.startsWith('demo-')) {
      setLessonFeedback([]);
      return;
    }
    
    try {
      const res = await apiClient(`/lessons/${lessonId}/ratings`);
      const result = await res.json();
      if (result.success && result.data) {
        setLessonFeedback(result.data);
      }
    } catch (error) {
      console.error('Error loading lesson feedback:', error);
      setLessonFeedback([]);
    }
  };

  const loadData = async () => {
    try {
      // Check payment status first
      const academiesRes = await apiClient('/academies');
      const academiesResult = await academiesRes.json();
      let currentPaymentStatus = 'NOT PAID';
      if (academiesResult.success && Array.isArray(academiesResult.data) && academiesResult.data.length > 0) {
        currentPaymentStatus = academiesResult.data[0].paymentStatus || 'NOT PAID';
      }
      setPaymentStatus(currentPaymentStatus);

      // If NOT PAID and this is a demo class, load demo data
      if (currentPaymentStatus === 'NOT PAID') {
        const { generateDemoClasses, generateDemoLessons } = await import('@/lib/demo-data');
        const demoClasses = generateDemoClasses();
        const demoLessons = generateDemoLessons();
        
        // Normalize slug for comparison (handle Spanish characters)
        const normalizeSlug = (str: string) => {
          return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
        };
        
        const urlSlug = normalizeSlug(decodeURIComponent(classId));
        
        // Find demo class by ID or by normalized slug
        const demoClass = demoClasses.find(c => {
          const classSlug = normalizeSlug(c.name);
          return c.id === classId || classSlug === urlSlug;
        });
        
        if (demoClass) {
          // Generate demo students for this class with varied activity
          const demoStudentsForClass = Array.from({ length: demoClass.studentCount || 30 }, (_, i) => {
            let lastLoginAt: string | null;
            const activityRoll = Math.random();
            if (activityRoll < 0.3) {
              // Active: last 24 hours (green)
              lastLoginAt = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
            } else if (activityRoll < 0.7) {
              // Recent: 1-7 days ago (yellow)
              lastLoginAt = new Date(Date.now() - (1 + Math.random() * 6) * 24 * 60 * 60 * 1000).toISOString();
            } else if (activityRoll < 0.9) {
              // Inactive: 7-30 days ago (red)
              lastLoginAt = new Date(Date.now() - (7 + Math.random() * 23) * 24 * 60 * 60 * 1000).toISOString();
            } else {
              // Never logged in (gray)
              lastLoginAt = null;
            }
            
            return {
              id: `demo-enrollment-${demoClass.id}-${i + 1}`,
              student: {
                id: `demo-student-${i + 1}`,
                firstName: ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Laura', 'Pedro', 'Isabel'][i % 10],
                lastName: ['García', 'Rodríguez', 'Martínez', 'López', 'Sánchez'][i % 5],
                email: `estudiante${i + 1}@demo.com`,
                lastLoginAt,
              },
              enrolledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'APPROVED',
            };
          });
          
          setClassData({
            id: demoClass.id,
            name: demoClass.name,
            description: demoClass.description,
            academy: { id: 'demo-academy', name: 'Mi Academia Demo' },
            enrollments: demoStudentsForClass,
          });
          
          // Filter lessons for this class and map to Lesson interface
          const classLessons = demoLessons
            .filter(l => l.classId === demoClass.id)
            .map(l => ({
              id: l.id,
              title: l.title,
              description: 'Lección de demostración con video de 1 hora',
              releaseDate: l.createdAt,
              topicId: null,
              maxWatchTimeMultiplier: 2.0,
              watermarkIntervalMins: 5,
              videoCount: 1,
              documentCount: l.documents?.length || 0,
              avgRating: 4.5 + Math.random() * 0.5,
              ratingCount: Math.floor(Math.random() * 20) + 5,
              firstVideoBunnyGuid: l.videoGuid,
              videos: [{
                id: `${l.id}-video`,
                title: l.title,
                bunnyGuid: l.videoGuid,
                durationSeconds: l.duration,
                createdAt: l.createdAt,
              }],
              documents: l.documents || [],
            } as Lesson));
          
          setLessons(classLessons);
          setTopics([]); // No topics for demo
          setPendingEnrollments([]);
          setLoading(false);
          return;
        }
      }
      
      // Normal flow for paid academies
      // First, fetch class data to get the actual ID (in case classId is a slug)
      const classRes = await apiClient(`/classes/${classId}`);
      const classResult = await classRes.json();
      
      if (!classResult.success) {
        throw new Error('Failed to load class');
      }
      
      setClassData(classResult.data);
      const actualClassId = classResult.data.id;
      
      // Load academy defaults for lesson creation
      try {
        const academyRes = await apiClient(`/academies/${classResult.data.academyId}`);
        const academyResult = await academyRes.json();
        if (academyResult.success && academyResult.data) {
          const defaults = {
            maxWatchTimeMultiplier: academyResult.data.defaultMaxWatchTimeMultiplier || 2.0,
            watermarkIntervalMins: academyResult.data.defaultWatermarkIntervalMins || 5
          };
          setAcademyDefaults(defaults);
          // Update lesson form data with academy defaults
          setLessonFormData(prev => ({
            ...prev,
            maxWatchTimeMultiplier: defaults.maxWatchTimeMultiplier,
            watermarkIntervalMins: defaults.watermarkIntervalMins
          }));
        }
      } catch (e) {
        console.error('Failed to load academy defaults:', e);
      }
      
      // Now fetch lessons, topics, and pending enrollments using the actual class ID
      const [lessonsRes, topicsRes, pendingRes] = await Promise.all([
        apiClient(`/lessons?classId=${actualClassId}`),
        apiClient(`/topics?classId=${actualClassId}`),
        apiClient('/enrollments/pending')
      ]);
      
      const [lessonsResult, topicsResult, pendingResult] = await Promise.all([
        lessonsRes.json(),
        topicsRes.json(),
        pendingRes.json()
      ]);
      
      if (lessonsResult.success) setLessons(lessonsResult.data || []);
      if (topicsResult.success) setTopics(topicsResult.data || []);
      if (pendingResult.success) {
        // Filter to only show enrollments for this class
        const classPending = (pendingResult.data || []).filter((e: any) => e.classId === actualClassId);
        setPendingEnrollments(classPending);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveClasses = async () => {
    try {
      const res = await apiClient(`/live?classId=${classId}`);
      const result = await res.json();
      if (result.success) {
        // Only show active streams (scheduled = not started yet, ended = finished)
        setLiveClasses((result.data || []).filter((s: any) => s.status === 'active'));
      }
    } catch (e) {
      console.error('Failed to load live classes:', e);
    }
  };

  const createLiveClass = async () => {
    if (!classData) {
      alert('Error: Datos de clase no cargados');
      return;
    }
    
    // Show custom modal for stream title
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('es-ES', { month: 'long' });
    const year = now.getFullYear();
    const defaultTitle = `STREAM (${day} ${month.charAt(0).toUpperCase() + month.slice(1)}, ${year})`;
    setStreamNameInput(defaultTitle);
    setShowStreamNameModal(true);
  };

  const confirmCreateStream = async () => {
    const streamTitle = streamNameInput.trim();
    if (!streamTitle || !classData) {
      return; // Empty string or no class data
    }
    
    setShowStreamNameModal(false);
    setCreatingStream(true);
    try {
      // Use classData.id (actual UUID) instead of classId from URL (could be slug)
      const res = await apiClient('/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classData.id,
          title: streamTitle.trim(),
        }),
      });
      const result = await res.json();
      if (result.success) {
        setLiveClasses(prev => [result.data, ...prev]);
        setShowStreamNameModal(false);
      } else {
        console.error('Live class creation error:', result);
        alert(`Error: ${result.error || 'No se pudo crear la reunión de Zoom'}`);
      }
    } catch (e: any) {
      console.error('Live class creation exception:', e);
      alert(`Error de conexión: ${e.message || 'No se pudo conectar al servidor'}`);
    } finally {
      setCreatingStream(false);
    }
  };

  const deleteLiveClass = async (classLiveId: string) => {
    if (!confirm('¿Eliminar esta clase en vivo? También se eliminará la reunión de Zoom.')) return;
    
    try {
      const res = await apiClient(`/live/${classLiveId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setLiveClasses(prev => prev.filter(s => s.id !== classLiveId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadLessonDetail = async (lessonId: string): Promise<LessonDetail | null> => {
    // Handle demo lessons locally
    if (lessonId.startsWith('demo-') && paymentStatus === 'NOT PAID') {
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) {
        const detailLesson: LessonDetail = {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          externalUrl: null,
          releaseDate: lesson.releaseDate,
          maxWatchTimeMultiplier: lesson.maxWatchTimeMultiplier,
          watermarkIntervalMins: lesson.watermarkIntervalMins,
          videos: (lesson as any).videos || [],
          documents: (lesson as any).documents || [],
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
      if (result.success) {
        setSelectedLesson(result.data);
        loadLessonFeedback(lessonId);
        return result.data;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const selectLesson = (lesson: Lesson) => {
    router.push(`/dashboard/academy/class/${classId}?lesson=${lesson.id}`);
  };

  const goBackToLessons = () => {
    router.push(`/dashboard/academy/class/${classId}`);
    setSelectedLesson(null);
    setSelectedVideo(null);
    loadData();
  };

  const selectVideoInLesson = (video: any) => {
    if (!selectedLesson) return;
    
    console.log('[Teacher Video Switch] Starting video switch');
    console.log('[Teacher Video Switch] Current video:', selectedVideo?.id, selectedVideo?.title);
    console.log('[Teacher Video Switch] Target video:', video.id, video.title);
    console.log('[Teacher Video Switch] Lesson:', selectedLesson.id);
    
    const newUrl = `/dashboard/academy/class/${classId}?lesson=${selectedLesson.id}&watch=${video.id}`;
    console.log('[Teacher Video Switch] Navigating to:', newUrl);
    
    // Use soft navigation with key prop on player to force remount
    router.push(newUrl);
  };

  const isPdfDocument = (doc: any) => {
    return doc.upload?.mimeType?.includes('pdf') || doc.upload?.fileName?.toLowerCase().endsWith('.pdf');
  };

  // Upload files: Videos to Bunny Stream, Documents to R2
  const uploadFilesWithMultipart = async (tempLessonId: string, abortController: AbortController) => {
    const uploadedVideos = [];
    const uploadedDocuments = [];
    let totalSize = 0;
    let uploadedSize = 0;

    // Calculate total size
    lessonFormData.videos.forEach(v => totalSize += v.file.size);
    lessonFormData.documents.forEach(d => totalSize += d.file.size);

    // Initialize tracking
    uploadStartTimeRef.current = Date.now();
    lastProgressRef.current = {loaded: 0, time: Date.now()};

    // Upload videos to Bunny Stream (better transcoding and streaming)
    for (const video of lessonFormData.videos) {
      const result = await uploadToBunny({
        file: video.file,
        title: video.title || video.file.name,
        collectionName: classData?.academy?.name, // Use academy name for collection
        onProgress: (progress) => {
          const fileProgress = progress.loaded;
          const totalUploaded = uploadedSize + fileProgress;
          const overallProgress = (totalUploaded / totalSize) * 100;
          
          // Calculate speed and ETA
          const now = Date.now();
          const timeDiff = (now - lastProgressRef.current.time) / 1000; // seconds
          if (timeDiff > 0.5) { // Update every 0.5 seconds
            const bytesDiff = totalUploaded - lastProgressRef.current.loaded;
            const speed = bytesDiff / timeDiff; // bytes per second
            const remaining = totalSize - totalUploaded;
            const eta = speed > 0 ? remaining / speed : 0;
            
            setUploadSpeed(speed);
            setUploadETA(eta);
            lastProgressRef.current = {loaded: totalUploaded, time: now};
          }
          
          setUploadProgress(overallProgress);
          setLessons(prev => prev.map(l => 
            l.id === tempLessonId ? { ...l, uploadProgress: overallProgress } : l
          ));
        },
        signal: abortController.signal,
      });

      uploadedSize += video.file.size;
      
      uploadedVideos.push({
        bunnyGuid: result.videoGuid,
        bunnyStatus: 1, // Uploaded, will be transcoded
        fileName: video.file.name,
        fileSize: video.file.size,
        mimeType: video.file.type,
        title: video.title,
        description: video.description,
        durationSeconds: video.duration,
      });
    }

    // Upload documents to R2 (cheaper storage for static files)
    for (const doc of lessonFormData.documents) {
      const storagePath = await multipartUpload({
        file: doc.file,
        folder: 'documents',
        onProgress: (progress) => {
          const fileProgress = progress.loaded;
          const totalUploaded = uploadedSize + fileProgress;
          const overallProgress = (totalUploaded / totalSize) * 100;
          
          // Calculate speed and ETA
          const now = Date.now();
          const timeDiff = (now - lastProgressRef.current.time) / 1000;
          if (timeDiff > 0.5) {
            const bytesDiff = totalUploaded - lastProgressRef.current.loaded;
            const speed = bytesDiff / timeDiff;
            const remaining = totalSize - totalUploaded;
            const eta = speed > 0 ? remaining / speed : 0;
            
            setUploadSpeed(speed);
            setUploadETA(eta);
            lastProgressRef.current = {loaded: totalUploaded, time: now};
          }
          
          setUploadProgress(overallProgress);
          setLessons(prev => prev.map(l => 
            l.id === tempLessonId ? { ...l, uploadProgress: overallProgress } : l
          ));
        },
        signal: abortController.signal,
      });

      uploadedSize += doc.file.size;
      
      uploadedDocuments.push({
        storagePath,
        fileName: doc.file.name,
        fileSize: doc.file.size,
        mimeType: doc.file.type,
        title: doc.title,
        description: doc.description,
      });
    }

    return { videos: uploadedVideos, documents: uploadedDocuments };
  };

  const handleLessonCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if using stream recording
    if (lessonFormData.selectedStreamRecordings.length > 0) {
      try {
        const response = await apiClient('/live/create-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId: lessonFormData.selectedStreamRecordings[0], // Use first selected recording
            title: lessonFormData.title || undefined,
            description: lessonFormData.description || undefined,
            releaseDate: lessonFormData.publishImmediately ? undefined : `${lessonFormData.releaseDate}T${lessonFormData.releaseTime}:00`,
          }),
        });
        
        const result = await response.json();
        if (result.success) {
          setShowLessonForm(false);
          setLessonFormData({
            title: '',
            description: '',
            externalUrl: '',
            releaseDate: new Date().toISOString().split('T')[0],
            releaseTime: '00:00',
            publishImmediately: true,
            maxWatchTimeMultiplier: 2.0,
            watermarkIntervalMins: 5,
            topicId: '',
            videos: [],
            documents: [],
            selectedStreamRecordings: [],
          });
          await loadData(); // Reload all data including lessons
        } else {
          console.error('[Create Lesson Error]', result);
          alert(`Error: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error creating lesson from stream:', error);
        alert('Error al crear lección desde grabación');
      }
      return;
    }
    
    if (lessonFormData.videos.length === 0 && lessonFormData.documents.length === 0) {
      return alert('Agrega al menos un video o documento, o selecciona una grabación de stream');
    }
    
    // Calculate release timestamp
    let releaseTimestamp: string;
    if (lessonFormData.publishImmediately) {
      // Publish immediately - use current time
      releaseTimestamp = new Date().toISOString();
    } else {
      // Scheduled - validate date/time is not in the past
      const releaseDatetime = `${lessonFormData.releaseDate}T${lessonFormData.releaseTime}:00`;
      const scheduledDate = new Date(releaseDatetime);
      if (scheduledDate < new Date()) {
        return alert('La fecha y hora de publicación no puede estar en el pasado');
      }
      releaseTimestamp = scheduledDate.toISOString();
    }
    
    // Create a temporary lesson card immediately
    const tempLessonId = `temp_${Date.now()}`;
    const tempLesson: Lesson = {
      id: tempLessonId,
      title: lessonFormData.title || new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
      description: lessonFormData.description,
      releaseDate: releaseTimestamp,
      topicId: lessonFormData.topicId || null,
      maxWatchTimeMultiplier: lessonFormData.maxWatchTimeMultiplier,
      watermarkIntervalMins: lessonFormData.watermarkIntervalMins,
      videoCount: lessonFormData.videos.length,
      documentCount: lessonFormData.documents.length,
      isUploading: true,
      uploadProgress: 0
    };
    
    // Add temp lesson to list and close modal immediately
    setLessons(prev => [tempLesson, ...prev]);
    setShowLessonForm(false);
    setUploading(true);
    setUploadProgress(0);
    
    // IMMEDIATELY expand topic and clean URL when lesson creation starts
    const topicToExpand = (lessonFormData.topicId === null || lessonFormData.topicId === undefined || lessonFormData.topicId === '') 
      ? 'uncategorized' 
      : lessonFormData.topicId;
    setExpandTopicId(topicToExpand);
    setTimeout(() => setExpandTopicId(null), 500);
    
    // Remove ?action=create from URL immediately
    const url = new URL(window.location.href);
    if (url.searchParams.has('action')) {
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.toString());
    }
    
    const abortController = new AbortController();
    activeUploadRef.current = abortController as any; // Store abort controller for cancellation
    
    try {
      // Upload files using optimized multipart upload
      const { videos, documents } = await uploadFilesWithMultipart(tempLessonId, abortController);
      
      // Create lesson with uploaded file references
      const res = await apiClient('/lessons/create-with-uploaded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classData?.id, // Use actual UUID, not slug from URL
          title: lessonFormData.title || new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
          description: lessonFormData.description,
          releaseDate: releaseTimestamp,
          topicId: lessonFormData.topicId || null,
          maxWatchTimeMultiplier: lessonFormData.maxWatchTimeMultiplier,
          watermarkIntervalMins: lessonFormData.watermarkIntervalMins,
          videos,
          documents,
        }),
        signal: abortController.signal,
      });
      
      const result = await res.json();
      
      if (result.success) {
        // Replace temp lesson with real lesson data
        setLessons(prev => prev.map(l => 
          l.id === tempLessonId ? { ...result.data, isUploading: false } : l
        ));
        setLessonFormData({
          title: '', description: '', externalUrl: '', releaseDate: new Date().toISOString().split('T')[0],
          releaseTime: '00:00', publishImmediately: true,
          maxWatchTimeMultiplier: academyDefaults.maxWatchTimeMultiplier, watermarkIntervalMins: academyDefaults.watermarkIntervalMins, topicId: '', videos: [], documents: [], selectedStreamRecordings: []
        });
        setUploadProgress(0);
        
        // Show success message
        // Show custom success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-in-from-top';
        notification.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-semibold">Lección creada exitosamente</span>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.style.animation = 'slideOut 0.3s ease-in';
          setTimeout(() => notification.remove(), 300);
        }, 3000);
        await loadData();
      } else {
        // Remove temp lesson on error
        setLessons(prev => prev.filter(l => l.id !== tempLessonId));
        alert(result.error || 'Failed to create lesson');
      }
    } catch (e: any) {
      console.error(e);
      // Remove temp lesson on error
      setLessons(prev => prev.filter(l => l.id !== tempLessonId));
      if (e.name !== 'AbortError') {
        alert('Error uploading files. Please check your connection and try again.');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      activeUploadRef.current = null; // Clear upload reference
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson? All videos and documents will be deleted.')) return;
    try {
      const res = await apiClient(`/lessons/${lessonId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) loadData();
      else alert(result.error || 'Failed to delete');
    } catch (e) {
      alert('Error occurred');
    }
  };

  const executeToggleRelease = async (lesson: Lesson, setHidden: boolean) => {
    try {
      const newReleaseDate = setHidden 
        ? '2099-12-31T23:59:59Z' 
        : new Date().toISOString();
        
      const res = await apiClient(`/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseDate: newReleaseDate,
          resetTimers: false
        }),
      });
      
      const result = await res.json();
      if (result.success) {
        setLessons(prev => prev.map(l => 
          l.id === lesson.id ? { ...l, releaseDate: newReleaseDate } : l
        ));
      } else {
        alert(result.error || 'Error al cambiar visibilidad');
      }
    } catch (e) {
      console.error('Error toggling release:', e);
      alert('Error al cambiar visibilidad');
    }
  };

  const handleToggleRelease = async (lesson: Lesson) => {
    const isReleasedNow = new Date(lesson.releaseDate) <= new Date();
    if (isReleasedNow) {
      if (window.confirm(`¿Estás seguro de que deseas ocultar la lección "${lesson.title}"? Los estudiantes perderán el acceso inmediatamente.`)) {
        executeToggleRelease(lesson, true);
      }
    } else {
      if (window.confirm(`¿Estás seguro de que deseas publicar la lección "${lesson.title}"? Los estudiantes tendrán acceso inmediatamente.`)) {
        executeToggleRelease(lesson, false);
      }
    }
  };

  const handleLessonMove = async (lessonId: string, topicId: string | null) => {
    try {
      const res = await apiClient(`/lessons/${lessonId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId }),
      });
      const result = await res.json();
      if (result.success) {
        // Update local state immediately for faster UI
        setLessons(prev => prev.map(l => 
          l.id === lessonId ? { ...l, topicId } : l
        ));
      } else {
        alert(result.error || 'Failed to move lesson');
      }
    } catch (e) {
      console.error('Error moving lesson:', e);
      alert('Error moving lesson');
    }
  };

  const handleRescheduleLesson = (lesson: Lesson) => {
    setReschedulingLesson(lesson);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async (newDate: string, newTime: string) => {
    if (!reschedulingLesson) return;
    
    try {
      const releaseDateTime = `${newDate}T${newTime}:00`;
      const newReleaseDate = new Date(releaseDateTime);
      const oldReleaseDate = new Date(reschedulingLesson.releaseDate);
      
      // Check if moving to future (new date is after old date)
      const movingToFuture = newReleaseDate > oldReleaseDate;
      
      const res = await apiClient(`/lessons/${reschedulingLesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseDate: newReleaseDate.toISOString(),
          resetTimers: movingToFuture, // Signal backend to reset timers
        }),
      });
      const result = await res.json();
      if (result.success) {
        setShowRescheduleModal(false);
        setReschedulingLesson(null);
        loadData();
        
        if (movingToFuture) {
          alert('Lección reprogramada. Los tiempos de visualización de todos los estudiantes han sido reiniciados.');
        }
      } else {
        alert(result.error || 'Failed to reschedule lesson');
      }
    } catch (e) {
      console.error('Error rescheduling lesson:', e);
      alert('Error rescheduling lesson');
    }
  };

  const addVideoToForm = (file: File) => {
    if (file.size > 500 * 1024 * 1024) {
      alert('File size must be under 500MB');
      return;
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      setLessonFormData(p => ({
        ...p,
        videos: [...p.videos, { file, title: '', description: '', duration: Math.floor(video.duration) }]
      }));
    };
    video.src = URL.createObjectURL(file);
  };

  const addDocumentToForm = (file: File) => {
    setLessonFormData(p => ({
      ...p,
      documents: [...p.documents, { file, title: '', description: '' }]
    }));
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('¿Estás seguro de eliminar este video?')) return;
    try {
      const res = await apiClient(`/lessons/video/${videoId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setEditingLessonMedia(prev => prev ? ({
          ...prev,
          videos: prev.videos.filter(v => v.id !== videoId)
        }) : null);
        // Refresh data in background
        loadData();
      } else {
        alert(result.error || 'Error al eliminar video');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;
    try {
      const res = await apiClient(`/lessons/document/${documentId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setEditingLessonMedia(prev => prev ? ({
          ...prev,
          documents: prev.documents.filter(d => d.id !== documentId)
        }) : null);
        // Refresh data in background
        loadData();
      } else {
        alert(result.error || 'Error al eliminar documento');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const handleEditLesson = async (lesson: Lesson) => {
    try {
      // Load lesson details WITHOUT setting selectedLesson to avoid navigation
      const res = await apiClient(`/lessons/${lesson.id}`);
      const result = await res.json();
      
      if (!result.success || !result.data) {
        alert('Error loading lesson details');
        return;
      }
      
      const detail = result.data;
      
      // Store current media for display in edit modal
      setEditingLessonMedia({
        videos: (detail.videos || []).map((v: any) => ({
          id: v.id,
          title: v.title || 'Video',
          durationSeconds: v.durationSeconds,
          bunnyGuid: v.upload?.bunnyGuid,
        })),
        documents: (detail.documents || []).map((d: any) => ({
          id: d.id,
          title: d.title || d.upload?.fileName || 'Document',
          fileName: d.upload?.fileName || 'Unknown',
          storagePath: d.upload?.storagePath || '',
        })),
      });
      
      // Populate form with existing data (no release date for editing)
      setLessonFormData({
        title: detail.title,
        description: detail.description || '',
        externalUrl: detail.externalUrl || '',
        releaseDate: detail.releaseDate.split('T')[0],
        releaseTime: '00:00',
        publishImmediately: true, // Not used in edit mode
        maxWatchTimeMultiplier: detail.maxWatchTimeMultiplier,
        watermarkIntervalMins: detail.watermarkIntervalMins,
        topicId: detail.topicId || '',
        videos: [],
        documents: [],
        selectedStreamRecordings: [],
      });
      setEditingLessonId(lesson.id);
      setShowLessonForm(true);
    } catch (e) {
      console.error('Error loading lesson for edit:', e);
      alert('Error loading lesson details');
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLessonId) return;
    
    try {
      // First, update the lesson metadata
      const res = await apiClient(`/lessons/${editingLessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonFormData.title,
          description: lessonFormData.description,
          maxWatchTimeMultiplier: lessonFormData.maxWatchTimeMultiplier,
          watermarkIntervalMins: lessonFormData.watermarkIntervalMins,
          topicId: lessonFormData.topicId || null,
        }),
      });
      const result = await res.json();
      
      if (!result.success) {
        alert(result.error || 'Failed to update lesson');
        return;
      }
      
      // If there are new files to upload, handle them
      if (lessonFormData.videos.length > 0 || lessonFormData.documents.length > 0 || lessonFormData.selectedStreamRecordings.length > 0) {
        setUploading(true);
        const abortController = new AbortController();
        
        try {
          // Handle Stream Recording if selected
          if (lessonFormData.selectedStreamRecordings.length > 0) {
            const streamRes = await apiClient(`/lessons/${editingLessonId}/add-stream`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ streamId: lessonFormData.selectedStreamRecordings[0] }), // Use first selected
            });
            const streamResult = await streamRes.json();
            if (!streamResult.success) {
              console.error('Failed to add stream:', streamResult.error);
              alert(`Error al añadir grabación de stream: ${streamResult.error}`);
            }
          }

          if (lessonFormData.videos.length > 0 || lessonFormData.documents.length > 0) {
            const { videos, documents } = await uploadFilesWithMultipart(editingLessonId, abortController);
            
            // Add new files to the lesson
            if (videos.length > 0 || documents.length > 0) {
              const addRes = await apiClient(`/lessons/${editingLessonId}/add-files`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videos, documents }),
              });
              const addResult = await addRes.json();
              if (!addResult.success) {
                console.error('Failed to add files:', addResult.error);
              }
            }
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          alert('Error al subir archivos adicionales');
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      }
      
      // Reset form and close modal
      setLessonFormData({
        title: '', description: '', externalUrl: '', releaseDate: new Date().toISOString().split('T')[0],
        releaseTime: '00:00', publishImmediately: true,
        maxWatchTimeMultiplier: academyDefaults.maxWatchTimeMultiplier, watermarkIntervalMins: academyDefaults.watermarkIntervalMins, topicId: '', videos: [], documents: [], selectedStreamRecordings: []
      });
      setEditingLessonId(null);
      setEditingLessonMedia(null);
      setShowLessonForm(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert('Error updating lesson');
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics?classId=${classId}`);
      const result = await res.json();
      if (result.success) setAnalyticsData(result.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnrollmentAction = async (enrollmentId: string, action: 'approve' | 'reject') => {
    try {
      const res = await apiClient('/enrollments/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, action }),
      });
      const result = await res.json();
      if (result.success) {
        // Reload pending enrollments
        setPendingEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
        loadData(); // Refresh class data with new enrollments
      } else {
        alert(result.error || 'Failed to process enrollment');
      }
    } catch (e) {
      console.error(e);
      alert('Error processing enrollment');
    }
  };

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const isReleased = (d: string) => new Date(d) <= new Date();

  if (loading) {
    return <PageLoader label="Cargando clase..." />;
  }

  if (!classData) {
    return (
      <>
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-gray-500">Class not found</p>
          <Link href="/dashboard/teacher" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clean Minimalist Header - Focus on Lessons */}
      {!selectedLesson && (
          <ClassHeader 
              classData={classData}
              classId={classId}
              lessonsCount={lessons.length}
              pendingCount={pendingEnrollments.length}
              creatingStream={creatingStream}
              showPendingRequests={showPendingRequests}
              paymentStatus={paymentStatus}
              onCreateLesson={() => { router.push(`/dashboard/academy/class/${classId}?action=create`); }}
              onCreateStream={createLiveClass}
              onTogglePendingRequests={() => setShowPendingRequests(!showPendingRequests)}
            />
        )}

        {/* Pending Enrollment Requests - Component */}
        {!selectedLesson && (
          <PendingEnrollments 
            pendingEnrollments={pendingEnrollments}
            showPendingRequests={showPendingRequests}
            onApprove={(id) => handleEnrollmentAction(id, 'approve')}
            onReject={(id) => handleEnrollmentAction(id, 'reject')}
            onClose={() => setShowPendingRequests(false)}
          />
        )}

        {/* Selected Lesson View */}
        {selectedLesson && currentUser && (
          <div className="space-y-6">
            <div>
              <button onClick={goBackToLessons} className="text-sm text-gray-500 hover:text-gray-900 mb-2">
                ← Volver a Clases
              </button>
              <h2 className="text-xl font-semibold text-gray-900">{selectedLesson.title}</h2>
              {selectedLesson.description ? (
                <p className="text-gray-600 mt-1">{selectedLesson.description}</p>
              ) : (
                <p className="text-gray-400 italic mt-1">Sin descripción</p>
              )}
            </div>

            {/* Video Player and Documents Side by Side */}
            <div className="flex gap-6 items-start mt-6">
              {/* Video Player - Left Side */}
              <div className="flex-1 min-w-0 max-w-3xl">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg text-center">VIDEOS</h3>
                {selectedVideo && (
                  <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Watermark overlay - hidden in fullscreen */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-3 pointer-events-none">
                      <span>Multiplicador: {selectedLesson.maxWatchTimeMultiplier}x</span>
                      <span className="w-px h-3 bg-white/40"></span>
                      <span>Marca de agua: cada {selectedLesson.watermarkIntervalMins} min</span>
                    </div>
                    <ProtectedVideoPlayer
                      key={selectedVideo.id}
                      videoUrl={selectedVideo.upload?.storageType === 'bunny' ? '' : `/api/video/stream/${selectedVideo.id}`}
                      videoId={selectedVideo.id}
                      studentId={currentUser.id}
                      maxWatchTimeMultiplier={selectedLesson.maxWatchTimeMultiplier}
                      durationSeconds={selectedVideo.durationSeconds || 0}
                      initialPlayState={{ totalWatchTimeSeconds: 0, sessionStartTime: null }}
                      userRole="TEACHER"
                      bunnyGuid={selectedVideo.upload?.storageType === 'bunny' ? selectedVideo.upload?.bunnyGuid : undefined}
                    />
                  </div>
                )}

                {/* No videos */}
                {selectedLesson.videos.length === 0 && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">No videos in this lesson.</p>
                  </div>
                )}

                {/* Video Switcher Buttons - Centered Below Videos */}
                {selectedLesson.videos.length > 1 && (
                  <div className="flex gap-2 flex-wrap justify-center mt-4">
                    {selectedLesson.videos.map((video, index) => (
                      <button
                        key={video.id}
                        onClick={() => selectVideoInLesson(video)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          selectedVideo?.id === video.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Video {index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents - Right Side (Full remaining width) */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg text-center">DOCUMENTOS</h3>
                {selectedLesson.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedLesson.documents
                      .filter(doc => doc.upload?.storagePath)
                      .map((doc) => (
                      <a
                        key={doc.id}
                        href={`/api/documents/${doc.upload!.storagePath.split('/').map(encodeURIComponent).join('/')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
                      >
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-gray-900 group-hover:text-emerald-600 truncate">{doc.title}</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm text-center">No documentos</p>
                )}
              </div>
            </div>

            {/* Feedback Section - Full Width Below */}
            <div className="pt-6">
              <h3 className="font-semibold text-gray-900 mb-3 text-lg text-center">FEEDBACK</h3>
              <div className="rounded-xl border border-gray-200 p-6 animate-in slide-in-from-top-2 shadow-sm">
                <div>
                {lessonFeedback.filter(f => f.comment && f.comment.trim().length > 0).length > 0 ? (
                  <div className="space-y-4">
                    {lessonFeedback.filter(f => f.comment && f.comment.trim().length > 0).map(feedback => {
                      // Calculate partial star fill (0.25 increments)
                      const fullStars = Math.floor(feedback.rating);
                      const remainder = feedback.rating - fullStars;
                      const partialFill = remainder >= 0.875 ? 1 : remainder >= 0.625 ? 0.75 : remainder >= 0.375 ? 0.5 : remainder >= 0.125 ? 0.25 : 0;
                      
                      return (
                        <div key={feedback.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(starIndex => {
                                  let fillPercentage = 0;
                                  if (starIndex <= fullStars) {
                                    fillPercentage = 100;
                                  } else if (starIndex === fullStars + 1) {
                                    fillPercentage = partialFill * 100;
                                  }
                                  
                                  return (
                                    <div key={starIndex} className="relative w-5 h-5">
                                      {/* Background star (gray) */}
                                      <svg className="absolute inset-0 w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                      {/* Filled star (yellow) with clip-path */}
                                      {fillPercentage > 0 && (
                                        <svg className="absolute inset-0 w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}>
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <span className="text-xs text-gray-500">{new Date(feedback.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                          {feedback.comment && (
                            <p className="text-sm text-gray-700 leading-relaxed">{feedback.comment}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    <p className="text-sm font-medium">No hay comentarios para esta lección</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Main View - No Lesson Selected */}
        {!selectedLesson && (
          <>
            {/* Active/Scheduled Stream Banner - Shows scheduled, active, and ended streams */}
            {liveClasses.length > 0 && liveClasses[0].status !== 'recording_failed' && (
              <div className="rounded-xl p-4 bg-gray-100 border-2 border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">{liveClasses[0].title}</p>
                      <p className="text-gray-600 text-sm">
                        {liveClasses[0].status === 'active' 
                          ? 'Estudiantes pueden unirse ahora' 
                          : 'Haz clic en "Entrar como Host" para iniciar'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={liveClasses[0].zoomStartUrl || liveClasses[0].zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg font-semibold text-sm transition-colors"
                    >
                      Entrar como Host
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(liveClasses[0].zoomLink);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                        copiedLink 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                      title="Copiar link para estudiantes"
                    >
                      {copiedLink ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm font-medium">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium">Copiar Link</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log('Sending notification with data:', {
                            classId: classData?.id,
                            liveStreamId: liveClasses[0].id,
                            message: `Clase en vivo: ${liveClasses[0].title}`
                          });
                          const res = await apiClient('/notifications', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              classId: classData?.id,
                              liveStreamId: liveClasses[0].id,
                              message: `Clase en vivo: ${liveClasses[0].title}`,
                            }),
                          });
                          const result = await res.json();
                          console.log('Notification response:', result);
                          if (res.ok) {
                            alert(result.data?.message || 'Estudiantes notificados');
                          } else {
                            alert(`Error: ${result.error || 'No se pudo enviar notificaciones'}`);
                          }
                        } catch (error) {
                          console.error('Error notifying students:', error);
                          alert('Error al enviar notificaciones');
                        }
                      }}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
                      title="Notificar a estudiantes"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <span className="text-sm font-medium">Notificar</span>
                    </button>
                    <button
                      onClick={() => deleteLiveClass(liveClasses[0].id)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="Cancelar stream"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lesson Form Modal */}
            {showLessonForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 !m-0 p-0">
                <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {editingLessonId ? 'Editar Clase' : 'Crear Nueva Clase'}
                    </h3>
                    <button 
                      onClick={() => { setShowLessonForm(false); setEditingLessonId(null); setEditingLessonMedia(null); router.push(`/dashboard/academy/class/${classId}`); }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <form onSubmit={editingLessonId ? handleUpdateLesson : handleLessonCreate} className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Title and Topic side by side in edit mode, Title with Publish options in create mode */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
                        <input 
                          type="text" 
                          value={lessonFormData.title} 
                          onChange={e => setLessonFormData({ ...lessonFormData, title: e.target.value })} 
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors" 
                          placeholder="Título de la lección"
                        />
                      </div>
                      {/* Topic Selector - show in BOTH create and edit modes */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tema (opcional)</label>
                        <select
                          value={lessonFormData.topicId}
                          onChange={e => setLessonFormData({ ...lessonFormData, topicId: e.target.value })}
                          className="w-full h-[38px] px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%236b7280%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27M6%208l4%204%204-4%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em] bg-[right_0.5rem_center] bg-no-repeat"
                        >
                          <option value="">Sin tema</option>
                          {topics.map(topic => (
                            <option key={topic.id} value={topic.id}>{topic.name}</option>
                          ))}
                        </select>
                      </div>
                      {/* Publish options - Only for CREATE mode */}
                      {!editingLessonId && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Publicación</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setLessonFormData({ ...lessonFormData, publishImmediately: true })}
                              className={`flex-1 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                                lessonFormData.publishImmediately 
                                  ? 'border-brand-500 bg-brand-50 text-brand-700' 
                                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Ahora
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setLessonFormData({ ...lessonFormData, publishImmediately: false })}
                              className={`flex-1 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                                !lessonFormData.publishImmediately 
                                  ? 'border-brand-500 bg-brand-50 text-brand-700' 
                                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Programar
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Date/Time inputs - only show when scheduling (CREATE mode only) */}
                    {!editingLessonId && !lessonFormData.publishImmediately && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
                          <input 
                            type="date" 
                            value={lessonFormData.releaseDate} 
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => setLessonFormData({ ...lessonFormData, releaseDate: e.target.value })} 
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Hora</label>
                          <input 
                            type="time" 
                            value={lessonFormData.releaseTime} 
                            onChange={e => setLessonFormData({ ...lessonFormData, releaseTime: e.target.value })} 
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                      <textarea 
                        value={lessonFormData.description} 
                        onChange={e => setLessonFormData({ ...lessonFormData, description: e.target.value })} 
                        rows={2} 
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors resize-none" 
                        placeholder="Descripción opcional"
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Multiplicador <span className="text-xs font-normal text-gray-500">(El video podrá verse durante X veces su duración)</span></label>
                        <input type="number" min="1" max="10" step="0.5" value={lessonFormData.maxWatchTimeMultiplier} onChange={e => setLessonFormData({ ...lessonFormData, maxWatchTimeMultiplier: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Marca de agua <span className="text-xs font-normal text-gray-500">(Cada cuántos minutos aparece)</span></label>
                        <input type="number" min="1" max="60" value={lessonFormData.watermarkIntervalMins} onChange={e => setLessonFormData({ ...lessonFormData, watermarkIntervalMins: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
                      </div>
                    </div>
                    {!editingLessonId && (
                      <>
                      <div className="grid md:grid-cols-2 gap-4">
                      {/* Videos Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Video/s</label>
                        <input 
                          type="file" 
                          accept="video/mp4" 
                          multiple 
                          onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(addVideoToForm); e.target.value = ''; }} 
                          className="w-full h-[38px] px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm bg-white appearance-none"
                        />
                        {lessonFormData.videos.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {lessonFormData.videos.map((v, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-900 truncate block">{v.file.name}</span>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => setLessonFormData({ ...lessonFormData, videos: lessonFormData.videos.filter((_, j) => j !== i) })} 
                                  className="text-xs text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
                                  title="Eliminar video"
                                >
                                  Eliminar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Stream Recording Selection */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">O utiliza grabaciones de stream</label>
                        <details className="w-full border border-gray-200 rounded-lg text-sm bg-white">
                          <summary className="px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg flex items-center justify-between">
                            <span>
                              {lessonFormData.selectedStreamRecordings.length > 0 
                                ? `${lessonFormData.selectedStreamRecordings.length} grabaciones seleccionadas` 
                                : availableStreamRecordings.length === 0 
                                  ? 'No hay grabaciones disponibles' 
                                  : 'Seleccionar grabaciones'}
                            </span>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </summary>
                          <div className="absolute left-0 right-0 mt-1 px-3 py-2 max-h-[200px] overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg z-50">
                            {availableStreamRecordings.length === 0 ? (
                              <p className="text-gray-500 text-sm py-1">No hay grabaciones disponibles</p>
                            ) : (
                              <div className="space-y-2">
                                {availableStreamRecordings.map(recording => (
                                  <label key={recording.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                    <input
                                      type="checkbox"
                                      checked={lessonFormData.selectedStreamRecordings.includes(recording.id)}
                                      onChange={e => {
                                        const checked = e.target.checked;
                                        setLessonFormData({
                                          ...lessonFormData,
                                          selectedStreamRecordings: checked
                                            ? [...lessonFormData.selectedStreamRecordings, recording.id]
                                            : lessonFormData.selectedStreamRecordings.filter(id => id !== recording.id)
                                        });
                                      }}
                                      className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                    />
                                    <span className="text-sm text-gray-700 flex-1">
                                      {recording.title}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        </details>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Documentos (PDF)</label>
                      <input type="file" accept=".pdf" multiple onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(addDocumentToForm); e.target.value = ''; }} className="w-full h-[38px] px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white appearance-none"/>
                      {lessonFormData.documents.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {lessonFormData.documents.map((d, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-900 truncate block">{d.file.name}</span>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => setLessonFormData({ ...lessonFormData, documents: lessonFormData.documents.filter((_, j) => j !== i) })} 
                                className="text-xs text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
                                title="Eliminar documento"
                              >
                                Eliminar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                      </>
                    )}
                    
                    {/* EDIT MODE: Show current media and allow adding more */}
                    {editingLessonId && editingLessonMedia && (
                      <div className="space-y-4">
                        {/* Current Videos Section */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Videos actuales ({editingLessonMedia.videos.length})
                          </label>
                          {editingLessonMedia.videos.length > 0 ? (
                            <div className="space-y-2">
                              {editingLessonMedia.videos.map((v, i) => (
                                <div key={v.id} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{v.title || `Video ${i + 1}`}</p>
                                    {v.durationSeconds && (
                                      <p className="text-xs text-gray-500">
                                        {Math.floor(v.durationSeconds / 60)}:{(v.durationSeconds % 60).toString().padStart(2, '0')}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteVideo(v.id)}
                                    className="text-xs text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No hay videos en esta lección</p>
                          )}
                        </div>
                        
                        {/* Current Documents Section */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Documentos actuales ({editingLessonMedia.documents.length})
                          </label>
                          {editingLessonMedia.documents.length > 0 ? (
                            <div className="space-y-2">
                              {editingLessonMedia.documents.map((d, i) => (
                                <div key={d.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{d.title || d.fileName}</p>
                                    <p className="text-xs text-gray-500 truncate">{d.fileName}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDocument(d.id)}
                                    className="text-xs text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No hay documentos en esta lección</p>
                          )}
                        </div>
                        
                        {/* Add More Files Section */}
                        <div className="pt-4 border-t border-gray-200">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Agregar más archivos</label>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nuevos videos</label>
                              <input 
                                type="file" 
                                accept="video/mp4" 
                                multiple 
                                onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(addVideoToForm); e.target.value = ''; }} 
                                className="w-full h-[38px] px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                              />
                              {lessonFormData.videos.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {lessonFormData.videos.map((v, i) => (
                                    <div key={i} className="relative p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                        </svg>
                                      </div>
                                      <span className="text-xs text-gray-700 truncate flex-1">{v.file.name}</span>
                                      <button 
                                        type="button" 
                                        onClick={() => setLessonFormData({ ...lessonFormData, videos: lessonFormData.videos.filter((_, j) => j !== i) })} 
                                        className="w-5 h-5 flex items-center justify-center text-red-500 hover:text-red-700 rounded"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nuevos documentos (PDF)</label>
                              <input 
                                type="file" 
                                accept=".pdf" 
                                multiple 
                                onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(addDocumentToForm); e.target.value = ''; }} 
                                className="w-full h-[38px] px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                              />
                              {lessonFormData.documents.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {lessonFormData.documents.map((d, i) => (
                                    <div key={i} className="relative p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                        </svg>
                                      </div>
                                      <span className="text-xs text-gray-700 truncate flex-1">{d.file.name}</span>
                                      <button 
                                        type="button" 
                                        onClick={() => setLessonFormData({ ...lessonFormData, documents: lessonFormData.documents.filter((_, j) => j !== i) })} 
                                        className="w-5 h-5 flex items-center justify-center text-red-500 hover:text-red-700 rounded"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">O utiliza grabaciones de stream</label>
                            <details className="w-full border border-gray-200 rounded-lg text-sm bg-white">
                              <summary className="px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg flex items-center justify-between">
                                <span>
                                  {lessonFormData.selectedStreamRecordings.length > 0 
                                    ? `${lessonFormData.selectedStreamRecordings.length} grabaciones seleccionadas` 
                                    : availableStreamRecordings.length === 0 
                                      ? 'No hay grabaciones disponibles' 
                                      : 'Seleccionar grabaciones'}
                                </span>
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </summary>
                              <div className="absolute left-0 right-0 mt-1 px-3 py-2 max-h-[200px] overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg z-50">
                                {availableStreamRecordings.length === 0 ? (
                                  <p className="text-gray-500 text-sm py-1">No hay grabaciones disponibles</p>
                                ) : (
                                  <div className="space-y-2">
                                    {availableStreamRecordings.map(recording => (
                                      <label key={recording.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                          type="checkbox"
                                          checked={lessonFormData.selectedStreamRecordings.includes(recording.id)}
                                          onChange={e => {
                                            const checked = e.target.checked;
                                            setLessonFormData({
                                              ...lessonFormData,
                                              selectedStreamRecordings: checked
                                                ? [...lessonFormData.selectedStreamRecordings, recording.id]
                                                : lessonFormData.selectedStreamRecordings.filter(id => id !== recording.id)
                                            });
                                          }}
                                          className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                        />
                                        <span className="text-sm text-gray-700 flex-1">
                                          {recording.title} ({new Date(recording.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })})
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </details>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload Progress Bar */}
                    {uploading && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">Subiendo archivos...</span>
                            {uploadSpeed > 0 && (
                              <span className="text-xs text-gray-500">
                                {(uploadSpeed / 1024 / 1024).toFixed(1)} MB/s
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {uploadETA > 0 && uploadProgress < 99 && (
                              <span className="text-xs text-gray-500">
                                ~{Math.ceil(uploadETA / 60)}min restante{Math.ceil(uploadETA / 60) !== 1 ? 's' : ''}
                              </span>
                            )}
                            <span className="font-bold">{Math.round(uploadProgress)}%</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-amber-600 mt-2 font-medium">
                          ⚠️ No salgas de esta página ni cierres el navegador hasta que termine la subida.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button 
                        type="submit" 
                        disabled={paymentStatus === 'NOT PAID'}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title={paymentStatus === 'NOT PAID' ? 'Active su academia para crear lecciones' : ''}
                      >
                        {uploading ? 'Creando...' : editingLessonId ? 'Actualizar Lección' : 'Crear Lección'}
                      </button>
                      <button type="button" onClick={() => { setShowLessonForm(false); setEditingLessonId(null); setEditingLessonMedia(null); }} className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium text-sm">
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Analytics */}
            {showAnalytics && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">📊 Class Analytics</h3>
                {analyticsData ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-900">{analyticsData.videos?.length || 0}</div>
                      <div className="text-sm text-blue-600">Videos</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-900">{analyticsData.studentEngagement?.length || 0}</div>
                      <div className="text-sm text-green-600">Active Students</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatDuration(analyticsData.studentEngagement?.reduce((s: number, x: any) => s + (x.totalWatchTime || 0), 0) || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Watch Time</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Loading analytics...</div>
                )}
              </div>
            )}

            {/* Clases - Component */}
            {!selectedLesson && (
              <TopicsLessonsList
                lessons={lessons}
                topics={topics}
                classId={classData?.id || ''}
                totalStudents={classData.enrollments.filter(e => e.status === 'APPROVED').length}
                expandTopicId={expandTopicId}
                paymentStatus={paymentStatus}
                onSelectLesson={selectLesson}
                onEditLesson={handleEditLesson}
                onDeleteLesson={handleDeleteLesson}
                onRescheduleLesson={handleRescheduleLesson}
                onTopicsChange={loadData}
                onLessonMove={handleLessonMove}
                onToggleRelease={handleToggleRelease}
              />
            )}

            {/* Reschedule Modal */}
            {showRescheduleModal && reschedulingLesson && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl max-w-md w-full p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Reprogramar Lección</h3>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const date = (form.elements.namedItem('rescheduleDate') as HTMLInputElement).value;
                    const time = (form.elements.namedItem('rescheduleTime') as HTMLInputElement).value;
                    handleRescheduleSubmit(date, time);
                  }}>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nueva Fecha</label>
                        <input 
                          type="date" 
                          name="rescheduleDate"
                          defaultValue={reschedulingLesson.releaseDate.split('T')[0]}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nueva Hora</label>
                        <input 
                          type="time"
                          name="rescheduleTime"
                          defaultValue={new Date(reschedulingLesson.releaseDate).toTimeString().slice(0, 5)}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button type="submit" className="flex-1 px-6 py-2.5 bg-accent-300 text-gray-900 rounded-lg hover:bg-accent-400 font-medium text-sm">
                        Reprogramar
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setShowRescheduleModal(false); setReschedulingLesson(null); }}
                        className="px-6 py-2.5 border-2 border-gray-900 text-gray-900 hover:bg-gray-50 rounded-lg font-medium text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Students - Component */}
            {!selectedLesson && (
              <StudentsList enrollments={classData.enrollments} />
            )}
          </>
        )}

        {/* Custom Stream Name Modal */}
        {showStreamNameModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Nombre del Stream</h3>
              
              <input
                type="text"
                value={streamNameInput}
                onChange={(e) => setStreamNameInput(e.target.value)}
                placeholder="Ingrese el nombre del stream"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmCreateStream();
                  } else if (e.key === 'Escape') {
                    setShowStreamNameModal(false);
                    setStreamNameInput('');
                  }
                }}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={confirmCreateStream}
                  disabled={!streamNameInput.trim()}
                  className="flex-1 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Crear Stream
                </button>
                <button
                  onClick={() => {
                    setShowStreamNameModal(false);
                    setStreamNameInput('');
                  }}
                  className="px-6 py-2.5 border-2 border-gray-900 text-gray-900 hover:bg-gray-50 rounded-lg font-medium text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
