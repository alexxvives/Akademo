'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { generateDemoStreams } from '@/lib/demo-data';
import { SkeletonList } from '@/components/ui/SkeletonLoader';

interface Stream {
  id: string;
  title: string;
  classId: string;
  classSlug?: string;
  className: string;
  teacherName?: string;
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
  duration?: number; // Duration in minutes
}

interface Class {
  id: string;
  name: string;
}

export default function AcademyStreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const [deletingStreamId, setDeletingStreamId] = useState<string | null>(null);

  useEffect(() => {
    loadAcademyInfo();
  }, []);

  const loadAcademyInfo = async () => {
    try {
      const [academiesRes, classesRes] = await Promise.all([
        apiClient('/academies'),
        apiClient('/academies/classes')
      ]);
      const [academiesResult, classesResult] = await Promise.all([
        academiesRes.json(),
        classesRes.json()
      ]);
      
      if (academiesResult.success && Array.isArray(academiesResult.data) && academiesResult.data.length > 0) {
        const academy = academiesResult.data[0];
        setAcademyName(academy.name);
        const status = academy.paymentStatus || 'NOT PAID';
        setPaymentStatus(status);
        
        // If NOT PAID, show demo streams
        if (status === 'NOT PAID') {
          const demoStreams = generateDemoStreams();
          setStreams(demoStreams.map((s: any) => ({
            ...s,
            classSlug: s.className.toLowerCase().replace(/\s+/g, '-'),
          })));
          // Load demo classes for filter
          setClasses([
            { id: 'demo-c1', name: 'Programación Web' },
            { id: 'demo-c2', name: 'Matemáticas Avanzadas' },
            { id: 'demo-c3', name: 'Diseño Gráfico' },
            { id: 'demo-c4', name: 'Física Cuántica' },
          ]);
          setLoading(false);
          return;
        }
        
        // If PAID, load real streams and start polling
        await loadStreams();
        const pollInterval = setInterval(() => {
          loadStreams();
        }, 10000);
        
        // Cleanup function
        window.addEventListener('beforeunload', () => clearInterval(pollInterval));
      }
      
      if (classesResult.success && Array.isArray(classesResult.data)) {
        setClasses(classesResult.data);
      }
    } catch (error) {
      console.error('Error loading academy info:', error);
      setLoading(false);
    }
  };

  const loadStreams = async () => {
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
  };

  const filteredStreams = useMemo(() => {
    if (selectedClass === 'all') return streams;
    return streams.filter(s => s.classId === selectedClass);
  }, [streams, selectedClass]);

  const handleEditTitle = (streamId: string, currentTitle: string) => {
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
        setStreams(streams.map(s => 
          s.id === streamId ? { ...s, title: editingTitleValue.trim() } : s
        ));
      } else {
        alert(`Error al actualizar el título: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error updating title:', error);
      alert('Error al actualizar el título');
    } finally{
      setEditingTitleValue('');
    }
  };

  const handleDeleteClick = (streamId: string, streamTitle: string) => {
    if (!confirm(`¿Estás seguro que deseas eliminar el stream "${streamTitle}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    handleDeleteStream(streamId);
  };

  const handleDeleteStream = async (streamId: string) => {
    setDeletingStreamId(streamId);

    try {
      const response = await apiClient(`/live/${streamId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        setStreams(streams.filter(s => s.id !== streamId));
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
    if (!start) return '-';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (date: string): string => {
    const d = new Date(date);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
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

  const activeCount = streams.filter(s => s.status === 'active' || s.status === 'scheduled').length;
  const endedCount = streams.filter(s => s.status === 'ended').length;
  
  const streamsWithParticipants = streams.filter(s => s.participantCount != null);
  const avgParticipants = streamsWithParticipants.length > 0
    ? Math.round(streamsWithParticipants.reduce((acc, s) => acc + (s.participantCount || 0), 0) / streamsWithParticipants.length)
    : 0;
  
  const totalDurationMs = streams.reduce((acc, stream) => {
    if (!stream.startedAt && !stream.createdAt) return acc;
    const start = stream.startedAt || stream.createdAt;
    const end = stream.endedAt || (stream.status === 'active' ? new Date().toISOString() : stream.createdAt);
    return acc + (new Date(end).getTime() - new Date(start).getTime());
  }, 0);
  const totalHours = Math.floor(totalDurationMs / (1000 * 60 * 60));
  const totalMinutes = Math.floor((totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Historial de Streams</h1>
          {academyName && <p className="text-gray-600 text-sm mt-1">{academyName}</p>}
        </div>
        {classes.length > 0 && (
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none w-full md:w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="all">Todas las clases</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonList rows={8} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-h-[750px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Profesor
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Clase
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Participantes
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Grabación
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Lección
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStreams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 sm:py-8 sm:py-12 text-center">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">No hay streams</p>
                      <p className="text-xs text-gray-500 mt-1">Los profesores pueden crear streams desde sus clases</p>
                    </td>
                  </tr>
                ) : (
                  filteredStreams.map((stream) => (
                  <tr key={stream.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex items-center gap-2">
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteClick(stream.id, stream.title)}
                          disabled={deletingStreamId === stream.id}
                          className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 flex-shrink-0"
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
                              if (e.key === 'Enter') {
                                handleSaveTitle(stream.id);
                              } else if (e.key === 'Escape') {
                                setEditingTitleId(null);
                                setEditingTitleValue('');
                              }
                            }}
                            autoFocus
                            className="px-2 py-1 border border-blue-500 rounded text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{stream.title}</span>
                            <button
                              onClick={() => handleEditTitle(stream.id, stream.title)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Editar título"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <span className="text-sm text-gray-700">
                        {stream.teacherName || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <Link 
                        href={`/dashboard/academy/class/${stream.classSlug || stream.classId}`}
                        className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
                      >
                        {stream.className}
                      </Link>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      {getStatusBadge(stream.status)}
                    </td>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                    <td className="py-3 px-2 sm:px-4">
                      {stream.recordingId ? (
                        <button
                          onClick={() => window.location.href = `/dashboard/academy/class/${stream.classId}?createFromStream=${stream.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Crear clase
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
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
