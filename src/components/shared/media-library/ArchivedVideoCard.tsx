'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
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
}

export function ArchivedVideoCard({ video, canDelete, onDelete }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Revoke blob URL on unmount or when preview closes
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handlePreview = async () => {
    if (loadingPreview) return;
    setLoadingPreview(true);
    try {
      const res = await apiClient(`/bunny/archive/${video.id}/download`);
      if (!res.ok) throw new Error('Failed to load preview');
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar "${video.title}"? Esta acción no se puede deshacer.`)) {
      onDelete(video.id);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await apiClient(`/bunny/archive/${video.id}/download`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = video.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
      {/* Thumbnail area — click to preview */}
      <div
        role="button"
        tabIndex={0}
        onClick={handlePreview}
        onKeyDown={(e) => { if (e.key === 'Enter') handlePreview(); }}
        className="relative w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center cursor-pointer"
      >
        {video.className && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded font-medium truncate max-w-[calc(100%-3rem)] z-10">
            {video.className}
          </div>
        )}
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="absolute top-2 left-2 p-1.5 bg-black/40 text-white/70 hover:bg-red-600 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20"
            title="Eliminar"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          disabled={downloading}
          className="absolute top-2 right-2 p-1.5 bg-black/40 text-white/70 hover:bg-brand-600 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10 disabled:opacity-50"
          title="Descargar"
        >
          {downloading ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
        </button>
        {loadingPreview ? (
          <svg className="w-10 h-10 text-white/60 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
            <svg className="w-6 h-6 text-white/80 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        <div className="absolute bottom-2 right-2 text-xs text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
          {video.durationSeconds ? `${Math.floor(video.durationSeconds / 60)}:${String(video.durationSeconds % 60).padStart(2, '0')}` : 'Video'}
        </div>
      </div>

      {/* Preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closePreview}
        >
          <div className="relative w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closePreview}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cerrar
            </button>
            <p className="text-white/80 text-sm mb-2 truncate">{video.title}</p>
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              autoPlay
              className="w-full rounded-xl max-h-[75vh]"
            />
          </div>
        </div>
      )}

      {/* Info + actions */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Title */}
        <div>
          <p className="text-sm font-semibold text-gray-900 truncate" title={video.title}>{video.title}</p>
          <p className="text-xs text-gray-400 truncate" title={video.fileName}>{video.fileName}</p>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatBytes(video.fileSize)}</span>
          <span>{formatDate(video.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
