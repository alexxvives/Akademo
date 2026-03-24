'use client';

import { createPortal } from 'react-dom';
import { useState, useCallback } from 'react';
import { apiClient, downloadDocument } from '@/lib/api-client';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';

interface ExportVideo {
  id: string;
  title: string;
  bunnyGuid: string;
  fileName: string | null;
  createdAt: string;
  classId: string;
  className: string;
}

interface ExportDocument {
  id: string;
  title: string;
  storagePath: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
  classId: string;
  className: string;
}

interface ExportArchived {
  id: string;
  title: string;
  fileName: string;
  fileSize: number | null;
  className: string;
  classId: string | null;
  createdAt: string;
}

type FlatItem =
  | (ExportVideo & { _type: 'video' })
  | (ExportDocument & { _type: 'document' })
  | (ExportArchived & { _type: 'archived' });

interface ContentExportModalProps {
  onClose: () => void;
  classes: { id: string; name: string }[];
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
  selectedAcademy?: string;
}

export function ContentExportModal({ onClose, classes, role, selectedAcademy }: ContentExportModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState('all');
  const [typeFilters, setTypeFilters] = useState({ videos: true, documents: true, archived: true });
  const [items, setItems] = useState<FlatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [downloading, setDownloading] = useState<Set<string>>(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (selectedClass !== 'all') params.set('classId', selectedClass);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (role === 'ADMIN' && selectedAcademy && selectedAcademy !== 'all') {
        params.set('academyId', selectedAcademy);
      }

      const res = await apiClient(`/media/export?${params}`);
      const data = await res.json() as { success: boolean; data: { videos: ExportVideo[]; documents: ExportDocument[]; archived: ExportArchived[] } };
      if (!data.success) return;

      const flat: FlatItem[] = [
        ...(typeFilters.videos ? (data.data.videos || []).map(v => ({ ...v, _type: 'video' as const })) : []),
        ...(typeFilters.documents ? (data.data.documents || []).map(d => ({ ...d, _type: 'document' as const })) : []),
        ...(typeFilters.archived ? (data.data.archived || []).map(a => ({ ...a, _type: 'archived' as const })) : []),
      ];
      // Sort all by date desc
      flat.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(flat);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const downloadItem = useCallback(async (item: FlatItem) => {
    const key = `${item._type}-${item.id}`;
    if (downloading.has(key)) return;
    setDownloading(prev => new Set(prev).add(key));
    try {
      if (item._type === 'document') {
        await downloadDocument(item.storagePath, item.fileName);
      } else if (item._type === 'archived') {
        const res = await apiClient(`/bunny/archive/${item.id}/download`);
        if (!res.ok) throw new Error('Download failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.fileName || item.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (item._type === 'video') {
        const res = await apiClient(`/bunny/video/${item.bunnyGuid}/download-url`);
        const json = await res.json() as { success: boolean; data: { url: string } };
        if (json.success && json.data?.url) {
          const a = document.createElement('a');
          a.href = json.data.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.download = item.fileName || `${item.title}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    } catch { /* ignore */ } finally {
      setDownloading(prev => { const next = new Set(prev); next.delete(key); return next; });
    }
  }, [downloading]);

  const handleDownloadAll = async () => {
    setBulkDownloading(true);
    for (const item of items) {
      await downloadItem(item);
      await new Promise(r => setTimeout(r, 700));
    }
    setBulkDownloading(false);
  };

  const iconFor = (type: string) => {
    if (type === 'video') return (
      <span className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      </span>
    );
    if (type === 'document') return (
      <span className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </span>
    );
    return (
      <span className="w-7 h-7 rounded-md bg-purple-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
      </span>
    );
  };

  const downloadableCount = items.length;
  const videoCount = items.filter(i => i._type === 'video').length;

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Exportar contenido</h2>
            <p className="text-sm text-gray-500 mt-0.5">Descarga vídeos, documentos y archivados filtrados</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 space-y-3 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
              <CustomDatePicker
                value={startDate}
                onChange={setStartDate}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
              <CustomDatePicker
                value={endDate}
                onChange={setEndDate}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Asignatura</label>
            <ClassSearchDropdown
              classes={classes}
              value={selectedClass}
              onChange={setSelectedClass}
              allLabel="Todas las asignaturas"
              placeholder="Filtrar por asignatura..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de contenido</label>
            <div className="flex gap-5">
              {([
                { key: 'videos', label: 'Vídeos' },
                { key: 'documents', label: 'Documentos' },
                { key: 'archived', label: 'Archivados' },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeFilters[key]}
                    onChange={e => setTypeFilters(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-gray-900 rounded"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !(typeFilters.videos || typeFilters.documents || typeFilters.archived)}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Buscando...
              </>
            ) : 'Buscar contenido'}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {!searched ? (
            <p className="text-sm text-gray-400 text-center py-10">Aplica los filtros y haz clic en «Buscar contenido»</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No se encontró contenido con estos filtros</p>
          ) : (
            <>
              <div className="space-y-1.5">
                {items.map(item => {
                  const key = `${item._type}-${item.id}`;
                  const isVideo = item._type === 'video';
                  const isDownloading = downloading.has(key);
                  return (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {iconFor(item._type)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.title || ('fileName' in item ? item.fileName : '')}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {item.className} · {new Date(item.createdAt).toLocaleDateString('es')}
                          </p>
                        </div>
                      </div>
                      <button
                          onClick={() => downloadItem(item)}
                          disabled={isDownloading}
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                          title={isVideo ? 'Descargar (720p)' : 'Descargar'}
                        >
                          {isDownloading ? (
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
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {items.length} elemento{items.length !== 1 ? 's' : ''}
            </p>
            {downloadableCount > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={bulkDownloading}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {bulkDownloading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Descargando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar todo ({downloadableCount})
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
