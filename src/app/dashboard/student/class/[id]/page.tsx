'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import { getBunnyThumbnailUrl } from '@/lib/bunny-stream';

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
  const [lessonRating, setLessonRating] = useState<number | null>(null);
  const [ratingHover, setRatingHover] = useState<number>(0);
  const [activeStream, setActiveStream] = useState<ActiveStream | null>(null);

  useEffect(() => {
    loadData();
  }, [classId]);

  // Poll for active streams
  useEffect(() => {
    const checkStream = async () => {
      try {
        const res = await fetch('/api/live/active');
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

    if (lessonParam) {
      const lesson = lessons.find(l => l.id === lessonParam);
      if (lesson) {
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
            setSelectedVideo(video);
          }
        } else if (lesson.videos.length > 0) {
          // Auto-select first video
          setSelectedVideo(lesson.videos[0]);
        }
      }
    } else {
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

      // Use the resolved class ID for subsequent requests
      const resolvedClassId = classResult.data.id;

      const [userRes, lessonsRes, streamsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/lessons?classId=${resolvedClassId}`),
        fetch('/api/live/active'),
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
    
    // Block content access if enrollment is pending
    if (enrollmentStatus === 'PENDING') {
      alert('Your enrollment is pending approval. You can view lessons but cannot access content yet.');
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

  const selectVideoInLesson = (video: Video) => {
    if (!selectedLesson) return;
    router.push(`/dashboard/student/class/${classId}?lesson=${selectedLesson.id}&watch=${video.id}`);
  };

  const isPdfDocument = (doc: Document) => {
    return doc.upload.mimeType?.includes('pdf') || doc.upload.fileName.toLowerCase().endsWith('.pdf');
  };

  const submitRating = async (rating: number) => {
    if (!selectedLesson) return;
    try {
      const res = await fetch('/api/lessons/rating', {
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
            {/* Title */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{classData.name}</h1>
                {classData.description && (
                  <p className="text-gray-600 text-lg max-w-3xl">{classData.description}</p>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{lessons.length}</p>
                  <p className="text-xs text-gray-500">Lecciones</p>
                </div>
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
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">Inscripción Pendiente de Aprobación</h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Tu solicitud para unirte a esta clase está esperando la aprobación del profesor. Puedes ver las lecciones a continuación, pero no podrás acceder a videos o documentos hasta que tu inscripción sea aprobada.
                </p>
                <p className="text-xs text-yellow-700">
                  El profesor revisará tu solicitud pronto y te notificará una vez aprobada.
                </p>
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
                  {lessonRating && (
                    <span className="text-sm text-gray-500">Tu calificación: {lessonRating}/5</span>
                  )}
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
                  <div className="rounded-lg overflow-hidden max-w-4xl mx-auto">
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
                  Documentos ({selectedLesson.documents.length})
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
                  
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => isReleased && selectLesson(lesson)}
                      className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden transition-all duration-300 group border border-gray-200 shadow-sm ${
                        isReleased
                          ? 'hover:border-brand-400 hover:shadow-lg hover:shadow-brand-500/10 cursor-pointer hover:scale-[1.02]'
                          : 'opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="p-5 flex flex-col h-full relative">
                        {/* Release Date - Top Right */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-gray-600 bg-white/90 px-2.5 py-1.5 rounded-lg backdrop-blur-sm border border-gray-200 z-10 shadow-sm">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-700 font-medium">{new Date(lesson.releaseDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        
                        {/* Status Badge */}
                        {!isReleased && (
                          <span className="absolute top-14 right-3 px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded border border-amber-200 z-10 shadow-sm">PRÓXIMAMENTE</span>
                        )}
                        
                        {/* Title */}
                        <h3 
                          className="font-bold text-lg text-gray-900 group-hover:text-brand-600 transition-colors mb-3 line-clamp-2 pr-32"
                          title={lesson.description || undefined}
                        >
                          {lesson.title}
                        </h3>
                        
                        {/* Video Thumbnail */}
                        {thumbnailUrl && videoCount > 0 ? (
                          <div className="relative w-full h-40 bg-gray-200 rounded-lg overflow-hidden mb-3">
                            <img 
                              src={thumbnailUrl} 
                              alt={lesson.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Hide image on error and show placeholder
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            {/* Play overlay */}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <div className="w-14 h-14 rounded-full bg-white group-hover:bg-brand-500 group-hover:scale-110 transition-all flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-gray-900 group-hover:text-white ml-1 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                              </div>
                            </div>
                            
                            {/* Content Icons - Overlaid on bottom of thumbnail */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-2">
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
                        ) : null}
                        
                        {/* Progress Bar with Stars and % */}
                        {videoCount > 0 && totalMax > 0 && isReleased && (
                          <div className="mb-4 bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500 text-base">{'★'.repeat(Math.round(overallProgress / 20))}</span>
                                <span className="text-gray-300 text-base">{'★'.repeat(5 - Math.round(overallProgress / 20))}</span>
                              </div>
                              <span className="text-gray-900 font-bold text-sm">{Math.round(overallProgress)}% ({remainingMinutes}min restantes)</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                                style={{ width: `${overallProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}