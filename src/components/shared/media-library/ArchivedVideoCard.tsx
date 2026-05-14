'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { getBunnyThumbnailUrl, getBunnyEmbedUrl } from '@/lib/bunny-stream';
import type { ArchivedVideoItem } from './types';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Props {
  video: ArchivedVideoItem;
  canDelete: boolean;
  onDelete: (id: string) => void;
  onUnarchive?: (id: string) => Promise<boolean>;
}

export function ArchivedVideoCard({ video, canDelete, onDelete, onUnarchive }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [unarchiving, setUnarchiving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showStreamPlayer, setShowStreamPlayer] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [imgError, setImgError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const bunnyGuid =
    video.mimeType === 'video/stream' && video.storageKey.startsWith('bunnystream:')
      ? video.storageKey.replace('bunnystream:', '')
      : null;
  const thumbnailUrl = bunnyGuid ? getBunnyThumbnailUrl(bunnyGuid) : null;

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handlePreview = async () => {
    if (bunnyGuid) { setShowStreamPlayer(true); return; }
    if (loadingPreview) return;
    setLoadingPreview(true);
    try {
      const res = await apiClient(`/bunny/archive/${video.id}/download`);
      if (!res.ok) throw new Error('Failed to load preview');
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) { console.error(e); } finally { setLoadingPreview(false); }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setShowStreamPlayer(false);
  };

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar "${video.title}"? Esta acción no se puede deshacer.`)) onDelete(video.id);
  };

  const handleUnarchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUnarchive) return;
    setUnarchiving(true);
    const ok = await onUnarchive(video.id);
    if (!ok) alert('No se pudo restaurar el video. Es posible que la lección original ya no exista.');
    setUnarchiving(false);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await apiClient(`/bunny/archive/${video.id}/download`);
      if (!res.ok) throw new Error('Download failed');
      if (bunnyGuid) {
        window.open(res.url, '_blank');
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = video.fileName; a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) { console.error(e); } finally { setDownloading(false); }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
      <div role="button" tabIndex={0} onClick={handlePreview}
        onKeyDown={(e) => { if (e.key === 'Enter') handlePreview(); }}
        className="relative w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center cursor-pointer"
      >
        {thumbnailUrl && !imgError && (
          <Image src={thumbnailUrl} alt={video.title} fill className="object-cover" unoptimized onError={() => setImgError(true)} />
        )}
        {/* Buttons top-right: delete → download → restore */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 z-20">
          {canDelete && (
            <button onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-red-600 text-white transition-colors"
              title="Eliminar">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} disabled={downloading}
            className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors disabled:opacity-50"
            title="Descargar">
            {downloading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </button>
          {onUnarchive && (video.lessonId || video.liveStreamId) && (
            <button onClick={handleUnarchive} disabled={unarchiving}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-brand-600 text-white transition-colors disabled:opacity-50"
              title="Restaurar">
              {unarchiving ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              )}
            </button>
          )}
        </div>
        {video.className && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded font-medium truncate max-w-[calc(100%-3rem)] z-10">
            {video.className}
          </div>
        )}
        {loadingPreview ? (
          <svg className="w-10 h-10 text-white/60 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors z-10">
            <svg className="w-6 h-6 text-white/80 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        {video.durationSeconds ? (
          <div className="absolute bottom-2 right-2 text-xs text-white/70 bg-black/40 px-1.5 py-0.5 rounded z-10">
            {Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, '0')}
          </div>
        ) : null}
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={closePreview}>
          <div className="relative w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={closePreview} className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cerrar
            </button>
            <p className="text-white/80 text-sm mb-2 truncate">{video.title}</p>
            <video ref={videoRef} src={previewUrl} controls autoPlay className="w-full rounded-xl max-h-[75vh]" />
          </div>
        </div>
      )}

      {showStreamPlayer && bunnyGuid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={closePreview}>
          <div className="relative w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/80 text-sm truncate flex-1">{video.title}</p>
              <button onClick={closePreview} className="ml-4 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-sm flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cerrar
              </button>
            </div>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe src={`${getBunnyEmbedUrl(bunnyGuid)}?autoplay=true`}
                className="absolute inset-0 w-full h-full rounded-xl"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen />
            </div>
          </div>
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 truncate" title={video.title}>{video.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{video.className || '—'}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>{formatDate(video.createdAt)}</span>
          {video.fileSize ? <span>{formatBytes(video.fileSize)}</span> : null}
        </div>
      </div>
    </div>
  );
}
