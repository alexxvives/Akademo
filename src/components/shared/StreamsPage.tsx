'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { generateDemoStreams } from '@/lib/demo-data';
import { SkeletonList } from '@/components/ui/SkeletonLoader';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';

interface Stream {
  id: string;
  title: string;
  classId: string;
  classSlug?: string;
  className: string;
  teacherName?: string;
  academyName?: string;
  academyId?: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  zoomMeetingId: string | null;
  zoomStartUrl?: string;
  zoomLink?: string;
  recordingId: string | null;
  participantCount?: number | null;
  participantsFetchedAt?: string | null;
  bunnyStatus?: number | null;
  duration?: number;
  validRecordingId?: string;
}

interface Academy {
  id: string;
  name: string;
}

interface ClassOption {
  id: string;
  name: string;
  academyId?: string;
}

interface StreamsPageProps {
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
}

export function StreamsPage({ role }: StreamsPageProps) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const [deletingStreamId, setDeletingStreamId] = useState<string | null>(null);

  // Admin-only
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState('all');

  // Highlight (from calendar redirect)
  const searchParams = useSearchParams();
  const [glowId, setGlowId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  const isAcademy = role === 'ACADEMY';
  const isTeacher = role === 'TEACHER';
  const isAdmin = role === 'ADMIN';
  const isDemo = (isAcademy || isTeacher) && paymentStatus === 'NOT PAID';
  const dashboardBase = isAcademy ? '/dashboard/academy' : isTeacher ? '/dashboard/teacher' : '/dashboard/admin';

  const loadStreams = useCallback(async () => {
    try {
      const response = await apiClient('/live/history');
      const result = await response.json();
      if (result.success) {
        setStreams(result.data || []);
      }
    } catch (error) {
      console.error('Error loading streams:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      if (role === 'TEACHER') {
        // Teacher: load via /teacher/academy + /classes + /live/history
        const academyRes = await apiClient('/teacher/academy');
        if (academyRes.ok) {
          const academyResult = await academyRes.json() as { data?: { academy?: { name?: string; paymentStatus?: string } } };
          if (academyResult.data?.academy) {
            setAcademyName(academyResult.data.academy.name || '');
            const status = academyResult.data.academy.paymentStatus || 'NOT PAID';
            setPaymentStatus(status);

            if (status === 'NOT PAID') {
              const demoStreams = generateDemoStreams() as Stream[];
              setStreams(demoStreams.map((stream) => ({
                ...stream,
                classSlug: stream.className.toLowerCase().replace(/\s+/g, '-'),
              })));
              setClasses([
                { id: 'demo-c1', name: 'Programación Web' },
                { id: 'demo-c2', name: 'Matemáticas Avanzadas' },
                { id: 'demo-c3', name: 'Diseño Gráfico' },
                { id: 'demo-c4', name: 'Física Cuántica' },
              ]);
              setLoading(false);
              return;
            }
          }
        }

        const [classesRes, streamsRes] = await Promise.all([
          apiClient('/classes'),
          apiClient('/live/history'),
        ]);
        const [classesResult, streamsResult] = await Promise.all([
          classesRes.json(),
          streamsRes.json(),
        ]);
        if (classesResult.success && Array.isArray(classesResult.data)) setClasses(classesResult.data);
        if (streamsResult.success && Array.isArray(streamsResult.data)) setStreams(streamsResult.data);
        setLoading(false);

        const pollInterval = setInterval(async () => {
          try {
            const r = await apiClient('/live/history');
            const res = await r.json();
            if (res.success) setStreams(res.data || []);
          } catch (e) { console.error(e); }
        }, 10000);
        window.addEventListener('beforeunload', () => clearInterval(pollInterval));
      } else if (role === 'ACADEMY') {
        const [academiesRes, classesRes] = await Promise.all([
          apiClient('/academies'),
          apiClient('/academies/classes'),
        ]);
        const [academiesResult, classesResult] = await Promise.all([
          academiesRes.json(),
          classesRes.json(),
        ]);

        if (
          academiesResult.success &&
          Array.isArray(academiesResult.data) &&
          academiesResult.data.length > 0
        ) {
          const academy = academiesResult.data[0];
          setAcademyName(academy.name);
          const status = academy.paymentStatus || 'NOT PAID';
          setPaymentStatus(status);

          if (status === 'NOT PAID') {
            const demoStreams = generateDemoStreams() as Stream[];
            setStreams(
              demoStreams.map((stream) => ({
                ...stream,
                classSlug: stream.className.toLowerCase().replace(/\s+/g, '-'),
              }))
            );
            setClasses([
              { id: 'demo-c1', name: 'Programación Web' },
              { id: 'demo-c2', name: 'Matemáticas Avanzadas' },
              { id: 'demo-c3', name: 'Diseño Gráfico' },
              { id: 'demo-c4', name: 'Física Cuántica' },
            ]);
            setLoading(false);
            return;
          }

          await loadStreams();
          const pollInterval = setInterval(() => loadStreams(), 10000);
          window.addEventListener('beforeunload', () => clearInterval(pollInterval));
        }

        if (classesResult.success && Array.isArray(classesResult.data)) {
          setClasses(classesResult.data);
        }
      } else {
        // ADMIN
        const [academiesRes, classesRes, streamsRes] = await Promise.all([
          apiClient('/academies'),
          apiClient('/classes'),
          apiClient('/live/history'),
        ]);
        const [academiesResult, classesResult, streamsResult] = await Promise.all([
          academiesRes.json(),
          classesRes.json(),
          streamsRes.json(),
        ]);

        if (academiesResult.success && Array.isArray(academiesResult.data)) {
          setAcademies(academiesResult.data);
        }
        if (classesResult.success && Array.isArray(classesResult.data)) {
          setClasses(classesResult.data);
        }
        if (streamsResult.success && Array.isArray(streamsResult.data)) {
          setStreams(streamsResult.data);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  }, [role, loadStreams]);

  useEffect(() => {
    loadData();
    if (role === 'ADMIN') {
      const pollInterval = setInterval(loadData, 10000);
      return () => clearInterval(pollInterval);
    }
  }, [loadData, role]);

  const filteredStreams = useMemo(() => {
    let result = streams;
    if (role === 'ADMIN' && selectedAcademy !== 'all') {
      result = result.filter((s) => s.academyId === selectedAcademy);
    }
    if (selectedClass !== 'all') {
      result = result.filter((s) => s.classId === selectedClass);
    }
    return result.sort((a, b) => {
      const dateA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const dateB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [streams, selectedClass, selectedAcademy, role]);

  // Glow effect on highlighted stream from calendar redirect
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (!highlightId || filteredStreams.length === 0) return;
    setGlowId(highlightId);
    // Scroll to the row after a short delay to allow render
    setTimeout(() => {
      if (highlightRef.current) {
        highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
    // Remove glow after 3 seconds
    const timer = setTimeout(() => setGlowId(null), 3300);
    return () => clearTimeout(timer);
  }, [searchParams, filteredStreams.length]);

  const filteredClassOptions = useMemo(() => {
    if (role !== 'ADMIN' || selectedAcademy === 'all') return [];
    return classes.filter((c) => c.academyId === selectedAcademy);
  }, [role, classes, selectedAcademy]);

  const handleEditTitle = (streamId: string, currentTitle: string) => {
    if (isDemo) return;
    setEditingTitleId(streamId);
    setEditingTitleValue(currentTitle);
  };

  const handleSaveTitle = async (streamId: string) => {
    if (!editingTitleValue.trim()) {
      setEditingTitleId(null);
      return;
    }
    setEditingTitleId(null);
    try {
      const response = await apiClient(`/live/${streamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitleValue.trim() }),
      });
      const result = await response.json();
      if (result.success) {
        setStreams(streams.map((s) => (s.id === streamId ? { ...s, title: editingTitleValue.trim() } : s)));
      } else {
        alert(`Error al actualizar el título: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error updating title:', error);
      alert('Error al actualizar el título');
    } finally {
      setEditingTitleValue('');
    }
  };

  const handleDeleteStream = async (streamId: string, streamTitle: string) => {
    if (isDemo) return;
    if (!confirm(`¿Estás seguro que deseas eliminar el stream "${streamTitle}"? Esta acción no se puede deshacer.`)) return;

    setDeletingStreamId(streamId);
    try {
      const response = await apiClient(`/live/${streamId}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setStreams(streams.filter((s) => s.id !== streamId));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting stream:', error);
      alert('Error al eliminar stream');
    } finally {
      setDeletingStreamId(null);
    }
  };

  const formatDuration = (start: string | null, end: string | null): string => {
    if (!start) return '—';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            En Vivo
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Esperando
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            Finalizado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Historial de Streams</h1>
          {(isAcademy || isTeacher) && academyName && (
            <p className="text-gray-600 text-sm mt-1">{academyName}</p>
          )}
          {isAdmin && (
            <p className="text-gray-600 text-sm mt-1">Todas las academias</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Class filter — for academy, or admin when academy selected */}
          {(isAcademy || isTeacher) && classes.length > 0 && (
            <ClassSearchDropdown
              classes={classes}
              value={selectedClass}
              onChange={setSelectedClass}
              allLabel="Todas las asignaturas"
              className="w-full md:w-64"
            />
          )}

          {role === 'ADMIN' && selectedAcademy !== 'all' && filteredClassOptions.length > 0 && (
            <ClassSearchDropdown
              classes={filteredClassOptions}
              value={selectedClass}
              onChange={setSelectedClass}
              allLabel="Todas las asignaturas"
              className="w-64"
            />
          )}

          {/* Academy filter — admin only */}
          {role === 'ADMIN' && (
            <AcademySearchDropdown
              academies={academies}
              value={selectedAcademy}
              onChange={(newVal) => {
                setSelectedAcademy(newVal);
                setSelectedClass('all');
              }}
              allLabel="Todas las academias"
              className="w-56"
            />
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonList rows={8} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-h-[750px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  {role === 'ADMIN' && (
                    <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Academia
                    </th>
                  )}
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profesor
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asignatura
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participantes
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grabación
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStreams.length === 0 ? (
                  <tr>
                    <td colSpan={role === 'ADMIN' ? 10 : 9} className="py-8 sm:py-12 text-center">
                      <svg
                        className="w-12 h-12 mx-auto text-gray-300 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">No hay streams</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Los profesores pueden crear streams desde sus clases
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStreams.map((stream) => (
                    <tr
                      key={stream.id}
                      id={`stream-${stream.id}`}
                      ref={glowId === stream.id ? highlightRef : null}
                      className={`hover:bg-gray-50/50 transition-colors ${glowId === stream.id ? 'ring-1 ring-blue-300/60 bg-blue-50/20 shadow-[inset_0_0_12px_rgba(96,165,250,0.12)]' : ''}`}
                    >
                      {/* Title */}
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex items-center gap-2">
                          {stream.status === 'active' && (
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          )}
                          {editingTitleId === stream.id ? (
                            <input
                              type="text"
                              value={editingTitleValue}
                              onChange={(e) => setEditingTitleValue(e.target.value)}
                              onBlur={() => handleSaveTitle(stream.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle(stream.id);
                                else if (e.key === 'Escape') {
                                  setEditingTitleId(null);
                                  setEditingTitleValue('');
                                }
                              }}
                              autoFocus
                              className="px-2 py-1 border border-blue-500 rounded text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">{stream.title}</span>
                          )}
                        </div>
                      </td>

                      {/* Academy column — admin only */}
                      {role === 'ADMIN' && (
                        <td className="py-3 px-2 sm:px-4">
                          <span className="text-sm text-gray-700">{stream.academyName || '—'}</span>
                        </td>
                      )}

                      <td className="py-3 px-2 sm:px-4">
                        <span className="text-sm text-gray-700">{stream.teacherName || '—'}</span>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <Link
                          href={`${dashboardBase}/subject/${stream.classSlug || stream.classId}`}
                          className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                        >
                          {stream.className}
                        </Link>
                      </td>
                      <td className="py-3 px-2 sm:px-4">{getStatusBadge(stream.status)}</td>
                      <td className="py-3 px-2 sm:px-4">
                        {stream.participantCount != null ? (
                          <span className="text-sm text-gray-600 font-medium">{stream.participantCount}</span>
                        ) : (
                          <span className="text-sm text-gray-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-sm text-gray-600">
                        {formatDate(stream.startedAt || stream.createdAt)}
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        {stream.status === 'ended' && (stream.duration || (stream.startedAt && stream.endedAt)) ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {stream.duration ? `${stream.duration} min` : formatDuration(stream.startedAt, stream.endedAt)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        {stream.recordingId ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Disponible
                          </span>
                        ) : stream.status === 'ended' ? (
                          <span className="text-xs text-gray-400">Procesando...</span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      {/* Acciones */}
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex items-center gap-1.5">
                          {stream.validRecordingId ? (
                            <Link
                              href={`${dashboardBase}/subject/${stream.classSlug || stream.classId}?lesson=${stream.validRecordingId}`}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver clase"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                          ) : stream.recordingId ? (
                            <button
                              onClick={() =>
                                (window.location.href = `${dashboardBase}/subject/${stream.classId}?${role === 'ADMIN' ? `action=create-lesson&recordingId=${stream.recordingId}&streamTitle=${encodeURIComponent(stream.title)}` : `createFromStream=${stream.id}`}`)
                              }
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Crear clase"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          ) : null}
                          <button
                            onClick={() => handleEditTitle(stream.id, stream.title)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Editar título"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteStream(stream.id, stream.title)}
                            disabled={deletingStreamId === stream.id}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar stream"
                          >
                            {deletingStreamId === stream.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
