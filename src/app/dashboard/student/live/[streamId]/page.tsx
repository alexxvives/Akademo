'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import DailyWatermark from '@/components/DailyWatermark';
import ZoomJoinOverlay from './ZoomJoinOverlay';
import { getLogoSrc } from './types';
import type { StreamInfo, UserInfo } from './types';

export default function StudentLivePage() {
  const { streamId } = useParams<{ streamId: string }>();
  const router = useRouter();
  const [stream, setStream] = useState<StreamInfo | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isZoom, setIsZoom] = useState(false);
  const [zoomJoinUrl, setZoomJoinUrl] = useState<string | null>(null);
  const [zoomMeetingId, setZoomMeetingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [watermarkIntervalMins, setWatermarkIntervalMins] = useState(5);

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

        if (tokenData.data.watermarkIntervalMins) {
          setWatermarkIntervalMins(tokenData.data.watermarkIntervalMins);
        }

        if (tokenData.data.isZoom) {
          setIsZoom(true);
          setZoomJoinUrl(tokenData.data.zoomLink);
          setZoomMeetingId(tokenData.data.zoomMeetingId || null);
        } else {
          setEmbedUrl(`${tokenData.data.roomUrl}?t=${tokenData.data.token}`);
        }

        if (meData.success && meData.data) {
          setUser(meData.data);
        }
      } catch {
        setError('Error de conexión');
      }
    };
    init();
  }, [streamId]);

  const backUrl = stream ? `/dashboard/student/subject/${stream.classSlug || stream.classId}` : '/dashboard/student/live';

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

  // Listen for Daily.co left-meeting event so students are redirected when host ends the session
  useEffect(() => {
    if (!embedUrl) return;
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;
      const m = e.data;
      if (
        m.action === 'left-meeting' || m.eventName === 'left-meeting' ||
        m.action === 'meeting-left' || m.type === 'meeting-left' ||
        (m.type === 'daily-event' && m.eventName === 'left-meeting')
      ) router.push(backUrl);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [embedUrl, backUrl, router]);

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
              <Image src={getLogoSrc(stream.academyLogoUrl)} alt={stream.academyName || 'Logo'} width={28} height={28} className="h-7 w-7 rounded object-cover" unoptimized />
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
        <div className="ml-auto z-10 flex items-center gap-2">
          {!isZoom && (
            <button
              onClick={() => setShowWhiteboard(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${showWhiteboard ? 'bg-violet-600 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-300'}`}
              title="Pizarra colaborativa"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Pizarra
            </button>
          )}
          <span className="flex items-center gap-1.5 text-red-400 text-xs font-semibold">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            EN VIVO
          </span>
          <button
            onClick={() => router.push(backUrl)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Salir
          </button>
        </div>
      </div>

      {/* Video area with watermark overlay */}
      <div className="flex-1 flex min-h-0">
        {/* Daily.co iframe + watermark */}
        <div className="flex-1 relative">
          {isZoom && zoomJoinUrl ? (
            <ZoomJoinOverlay
              streamTitle={stream?.title || 'Clase en vivo'}
              zoomJoinUrl={zoomJoinUrl}
              zoomMeetingId={zoomMeetingId}
              displayName={displayName}
              displayEmail={displayEmail}
              displayId={displayId}
              watermarkIntervalMins={watermarkIntervalMins}
            />
          ) : !embedUrl ? (
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
                  watermarkIntervalMins={watermarkIntervalMins}
                />
              )}
            </>
          )}
        </div>
        {/* Collaborative whiteboard panel */}
        {showWhiteboard && (
          <div className="w-[42%] flex-shrink-0 flex flex-col border-l border-white/10">
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-white/10">
              <span className="text-white text-xs font-semibold">Pizarra colaborativa</span>
              <a
                href={`https://wbo.ophir.dev/boards/akademo-${streamId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-xs transition-colors"
                title="Abrir en nueva pestaña"
              >
                ↗ Nueva pestaña
              </a>
            </div>
            <iframe
              src={`https://wbo.ophir.dev/boards/akademo-${streamId}`}
              className="flex-1 border-0 bg-white"
              title="Pizarra"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        )}
      </div>
    </div>
  );
}
