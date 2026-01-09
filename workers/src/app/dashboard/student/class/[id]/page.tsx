'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import DocumentSigningModal from '@/components/DocumentSigningModal';
import { getBunnyThumbnailUrl } from '@/lib/bunny-stream';
import { apiClient } from '@/lib/api-client';

interface Video {
  id: string;
  title: string;
  description: string | null;
  durationSeconds: number | null;
  playStates: Array<{
    totalWatchTimeSeconds: number;
    sessionStartTime: string | null;
  }>;
  upload?: {
    storageType?: string;
    bunnyGuid?: string;
    storagePath?: string;
  };
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  upload: {
    fileName: string;
    storagePath: string;
    mimeType?: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  releaseDate: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videos: Video[];
  documents: Document[];
}

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  academy: {
    name: string;
  };
}

interface ActiveStream {
  id: string;
  classId: string;
  title: string;
  zoomLink: string;
  status: string;
  className: string;
  teacherName: string;
}

export default function ClassPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = params.id as string;
  const lessonParam = searchParams.get('lesson');
  const watchVideoId = searchParams.get('watch');

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'PENDING' | 'APPROVED'>('APPROVED');
  const [documentSigned, setDocumentSigned] = useState(false);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [lessonRating, setLessonRating] = useState<number | null>(null);
  const [ratingHover, setRatingHover] = useState<number>(0);
  const [activeStream, setActiveStream] = useState<ActiveStream | null>(null);
  const [showPendingWarning, setShowPendingWarning] = useState(false);

  useEffect(() => {
    loadData();
  }, [classId]);

  // Poll for active streams
  useEffect(() => {
    const checkStream = async () => {
      try {
        const res = await apiClient('/live/active');
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          const stream = result.data.find((s: ActiveStream) => s.classId === classId);
          setActiveStream(stream || null);
        }
      } catch (error) {
        console.error('Failed to check streams:', error);
      }
    };

    // Check immediately on load
    checkStream();
    // Then check every 10 seconds
    const interval = setInterval(checkStream, 10000);
    return () => clearInterval(interval);
  }, [classId]);

  // Handle URL parameters for lesson and video selection
  useEffect(() => {
    if (lessons.length === 0) return;

    console.log('[URL Params] Processing - lessonParam:', lessonParam, 'watchVideoId:', watchVideoId);

    if (lessonParam) {
      const lesson = lessons.find(l => l.id === lessonParam);
      if (lesson) {
        console.log('[URL Params] Found lesson:', lesson.title, 'with', lesson.videos.length, 'videos');
        setSelectedLesson(lesson);
        // Fetch rating for this lesson
        fetch(`/api/lessons/rating?lessonId=${lesson.id}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => setLessonRating(data?.data?.rating ?? null))
          .catch(() => setLessonRating(null));
        // If watching a specific video
        if (watchVideoId) {
          const video = lesson.videos.find(v => v.id === watchVideoId);
          if (video) {
            console.log('[URL Params] Setting selected video from URL:', video.title, 'ID:', video.id);
            setSelectedVideo(video);
          } else {
            console.warn('[URL Params] Video not found in lesson:', watchVideoId);
          }
        } else if (lesson.videos.length > 0) {
          // Auto-select first video
          console.log('[URL Params] Auto-selecting first video:', lesson.videos[0].title);
          setSelectedVideo(lesson.videos[0]);
        }
      } else {
        console.warn('[URL Params] Lesson not found:', lessonParam);
      }
    } else {
      console.log('[URL Params] No lesson selected');
      setSelectedLesson(null);
      setSelectedVideo(null);
      setLessonRating(null);
    }
  }, [lessonParam, watchVideoId, lessons]);

  const loadData = async () => {
    try {
      // First, load class data to resolve slug to ID
      console.log('[Student Class] Loading class data for:', classId);
      const classRes = await fetch(`/api/classes/${classId}`);
      const classResult = await classRes.json();

      if (!classResult.success) {
        console.error('[Student Class] Failed to load class:', classResult.error);
        setLoading(false);
        return;
      }

      console.log('[Student Class] Class loaded:', classResult.data.name, 'ID:', classResult.data.id);
      setClassData(classResult.data);
      setEnrollmentStatus(classResult.data.enrollmentStatus || 'APPROVED');
      setDocumentSigned(classResult.data.documentSigned === true);

      // Use the resolved class ID for subsequent requests
      const resolvedClassId = classResult.data.id;

      const [userRes, lessonsRes, streamsRes] = await Promise.all([
        apiClient('/auth/me'),
        fetch(`/api/lessons?classId=${resolvedClassId}`),
        apiClient('/live/active'),
      ]);

      const [userResult, lessonsResult, streamsResult] = await Promise.all([
        userRes.json(),
        lessonsRes.json(),
        streamsRes.json(),
      ]);

      if (userResult.success) {
        setUser(userResult.data);
      }

      console.log('[Student Class] Lessons result:', lessonsResult);
      if (lessonsResult.success) {
        console.log('[Student Class] Found', lessonsResult.data.length, 'lessons');
        // Fetch detailed lesson data with videos and documents
        const detailedLessons = await Promise.all(
          lessonsResult.data.map(async (lesson: any) => {
            const res = await fetch(`/api/lessons/${lesson.id}`);
            const result = await res.json();
            console.log('[Student Class] Lesson detail for', lesson.title, ':', result);
            return result.success ? result.data : lesson;
          })
        );
        console.log('[Student Class] Setting lessons:', detailedLessons.length);
        setLessons(detailedLessons);
      }

      // Check for active stream in this class
      if (streamsResult.success && Array.isArray(streamsResult.data)) {
        const stream = streamsResult.data.find((s: ActiveStream) => s.classId === resolvedClassId);
        setActiveStream(stream || null);
      }
    } catch (error) {
      console.error('[Student Class] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectLesson = async (lesson: Lesson) => {
    const isReleased = new Date(lesson.releaseDate) <= new Date();
    if (!isReleased) return;
    
    // Block content access if document not signed
    if (!documentSigned) {
      setShowSigningModal(true);
      return;
    }
    
    // Block content access if enrollment is pending
    if (enrollmentStatus === 'PENDING') {
      setShowPendingWarning(true);
      setTimeout(() => setShowPendingWarning(false), 4000);
      return;
    }
    
    // Fetch user's rating for this lesson
    try {
      const res = await fetch(`/api/lessons/rating?lessonId=${lesson.id}`);
      if (res.ok) {
        const data = await res.json();
        setLessonRating(data.data?.rating ?? null);
      } else {
        setLessonRating(null);
      }
    } catch {
      setLessonRating(null);
    }
    
    router.push(`/dashboard/student/class/${classId}?lesson=${lesson.id}`);
  };

  const goBackToLessons = async () => {
    router.push(`/dashboard/student/class/${classId}`);
    setSelectedLesson(null);
    setSelectedVideo(null);
    setLessonRating(null);
    await loadData();
  };

  const handleSignDocument = async () => {
    try {
      const res = await apiClient('/enrollments/sign-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      });

      const result = await res.json();

      if (result.success) {
        setDocumentSigned(true);
        setShowSigningModal(false);
        alert('¡Documento firmado exitosamente! Ya puedes acceder al contenido una vez que el profesor apruebe tu inscripción.');
      } else {
        throw new Error(result.error || 'Failed to sign document');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const selectVideoInLesson = (video: Video) => {
    if (!selectedLesson) return;
    
    console.log('[Video Switch] Starting video switch');
    console.log('[Video Switch] Current video:', selectedVideo?.id, selectedVideo?.title);
    console.log('[Video Switch] Target video:', video.id, video.title);
    console.log('[Video Switch] Lesson:', selectedLesson.id);
    
    // Use hard page reload to ensure video player resets completely
    const newUrl = `/dashboard/student/class/${classId}?lesson=${selectedLesson.id}&watch=${video.id}`;
    console.log('[Video Switch] Navigating to:', newUrl);
    
    // Force full page reload
    window.location.href = newUrl;
  };

  const isPdfDocument = (doc: Document) => {
    return doc.upload.mimeType?.includes('pdf') || doc.upload.fileName.toLowerCase().endsWith('.pdf');
  };

  const submitRating = async (rating: number) => {
    if (!selectedLesson) return;
    try {
      const res = await apiClient('/lessons/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: selectedLesson.id, rating }),
      });
      if (res.ok) {
        setLessonRating(rating);
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }
  };

  if (loading) {
    return (
      <>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading class...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header - Same style as teacher */}
        {!selectedLesson && classData && (
          <>
            {/* Title and Stats */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 flex-wrap mb-2">
                  <h1 className="text-2xl font-semibold text-gray-900">{classData.name}</h1>
                  {/* Stats badge inline with title */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1.5">
                      <span className="font-semibold text-blue-900">{lessons.length}</span>
                      <span className="text-blue-700">lecciones</span>
                    </div>
                  </div>
                </div>
                {classData.description && (
                  <p className="text-gray-600 text-lg max-w-3xl">{classData.description}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Live Stream Banner */}
        {activeStream && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded uppercase">
                      En Vivo
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg">{activeStream.title}</h3>
                  <p className="text-white/80 text-sm">
                    {activeStream.teacherName} está transmitiendo ahora
                  </p>
                </div>
              </div>
              <a
                href={activeStream.zoomLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Unirse Ahora
              </a>
            </div>
          </div>
        )}

        {/* Pending Enrollment Notice */}
        {enrollmentStatus === 'PENDING' && (
          <div className="bg-white border-2 border-amber-300 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Solicitud Pendiente</h3>
                <p className="text-sm text-gray-600">
                  Tu solicitud está esperando aprobación. Puedes ver las lecciones, pero el contenido estará disponible una vez que el profesor apruebe tu inscripción.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Custom Pending Warning Toast */}
        {showPendingWarning && (
          <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
            <div className="bg-white border-2 border-amber-400 rounded-lg shadow-lg p-4 max-w-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Inscripción pendiente</p>
                  <p className="text-xs text-gray-600 mt-1">El contenido estará disponible tras la aprobación del profesor</p>
                </div>
                <button onClick={() => setShowPendingWarning(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lesson Content View - When a lesson is selected */}
        {selectedLesson && user && (
          <div className="space-y-6">
            {/* Back button when lesson is selected */}
            <div>
              <button
                onClick={goBackToLessons}
                className="text-sm text-gray-500 hover:text-gray-900 mb-2"
              >
                ← Volver a lecciones
              </button>
              <h2 className="text-xl font-semibold text-gray-900">{selectedLesson.title}</h2>
              {selectedLesson.description && (
                <p className="text-gray-600 mt-1">{selectedLesson.description}</p>
              )}
              
              {/* Star Rating */}
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Califica esta lección:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => submitRating(star)}
                        onMouseEnter={() => setRatingHover(star)}
                        onMouseLeave={() => setRatingHover(0)}
                        className="text-2xl transition-colors focus:outline-none"
                      >
                        <span className={
                          (ratingHover ? star <= ratingHover : star <= (lessonRating || 0))
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }>
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-1">Tu calificación es anónima y no será vista por el profesor</p>
              </div>
            </div>
            
            {/* Videos Section */}
            {selectedLesson.videos.length > 0 && (
              <div>
                {/* Video selector buttons if multiple videos */}
                {selectedLesson.videos.length > 1 && (
                  <div className="flex gap-2 flex-wrap mb-4">
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
                      studentId={user.id}
                      studentName={`${user.firstName} ${user.lastName}`}
                      studentEmail={user.email}
                      maxWatchTimeMultiplier={selectedLesson.maxWatchTimeMultiplier}
                      durationSeconds={selectedVideo.durationSeconds || 0}
                      initialPlayState={selectedVideo.playStates?.[0] || { totalWatchTimeSeconds: 0, sessionStartTime: null }}
                      userRole={user.role}
                      watermarkIntervalMins={selectedLesson.watermarkIntervalMins}
                      bunnyGuid={selectedVideo.upload?.storageType === 'bunny' ? selectedVideo.upload?.bunnyGuid : undefined}
                    />
                  </div>
                )}
              </div>
            )}

            {/* No videos message */}
            {selectedLesson.videos.length === 0 && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-600">Aún no hay videos en esta lección.</p>
              </div>
            )}

            {/* Documents Section - Below Video */}
            {selectedLesson.documents.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-4">
                  Documentos
                </h3>
                
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
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600">{doc.title}</p>
                          {doc.description && (
                            <p className="text-xs text-gray-500">{doc.description}</p>
                          )}
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

        {/* Lessons Grid - When no lesson is selected */}
        {!selectedLesson && (
          <div>
            {/* Lessons Header */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lecciones</h2>
            </div>
            
            {lessons.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mt-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Aún no hay lecciones</h3>
                <p className="text-gray-500 text-sm">El profesor aún no ha creado lecciones para esta clase.</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto pr-2">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {lessons.map((lesson) => {
                  const isReleased = new Date(lesson.releaseDate) <= new Date();
                  const videoCount = lesson.videos?.length || 0;
                  const docCount = lesson.documents?.length || 0;
                  
                  // Calculate combined progress for all videos
                  let totalWatched = 0;
                  let totalMax = 0;
                  lesson.videos?.forEach((video: any) => {
                    const playState = video.playStates?.[0];
                    const watchedSeconds = playState?.totalWatchTimeSeconds || 0;
                    const videoDuration = video.durationSeconds || 0;
                    if (videoDuration > 0) {
                      totalWatched += watchedSeconds;
                      totalMax += videoDuration * lesson.maxWatchTimeMultiplier;
                    }
                  });
                  const overallProgress = totalMax > 0 ? Math.min(100, (totalWatched / totalMax) * 100) : 0;
                  const remainingMinutes = totalMax > 0 ? Math.ceil((totalMax - totalWatched) / 60) : 0;
                  
                  // Get first video thumbnail if available
                  const firstVideo = lesson.videos?.[0];
                  let thumbnailUrl = null;
                  if (firstVideo?.upload?.bunnyGuid) {
                    try {
                      thumbnailUrl = getBunnyThumbnailUrl(firstVideo.upload.bunnyGuid);
                      // Validate the URL has a proper hostname
                      if (!thumbnailUrl.includes('b-cdn.net')) {
                        console.warn('Invalid thumbnail URL generated:', thumbnailUrl);
                        thumbnailUrl = null;
                      }
                    } catch (e) {
                      console.error('Error generating thumbnail URL:', e);
                      thumbnailUrl = null;
                    }
                  }
                  
                  // Format date with capitalized month (like teacher version)
                  const formatDate = (d: string) => {
                    const date = new Date(d);
                    const formatted = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
                    // Split by 'de' to find the month part and capitalize it
                    const parts = formatted.split(' de ');
                    if (parts.length === 2) {
                      const month = parts[1];
                      return `${parts[0]} de ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
                    }
                    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                  };

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => isReleased && selectLesson(lesson)}
                      className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden transition-all duration-300 group border border-gray-200 shadow-sm ${
                        isReleased
                          ? 'hover:border-brand-400 hover:shadow-xl hover:scale-[1.02] cursor-pointer'
                          : 'opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex flex-col h-full">
                        {/* Header with Title */}
                        <div className="px-4 pt-4 pb-3 relative">
                          {/* Status Badge */}
                          {!isReleased && (
                            <span className="absolute top-3 right-3 px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded border border-amber-200 z-10 shadow-sm">PRÓXIMAMENTE</span>
                          )}
                          
                          <h3 
                            className="text-lg font-bold text-gray-900 line-clamp-2"
                            title={lesson.description || undefined}
                          >
                            {lesson.title}
                          </h3>
                        </div>

                        {/* Thumbnail with play button overlay and content badges */}
                        <div className="relative" style={{ height: '160px' }}>
                          {thumbnailUrl && videoCount > 0 ? (
                            <>
                              <img 
                                src={thumbnailUrl} 
                                alt={lesson.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Hide image on error and show placeholder
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              {/* Date Badge - Top Right */}
                              <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 text-xs bg-gray-100/90 text-gray-600 px-2.5 py-1.5 rounded-lg backdrop-blur-sm border border-gray-300/50 shadow-lg">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">
                                  {lesson.releaseDate ? formatDate(lesson.releaseDate) : 'Sin fecha'}
                                </span>
                              </div>
                              {/* Play Button Overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                  <svg className="w-8 h-8 text-brand-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                  </svg>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                              <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Content Badge Overlay on Thumbnail - Bottom */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <div className="flex items-center gap-2">
                              {videoCount > 0 && (
                                <div className="flex items-center gap-1.5 bg-blue-500/90 px-2.5 py-1 rounded-lg border border-blue-400/50">
                                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                  </svg>
                                  <span className="text-white font-bold text-xs">{videoCount}</span>
                                </div>
                              )}
                              {docCount > 0 && (
                                <div className="flex items-center gap-1.5 bg-purple-500/90 px-2.5 py-1 rounded-lg border border-purple-400/50">
                                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-white font-bold text-xs">{docCount}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress section - Student's personal progress */}
                        {videoCount > 0 && totalMax > 0 && isReleased && (
                          <div className="px-4 py-3 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-4 h-4 ${star <= Math.round(overallProgress / 20) ? 'text-yellow-500' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-gray-600 font-semibold">
                                {Math.round(overallProgress)}% completado
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${overallProgress}%`,
                                  background: overallProgress >= 90 
                                    ? 'linear-gradient(to right, #ef4444, #dc2626)' // red
                                    : overallProgress >= 75 
                                    ? 'linear-gradient(to right, #eab308, #ef4444)' // yellow to red
                                    : overallProgress >= 50 
                                    ? 'linear-gradient(to right, #22c55e, #eab308)' // green to yellow
                                    : 'linear-gradient(to right, #15803d, #22c55e)' // dark green to green
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Signing Modal */}
      <DocumentSigningModal
        isOpen={showSigningModal}
        onClose={() => setShowSigningModal(false)}
        onSign={handleSignDocument}
        classId={classId}
        className={classData?.name || ''}
      />
    </>
  );
}