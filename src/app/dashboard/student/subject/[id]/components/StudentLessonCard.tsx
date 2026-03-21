'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getBunnyThumbnailUrl } from '@/lib/bunny-stream';
import type { LessonCardProps, Video } from './StudentTopicsLessonsTypes';

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

export default function StudentLessonCard({ lesson, onSelectLesson }: LessonCardProps) {
  const [thumbnailError, setThumbnailError] = useState(false);

  const released = isReleased(lesson.releaseDate);
  const videoCount = lesson.videoCount ?? lesson.videos?.length ?? 0;
  const docCount = lesson.documentCount ?? lesson.documents?.length ?? 0;

  let totalWatched = 0;
  let totalMax = 0;

  if (typeof lesson.totalVideoDuration === 'number') {
    totalMax = lesson.totalVideoDuration * lesson.maxWatchTimeMultiplier;
    totalWatched = lesson.totalWatchedSeconds || 0;
  } else if (lesson.videos && lesson.videos.length > 0) {
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

  let thumbnailUrl: string | null = null;
  const bunnyGuid = lesson.firstVideoBunnyGuid || lesson.videos?.[0]?.upload?.bunnyGuid;
  if (bunnyGuid) {
    try {
      thumbnailUrl = getBunnyThumbnailUrl(bunnyGuid);
      if (!thumbnailUrl.includes('b-cdn.net')) {
        thumbnailUrl = null;
      }
    } catch {
      thumbnailUrl = null;
    }
  }

  return (
    <div
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
              {thumbnailError ? (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
              ) : (
                <Image
                  src={thumbnailUrl}
                  alt={lesson.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  unoptimized
                  className="object-cover"
                  onError={() => setThumbnailError(true)}
                />
              )}
              {/* Transcoding Badge */}
              {lesson.isTranscoding === 1 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="bg-amber-500/90 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm border border-amber-400/50">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>TRANSCODIFICANDO</span>
                    </div>
                    <p className="text-xs mt-1 text-center opacity-90">Procesando video...</p>
                  </div>
                </div>
              )}
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

        {/* Card Body - Progress or PROXIMAMENTE */}
        <div className="p-4">
          {!released ? (
            <div className="flex items-center justify-center py-2">
              <div className="border-2 border-white/40 rounded-lg px-4 py-2">
                <span className="text-white font-bold text-lg tracking-wide">PRÓXIMAMENTE</span>
              </div>
            </div>
          ) : (
            videoCount > 0 && (
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
            )
          )}
        </div>
      </div>
    </div>
  );
}
