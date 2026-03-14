'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { apiClient, openDocument, downloadDocument } from '@/lib/api-client';
import { getBunnyThumbnailUrl, getBunnyEmbedUrl, getBunnyDownloadUrl } from '@/lib/bunny-stream';
import { formatDuration, formatDate, formatBytes } from '@/lib/formatters';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { usePeriod } from '@/contexts/PeriodContext';

interface VideoItem {
  id: string;
  title: string;
  durationSeconds: number | null;
  createdAt: string;
  lessonId: string | null;
  lessonTitle: string | null;
  classId: string;
  className: string;
  bunnyGuid: string;
  bunnyStatus: number | null;
  fileName: string | null;
  fileSize: number | null;
  source: 'lesson' | 'recording';
}

interface DocumentItem {
  id: string;
  title: string;
  createdAt: string;
  lessonId: string;
  lessonTitle: string;
  classId: string;
  className: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
}

interface ClassOption {
  id: string;
  name: string;
  startDate?: string;
}

type Tab = 'videos' | 'documents';

export function MediaLibraryPage({ role }: { role: 'ACADEMY' | 'ADMIN' | 'TEACHER' }) {
  const [tab, setTab] = useState<Tab>('videos');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const { activePeriodId, isClassInPeriod } = usePeriod();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change (not on tab — handled in tab click handlers to avoid double-load)
  useEffect(() => {
    setPage(1);
  }, [selectedClass, debouncedSearch]);

  // Load classes
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient('/classes');
        const data = await res.json();
        if (data.success) setClasses(data.data || []);
      } catch { /* ignore */ }
    };
    load();
  }, []);

  // Filter classes by active period
  const filteredClasses = useMemo(() => {
    if (!activePeriodId) return classes;
    return classes.filter(c => isClassInPeriod(c.id));
  }, [classes, activePeriodId, isClassInPeriod]);

  // Fetch total counts for both tabs independently of the active tab
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const params = new URLSearchParams({ type: 'all', page: '1', limit: '1' });
        if (selectedClass !== 'all') params.set('classId', selectedClass);
        if (debouncedSearch) params.set('search', debouncedSearch);
        const res = await apiClient(`/media?${params}`);
        const data = await res.json();
        if (data.success) {
          setTotalVideos(data.data.totalVideos || 0);
          setTotalDocuments(data.data.totalDocuments || 0);
        }
      } catch { /* ignore */ }
    };
    fetchCounts();
  }, [selectedClass, debouncedSearch]);

  // Load media data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: tab,
        page: String(page),
        limit: '50',
      });
      if (selectedClass !== 'all') params.set('classId', selectedClass);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await apiClient(`/media?${params}`);
      const data = await res.json();
      if (data.success) {
        if (tab === 'videos') {
          setVideos(data.data.videos || []);
          setTotalVideos(data.data.totalVideos || 0);
        } else {
          setDocuments(data.data.documents || []);
          setTotalDocuments(data.data.totalDocuments || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, page, selectedClass, debouncedSearch]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalPages = Math.ceil((tab === 'videos' ? totalVideos : totalDocuments) / 50);
  const totalCount = tab === 'videos' ? totalVideos : totalDocuments;

  const getDocIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
    if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return '📊';
    if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return '📎';
    if (mimeType?.includes('image')) return '🖼️';
    return '📁';
  };

  return (
    <div className="space-y-6">
      {/* Row 1: Title (left) + Filters (right) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mediateca</h1>
          <p className="text-gray-600 text-sm mt-1">
            Todos los archivos de tu academia en un solo lugar
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'videos' ? 'Buscar videos...' : 'Buscar documentos...'}
              className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b0e788] focus:border-transparent"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="w-full sm:w-52">
            <ClassSearchDropdown
              classes={filteredClasses}
              value={selectedClass}
              onChange={setSelectedClass}
              allLabel="Todas las asignaturas"
              placeholder="Filtrar por asignatura..."
            />
          </div>
        </div>
      </div>

      {/* Row 2: Tabs — centered */}
      <div className="flex justify-center">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => { setTab('videos'); setPage(1); }}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'videos'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Videos{totalVideos > 0 ? ` (${totalVideos})` : ''}
          </button>
          <button
            onClick={() => { setTab('documents'); setPage(1); }}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'documents'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Documentos{totalDocuments > 0 ? ` (${totalDocuments})` : ''}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        tab === 'videos' ? <SkeletonVideosGrid /> : <SkeletonTable rows={8} cols={5} />
      ) : tab === 'videos' ? (
        <VideosGrid videos={videos} />
      ) : (
        <DocumentsTable documents={documents} getDocIcon={getDocIcon} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

function SkeletonVideosGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function VideosGrid({ videos }: { videos: VideoItem[] }) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="mx-auto w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="font-medium">No hay videos</p>
        <p className="text-sm mt-1">Los videos de tus clases y grabaciones aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
        <VideoCard key={`${video.source}-${video.id}`} video={video} />
      ))}
    </div>
  );
}

function VideoCard({ video }: { video: VideoItem }) {
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

function DocumentsTable({ documents, getDocIcon }: { documents: DocumentItem[]; getDocIcon: (mime: string) => string }) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="mx-auto w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="font-medium">No hay documentos</p>
        <p className="text-sm mt-1">Los documentos de tus lecciones aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th className="px-4 py-3">Documento</th>
            <th className="px-4 py-3 hidden sm:table-cell">Asignatura</th>
            <th className="px-4 py-3 hidden md:table-cell">Lección</th>
            <th className="px-4 py-3 hidden lg:table-cell">Tamaño</th>
            <th className="px-4 py-3 hidden lg:table-cell">Fecha</th>
            <th className="px-4 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={async () => { try { await openDocument(doc.storagePath); } catch { /* noop */ } }}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getDocIcon(doc.mimeType)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500 truncate sm:hidden">{doc.className}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{doc.className}</td>
              <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell truncate max-w-[200px]">{doc.lessonTitle}</td>
              <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{formatBytes(doc.fileSize)}</td>
              <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{formatDate(doc.createdAt)}</td>
              <td className="px-4 py-3">
                <button
                  title="Descargar"
                  onClick={async (e) => { e.stopPropagation(); try { await downloadDocument(doc.storagePath, doc.title); } catch { /* noop */ } }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
