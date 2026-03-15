'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

const getLogoSrc = (url: string) => url.startsWith('http') ? url : `/api/storage/serve/${url}`;

interface StreamInfo {
  id: string;
  title: string;
  className: string;
  classSlug?: string;
  classId: string;
  status: string;
  dailyRoomUrl: string | null;
  academyName?: string;
  academyLogoUrl?: string;
}

export default function TeacherLivePage() {
  const { streamId } = useParams<{ streamId: string }>();
  const router = useRouter();
  const [stream, setStream] = useState<StreamInfo | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isZoom, setIsZoom] = useState(false);
  const [zoomJoinUrl, setZoomJoinUrl] = useState<string | null>(null);
  const [zoomMeetingId, setZoomMeetingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ended] = useState(false);
  const [recordingReady] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartedRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Load stream info first, then generate join token with redirect URL embedded in token
        const streamRes = await apiClient(`/live/${streamId}`);
        const streamData = await streamRes.json();

        if (!streamData.success) { setError(streamData.error || 'Stream no encontrado'); return; }

        const sData = streamData.data;
        setStream(sData);

        const tokenRes = await apiClient(`/live/${streamId}/join-token`);
        const tokenData = await tokenRes.json();

        if (!tokenData.success) { setError(tokenData.error || 'Error al cargar la sala'); return; }

        if (tokenData.data.isZoom) {
          setIsZoom(true);
          setZoomJoinUrl(tokenData.data.zoomLink || null);
          setZoomMeetingId(tokenData.data.zoomMeetingId || null);
        } else {
          setEmbedUrl(`${tokenData.data.roomUrl}?t=${tokenData.data.token}`);
        }
      } catch {
        setError('Error de conexión');
      }
    };
    init();
  }, [streamId]);

  const startRecording = useCallback(async () => {
    if (recordingStartedRef.current) return;
    try {
      const res = await apiClient(`/live/${streamId}/start-recording`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data?.started) recordingStartedRef.current = true;
    } catch {}
  }, [streamId]);

  const backUrl = stream ? `/dashboard/teacher/subject/${stream.classSlug || stream.classId}` : '/dashboard/teacher/streams';

  const endSession = useCallback(() => {
    // fire-and-forget: navigate away immediately, API cleanup runs in background
    apiClient(`/live/${streamId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ended' }),
    }).catch(() => {});
    router.push(backUrl);
  }, [streamId, backUrl, router]);

  const dailyContainerRef = useRef<HTMLDivElement>(null);

  // Use @daily-co/daily-js SDK — proper typed events, no fragile postMessage parsing
  useEffect(() => {
    if (!embedUrl || !dailyContainerRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let callFrame: any = null;
    const t1 = setTimeout(startRecording, 8000);
    const t2 = setTimeout(startRecording, 25000);
    const t3 = setTimeout(startRecording, 60000);
    const setup = async () => {
      const { default: DailyIframe } = await import('@daily-co/daily-js');
      callFrame = DailyIframe.createFrame(dailyContainerRef.current!, {
        iframeStyle: { border: '0', width: '100%', height: '100%' },
      });
      callFrame.on('joined-meeting', () => startRecording());
      callFrame.on('left-meeting', () => endSession());
      await callFrame.join({ url: embedUrl });
    };
    setup().catch(console.error);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      callFrame?.destroy();
    };
  }, [embedUrl, startRecording, endSession]);



  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

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

  if (ended) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white space-y-6 max-w-sm mx-auto px-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Sesión finalizada</h2>
            {recordingReady ? (
              <p className="text-green-400 text-sm">✓ Grabación disponible en el historial de streams</p>
            ) : (
              <p className="text-gray-400 text-sm">La grabación se está procesando. Estará disponible en breve en el historial de streams.</p>
            )}
          </div>
          <button
            onClick={() => router.push(backUrl)}
            className="w-full px-4 py-3 bg-white text-gray-900 hover:bg-gray-100 rounded-lg font-semibold transition-colors"
          >
            Ir a la asignatura
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 relative flex items-center px-4 py-3 bg-gray-900 border-b border-white/10">
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
        <div className="ml-auto flex items-center gap-2 z-10">
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
          <span className="hidden sm:flex items-center gap-1.5 text-red-400 text-xs font-semibold">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            EN VIVO
          </span>
        </div>
      </div>

      {/* Main content: split when whiteboard is open */}
      <div className="flex-1 flex min-h-0">
        {/* Daily.co iframe or GTM overlay */}
        <div className="flex-1 relative">
          {isZoom && zoomJoinUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gray-900">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.867V15.133a1 1 0 01-1.447.902L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-white text-lg font-semibold">{stream?.title || 'Clase en vivo'}</h2>
                <p className="text-gray-400 text-sm">La reunión se abre en la app de GoTo Meeting</p>
              </div>
              <a
                href={zoomJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (zoomMeetingId) {
                    e.preventDefault();
                    window.location.href = `gotomeeting://join/${zoomMeetingId}`;
                    setTimeout(() => window.open(zoomJoinUrl!, '_blank', 'noopener,noreferrer'), 2500);
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-[#b1e787] text-gray-900 rounded-xl hover:bg-[#9fd470] font-semibold transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Abrir GoTo Meeting
              </a>
            </div>
          ) : !embedUrl ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400 space-y-3">
                <div className="w-10 h-10 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto" />
                <p className="text-sm">Preparando sala...</p>
              </div>
            </div>
          ) : (
            <div ref={dailyContainerRef} className="absolute inset-0" />
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
