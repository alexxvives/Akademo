'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { StreamsHeader } from '@/app/dashboard/teacher/streams/components/StreamsHeader';
import { StreamsTable } from '@/app/dashboard/teacher/streams/components/StreamsTable';

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
}

interface Academy {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  academyId: string;
}

export default function AdminStreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAcademy, setSelectedAcademy] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [deletingStreamId, setDeletingStreamId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const pollInterval = setInterval(loadData, 10000);
    return () => clearInterval(pollInterval);
  }, []);

  const loadData = async () => {
    try {
      const [academiesRes, classesRes, streamsRes] = await Promise.all([
        apiClient('/academies'),
        apiClient('/classes'),
        apiClient('/live/history')
      ]);
      
      const [academiesResult, classesResult, streamsResult] = await Promise.all([
        academiesRes.json(),
        classesRes.json(),
        streamsRes.json()
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
    } catch (error) {
      console.error('Error loading streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStream = async (streamId: string, streamTitle: string) => {
    if (!confirm(`¿Estás seguro que deseas eliminar el stream "${streamTitle}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    setDeletingStreamId(streamId);
    try {
      const response = await apiClient(`/live/${streamId}`, { method: 'DELETE' });
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

  const filteredStreams = useMemo(() => {
    let result = streams;
    
    if (selectedAcademy !== 'all') {
      result = result.filter(s => s.academyId === selectedAcademy);
    }
    
    if (selectedClass !== 'all') {
      result = result.filter(s => s.classId === selectedClass);
    }
    
    return result;
  }, [streams, selectedAcademy, selectedClass]);

  const filteredClasses = useMemo(() => {
    if (selectedAcademy === 'all') return classes;
    return classes.filter(c => c.academyId === selectedAcademy);
  }, [classes, selectedAcademy]);

  const streamStats = useMemo(() => {
    const streamsWithParticipants = filteredStreams.filter(s => s.participantCount != null);
    const totalParticipants = streamsWithParticipants.reduce((sum, s) => sum + (s.participantCount || 0), 0);
    
    return {
      total: filteredStreams.length,
      avgParticipants: streamsWithParticipants.length > 0 
        ? Math.round(totalParticipants / streamsWithParticipants.length)
        : 0
    };
  }, [filteredStreams]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatDuration = (start: string | null, end: string | null): string => {
    if (!start) return '—';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      scheduled: <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Programado</span>,
      active: <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">En Vivo</span>,
      ended: <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">Finalizado</span>,
    };
    return badges[status as keyof typeof badges] || <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with inline filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Historial de Streams</h1>
          <p className="text-gray-600 text-sm mt-1">Todas las academias</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={selectedAcademy}
            onChange={(e) => {
              setSelectedAcademy(e.target.value);
              setSelectedClass('all');
            }}
            className="appearance-none w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="all">Todas las academias</option>
            {academies.map(academy => (
              <option key={academy.id} value={academy.id}>{academy.name}</option>
            ))}
          </select>
          
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="appearance-none w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="all">Todas las clases</option>
            {filteredClasses.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Removed stats cards - directly to table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[750px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Título</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Academia</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clase</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Profesor</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="py-4 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Participantes</th>
                <th className="py-4 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                <th className="py-4 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duración</th>
                <th className="py-4 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStreams.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    No hay streams disponibles
                  </td>
                </tr>
              ) : (
                filteredStreams.map(stream => (
                  <tr key={stream.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{stream.title}</div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{stream.academyName || '—'}</td>
                    <td className="py-4 px-4">
                      <Link 
                        href={`/dashboard/admin/class/${stream.classSlug || stream.classId}`}
                        className="text-brand-600 hover:text-brand-700 font-medium"
                      >
                        {stream.className}
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{stream.teacherName || '—'}</td>
                    <td className="py-4 px-4">{getStatusBadge(stream.status)}</td>
                    <td className="py-4 px-4">
                      {stream.participantCount != null ? (
                        <span className="text-sm text-gray-600 font-medium">{stream.participantCount}</span>
                      ) : (
                        <span className="text-sm text-gray-400">0</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDate(stream.startedAt || stream.createdAt)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {stream.status === 'ended' ? formatDuration(stream.startedAt, stream.endedAt) : '—'}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleDeleteStream(stream.id, stream.title)}
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
