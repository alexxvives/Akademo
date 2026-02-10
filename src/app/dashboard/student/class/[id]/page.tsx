'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import { SkeletonStudentClass } from '@/components/ui/SkeletonLoader';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import StudentTopicsLessonsList from './components/StudentTopicsLessonsList';

interface Video {
  id: string;
  title: string;
  description: string | null;
  durationSeconds: number | null;
  bunnyGuid?: string; // For demo videos
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
  topicId: string | null;
  topicName?: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videos: Video[];
  documents: Document[];
  // API list fields
  firstVideoBunnyGuid?: string | null;
  videoCount?: number;
  documentCount?: number;
  totalVideoDuration?: number;
  totalWatchedSeconds?: number;
}

interface Topic {
  id: string;
  name: string;
  classId: string;
  orderIndex: number;
  lessonCount: number;
}

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  startDate?: string | null;
  academy: {
    name: string;
    id: string;
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
  
  // Use cached auth hook instead of fetching /auth/me manually
  const { user } = useAuth();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'PENDING' | 'APPROVED'>('APPROVED');
  const [lessonRating, setLessonRating] = useState<number | null>(null);
  const [ratingHover, setRatingHover] = useState<number>(0);
  const [activeStream, setActiveStream] = useState<ActiveStream | null>(null);
  const [showPendingWarning, setShowPendingWarning] = useState(false);
  const [showRatingSuccess, setShowRatingSuccess] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [tempRating, setTempRating] = useState<number | null>(null);
  const [academyFeedbackEnabled, setAcademyFeedbackEnabled] = useState<boolean>(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // Poll for active streams - must use classData.id (resolved UUID) not classId (could be slug)
  useEffect(() => {
    // Only start polling after classData is loaded
    if (!classData?.id) return;

    const checkStream = async () => {
      try {
        const res = await apiClient('/live/active');
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          // Use classData.id (UUID) instead of classId (might be slug)
          const stream = result.data.find((s: ActiveStream) => s.classId === classData.id);
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
  }, [classData?.id]); // Depend on classData.id, not classId

  // Handle URL parameters for lesson and video selection
  useEffect(() => {
    if (lessons.length === 0) return;


    if (lessonParam) {
      // Reload lesson data to get fresh playStates
      const reloadLessonData = async () => {
        try {
          const res = await apiClient(`/lessons/${lessonParam}`);
          const result = await res.json();
          
          if (result.success && result.data) {
            const freshLesson = result.data;
            
            // Update lessons array with fresh data
            setLessons(prev => prev.map(l => l.id === lessonParam ? freshLesson : l));
            setSelectedLesson(freshLesson);
            
            // Fetch rating for this lesson
            apiClient(`/ratings?lessonId=${freshLesson.id}`)
              .then(res => res.ok ? res.json() : null)
              .then(data => setLessonRating(data?.data?.rating ?? null))
              .catch(() => setLessonRating(null));
            
            // If watching a specific video
            if (watchVideoId) {
              const video = freshLesson.videos.find((v: Video) => v.id === watchVideoId);
              if (video) {
                setSelectedVideo(video);
              } else {
                console.warn('[URL Params] Video not found in lesson:', watchVideoId);
              }
            } else if (freshLesson.videos.length > 0) {
              // Auto-select first video
              setSelectedVideo(freshLesson.videos[0]);
            }
          }
        } catch (error) {
          console.error('[URL Params] Failed to reload lesson:', error);
          // Fallback to cached data
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

  const loadData = async () => {
    try {
      // First, load class data to resolve slug to ID
      const classRes = await apiClient(`/classes/${classId}`);
      const classResult = await classRes.json();

      if (!classResult.success) {
        console.error('[Student Class] Failed to load class:', classResult.error);
        setLoading(false);
        return;
      }

      setClassData(classResult.data);
      setEnrollmentStatus(classResult.data.enrollmentStatus || 'APPROVED');

      // Load academy to get feedbackEnabled setting
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

      // Use the resolved class ID for subsequent requests
      const resolvedClassId = classResult.data.id;

      const [lessonsRes, topicsRes] = await Promise.all([
        apiClient(`/lessons?classId=${resolvedClassId}`),
        apiClient(`/topics?classId=${resolvedClassId}`),
      ]);

      const [lessonsResult, topicsResult] = await Promise.all([
        lessonsRes.json(),
        topicsRes.json(),
      ]);

      if (topicsResult.success) {
        setTopics(topicsResult.data || []);
      }

      if (lessonsResult.success) {
        // Just store the lesson list - don't fetch details yet (will fetch on-demand)
        setLessons(lessonsResult.data);
      }

      // Stream state managed by checkStream() polling - no duplicate fetching here
    } catch (error) {
      console.error('[Student Class] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectLesson = async (lesson: Lesson) => {
    const isReleased = new Date(lesson.releaseDate) <= new Date();
    if (!isReleased) return;
    
    // Block content access if enrollment is pending
    if (enrollmentStatus === 'PENDING') {
      setShowPendingWarning(true);
      setTimeout(() => setShowPendingWarning(false), 4000);
      return;
    }
    
    // Fetch user's rating for this lesson
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
    
    router.push(`/dashboard/student/class/${classId}?lesson=${lesson.id}`);
  };

  const goBackToLessons = async () => {
    // Expand the topic of the lesson we're leaving
    if (selectedLesson && selectedLesson.topicId) {
      setExpandedTopics(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedLesson.topicId!);
        return newSet;
      });
    }
    router.push(`/dashboard/student/class/${classId}`);
    setSelectedLesson(null);
    setSelectedVideo(null);
    setLessonRating(null);
    await loadData();
  };

  const selectVideoInLesson = async (video: Video) => {
    if (!selectedLesson) return;
    
    
    // Reload lesson data to get fresh playStates before switching
    try {
      const res = await apiClient(`/lessons/${selectedLesson.id}`);
      const result = await res.json();
      
      if (result.success && result.data) {
        // Update the lesson in the lessons array
        setLessons(prev => prev.map(l => l.id === selectedLesson.id ? result.data : l));
        // Update selected lesson with fresh data
        setSelectedLesson(result.data);
        
        // Find the video with updated playState
        const updatedVideo = result.data.videos.find((v: Video) => v.id === video.id);
        if (updatedVideo) {
          setSelectedVideo(updatedVideo);
        }
      }
    } catch (error) {
      console.error('[Video Switch] Failed to reload lesson:', error);
    }
    
    // Update URL without full page reload
    const newUrl = `/dashboard/student/class/${classId}?lesson=${selectedLesson.id}&watch=${video.id}`;
    router.push(newUrl);
  };

  const _isPdfDocument = (doc: Document) => {
    return doc.upload.mimeType?.includes('pdf') || doc.upload.fileName.toLowerCase().endsWith('.pdf');
  };

  const submitRating = async (rating: number) => {
    if (!selectedLesson || showRatingSuccess) return;
    
    try {
      const res = await apiClient('/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lessonId: selectedLesson.id, 
          rating,
          feedback: feedbackText || null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setLessonRating(rating);
        setShowRatingSuccess(true);
        setTempRating(null);
        setFeedbackText('');
        
        // Trigger event to update teacher/academy sidebar badge (they'll see new/edited review)
        window.dispatchEvent(new CustomEvent('unreadReviewsChanged'));
        
        // Hide success message after 2 seconds
        setTimeout(() => {
          setShowRatingSuccess(false);
        }, 2000);
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

  const _submitFeedback = () => {
    if (tempRating) {
      submitRating(tempRating);
    }
  };

  if (loading) {
    return <SkeletonStudentClass />;
  }

  // Block access if class hasn't started yet
  if (classData?.startDate) {
    const startDate = new Date(classData.startDate);
    const now = new Date();
    if (startDate > now) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Esta asignatura aún no ha comenzado</h2>
          <p className="text-gray-500 mb-1">
            <span className="font-medium text-gray-700">{classData.name}</span>
          </p>
          <p className="text-gray-500 mb-6">
            Empieza el <span className="font-semibold text-gray-700">{startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </p>
          <Link href="/dashboard/student/classes" className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
            ← Volver a mis asignaturas
          </Link>
        </div>
      );
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header - Same style as teacher */}
        {!selectedLesson && classData && (
          <>
            {/* Back Button */}
            <Link href="/dashboard/student/classes" className="text-sm text-gray-500 hover:text-gray-900 inline-block">
              ← Volver a asignaturas
            </Link>
            {/* Title and Stats */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 flex-wrap mb-2">
                  <h1 className="text-2xl font-semibold text-gray-900">{classData.name}</h1>
                  
                  {/* Live Stream Indicator - Subtle container next to title */}
                  {activeStream && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                        <span className="text-red-600 text-sm font-medium">En Vivo</span>
                      </div>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-600 text-sm">{activeStream.teacherName}</span>
                      <a
                        href={activeStream.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Unirse
                      </a>
                    </div>
                  )}
                </div>
                {classData.description && (
                  <p className="text-gray-600 text-base sm:text-lg max-w-3xl">{classData.description}</p>
                )}
              </div>
            </div>
          </>
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
                  Tu solicitud está esperando aprobación. Puedes ver las Clases, pero el contenido estará disponible una vez que el profesor apruebe tu inscripción.
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
                ← Volver a Clases
              </button>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedLesson.title}</h2>
              
              {academyFeedbackEnabled && (
              <div className="flex items-center gap-4 mb-2">
                {/* Star Rating */}
                <div className="flex gap-1 group/rating relative">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleStarClick(star)}
                      onMouseEnter={() => setRatingHover(star)}
                      onMouseLeave={() => setRatingHover(0)}
                      className="text-xl transition-all focus:outline-none hover:scale-110"
                      disabled={showRatingSuccess}
                    >
                      <span className={
                        (ratingHover ? star <= ratingHover : star <= (tempRating ?? lessonRating ?? 0))
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }>
                        ★
                      </span>
                    </button>
                  ))}
                </div>

                {/* Success Animation */}
                {showRatingSuccess && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-600 font-semibold text-sm">¡Gracias!</span>
                  </div>
                )}

                {/* Feedback Input - Right next to stars */}
                {tempRating !== null && !showRatingSuccess && (
                  <div className="flex-1 max-w-2xl">
                    <div className="bg-white border-2 border-[#b2e787] rounded-xl p-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Comparte tu opinión (opcional)..."
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b2e787] focus:border-[#b2e787] transition-all text-sm text-gray-900 placeholder:text-gray-400"
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              if (tempRating) {
                                submitRating(tempRating);
                              }
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Omitir
                          </button>
                          <button
                            onClick={() => {
                              if (tempRating) {
                                submitRating(tempRating);
                              }
                            }}
                            className="px-4 py-1.5 bg-[#b2e787] text-[#1a1c29] rounded-lg hover:bg-[#a1d676] text-sm font-medium shadow-sm hover:shadow transition-all"
                          >
                            Enviar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )}
              
              {selectedLesson.description && (
                <p className="text-gray-600 mt-1">{selectedLesson.description}</p>
              )}
            </div>
            
            {/* Video Player and Documents Side by Side */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Video Player - Left Side */}
              <div className="flex-1 min-w-0 max-w-3xl">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg text-center">VIDEOS</h3>
                {selectedLesson.videos.length > 0 && selectedVideo && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <ProtectedVideoPlayer
                      key={selectedVideo.id}
                      videoUrl={(selectedVideo.upload?.storageType === 'bunny' || selectedVideo.bunnyGuid) ? '' : `/api/video/stream/${selectedVideo.id}`}
                      videoId={selectedVideo.id}
                      studentId={user.id}
                      studentName={`${user.firstName} ${user.lastName}`}
                      studentEmail={user.email}
                      maxWatchTimeMultiplier={selectedLesson.maxWatchTimeMultiplier}
                      durationSeconds={selectedVideo.durationSeconds || 0}
                      initialPlayState={selectedVideo.playStates?.[0] || { totalWatchTimeSeconds: 0, sessionStartTime: null }}
                      userRole={user.role}
                      watermarkIntervalMins={selectedLesson.watermarkIntervalMins}
                      bunnyGuid={(selectedVideo.upload?.storageType === 'bunny' ? selectedVideo.upload?.bunnyGuid : selectedVideo.bunnyGuid) || undefined}
                    />
                  </div>
                )}

                {/* No videos message */}
                {selectedLesson.videos.length === 0 && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">Aún no hay videos en esta lección.</p>
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
                        href={`/api/documents/${doc.upload.storagePath.split('/').map(encodeURIComponent).join('/')}`}
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
          </div>
        )}

        {/* Lessons Grid - When no lesson is selected */}
        {!selectedLesson && (
          <StudentTopicsLessonsList 
            lessons={lessons}
            topics={topics}
            expandedTopics={expandedTopics}
            setExpandedTopics={setExpandedTopics}
            onSelectLesson={selectLesson}
          />
        )}
      </div>
    </>
  );
}
