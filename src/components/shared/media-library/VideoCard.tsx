'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getBunnyThumbnailUrl, getBunnyEmbedUrl, getBunnyDownloadUrl } from '@/lib/bunny-stream';
import { formatDuration, formatDate, formatBytes } from '@/lib/formatters';
import type { VideoItem } from './types';

export function VideoCard({ video }: { video: VideoItem }) {
  const [imgError, setImgError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const thumbnailUrl = video.bunnyGuid ? getBunnyThumbnailUrl(video.bunnyGuid) : null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!video.bunnyGuid || downloading) return;
    setDownloading(true);
    try {
      const url = getBunnyDownloadUrl(video.bunnyGuid);
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${video.title || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab if fetch fails (e.g. CORS)
      window.open(getBunnyDownloadUrl(video.bunnyGuid), '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => { if (video.bunnyGuid) window.open(getBunnyEmbedUrl(video.bunnyGuid), '_blank'); }}
      onKeyDown={(e) => { if (e.key === 'Enter' && video.bunnyGuid) window.open(getBunnyEmbedUrl(video.bunnyGuid), '_blank'); }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        {thumbnailUrl && !imgError ? (
          <Image
            src={thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        {/* Duration badge */}
        {video.durationSeconds && video.durationSeconds > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(video.durationSeconds)}
          </span>
        )}
        {/* Source badge */}
        <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${
          video.source === 'recording'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {video.source === 'recording' ? 'Stream' : 'Clase'}
        </span>
        {/* Transcoding status */}
        {video.bunnyStatus !== null && video.bunnyStatus !== undefined && video.bunnyStatus < 3 && (
          <span className="absolute top-2 right-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
            Procesando...
          </span>
        )}
        {/* Download button overlay */}
        {video.bunnyGuid && video.bunnyStatus !== null && video.bunnyStatus >= 3 && (
          <button
            title={downloading ? 'Descargando...' : 'Descargar video'}
            onClick={handleDownload}
            disabled={downloading}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            {downloading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </button>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 truncate" title={video.title}>
              {video.title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {video.className}
              {video.lessonTitle && ` · ${video.lessonTitle}`}
            </p>
          </div>

        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>{formatDate(video.createdAt)}</span>
          {video.fileSize && <span>{formatBytes(video.fileSize)}</span>}
        </div>
      </div>
    </div>
  );
}
