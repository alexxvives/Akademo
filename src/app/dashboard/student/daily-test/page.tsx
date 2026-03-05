'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface Room {
  id: string;
  roomName: string;
  roomUrl: string;
  createdAt: string;
}

interface JoinedRoom {
  roomUrl: string;
  embedUrl: string;
  roomName: string;
}

export default function StudentDailyTestPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedRoom, setJoinedRoom] = useState<JoinedRoom | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const loadRooms = useCallback(async () => {
    try {
      const res = await apiClient('/daily-test/rooms');
      const result = await res.json();
      if (result.success) {
        setRooms(result.data || []);
        // Auto-join if we're already in a room that's still active
        if (joinedRoom) {
          const stillActive = (result.data || []).some(
            (r: Room) => r.roomUrl === joinedRoom.roomUrl
          );
          if (!stillActive) setJoinedRoom(null);
        }
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  }, [joinedRoom]);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 8000);
    return () => clearInterval(interval);
  }, [loadRooms]);

  const joinRoom = async (room: Room) => {
    setJoiningId(room.id);
    try {
      const res = await apiClient('/daily-test/token', {
        method: 'POST',
        body: JSON.stringify({ roomName: room.roomName }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Error al unirse');
      setJoinedRoom({
        roomUrl: room.roomUrl,
        roomName: room.roomName,
        embedUrl: `${room.roomUrl}?t=${result.data.token}`,
      });
    } catch (err) {
      console.error('Failed to join room:', err);
    } finally {
      setJoiningId(null);
    }
  };

  const leaveRoom = () => {
    setLeaving(true);
    setTimeout(() => {
      setJoinedRoom(null);
      setLeaving(false);
    }, 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (joinedRoom) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 text-sm font-semibold uppercase">EN VIVO</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Clase en Vivo (Test Daily.co)</h1>
          </div>
          <button
            onClick={leaveRoom}
            disabled={leaving}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
          >
            Salir
          </button>
        </div>
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-black" style={{ height: '72vh', minHeight: 480 }}>
          <iframe
            src={joinedRoom.embedUrl}
            allow="camera; microphone; fullscreen; display-capture; speaker-selection"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Daily.co Live Class"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-0.5">
            Prototipo Daily.co
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Clase en Vivo (Test)</h1>
        <p className="text-sm text-gray-500 mt-1">
          Únete a las clases activas — sin necesidad de instalar nada
        </p>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="2" strokeWidth="2" />
              <circle cx="12" cy="12" r="6" strokeWidth="2" />
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay clases en vivo</h2>
          <p className="text-gray-500">Esperando a que tu profesor inicie una transmisión...</p>
          <p className="text-xs text-gray-400 mt-3">Esta página se actualiza automáticamente cada 8 segundos</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-500 text-xs font-semibold uppercase">En vivo</span>
                  </div>
                  <p className="font-semibold text-gray-900">Clase Daily.co Test</p>
                  <p className="text-xs text-gray-400 mt-0.5">Sala activa — cámara, micrófono y pizarra disponibles</p>
                </div>
              </div>
              <button
                onClick={() => joinRoom(room)}
                disabled={joiningId === room.id}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 font-medium text-sm transition-colors"
              >
                {joiningId === room.id ? 'Uniéndose...' : 'Unirse'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
