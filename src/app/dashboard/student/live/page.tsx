'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { WatermarkOverlay } from '@/components/video/WatermarkOverlay';

interface LiveStream {
  id: string;
  classId: string;
  className: string;
  teacherName: string;
  title: string;
  zoomLink: string;
  status: 'LIVE';
  startedAt: string;
}

interface UserSession {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function StudentLivePage() {
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWatermark, setShowWatermark] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const watermarkInterval = useRef<NodeJS.Timeout | null>(null);
  const watermarkDisplay = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadUserInfo();
    loadActiveStreams();
    // Poll for active streams every 10 seconds
    const interval = setInterval(loadActiveStreams, 10000);
    return () => {
      clearInterval(interval);
      if (watermarkInterval.current) clearInterval(watermarkInterval.current);
      if (watermarkDisplay.current) clearTimeout(watermarkDisplay.current);
    };
  }, []);

  const loadUserInfo = async () => {
    try {
      const res = await apiClient('/auth/me');
      const result = await res.json();
      if (result.success && result.data) {
        const user: UserSession = result.data;
        setStudentName(`${user.firstName} ${user.lastName}`);
        setStudentEmail(user.email);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const loadActiveStreams = async () => {
    try {
      const res = await apiClient('/explore/enrolled-academies/classes');
      const result = await res.json();
      if (result.success && result.data) {
        // Filter to only show classes with active streams
        const classesWithStreams = result.data.filter(
          (c: any) => c.activeStreams && c.activeStreams.length > 0
        );
        const streams: LiveStream[] = classesWithStreams.flatMap((c: any) =>
          c.activeStreams.map((s: any) => ({
            ...s,
            className: c.name,
            teacherName: c.teacherName || 'Profesor',
          }))
        );
        setActiveStreams(streams);
      }
    } catch (error) {
      console.error('Failed to load active streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerWatermark = useCallback(() => {
    setShowWatermark(true);
    // Hide after 5 seconds
    watermarkDisplay.current = setTimeout(() => {
      setShowWatermark(false);
    }, 5000);
  }, []);

  const handleJoinStream = (stream: LiveStream) => {
    setSelectedStream(stream);
    // Start watermark interval (every 5 minutes)
    triggerWatermark();
    watermarkInterval.current = setInterval(triggerWatermark, 5 * 60 * 1000);
    // Open Zoom link
    window.open(stream.zoomLink, '_blank');
  };

  const handleLeaveStream = () => {
    setSelectedStream(null);
    setShowWatermark(false);
    if (watermarkInterval.current) {
      clearInterval(watermarkInterval.current);
      watermarkInterval.current = null;
    }
    if (watermarkDisplay.current) {
      clearTimeout(watermarkDisplay.current);
      watermarkDisplay.current = null;
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">En vivo</h1>
        <p className="text-gray-600 mt-2">
          Únete a clases en vivo de tus asignaturas
        </p>
      </div>

      {/* Active Streams */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Clases activas
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : activeStreams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📺</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No hay clases en vivo
              </h3>
              <p className="text-gray-500">
                Cuando tus profesores inicien una clase en vivo, aparecerá aquí
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 animate-pulse">
                          🔴 EN VIVO
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {stream.className}
                      </h3>
                      {stream.title && (
                        <p className="text-gray-600 mb-2">{stream.title}</p>
                      )}
                      <p className="text-sm text-gray-500 mb-1">
                        Profesor: {stream.teacherName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Iniciada:{' '}
                        {new Date(stream.startedAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <button
                      onClick={() => handleJoinStream(stream)}
                      className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                    >
                      Unirse a clase
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Currently Watching Card */}
        {selectedStream && (
          <div className="mt-8 bg-gradient-to-r from-brand-50 to-brand-100 border border-brand-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                    🔴 EN VIVO
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedStream.className}
                  </h3>
                </div>
                <p className="text-sm text-gray-700">
                  Estás participando en esta clase
                </p>
              </div>
              <button
                onClick={handleLeaveStream}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
              >
                Salir de clase
              </button>
            </div>

            {/* Watermark Overlay */}
            <div className="relative mt-4 bg-black/10 rounded-lg p-4 min-h-[100px]">
              <WatermarkOverlay
                showWatermark={showWatermark}
                studentName={studentName}
                studentEmail={studentEmail}
                plyrContainer={null}
                isUnlimitedUser={false}
              />
              <div className="text-center text-sm text-gray-600">
                ⚠️ Esta clase está protegida con marca de agua
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Instrucciones
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>
                  • Las clases en vivo de tus asignaturas aparecerán aquí cuando
                  el profesor las inicie
                </li>
                <li>
                  • Haz clic en "Unirse a clase" para acceder a la reunión de
                  Zoom
                </li>
                <li>
                  • La clase está protegida con marca de agua para tu seguridad
                </li>
                <li>
                  • Puedes ver la lista de participantes en la reunión de Zoom
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
