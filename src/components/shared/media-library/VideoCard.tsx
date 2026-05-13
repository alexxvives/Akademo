'use client';

import { useState } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { getBunnyThumbnailUrl, getBunnyEmbedUrl, getBunnyDownloadUrl } from '@/lib/bunny-stream';
import { formatDuration, formatDate, formatBytes } from '@/lib/formatters';
import type { VideoItem } from './types';

function VideoPlayerModal({ video, onClose }: { video: VideoItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      <div className="relative w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-white/80 text-sm truncate flex-1">{video.title}</p>
          <button
            onClick={onClose}
            className="ml-4 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-sm flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cerrar
          </button>
        </div>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`${getBunnyEmbedUrl(video.bunnyGuid)}?autoplay=true`}
            className="absolute inset-0 w-full h-full rounded-xl"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
        {video.className && (
          <p className="text-white/50 text-xs mt-2">{video.className}{video.lessonTitle ? ` · ${video.lessonTitle}` : ''}</p>
        )}
      </div>
    </div>
  );
}

export function VideoCard({ video, onArchive, onDelete }: { video: VideoItem; onArchive?: (videoId: string) => void; onDelete?: (videoId: string) => void }) {
  const [imgError, setImgError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;
    if (!window.confirm(`¿Eliminar permanentemente "${video.title}"? Esta acción no se puede deshacer y borrará el video de Bunny Stream.`)) return;
    setDeleting(true);
    try {
      const res = await apiClient(`/bunny/videos/${video.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete?.(video.id);
      } else {
        const data = await res.json() as { error?: string };
        alert(data.error || 'Error al eliminar el video');
      }
    } catch {
      alert('Error al eliminar el video');
    } finally {
      setDeleting(false);
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (archiving) return;
    if (!window.confirm(`¿Archivar "${video.title}"? El video se moverá a Archivados y ya no estará visible en la clase.`)) return;
    setArchiving(true);
    try {
      const res = await apiClient(`/bunny/videos/${video.id}/archive`, { method: 'POST' });
      if (res.ok) {
        onArchive?.(video.id);
      } else {
        const data = await res.json() as { error?: string };
        alert(data.error || 'Error al archivar el video');
      }
    } catch {
      alert('Error al archivar el video');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <>
    {showPlayer && <VideoPlayerModal video={video} onClose={() => setShowPlayer(false)} />}
    <div
      role="button"
      tabIndex={0}
      onClick={() => { if (video.bunnyGuid) setShowPlayer(true); }}
      onKeyDown={(e) => { if (e.key === 'Enter' && video.bunnyGuid) setShowPlayer(true); }}
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
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
            {onArchive && (
              <button
                title={archiving ? 'Archivando...' : 'Mover a Archivados'}
                onClick={handleArchive}
                disabled={archiving}
                className="p-1.5 rounded-lg bg-black/50 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
              >
                {archiving ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                )}
              </button>
            )}
            <button
              title={downloading ? 'Descargando...' : 'Descargar video'}
              onClick={handleDownload}
              disabled={downloading}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
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
            {onDelete && (
              <button
                title={deleting ? 'Eliminando...' : 'Eliminar video'}
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-lg bg-black/50 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
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
    </>
  );
}
