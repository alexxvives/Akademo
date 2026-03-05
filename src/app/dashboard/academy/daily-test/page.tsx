'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface ActiveRoom {
  id: string;
  roomName: string;
  roomUrl: string;
  embedUrl: string;
}

export default function AcademyDailyTestPage() {
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  const loadActiveRoom = useCallback(async () => {
    try {
      const res = await apiClient('/daily-test/rooms');
      const result = await res.json();
      if (result.success && result.data.length > 0) {
        const room = result.data[0];
        const tokenRes = await apiClient('/daily-test/token', {
          method: 'POST',
          body: JSON.stringify({ roomName: room.roomName }),
        });
        const tokenResult = await tokenRes.json();
        if (tokenResult.success) {
          setActiveRoom({
            id: room.id,
            roomName: room.roomName,
            roomUrl: room.roomUrl,
            embedUrl: `${room.roomUrl}?t=${tokenResult.data.token}`,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load active room:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveRoom();
    // Fetch user name for watermark
    apiClient('/auth/me').then(r => r.json()).then(r => {
      if (r.success && r.data) setUserName(`${r.data.firstName} ${r.data.lastName}`.trim());
    }).catch(() => {});
  }, [loadActiveRoom]);

  const startStream = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await apiClient('/daily-test/rooms', { method: 'POST', body: '{}' });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Error al crear la sala');
      setActiveRoom(result.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setStarting(false);
    }
  };

  const endStream = async () => {
    if (!activeRoom) return;
    setEnding(true);
    try {
      await apiClient(`/daily-test/rooms/${activeRoom.id}`, { method: 'DELETE' });
      setActiveRoom(null);
    } catch (err) {
      console.error('Failed to end stream:', err);
    } finally {
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-0.5">
              Prototipo Daily.co
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Clase en Vivo (Test)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Prueba de integraciÃ³n con Daily.co â€” pantalla compartida y pizarra disponibles
          </p>
        </div>
        {activeRoom ? (
          <button
            onClick={endStream}
            disabled={ending}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {ending ? 'Finalizando...' : 'Finalizar Stream'}
          </button>
        ) : (
          <button
            onClick={startStream}
            disabled={starting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 font-medium transition-colors"
          >
            <span className="w-2 h-2 bg-red-400 rounded-full" />
            {starting ? 'Iniciando...' : 'Iniciar Stream'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {activeRoom ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black" style={{ height: '70vh', minHeight: 480 }}>
          <iframe
            src={activeRoom.embedUrl}
            allow="camera *; microphone *; fullscreen *; display-capture *; speaker-selection *"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Daily.co Test Stream"
          />
          {/* Watermark overlay â€” visible in screen recordings */}
          {userName && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              style={{ zIndex: 1 }}
              aria-hidden
            >
              <span
                style={{
                  transform: 'rotate(-35deg)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.13)',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  letterSpacing: '0.05em',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
              >
                {userName}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sin transmisiÃ³n activa</h2>
          <p className="text-gray-500 mb-6">Pulsa &quot;Iniciar Stream&quot; para crear una sala Daily.co y comenzar la clase</p>
          <p className="text-xs text-gray-400">Los estudiantes podrÃ¡n unirse desde su pestaÃ±a &quot;Daily.co Test&quot;</p>
        </div>
      )}
    </div>
  );
}
