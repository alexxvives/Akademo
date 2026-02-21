'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { SkeletonLiveStreams } from '@/components/ui/SkeletonLoader';

interface LiveStream {
  id: string;
  classId: string;
  className: string;
  teacherName: string;
  zoomLink?: string;
  zoomMeetingId: string;
  zoomPassword?: string;
  status: 'scheduled' | 'active' | 'LIVE';
}

export default function StudentLivePage() {
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveStreams();
    const interval = setInterval(loadActiveStreams, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const loadActiveStreams = async () => {
    try {
      const res = await apiClient('/live/active');
      const result = await res.json();
      if (result.success) {
        setActiveStreams(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load streams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <SkeletonLiveStreams />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Clases en Vivo</h1>
        <p className="text-sm text-gray-500 mt-1">Únete a las clases que están transmitiendo ahora</p>
      </div>

      {activeStreams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="2" strokeWidth="2"/>
              <circle cx="12" cy="12" r="6" strokeWidth="2"/>
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay clases en vivo</h2>
          <p className="text-gray-500">Esperando a que tu profesor inicie una transmisión...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {activeStreams.map((stream) => (
            <div key={stream.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-500 text-sm font-semibold uppercase">EN VIVO</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{stream.className}</h2>
                  <p className="text-gray-600 mt-1">Profesor: {stream.teacherName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={stream.zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Unirse a la clase
                </a>
                
                {stream.zoomMeetingId && (
                  <div className="text-sm text-gray-500">
                    ID: <span className="font-mono">{stream.zoomMeetingId}</span>
                    {stream.zoomPassword && (
                      <span className="ml-4">Contraseña: <span className="font-mono">{stream.zoomPassword}</span></span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
