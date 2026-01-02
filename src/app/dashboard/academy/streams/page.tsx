'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stream {
  id: string;
  title: string;
  classId: string;
  className: string;
  teacherName: string;
  teacherId: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  zoomMeetingId: string | null;
  zoomLink: string | null;
  recordingId: string | null;
}

export default function AcademyStreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    try {
      // Load all streams from all teachers in the academy
      const response = await fetch('/api/live/history');
      const result = await response.json();
      if (result.success) {
        setStreams(result.data);
      }
    } catch (error) {
      console.error('Error loading streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStreams = streams.filter(stream => {
    if (filter === 'active') return stream.status === 'ACTIVE';
    if (filter === 'ended') return stream.status === 'ENDED';
    return true;
  });

  const activeCount = streams.filter(s => s.status === 'ACTIVE').length;
  const endedCount = streams.filter(s => s.status === 'ENDED').length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Streams en Vivo</h1>
          <p className="text-gray-600 text-sm">Gestiona todos los streams de la academia</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white border border-gray-200 rounded-xl p-1 mb-6 inline-flex">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todos ({streams.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
              filter === 'active'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Activos ({activeCount})
          </button>
          <button
            onClick={() => setFilter('ended')}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
              filter === 'ended'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Finalizados ({endedCount})
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando streams...</p>
          </div>
        ) : filteredStreams.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No hay streams' : filter === 'active' ? 'No hay streams activos' : 'No hay streams finalizados'}
            </h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'Los profesores pueden crear streams desde sus dashboards.' : 'Los streams aparecerán aquí una vez creados.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStreams.map((stream) => (
              <div key={stream.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        stream.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : stream.status === 'ENDED'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {stream.status === 'ACTIVE' ? '🔴 En vivo' : stream.status === 'ENDED' ? 'Finalizado' : 'Pendiente'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{stream.title}</h3>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-gray-700"><span className="font-medium">Clase:</span> {stream.className}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-gray-700"><span className="font-medium">Profesor:</span> {stream.teacherName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Creado: {formatDate(stream.createdAt)}</span>
                      </div>
                      {stream.startedAt && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Iniciado: {formatDate(stream.startedAt)}</span>
                        </div>
                      )}
                      {stream.endedAt && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                          </svg>
                          <span>Finalizado: {formatDate(stream.endedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {stream.status === 'ACTIVE' && stream.zoomLink && (
                      <a
                        href={stream.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                      >
                        Unirse al Stream
                      </a>
                    )}
                    {stream.recordingId && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                        ✓ Grabado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
