'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import { usePeriod } from '@/contexts/PeriodContext';
import type { VideoItem, DocumentItem, ClassOption, Tab } from './types';
import { SkeletonVideosGrid, VideosGrid } from './VideosGrid';
import { DocumentsTable } from './DocumentsTable';

export function MediaLibraryPage({ role }: { role: 'ACADEMY' | 'ADMIN' | 'TEACHER' }) {
  const [tab, setTab] = useState<Tab>('videos');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedAcademy, setSelectedAcademy] = useState('all');
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
  }, [selectedClass, debouncedSearch, selectedAcademy]);

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

  // Derive academy options for admin from classes list
  const adminAcademies = useMemo(() => {
    if (role !== 'ADMIN') return [];
    const map = new Map<string, { id: string; name: string }>();
    classes.forEach(c => {
      if (c.academyId && c.academyName && !map.has(c.academyId)) {
        map.set(c.academyId, { id: c.academyId, name: c.academyName });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, role]);

  // Fetch total counts for both tabs independently of the active tab
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const params = new URLSearchParams({ type: 'all', page: '1', limit: '1' });
        if (selectedClass !== 'all') params.set('classId', selectedClass);
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (role === 'ADMIN' && selectedAcademy !== 'all') params.set('academyId', selectedAcademy);
        const res = await apiClient(`/media?${params}`);
        const data = await res.json();
        if (data.success) {
          setTotalVideos(data.data.totalVideos || 0);
          setTotalDocuments(data.data.totalDocuments || 0);
        }
      } catch { /* ignore */ }
    };
    fetchCounts();
  }, [selectedClass, debouncedSearch, selectedAcademy, role]);

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
      if (role === 'ADMIN' && selectedAcademy !== 'all') params.set('academyId', selectedAcademy);

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
  }, [tab, page, selectedClass, debouncedSearch, selectedAcademy, role]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalPages = Math.ceil((tab === 'videos' ? totalVideos : totalDocuments) / 50);

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
          {role === 'ADMIN' && adminAcademies.length > 0 && (
            <AcademySearchDropdown
              academies={adminAcademies}
              value={selectedAcademy}
              onChange={(value) => { setSelectedAcademy(value); setSelectedClass('all'); }}
              allLabel="Todas las academias"
              allValue="all"
              className="w-full sm:w-56"
            />
          )}
          <div className="relative w-full sm:w-48">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'videos' ? 'Buscar videos...' : 'Buscar documentos...'}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="w-full sm:w-56">
            <ClassSearchDropdown
              classes={role === 'ADMIN' && selectedAcademy !== 'all'
                ? filteredClasses.filter(c => c.academyId === selectedAcademy)
                : filteredClasses}
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
        <DocumentsTable documents={documents} />
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
