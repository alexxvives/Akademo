'use client';

import Image from 'next/image';
import { getBunnyThumbnailUrl } from '@/lib/bunny-stream';
import { formatDateWithMonth, formatDateTimeWithMonth, parseD1Date } from '@/lib/formatters';
import type { Lesson } from './types';

interface LessonCardThumbnailProps {
  lesson: Lesson;
  released: boolean;
  onToggleRelease: (lesson: Lesson) => void;
}

export function LessonCardThumbnail({ lesson, released, onToggleRelease }: LessonCardThumbnailProps) {
  const videoCount = lesson.videoCount || 0;
  const docCount = lesson.documentCount || 0;
  const assignmentCount = lesson.assignmentCount || 0;
  const linkCount = lesson.linkCount || 0;
  const bunnyGuid = lesson.firstVideoBunnyGuid || lesson.firstVideoUpload?.bunnyGuid;

  const isSentinelDate = parseD1Date(lesson.releaseDate).getFullYear() >= 2099;

  const DateBadge = () => {
    if (!lesson.releaseDate) return null;
    if (!released) {
      if (isSentinelDate) return null;
      return (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-lg border border-violet-400/50 bg-violet-900/80 text-violet-200">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">{formatDateTimeWithMonth(lesson.releaseDate)}</span>
        </div>
      );
    }
    return (
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-lg border border-gray-300/50 bg-white/90 text-gray-900">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="font-medium">{formatDateWithMonth(lesson.releaseDate)}</span>
      </div>
    );
  };

  return (
    <div className="relative" style={{ height: '160px' }}>
      {bunnyGuid ? (
        <>
          {lesson.isTranscoding ? (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center">
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-white/30 border-t-purple-400 mb-2" />
              <span className="text-sm font-medium text-white">Transcodificando...</span>
            </div>
          ) : lesson.isUploading ? (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center">
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-white/30 border-t-purple-400 mb-2" />
              <span className="text-sm font-medium text-white">Subiendo...</span>
            </div>
          ) : (
            <Image
              src={`${getBunnyThumbnailUrl(bunnyGuid)}?t=${lesson.isTranscoding || 0}`}
              alt={lesson.title}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              unoptimized
              className="object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <DateBadge />
          <button
            onClick={(e) => { e.stopPropagation(); onToggleRelease(lesson); }}
            className={`absolute top-2 right-2 z-10 p-1.5 rounded-lg backdrop-blur-sm shadow-lg transition-all border ${
              released ? 'bg-white/90 text-gray-900 border-gray-300' : 'bg-gray-800/90 text-gray-400 border-gray-700'
            }`}
            title={released ? 'Visible: Click para ocultar' : 'Oculto: Click para publicar'}
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
          <DateBadge />
          <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleRelease(lesson); }}
            className={`absolute top-2 right-2 z-10 p-1.5 rounded-lg backdrop-blur-sm shadow-lg transition-all border ${
              released ? 'bg-white/90 text-gray-900 border-gray-300' : 'bg-gray-800/90 text-gray-400 border-gray-700'
            }`}
            title={released ? 'Visible: Click para ocultar' : 'Oculto: Click para publicar'}
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
            <div className="flex items-center gap-1.5 bg-red-500/90 px-2.5 py-1 rounded-lg border border-red-400/50">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <span className="text-white font-bold text-xs">{docCount}</span>
            </div>
          )}
          {linkCount > 0 && (
            <div className="flex items-center gap-1.5 bg-violet-500/90 px-2.5 py-1 rounded-lg border border-violet-400/50">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-white font-bold text-xs">{linkCount}</span>
            </div>
          )}
          {assignmentCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/90 px-2.5 py-1 rounded-lg border border-amber-400/50">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-white font-bold text-xs">{assignmentCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
