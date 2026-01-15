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
  onSelectLesson: (lesson: Lesson) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onRescheduleLesson: (lesson: Lesson) => void;
  onTopicsChange: () => void;
  onLessonMove: (lessonId: string, topicId: string | null) => void;
}

export default function TopicsLessonsList({
  lessons,
  topics,
  classId,
  totalStudents,
  onSelectLesson,
  onEditLesson,
  onDeleteLesson,
  onRescheduleLesson,
  onTopicsChange,
  onLessonMove,
}: TopicsLessonsListProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [draggedLesson, setDraggedLesson] = useState<string | null>(null);
  const [dragOverTopic, setDragOverTopic] = useState<string | null>(null);
  const [showNewTopicInput, setShowNewTopicInput] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);

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
    if (!confirm('¿Eliminar este tema? Las lecciones se moverán a "Sin tema".')) return;
    try {
      const res = await apiClient(`/topics/${topicId}`, { method: 'DELETE' });
      if (res.ok) {
        onTopicsChange();
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
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
        } ${draggedLesson === lesson.id ? 'opacity-50' : ''}`}
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
                  {/* Reschedule button for unreleased lessons */}
                  {!released && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRescheduleLesson(lesson);
                      }}
                      className="p-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 hover:scale-105 transition-all border border-violet-500/30"
                      title="Reprogramar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!lesson.isUploading) onEditLesson(lesson);
                    }}
                    disabled={lesson.isUploading}
                    className="p-2 bg-accent-500/20 text-accent-400 rounded-lg hover:bg-accent-500/30 hover:scale-105 transition-all border border-accent-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Editar lección"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!lesson.isUploading) onDeleteLesson(lesson.id);
                    }}
                    disabled={lesson.isUploading}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 hover:scale-105 transition-all border border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Eliminar lección"
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
                <div className={`absolute top-2 right-2 z-10 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-lg ${
                  released
                    ? 'bg-gray-100/90 text-gray-600 border border-gray-300/50'
                    : 'bg-emerald-500/90 text-white border border-emerald-400/50'
                }`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{formatDate(lesson.releaseDate)}</span>
                </div>
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
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
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
            {!lesson.isUploading && !lesson.isTranscoding && released && (
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
              {topicLessons.length} {topicLessons.length === 1 ? 'lección' : 'lecciones'}
            </span>
          </div>
          {topicId && (
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
                Las lecciones se moverán a "Sin tema"
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
                <p>Arrastra lecciones aquí</p>
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
        <h2 className="text-lg font-semibold text-gray-900">Lecciones</h2>
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
          <h3 className="text-base font-semibold text-gray-900 mb-1">Aún no hay lecciones</h3>
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
    </div>
  );
}
