'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface Class {
  id: string;
  name: string;
  slug: string;
  academyId: string;
  teacherId: string;
}

interface LiveStream {
  id: string;
  classId: string;
  className: string;
  title: string;
  zoomLink: string;
  zoomMeetingId: string;
  zoomStartUrl: string;
  status: 'PENDING' | 'LIVE' | 'ENDED';
  createdAt: string;
  startedAt?: string;
}

export default function TeacherLivePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
    // Poll for active streams every 10 seconds
    const interval = setInterval(loadActiveStreams, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadClasses(), loadActiveStreams()]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await apiClient('/classes');
      const result = await res.json();
      if (result.success && result.data) {
        setClasses(result.data);
        if (result.data.length > 0 && !selectedClassId) {
          setSelectedClassId(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadActiveStreams = async () => {
    try {
      const res = await apiClient('/live/active');
      const result = await res.json();
      if (result.success && result.data) {
        setActiveStreams(result.data);
      }
    } catch (error) {
      console.error('Failed to load active streams:', error);
    }
  };

  const handleStartStream = async () => {
    if (!selectedClassId) {
      alert('Por favor, selecciona una asignatura');
      return;
    }

    setCreating(true);
    try {
      const res = await apiClient('/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          title: 'Clase en vivo',
        }),
      });

      const result = await res.json();
      if (result.success && result.data) {
        // Open Zoom start URL in new tab
        window.open(result.data.zoomStartUrl, '_blank');
        await loadActiveStreams();
      } else {
        alert('Error al crear la clase en vivo');
      }
    } catch (error) {
      console.error('Failed to start stream:', error);
      alert('Error al crear la clase en vivo');
    } finally {
      setCreating(false);
    }
  };

  const handleEndStream = async (streamId: string) => {
    if (!confirm('¿Seguro que quieres finalizar esta clase en vivo?')) {
      return;
    }

    try {
      const res = await apiClient(`/live/${streamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' }),
      });

      const result = await res.json();
      if (result.success) {
        await loadActiveStreams();
      } else {
        alert('Error al finalizar la clase');
      }
    } catch (error) {
      console.error('Failed to end stream:', error);
      alert('Error al finalizar la clase');
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">En vivo</h1>
        <p className="text-gray-600 mt-2">
          Crea y gestiona clases en vivo con Zoom
        </p>
      </div>

      {/* Start Stream Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Iniciar clase en vivo
          </h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asignatura
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                disabled={loading || creating}
              >
                <option value="">Seleccionar asignatura...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleStartStream}
              disabled={!selectedClassId || creating || loading}
              className="px-8 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {creating ? 'Creando...' : 'Iniciar Clase'}
            </button>
          </div>
        </div>

        {/* Active Streams */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Clases activas
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : activeStreams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay clases en vivo activas
            </div>
          ) : (
            <div className="space-y-4">
              {activeStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          🔴 EN VIVO
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {stream.className}
                        </h3>
                      </div>
                      {stream.title && (
                        <p className="text-sm text-gray-600 mb-2">
                          {stream.title}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        ID de reunión: {stream.zoomMeetingId}
                      </p>
                      {stream.startedAt && (
                        <p className="text-xs text-gray-500">
                          Iniciada:{' '}
                          {new Date(stream.startedAt).toLocaleString('es-ES')}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => window.open(stream.zoomStartUrl, '_blank')}
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
                      >
                        Abrir Zoom
                      </button>
                      <button
                        onClick={() => handleEndStream(stream.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Finalizar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Instrucciones
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Selecciona la asignatura y haz clic en "Iniciar Clase"</li>
                <li>• Se abrirá Zoom automáticamente con tu reunión</li>
                <li>• Los estudiantes verán la clase disponible en su panel</li>
                <li>• Recuerda finalizar la clase cuando termines</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
