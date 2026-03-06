'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import DailyWatermark from '@/components/DailyWatermark';

const getLogoSrc = (url: string) => url.startsWith('http') ? url : `/api/storage/serve/${url}`;

interface StreamInfo {
  id: string;
  title: string;
  className: string;
  classId: string;
  classSlug?: string;
  status: string;
  academyName?: string;
  academyLogoUrl?: string;
}

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  id: string;
}

export default function StudentLivePage() {
  const { streamId } = useParams<{ streamId: string }>();
  const router = useRouter();
  const [stream, setStream] = useState<StreamInfo | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [streamRes, tokenRes, meRes] = await Promise.all([
          apiClient(`/live/${streamId}`),
          apiClient(`/live/${streamId}/join-token`),
          apiClient('/auth/me'),
        ]);
        const streamData = await streamRes.json();
        const tokenData = await tokenRes.json();
        const meData = await meRes.json();

        if (!streamData.success) { setError(streamData.error || 'Sesión no encontrada'); return; }
        if (!tokenData.success) { setError(tokenData.error || 'No tienes acceso a esta sesión'); return; }

        setStream(streamData.data);
        setEmbedUrl(`${tokenData.data.roomUrl}?t=${tokenData.data.token}`);

        if (meData.success && meData.data) {
          setUser(meData.data);
        }
      } catch {
        setError('Error de conexión');
      }
    };
    init();
  }, [streamId]);

  const backUrl = stream ? `/dashboard/student/subject/${(stream as any).classSlug || stream.classId}` : '/dashboard/student/live';

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <p className="text-red-400 text-lg">{error}</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  const displayEmail = user?.email || '';
  const displayId = user?.id || '';

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 relative flex items-center px-4 py-3 bg-gray-900 border-b border-white/10">
        {/* Left: back */}
        <button
          onClick={() => router.push(backUrl)}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 rounded z-10"
          title="Volver"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {/* Center: academy branding */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {stream?.academyLogoUrl ? (
              <img src={getLogoSrc(stream.academyLogoUrl)} alt={stream.academyName || 'Logo'} className="h-7 w-7 rounded object-cover" />
            ) : (
              <div className="h-7 w-7 rounded bg-white/10 flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
            )}
            <span className="text-white text-sm font-semibold">
              {stream?.academyName || 'AKADEMO'}
            </span>
          </div>
        </div>
        {/* Right: EN VIVO */}
        <div className="ml-auto z-10">
          <span className="flex items-center gap-1.5 text-red-400 text-xs font-semibold">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            EN VIVO
          </span>
        </div>
      </div>

      {/* Video area with watermark overlay */}
      <div className="flex-1 relative">
        {!embedUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400 space-y-3">
              <div className="w-10 h-10 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto" />
              <p className="text-sm">Conectando a la sesión...</p>
            </div>
          </div>
        ) : (
          <>
            <iframe
              src={embedUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
              title="Sesión en vivo"
            />
            {displayName && (
              <DailyWatermark
                name={displayName}
                email={displayEmail}
                userId={displayId}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
