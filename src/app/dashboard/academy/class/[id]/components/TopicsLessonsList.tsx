'use client';

import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { getBunnyThumbnailUrl } from '@/lib/bunny-stream';
import { apiClient } from '@/lib/api-client';

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
  studentsAccessed?: number;
  avgProgress?: number;
  avgRating?: number;
  ratingCount?: number;
  firstVideoBunnyGuid?: string;
  firstVideoUpload?: { bunnyGuid?: string };
  isTranscoding?: number;
  isUploading?: boolean;
  uploadProgress?: number;
}

interface Topic {
  id: string;
  name: string;
  classId: string;
  orderIndex: number;
  lessonCount: number;
}

interface TopicsLessonsListProps {
  lessons: Lesson[];
  topics: Topic[];
  classId: string;
  totalStudents: number;
  expandTopicId?: string | null;
  paymentStatus?: string;
  onSelectLesson: (lesson: Lesson) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onRescheduleLesson: (lesson: Lesson) => void;
  onTopicsChange: () => void;
  onLessonMove: (lessonId: string, topicId: string | null) => void;
  onToggleRelease: (lesson: Lesson) => void;
}

export default function TopicsLessonsList({
  lessons,
  topics,
  classId,
  totalStudents,
  expandTopicId,
  paymentStatus,
  onSelectLesson,
  onEditLesson,
  onDeleteLesson,
  onRescheduleLesson,
  onTopicsChange,
  onLessonMove,
  onToggleRelease,
}: TopicsLessonsListProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [draggedLesson, setDraggedLesson] = useState<string | null>(null);
  const [dragOverTopic, setDragOverTopic] = useState<string | null>(null);
  const [showNewTopicInput, setShowNewTopicInput] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  
  // Auto-expand topic when expandTopicId prop changes
  useEffect(() => {
    if (expandTopicId) {
      setExpandedTopics(prev => {
        const newSet = new Set(prev);
        newSet.add(expandTopicId);
        return newSet;
      });
    }
  }, [expandTopicId]);
  
  // Student time management modal
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedLessonForTime, setSelectedLessonForTime] = useState<Lesson | null>(null);
  const [isLoadingStudentTimes, setIsLoadingStudentTimes] = useState(false);
  const [studentTimesData, setStudentTimesData] = useState<Array<{
    studentId: string;
    studentName: string;
    videos: Array<{
      videoId: string;
      videoTitle: string;
      totalWatchTimeSeconds: number;
      maxWatchTimeSeconds: number;
      status: string;
    }>;
  }>>([]);

  // Auto-scroll while dragging near edges
  const handleDragScroll = useCallback((clientY: number) => {
    const container = scrollContainerRef.current;
    if (!container || !draggedLesson) return;

    const rect = container.getBoundingClientRect();
    const scrollThreshold = 80; // pixels from edge to start scrolling
    const maxScrollSpeed = 15; // pixels per frame

    // Calculate distance from edges
    const distanceFromTop = clientY - rect.top;
    const distanceFromBottom = rect.bottom - clientY;

    let scrollAmount = 0;

    if (distanceFromTop < scrollThreshold && distanceFromTop > 0) {
      // Scroll up - speed increases as you get closer to edge
      scrollAmount = -maxScrollSpeed * (1 - distanceFromTop / scrollThreshold);
    } else if (distanceFromBottom < scrollThreshold && distanceFromBottom > 0) {
      // Scroll down - speed increases as you get closer to edge
      scrollAmount = maxScrollSpeed * (1 - distanceFromBottom / scrollThreshold);
    }

    if (scrollAmount !== 0) {
      container.scrollTop += scrollAmount;
    }
  }, [draggedLesson]);

  // Global drag handler for auto-scroll
  useEffect(() => {
    if (!draggedLesson) {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
      return;
    }

    let lastClientY = 0;

    const handleDragOver = (e: globalThis.DragEvent) => {
      lastClientY = e.clientY;
    };

    const animate = () => {
      handleDragScroll(lastClientY);
      scrollAnimationRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener('dragover', handleDragOver);
    scrollAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, [draggedLesson, handleDragScroll]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const formatted = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    const parts = formatted.split(' de ');
    if (parts.length === 2) {
      const month = parts[1];
      return `${parts[0]} de ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
    }
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const isReleased = (d: string) => new Date(d) <= new Date();

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  // Group lessons by topic
  const lessonsByTopic = new Map<string | null, Lesson[]>();
  lessons.forEach(lesson => {
    const key = lesson.topicId || null;
    if (!lessonsByTopic.has(key)) {
      lessonsByTopic.set(key, []);
    }
    lessonsByTopic.get(key)!.push(lesson);
  });

  // Drag handlers
  const handleDragStart = (e: DragEvent, lessonId: string) => {
    setDraggedLesson(lessonId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedLesson(null);
    setDragOverTopic(null);
  };

  const handleDragOver = (e: DragEvent, topicId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTopic(topicId === null ? 'uncategorized' : topicId);
  };

  const handleDrop = async (e: DragEvent, topicId: string | null) => {
    e.preventDefault();
    if (draggedLesson) {
      onLessonMove(draggedLesson, topicId);
    }
    setDraggedLesson(null);
    setDragOverTopic(null);
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return;
    setCreatingTopic(true);
    try {
      const res = await apiClient('/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, name: newTopicName.trim() }),
      });
      if (res.ok) {
        setNewTopicName('');
        setShowNewTopicInput(false);
        onTopicsChange();
      }
    } catch (error) {
      console.error('Failed to create topic:', error);
    }
    setCreatingTopic(false);
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('¿Eliminar este tema? Las Clases se moverán a "Sin tema".')) return;
    try {
      const res = await apiClient(`/topics/${topicId}`, { method: 'DELETE' });
      if (res.ok) {
        onTopicsChange();
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
    }
  };
  
  const handleManageStudentTimes = async (lesson: Lesson) => {
    setSelectedLessonForTime(lesson);
    setShowTimeModal(true);
    setIsLoadingStudentTimes(true);
    setStudentTimesData([]);
    
    try {
      // If demo academy, load demo data
      if (paymentStatus === 'NOT PAID') {
        const { generateDemoStudentTimes } = await import('@/lib/demo-data');
        const demoData = generateDemoStudentTimes(lesson.id);
        setStudentTimesData(demoData);
        setIsLoadingStudentTimes(false);
        return;
      }
      
      // For real academies, fetch from API
      const res = await apiClient(`/videos/student-times?lessonId=${lesson.id}`);
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
        // Reload data
        if (selectedLessonForTime) {
          await handleManageStudentTimes(selectedLessonForTime);
        }
      } else {
        alert(result.error || 'Error al actualizar tiempo');
      }
    } catch (error) {
      console.error('Failed to update student time:', error);
      alert('Error al actualizar tiempo');
    }
  };

  const renderLessonCard = (lesson: Lesson) => {
    const videoCount = lesson.videoCount || 0;
    const docCount = lesson.documentCount || 0;
    const released = isReleased(lesson.releaseDate);

    return (
      <div
        key={lesson.id}
        draggable={!lesson.isUploading}
        onDragStart={(e) => handleDragStart(e, lesson.id)}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-action-buttons]')) return;
          if (!lesson.isUploading) onSelectLesson(lesson);
        }}
        className={`bg-[#1a1d29] rounded-xl overflow-hidden transition-all duration-300 group border border-gray-700 shadow-sm ${
          lesson.isUploading
            ? 'cursor-default'
            : 'hover:border-accent-500 hover:shadow-xl hover:shadow-accent-500/20 cursor-pointer hover:scale-[1.03]'
        } ${draggedLesson === lesson.id ? 'opacity-50' : ''} ${!released ? 'opacity-70 grayscale sepia-[.2]' : ''}`}
      >
        <div className="flex flex-col h-full">
          {/* Header with Title and Action Buttons */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-white line-clamp-2 flex-1">
                {lesson.title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex gap-1.5" data-action-buttons>
                  {/* Student times management button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManageStudentTimes(lesson);
                    }}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 hover:scale-105 transition-all border border-blue-500/30"
                    title="Gestionar tiempos de estudiantes"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {/* Reschedule button for all lessons */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (paymentStatus !== 'NOT PAID') onRescheduleLesson(lesson);
                    }}
                    disabled={paymentStatus === 'NOT PAID'}
                    className="p-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 hover:scale-105 transition-all border border-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={paymentStatus === 'NOT PAID' ? 'Active su academia para reprogramar lecciones' : 'Reprogramar'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!lesson.isUploading && paymentStatus !== 'NOT PAID') onEditLesson(lesson);
                    }}
                    disabled={lesson.isUploading || paymentStatus === 'NOT PAID'}
                    className="p-2 bg-accent-500/20 text-accent-400 rounded-lg hover:bg-accent-500/30 hover:scale-105 transition-all border border-accent-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={paymentStatus === 'NOT PAID' ? 'Active su academia para editar lecciones' : 'Editar lección'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!lesson.isUploading && paymentStatus !== 'NOT PAID') onDeleteLesson(lesson.id);
                    }}
                    disabled={lesson.isUploading || paymentStatus === 'NOT PAID'}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 hover:scale-105 transition-all border border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={paymentStatus === 'NOT PAID' ? 'Active su academia para eliminar lecciones' : 'Eliminar lección'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="relative" style={{ height: '160px' }}>
            {(lesson.firstVideoBunnyGuid || lesson.firstVideoUpload?.bunnyGuid) ? (
              <>
                <img
                  src={getBunnyThumbnailUrl(lesson.firstVideoBunnyGuid || lesson.firstVideoUpload?.bunnyGuid || '')}
                  alt={lesson.title}
                  className={`w-full h-full object-cover ${lesson.isUploading || lesson.isTranscoding ? 'opacity-50' : ''}`}
                />
                {(lesson.isUploading || lesson.isTranscoding) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                    <div className="w-8 h-8 border-3 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mb-2" />
                    <span className="text-sm font-medium text-white">
                      {lesson.isUploading ? 'Subiendo...' : 'Transcodificando...'}
                    </span>
                  </div>
                )}
                {/* Date Badge - Top Left */}
                {released && (
                  <div className={`absolute top-2 left-2 z-10 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-lg border border-gray-300/50 bg-white/90 text-gray-900`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{formatDate(lesson.releaseDate)}</span>
                  </div>
                )}
                
                {/* Visibility Toggle - Top Right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRelease(lesson);
                  }}
                  className={`absolute top-2 right-2 z-10 p-1.5 rounded-lg backdrop-blur-sm shadow-lg transition-all border ${
                    released
                      ? 'bg-white/90 text-gray-900 border-gray-300' 
                      : 'bg-gray-800/90 text-gray-400 border-gray-700'
                  }`}
                  title={released ? "Visible: Click para ocultar" : "Oculto: Click para publicar"}
                >
                  {released ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
                {!lesson.isUploading && !lesson.isTranscoding && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center relative">
                {/* Date Badge for document-only lessons */}
                {released && (
                  <div className={`absolute top-2 left-2 z-10 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-lg border border-gray-300/50 bg-white/90 text-gray-900`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{formatDate(lesson.releaseDate)}</span>
                  </div>
                )}
                <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
            )}
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

          {/* Card Body */}
          <div className="p-4">
            {!lesson.isUploading && !lesson.isTranscoding && (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500 text-base">{'★'.repeat(Math.round(lesson.avgRating || 0))}</span>
                    <span className="text-gray-600 text-base">{'★'.repeat(5 - Math.round(lesson.avgRating || 0))}</span>
                    {lesson.ratingCount !== undefined && lesson.ratingCount > 0 && (
                      <span className="text-xs text-gray-400 ml-1">({lesson.ratingCount})</span>
                    )}
                  </div>
                  <span className="text-gray-300 font-bold text-sm">
                    {lesson.studentsAccessed || 0}/{totalStudents} estudiantes
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${totalStudents > 0 ? Math.min(100, ((lesson.studentsAccessed || 0) / totalStudents) * 100) : 0}%`,
                      background: totalStudents > 0 && ((lesson.studentsAccessed || 0) / totalStudents) >= 0.75
                        ? 'linear-gradient(to right, #15803d, #166534)'
                        : totalStudents > 0 && ((lesson.studentsAccessed || 0) / totalStudents) >= 0.50
                        ? 'linear-gradient(to right, #22c55e, #15803d)'
                        : totalStudents > 0 && ((lesson.studentsAccessed || 0) / totalStudents) >= 0.25
                        ? 'linear-gradient(to right, #eab308, #22c55e)'
                        : 'linear-gradient(to right, #ef4444, #eab308)',
                    }}
                  />
                </div>
              </>
            )}
            {lesson.isUploading && (
              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                <div className="flex items-center justify-between text-sm text-blue-400 mb-2">
                  <span className="font-medium flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    Subiendo...
                  </span>
                  <span className="font-bold">{Math.round(lesson.uploadProgress || 0)}%</span>
                </div>
                <div className="h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${lesson.uploadProgress || 0}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTopicSection = (topicId: string | null, topicName: string, topicLessons: Lesson[]) => {
    const isExpanded = expandedTopics.has(topicId || 'uncategorized');
    const isDragOver = dragOverTopic === (topicId || 'uncategorized');

    return (
      <div
        key={topicId || 'uncategorized'}
        className={`rounded-xl border-2 transition-all duration-200 ${
          isDragOver 
            ? 'border-accent-500 bg-accent-500/10 shadow-lg shadow-accent-500/10' 
            : 'border-slate-600/40'
        }`}
        onDragOver={(e) => handleDragOver(e, topicId)}
        onDrop={(e) => handleDrop(e, topicId)}
      >
        {/* Topic Header */}
        <div
          className="flex items-center justify-between px-4 py-3.5 cursor-pointer rounded-t-xl transition-colors"
          onClick={() => toggleTopic(topicId || 'uncategorized')}
        >
          <div className="flex items-center gap-3">
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-semibold text-gray-900">{topicName}</span>
            <span className="text-xs text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full font-medium">
              {topicLessons.length} {topicLessons.length === 1 ? 'lección' : 'Clases'}
            </span>
          </div>
          {topicId && (
            <div className="flex items-center gap-1">
              {/* Hide All Button - Hides all currently released lessons in this topic */}
              <div className="relative group/hidetopic">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!confirm('¿Ocultar todas las Clases visibles de este tema?')) return;
                    topicLessons.filter(l => isReleased(l.releaseDate)).forEach(l => onToggleRelease(l));
                  }}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
                {/* Tooltip */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/hidetopic:opacity-100 group-hover/hidetopic:visible transition-all duration-200 whitespace-nowrap z-20">
                  <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45"></div>
                  Ocultar todas las Clases de este tema
                </div>
              </div>
              
              <div className="relative group/delete">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTopic(topicId);
                }}
                className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/15 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              {/* Tooltip - positioned to the left */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/delete:opacity-100 group-hover/delete:visible transition-all duration-200 whitespace-nowrap z-20">
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45"></div>
                Las Clases se moverán a "Sin tema"
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Lessons Grid */}
        {isExpanded && (
          <div className="px-4 pb-4">
            {topicLessons.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-500/40 rounded-lg">
                <svg className="w-8 h-8 mx-auto mb-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <p>Arrastra Clases aquí</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
                {topicLessons.map(renderLessonCard)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Clases</h2>
          {/* Global Hide/Show All Button */}
          <div className="relative group/hideall">
            <button
              onClick={() => {
                if (!confirm('¿Ocultar todas las Clases visibles de todas las clases?')) return;
                lessons.filter(l => isReleased(l.releaseDate)).forEach(l => onToggleRelease(l));
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
            {/* Tooltip */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/hideall:opacity-100 group-hover/hideall:visible transition-all duration-200 whitespace-nowrap z-20">
              <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
              Ocultar todas las Clases visibles
            </div>
          </div>
        </div>
        {showNewTopicInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="Nombre del tema"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
              autoFocus
            />
            <button
              onClick={handleCreateTopic}
              disabled={creatingTopic || !newTopicName.trim()}
              className="px-4 py-2 bg-accent-600 text-white rounded-lg text-sm font-medium hover:bg-accent-700 disabled:opacity-50"
            >
              {creatingTopic ? 'Creando...' : 'Crear'}
            </button>
            <button
              onClick={() => { setShowNewTopicInput(false); setNewTopicName(''); }}
              className="px-3 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewTopicInput(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Tema
          </button>
        )}
      </div>

      {lessons.length === 0 && topics.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Aún no hay Clases</h3>
          <p className="text-gray-500 text-sm">Crea tu primera lección para comenzar</p>
        </div>
      ) : (
        <div ref={scrollContainerRef} className="max-h-[700px] overflow-y-auto space-y-3 scroll-smooth py-2">
          {/* Render topics in order */}
          {topics.map(topic => renderTopicSection(topic.id, topic.name, lessonsByTopic.get(topic.id) || []))}
          
          {/* Render uncategorized lessons */}
          {renderTopicSection(null, 'Sin tema', lessonsByTopic.get(null) || [])}
        </div>
      )}
      
      {/* Student Time Management Modal */}
      {showTimeModal && selectedLessonForTime && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Gestionar tiempos de estudiantes</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedLessonForTime.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowTimeModal(false);
                    setSelectedLessonForTime(null);
                    setStudentTimesData([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingStudentTimes ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-4 text-gray-600">Cargando datos de estudiantes...</p>
                </div>
              ) : studentTimesData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No hay datos de estudiantes para esta lección</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {studentTimesData.map((studentData) => (
                    <div key={studentData.studentId} className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">{studentData.studentName}</h4>
                      
                      {studentData.videos.length === 0 ? (
                        <p className="text-sm text-gray-500">No ha visto ningún video aún</p>
                      ) : (
                        <div className="space-y-3">
                          {studentData.videos.map((video, videoIndex) => (
                            <div key={video.videoId} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                  <p className="font-medium text-gray-900 text-sm">Video {videoIndex + 1}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-600">
                                      Tiempo usado: {Math.floor(video.totalWatchTimeSeconds / 60)}:{String(Math.floor(video.totalWatchTimeSeconds % 60)).padStart(2, '0')}
                                    </span>
                                    <span className="text-xs text-gray-400">/</span>
                                    <span className="text-xs text-gray-600">
                                      Máximo: {Math.floor(video.maxWatchTimeSeconds / 60)}:{String(Math.floor(video.maxWatchTimeSeconds % 60)).padStart(2, '0')}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      video.status === 'BLOCKED' 
                                        ? 'bg-red-100 text-red-700' 
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                      {video.status === 'BLOCKED' ? 'Bloqueado' : 'Activo'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                  <button
                                    onClick={() => handleUpdateStudentTime(studentData.studentId, video.videoId, 0)}
                                    disabled={paymentStatus === 'NOT PAID'}
                                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={paymentStatus === 'NOT PAID' ? 'Active su academia para modificar tiempos' : 'Reiniciar completamente'}
                                  >
                                    Reiniciar
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newTime = Math.max(0, video.totalWatchTimeSeconds - 900);
                                      handleUpdateStudentTime(studentData.studentId, video.videoId, newTime);
                                    }}
                                    disabled={paymentStatus === 'NOT PAID'}
                                    className="px-2 py-1 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={paymentStatus === 'NOT PAID' ? 'Active su academia para modificar tiempos' : 'Reducir 15 minutos'}
                                  >
                                    +15min
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newTime = Math.max(0, video.totalWatchTimeSeconds - 1800);
                                      handleUpdateStudentTime(studentData.studentId, video.videoId, newTime);
                                    }}
                                    disabled={paymentStatus === 'NOT PAID'}
                                    className="px-2 py-1 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={paymentStatus === 'NOT PAID' ? 'Active su academia para modificar tiempos' : 'Reducir 30 minutos'}
                                  >
                                    +30min
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newTime = Math.max(0, video.totalWatchTimeSeconds - 3600);
                                      handleUpdateStudentTime(studentData.studentId, video.videoId, newTime);
                                    }}
                                    disabled={paymentStatus === 'NOT PAID'}
                                    className="px-2 py-1 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={paymentStatus === 'NOT PAID' ? 'Active su academia para modificar tiempos' : 'Reducir 1 hora'}
                                  >
                                    +1hr
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowTimeModal(false);
                  setSelectedLessonForTime(null);
                  setStudentTimesData([]);
                }}
                className="w-full px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
