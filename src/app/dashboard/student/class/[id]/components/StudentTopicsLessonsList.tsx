'use client';

import { useState } from 'react';
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

interface StudentTopicsLessonsListProps {
  lessons: Lesson[];
  topics: Topic[];
  onSelectLesson: (lesson: Lesson) => void;
}

export default function StudentTopicsLessonsList({
  lessons,
  topics,
  onSelectLesson,
}: StudentTopicsLessonsListProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(
    new Set() // Start with all topics collapsed
  );

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

  const renderLessonCard = (lesson: Lesson) => {
    const released = isReleased(lesson.releaseDate);
    // Use API-provided counts or fallback to array length
    const videoCount = lesson.videoCount ?? lesson.videos?.length ?? 0;
    const docCount = lesson.documentCount ?? lesson.documents?.length ?? 0;

    // Calculate combined progress for all videos (only if video data is loaded)
    let totalWatched = 0;
    let totalMax = 0;
    
    // Check if we have pre-calculated progress from API (list view optimization)
    if (typeof lesson.totalVideoDuration === 'number') {
      totalMax = lesson.totalVideoDuration * lesson.maxWatchTimeMultiplier;
      totalWatched = lesson.totalWatchedSeconds || 0;
    } 
    // Fallback to detailed video calculation if videos array exists
    else if (lesson.videos && lesson.videos.length > 0) {
      lesson.videos.forEach((video: Video) => {
        const playState = video.playStates?.[0];
        const watchedSeconds = playState?.totalWatchTimeSeconds || 0;
        const videoDuration = video.durationSeconds || 0;
        if (videoDuration > 0) {
          totalWatched += watchedSeconds;
          totalMax += videoDuration * lesson.maxWatchTimeMultiplier;
        }
      });
    }
    
    const overallProgress = totalMax > 0 ? Math.min(100, (totalWatched / totalMax) * 100) : 0;
    const remainingMinutes = totalMax > 0 ? Math.ceil((totalMax - totalWatched) / 60) : 0;

    // Get thumbnail from API field or first video
    let thumbnailUrl = null;
    const bunnyGuid = lesson.firstVideoBunnyGuid || lesson.videos?.[0]?.upload?.bunnyGuid;
    if (bunnyGuid) {
      try {
        thumbnailUrl = getBunnyThumbnailUrl(bunnyGuid);
        if (!thumbnailUrl.includes('b-cdn.net')) {
          thumbnailUrl = null;
        }
      } catch (e) {
        thumbnailUrl = null;
      }
    }

    return (
      <div
        key={lesson.id}
        onClick={() => released && onSelectLesson(lesson)}
        className={`bg-[#1a1d29] rounded-xl overflow-hidden transition-all duration-300 group border border-gray-700 shadow-sm ${
          released
            ? 'hover:border-accent-500 hover:shadow-xl hover:shadow-accent-500/20 hover:scale-[1.03] cursor-pointer'
            : 'opacity-60 cursor-not-allowed'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with Title */}
          <div className="px-4 pt-4 pb-3 relative">
            {/* Status Badge */}
            {!released && (
              <span className="absolute top-3 right-3 px-2 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded border border-amber-500/30 z-10 shadow-sm">
                PRÓXIMAMENTE
              </span>
            )}
            
            <h3 
              className="text-lg font-bold text-white line-clamp-2"
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
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Date Badge - Top Right */}
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
                {/* Play Button Overlay */}
                {released && (
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
            {/* Content Badges */}
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

          {/* Card Body - Progress */}
          <div className="p-4">
            {released && videoCount > 0 && (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400 text-xs">Progreso</span>
                  <span className="text-gray-300 font-bold text-sm">
                    {Math.round(overallProgress)}%
                    {remainingMinutes > 0 && (
                      <span className="text-xs font-normal text-gray-500 ml-1">
                        ({remainingMinutes}m restantes)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-500 to-green-500 transition-all"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTopicSection = (topicId: string | null, topicName: string, topicLessons: Lesson[]) => {
    const isExpanded = expandedTopics.has(topicId || 'uncategorized');
    
    // Don't render empty topics for students
    if (topicLessons.length === 0) return null;

    return (
      <div
        key={topicId || 'uncategorized'}
        className="rounded-xl border-2 border-slate-600/40 transition-all duration-200"
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
        </div>

        {/* Lessons Grid */}
        {isExpanded && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
              {topicLessons.map(renderLessonCard)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Lecciones</h2>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Aún no hay lecciones</h3>
          <p className="text-gray-500 text-sm">El profesor aún no ha creado lecciones para esta clase.</p>
        </div>
      ) : (
        <div className="max-h-[700px] overflow-y-auto space-y-3 py-2">
          {/* Render topics in order */}
          {topics.map(topic => renderTopicSection(topic.id, topic.name, lessonsByTopic.get(topic.id) || []))}
          
          {/* Render uncategorized lessons */}
          {renderTopicSection(null, 'Sin tema', lessonsByTopic.get(null) || [])}
        </div>
      )}
    </div>
  );
}
