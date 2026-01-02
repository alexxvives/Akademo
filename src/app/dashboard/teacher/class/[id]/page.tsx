'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import { multipartUpload } from '@/lib/multipart-upload';
import { uploadToBunny } from '@/lib/bunny-upload';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  releaseDate: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videoCount: number;
  documentCount: number;
  studentsWatching?: number;
  avgProgress?: number;
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

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonDetail | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0); // bytes per second
  const [uploadETA, setUploadETA] = useState(0); // seconds remaining
  const activeUploadRef = useRef<XMLHttpRequest | null>(null);
  const uploadStartTimeRef = useRef<number>(0);
  const lastProgressRef = useRef<{loaded: number, time: number}>({loaded: 0, time: 0});
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    description: '',
    externalUrl: '',
    releaseDate: new Date().toISOString().split('T')[0],
    releaseTime: '00:00',
    publishImmediately: true,
    maxWatchTimeMultiplier: 2.0,
    watermarkIntervalMins: 5,
    videos: [] as { file: File; title: string; description: string; duration: number }[],
    documents: [] as { file: File; title: string; description: string }[],
  });

  // Analytics
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

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

  useEffect(() => {
    if (classId) {
      loadData();
      loadUser();
      loadLiveClasses();
    }
  }, [classId]);

  // Poll for transcoding status updates
  useEffect(() => {
    const hasTranscoding = lessons.some(l => l.isTranscoding === 1);
    if (!hasTranscoding) return;

    const interval = setInterval(async () => {
      try {
        // Use checkTranscoding=true to update Bunny status before returning lessons
        const lessonsRes = await fetch(`/api/lessons?classId=${classId}&checkTranscoding=true`);
        const lessonsResult = await lessonsRes.json();
        if (lessonsResult.success) {
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
  }, [lessons, classId]);

  // Handle URL params for lesson/video selection
  useEffect(() => {
    if (lessons.length === 0) return;

    if (lessonParam) {
      loadLessonDetail(lessonParam).then(lesson => {
        if (lesson && watchVideoId) {
          const video = lesson.videos.find((v: any) => v.id === watchVideoId);
          if (video) setSelectedVideo(video);
        } else if (lesson && lesson.videos.length > 0) {
          setSelectedVideo(lesson.videos[0]);
        }
      });
    } else {
      setSelectedLesson(null);
      setSelectedVideo(null);
    }
  }, [lessonParam, watchVideoId, lessons]);

  // Handle action param for create lesson modal
  useEffect(() => {
    if (actionParam === 'create') {
      setShowLessonForm(true);
      setEditingLessonId(null);
    }
  }, [actionParam]);

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

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const result = await res.json();
      if (result.success) setCurrentUser(result.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    try {
      // First, fetch class data to get the actual ID (in case classId is a slug)
      const classRes = await fetch(`/api/classes/${classId}`);
      const classResult = await classRes.json();
      
      if (!classResult.success) {
        throw new Error('Failed to load class');
      }
      
      setClassData(classResult.data);
      const actualClassId = classResult.data.id;
      
      // Now fetch lessons and pending enrollments using the actual class ID
      const [lessonsRes, pendingRes] = await Promise.all([
        fetch(`/api/lessons?classId=${actualClassId}`),
        fetch(`/api/enrollments/pending`)
      ]);
      
      const [lessonsResult, pendingResult] = await Promise.all([
        lessonsRes.json(),
        pendingRes.json()
      ]);
      
      if (lessonsResult.success) setLessons(lessonsResult.data);
      if (pendingResult.success) {
        // Filter to only show enrollments for this class
        const classPending = pendingResult.data.filter((e: any) => e.classId === actualClassId);
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
      const res = await fetch(`/api/live?classId=${classId}`);
      const result = await res.json();
      if (result.success) {
        setLiveClasses(result.data);
      }
    } catch (e) {
      console.error('Failed to load live classes:', e);
    }
  };

  const createLiveClass = async () => {
    setCreatingStream(true);
    try {
      // Generate default title with timestamp
      const now = new Date();
      const defaultTitle = `Stream ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
      
      const res = await fetch('/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          title: defaultTitle,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setLiveClasses(prev => [result.data, ...prev]);
        setShowStreamModal(false);
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
      const res = await fetch(`/api/live?id=${classLiveId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setLiveClasses(prev => prev.filter(s => s.id !== classLiveId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadLessonDetail = async (lessonId: string): Promise<LessonDetail | null> => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}`);
      const result = await res.json();
      if (result.success) {
        setSelectedLesson(result.data);
        return result.data;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const selectLesson = (lesson: Lesson) => {
    router.push(`/dashboard/teacher/class/${classId}?lesson=${lesson.id}`);
  };

  const goBackToLessons = () => {
    router.push(`/dashboard/teacher/class/${classId}`);
    setSelectedLesson(null);
    setSelectedVideo(null);
    loadData();
  };

  const selectVideoInLesson = (video: any) => {
    if (!selectedLesson) return;
    router.push(`/dashboard/teacher/class/${classId}?lesson=${selectedLesson.id}&watch=${video.id}`);
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
    if (lessonFormData.videos.length === 0 && lessonFormData.documents.length === 0) {
      return alert('Agrega al menos un video o documento');
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
    
    const abortController = new AbortController();
    activeUploadRef.current = abortController as any; // Store abort controller for cancellation
    
    try {
      // Upload files using optimized multipart upload
      const { videos, documents } = await uploadFilesWithMultipart(tempLessonId, abortController);
      
      // Create lesson with uploaded file references
      const res = await fetch('/api/lessons/create-with-uploaded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          title: lessonFormData.title || new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
          description: lessonFormData.description,
          releaseDate: releaseTimestamp,
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
          maxWatchTimeMultiplier: 2.0, watermarkIntervalMins: 5, videos: [], documents: []
        });
        setUploadProgress(0);
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
      const res = await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) loadData();
      else alert(result.error || 'Failed to delete');
    } catch (e) {
      alert('Error occurred');
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

  const handleEditLesson = async (lesson: Lesson) => {
    try {
      // Load lesson details WITHOUT setting selectedLesson to avoid navigation
      const res = await fetch(`/api/lessons/${lesson.id}`);
      const result = await res.json();
      
      if (!result.success || !result.data) {
        alert('Error loading lesson details');
        return;
      }
      
      const detail = result.data;
      
      // Populate form with existing data
      const releaseDatetime = new Date(detail.releaseDate);
      const timeString = releaseDatetime.toTimeString().slice(0, 5); // HH:MM format
      
      setLessonFormData({
        title: detail.title,
        description: detail.description || '',
        externalUrl: detail.externalUrl || '',
        releaseDate: detail.releaseDate.split('T')[0],
        releaseTime: timeString,
        publishImmediately: false, // When editing, show scheduling options
        maxWatchTimeMultiplier: detail.maxWatchTimeMultiplier,
        watermarkIntervalMins: detail.watermarkIntervalMins,
        videos: [],
        documents: [],
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
      const res = await fetch(`/api/lessons/${editingLessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonFormData.title,
          description: lessonFormData.description,
          releaseDate: new Date(lessonFormData.releaseDate).toISOString(),
          maxWatchTimeMultiplier: lessonFormData.maxWatchTimeMultiplier,
          watermarkIntervalMins: lessonFormData.watermarkIntervalMins,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setLessonFormData({
          title: '', description: '', externalUrl: '', releaseDate: new Date().toISOString().split('T')[0],
          releaseTime: '00:00', publishImmediately: true,
          maxWatchTimeMultiplier: 2.0, watermarkIntervalMins: 5, videos: [], documents: []
        });
        setEditingLessonId(null);
        setShowLessonForm(false);
        loadData();
      } else {
        alert(result.error || 'Failed to update lesson');
      }
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
      const res = await fetch('/api/enrollments/pending', {
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
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </>
    );
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
    <>
      <div className="space-y-6">
        {/* Clean Minimalist Header - Focus on Lessons */}
        {!selectedLesson && (
          <>
            {/* Title and Actions */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{classData.name}</h1>
                {classData.description && (
                  <p className="text-gray-600 text-lg max-w-3xl">{classData.description}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { router.push(`/dashboard/teacher/class/${classId}?action=create`); }}
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all"
                >
                  + Nueva Lección
                </button>
                <button
                  onClick={createLiveClass}
                  disabled={creatingStream}
                  className="px-5 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {creatingStream ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                  {creatingStream ? 'Creando...' : '🔴 Stream'}
                </button>
              </div>
            </div>

            {/* Floating Stats Container */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{lessons.length}</span>
                  <span className="text-gray-600">lecciones</span>
                </div>
                <div className="h-4 w-px bg-gray-200"></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{classData.enrollments.filter((e: any) => e.status === 'approved').length}</span>
                  <span className="text-gray-600">estudiantes</span>
                </div>
                {pendingEnrollments.length > 0 && (
                  <>
                    <div className="h-4 w-px bg-gray-200"></div>
                    <button
                      onClick={() => setShowPendingRequests(!showPendingRequests)}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                      </span>
                      <span className="font-semibold">{pendingEnrollments.length}</span>
                      <span>solicitud{pendingEnrollments.length !== 1 ? 'es' : ''}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Pending Enrollment Requests - Keep original */}
        {pendingEnrollments.length > 0 && showPendingRequests && !selectedLesson && (
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-200 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-6 py-3 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Solicitudes Pendientes</h2>
                    <p className="text-xs text-gray-600">{pendingEnrollments.length} estudiante{pendingEnrollments.length !== 1 ? 's' : ''} esperando tu aprobación</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPendingRequests(false)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {pendingEnrollments.map((enrollment) => (
                  <div 
                    key={enrollment.id} 
                    className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {enrollment.student.firstName.charAt(0)}{enrollment.student.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">
                        {enrollment.student.firstName} {enrollment.student.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{enrollment.student.email}</p>
                      <p className="text-xs text-gray-400">
                        Solicitado {new Date(enrollment.enrolledAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEnrollmentAction(enrollment.id, 'reject')}
                        className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                        title="Rechazar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEnrollmentAction(enrollment.id, 'approve')}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                        title="Aprobar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selected Lesson View */}
        {selectedLesson && currentUser && (
          <div className="space-y-6">
            <div>
              <button onClick={goBackToLessons} className="text-sm text-gray-500 hover:text-gray-900 mb-2">
                ← Volver a lecciones
              </button>
              <h2 className="text-xl font-semibold text-gray-900">{selectedLesson.title}</h2>
              {selectedLesson.description && <p className="text-gray-600 mt-1">{selectedLesson.description}</p>}
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>Lanzamiento: {formatDate(selectedLesson.releaseDate)}</span>
                <span>Multiplicador: {selectedLesson.maxWatchTimeMultiplier}x</span>
                <span>Marca de agua: cada {selectedLesson.watermarkIntervalMins} min</span>
              </div>
            </div>

            {/* Video Tabs */}
            {selectedLesson.videos.length > 1 && (
              <div className="flex gap-2 flex-wrap">
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

            {/* Video Player */}
            {selectedVideo && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <ProtectedVideoPlayer
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

            {/* Documents */}
            {selectedLesson.documents.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-4">Documentos ({selectedLesson.documents.length})</h3>
                <div className="space-y-3">
                  {selectedLesson.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={`/api/storage/serve/${encodeURIComponent(doc.upload.storagePath)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600">{doc.title}</p>
                          {doc.description && <p className="text-xs text-gray-500">{doc.description}</p>}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main View - No Lesson Selected */}
        {!selectedLesson && (
          <>
            {/* Active/Scheduled Stream Banner */}
            {liveClasses.length > 0 && (
              <div className={`rounded-xl p-4 text-white shadow-lg ${
                liveClasses[0].status === 'active' 
                  ? 'bg-gradient-to-r from-red-500 to-red-600' 
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      {liveClasses[0].status === 'active' ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white/70"></span>
                      )}
                    </span>
                    <div>
                      {liveClasses[0].status === 'active' ? (
                        <>
                          <p className="font-semibold">🔴 En Vivo: {liveClasses[0].title}</p>
                          <p className="text-red-100 text-sm">Estudiantes pueden unirse ahora</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold">⏳ Esperando: {liveClasses[0].title}</p>
                          <p className="text-yellow-100 text-sm">Haz clic en "Entrar como Host" para iniciar</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={liveClasses[0].zoomStartUrl || liveClasses[0].zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                        liveClasses[0].status === 'active'
                          ? 'bg-white text-red-600 hover:bg-red-50'
                          : 'bg-white text-orange-600 hover:bg-orange-50'
                      }`}
                    >
                      Entrar como Host
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(liveClasses[0].zoomLink);
                        alert('Link copiado al portapapeles');
                      }}
                      className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                      title="Copiar link para estudiantes"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">Copiar Link</span>
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log('Sending notification with data:', {
                            classId: classData?.id,
                            liveStreamId: liveClasses[0].id,
                            message: `Clase en vivo: ${liveClasses[0].title}`
                          });
                          const res = await fetch('/api/notifications', {
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
                      className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
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

            {/* Lessons Header */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lecciones ({lessons.length})</h2>
            </div>

            {/* Lesson Form Modal */}
            {showLessonForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {editingLessonId ? 'Editar Lección' : 'Crear Nueva Lección'}
                    </h3>
                    <button 
                      onClick={() => { setShowLessonForm(false); setEditingLessonId(null); router.push(`/dashboard/teacher/class/${classId}`); }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <form onSubmit={editingLessonId ? handleUpdateLesson : handleLessonCreate} className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Title + Publish Options Row */}
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
                    </div>
                    
                    {/* Date/Time inputs - only show when scheduling */}
                    {!lessonFormData.publishImmediately && (
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
                      <textarea value={lessonFormData.description} onChange={e => setLessonFormData({ ...lessonFormData, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors resize-none" placeholder="Descripción opcional"/>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Multiplicador de Tiempo de Visualización</label>
                        <input type="number" min="1" max="10" step="0.5" value={lessonFormData.maxWatchTimeMultiplier} onChange={e => setLessonFormData({ ...lessonFormData, maxWatchTimeMultiplier: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
                        <p className="text-xs text-gray-500 mt-1">Los estudiantes pueden ver esto × duración del video</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Intervalo de Marca de Agua</label>
                        <input type="number" min="1" max="60" value={lessonFormData.watermarkIntervalMins} onChange={e => setLessonFormData({ ...lessonFormData, watermarkIntervalMins: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
                        <p className="text-xs text-gray-500 mt-1">Cada cuánto tiempo aparece la marca de agua</p>
                      </div>
                    </div>
                    {!editingLessonId && (
                      <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Videos</label>
                      <input type="file" accept="video/mp4" multiple onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(addVideoToForm); e.target.value = ''; }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
                      {lessonFormData.videos.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {lessonFormData.videos.map((v, i) => (
                            <div key={i} className="p-3 bg-blue-50 rounded-lg space-y-2">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="text" 
                                  value={v.title} 
                                  onChange={e => { 
                                    const nv = [...lessonFormData.videos]; 
                                    nv[i].title = e.target.value; 
                                    setLessonFormData({ ...lessonFormData, videos: nv }); 
                                  }} 
                                  placeholder="Título del video"
                                  className="flex-1 px-2 py-1 border border-blue-200 rounded text-sm"
                                />
                                <span className="text-xs text-gray-500 whitespace-nowrap">{formatDuration(v.duration)}</span>
                                <button 
                                  type="button" 
                                  onClick={() => setLessonFormData({ ...lessonFormData, videos: lessonFormData.videos.filter((_, j) => j !== i) })} 
                                  className="text-red-500 hover:text-red-700 text-xl leading-none"
                                >
                                  ×
                                </button>
                              </div>
                              <input 
                                type="text" 
                                value={v.description} 
                                onChange={e => { 
                                  const nv = [...lessonFormData.videos]; 
                                  nv[i].description = e.target.value; 
                                  setLessonFormData({ ...lessonFormData, videos: nv }); 
                                }} 
                                placeholder="Descripción del video (opcional)"
                                className="w-full px-2 py-1 border border-blue-200 rounded text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Documentos (PDF)</label>
                      <input type="file" accept=".pdf" multiple onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(addDocumentToForm); e.target.value = ''; }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
                      {lessonFormData.documents.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {lessonFormData.documents.map((d, i) => (
                            <div key={i} className="p-3 bg-red-50 rounded-lg space-y-2">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="text" 
                                  value={d.title} 
                                  onChange={e => { 
                                    const nd = [...lessonFormData.documents]; 
                                    nd[i].title = e.target.value; 
                                    setLessonFormData({ ...lessonFormData, documents: nd }); 
                                  }} 
                                  placeholder="Título del documento (opcional)"
                                  className="flex-1 px-2 py-1 border border-red-200 rounded text-sm"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => setLessonFormData({ ...lessonFormData, documents: lessonFormData.documents.filter((_, j) => j !== i) })} 
                                  className="text-red-500 hover:text-red-700 text-xl leading-none"
                                >
                                  ×
                                </button>
                              </div>
                              <input 
                                type="text" 
                                value={d.description} 
                                onChange={e => { 
                                  const nd = [...lessonFormData.documents]; 
                                  nd[i].description = e.target.value; 
                                  setLessonFormData({ ...lessonFormData, documents: nd }); 
                                }} 
                                placeholder="Descripción del documento (opcional)"
                                className="w-full px-2 py-1 border border-red-200 rounded text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                      </>
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

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button type="submit" disabled={uploading} className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm disabled:opacity-50">
                        {uploading ? 'Creando...' : editingLessonId ? 'Actualizar Lección' : 'Crear Lección'}
                      </button>
                      <button type="button" onClick={() => { setShowLessonForm(false); setEditingLessonId(null); }} className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium text-sm">
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

            {/* Lecciones */}
            <div>
              {lessons.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Aún no hay lecciones</h3>
                  <p className="text-gray-500 text-sm">Crea tu primera lección para comenzar</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lessons.map((lesson) => {
                    const videoCount = lesson.videoCount || 0;
                    const docCount = lesson.documentCount || 0;
                    
                    return (
                      <div
                        key={lesson.id}
                        onClick={(e) => {
                          // Check if click is on action buttons container
                          const target = e.target as HTMLElement;
                          if (target.closest('[data-action-buttons]')) {
                            return; // Don't navigate if clicking action buttons area
                          }
                          if (!lesson.isUploading && !lesson.isTranscoding) {
                            selectLesson(lesson);
                          }
                        }}
                        className={`bg-white rounded-xl border overflow-hidden transition-all duration-200 group shadow-sm ${
                          lesson.isUploading || lesson.isTranscoding
                            ? 'border-blue-300 cursor-default'
                            : 'border-gray-200 hover:border-gray-400 hover:shadow-lg cursor-pointer'
                        }`}
                      >
                        <div className="p-6 flex flex-col h-full">
                          {/* Uploading Progress */}
                          {lesson.isUploading && (
                            <div className="mb-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <div className="flex items-center justify-between text-sm text-blue-700 mb-2">
                                <span className="font-medium flex items-center gap-2">
                                  <span className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                                  Subiendo archivos...
                                </span>
                                <span className="font-bold">{Math.round(lesson.uploadProgress || 0)}%</span>
                              </div>
                              <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-600 transition-all"
                                  style={{ width: `${lesson.uploadProgress || 0}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Transcoding Status */}
                          {lesson.isTranscoding === 1 && !lesson.isUploading && (
                            <div className="mb-3 bg-purple-50 rounded-lg p-3 border border-purple-200 text-center">
                              <span className="text-sm font-medium text-purple-700 flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
                                Transcodificando video...
                              </span>
                              <p className="text-xs text-purple-600 mt-1">Esto puede tomar varios minutos</p>
                            </div>
                          )}
                          
                          {/* Title and Actions */}
                          <div className="flex items-start justify-between mb-4">
                            <h3 
                              className="font-bold text-lg text-gray-900 group-hover:text-gray-600 transition-colors flex-1 pr-2"
                              title={lesson.description || undefined}
                            >
                              {lesson.title}
                            </h3>
                            <div className="flex items-center gap-1 flex-shrink-0" data-action-buttons onClick={(e) => e.stopPropagation()}>
                              {!isReleased(lesson.releaseDate) && !lesson.isUploading && !lesson.isTranscoding && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-medium rounded border border-amber-200 mr-1">Programada</span>
                              )}
                              <button
                                onClick={(e) => { 
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.nativeEvent.stopImmediatePropagation();
                                  if (!lesson.isUploading && !lesson.isTranscoding) {
                                    handleEditLesson(lesson);
                                  }
                                }}
                                disabled={lesson.isUploading || lesson.isTranscoding === 1}
                                className={`p-1 rounded transition-colors ${
                                  lesson.isUploading || lesson.isTranscoding
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-400 hover:text-brand-600'
                                }`}
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { 
                                  e.preventDefault();
                                  e.stopPropagation(); 
                                  if (!lesson.isUploading && !lesson.isTranscoding && window.confirm('¿Eliminar esta lección?')) {
                                    handleDeleteLesson(lesson.id);
                                  }
                                }}
                                disabled={lesson.isUploading || lesson.isTranscoding === 1}
                                className={`p-1 rounded transition-colors ${
                                  lesson.isUploading || lesson.isTranscoding
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-400 hover:text-red-600'
                                }`}
                                title="Eliminar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {/* Counts - Enhanced Style */}
                          <div className="flex items-center gap-4 text-sm">
                            {videoCount > 0 && (
                              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                </svg>
                                <span className="font-semibold text-blue-900">{videoCount}</span>
                                <span className="text-blue-700">video{videoCount !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                            {docCount > 0 && (
                              <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
                                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold text-purple-900">{docCount}</span>
                                <span className="text-purple-700">doc{docCount !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Release Date - Bottom */}
                          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">Lanzamiento:</span>
                            <span>{new Date(lesson.releaseDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Students - Compact */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Estudiantes</h2>
              {classData.enrollments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <p className="text-gray-500 text-sm">No hay estudiantes inscritos</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {classData.enrollments.map(e => (
                    <div key={e.id} className="p-3 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {e.student.firstName[0]}{e.student.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{e.student.firstName} {e.student.lastName}</p>
                          <p className="text-xs text-gray-500 truncate">{e.student.email}</p>
                        </div>
                      </div>
                      
                      {/* Inline Status */}
                      <div className="flex items-center gap-4 text-xs text-gray-600 ml-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Activo</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(e.enrolledAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
