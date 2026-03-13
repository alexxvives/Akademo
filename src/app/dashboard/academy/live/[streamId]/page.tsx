'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, API_BASE_URL } from '@/lib/api-client';

const getLogoSrc = (url: string) => url.startsWith('http') ? url : `/api/storage/serve/${url}`;

interface StreamInfo {
  id: string;
  title: string;
  className: string;
  classId: string;
  classSlug?: string;
  status: string;
  dailyRoomUrl: string | null;
  academyName?: string;
  academyLogoUrl?: string;
}

export default function AcademyLivePage() {
  const { streamId } = useParams<{ streamId: string }>();
  const router = useRouter();
  const [stream, setStream] = useState<StreamInfo | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [ended, setEnded] = useState(false);
  const [recordingReady, setRecordingReady] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartedRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [streamRes, tokenRes] = await Promise.all([
          apiClient(`/live/${streamId}`),
          apiClient(`/live/${streamId}/join-token`),
        ]);
        const streamData = await streamRes.json();
        const tokenData = await tokenRes.json();

        if (!streamData.success) { setError(streamData.error || 'Stream no encontrado'); return; }
        if (!tokenData.success) { setError(tokenData.error || 'Error al cargar la sala'); return; }

        const sData = streamData.data;
        setStream(sData);
        const redirectUrl = encodeURIComponent(
          `${window.location.origin}/dashboard/academy/subject/${sData.classSlug || sData.classId}`
        );
        setEmbedUrl(`${tokenData.data.roomUrl}?t=${tokenData.data.token}&redirect_on_meeting_exit=${redirectUrl}`);
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

  // Start recording when host joins: listen for Daily.co postMessage + fallback retries
  useEffect(() => {
    if (!embedUrl) return;
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;
      const m = e.data;
      if (
        m.action === 'joined-meeting' || m.eventName === 'joined-meeting' ||
        m.action === 'meeting-joined' || m.type === 'meeting-joined' ||
        (m.type === 'daily-event' && m.eventName === 'joined-meeting')
      ) startRecording();
    };
    window.addEventListener('message', handleMessage);
    const t1 = setTimeout(startRecording, 8000);
    const t2 = setTimeout(startRecording, 25000);
    const t3 = setTimeout(startRecording, 60000);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, [embedUrl, startRecording]);



  const handleEndSession = async () => {
    if (!confirm('Â¿Finalizar la sesiÃ³n? La grabaciÃ³n se procesarÃ¡ automÃ¡ticamente.')) return;
    setEnding(true);
    try {
      const res = await apiClient(`/live/${streamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' }),
      });
      const result = await res.json();
      if (result.success) {
        setEnded(true);
        pollRef.current = setInterval(async () => {
          const r = await apiClient(`/live/${streamId}/check-recording`);
          const d = await r.json();
          if (d.success && d.data?.recordingId) {
            setRecordingReady(true);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }, 8000);
      }
    } catch {
      alert('Error al finalizar la sesiÃ³n');
    } finally {
      setEnding(false);
    }
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const backUrl = stream ? `/dashboard/academy/subject/${(stream as any).classSlug || stream.classId}` : '/dashboard/academy/streams';

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <p className="text-red-400 text-lg">{error}</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
            â† Volver
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
            <h2 className="text-xl font-semibold mb-2">SesiÃ³n finalizada</h2>
            {recordingReady ? (
              <p className="text-green-400 text-sm">âœ“ GrabaciÃ³n disponible en el historial de streams</p>
            ) : (
              <p className="text-gray-400 text-sm">La grabaciÃ³n se estÃ¡ procesando. EstarÃ¡ disponible en breve en el historial de streams.</p>
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
        <div className="ml-auto flex items-center gap-2 z-10">
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
          <span className="hidden sm:flex items-center gap-1.5 text-red-400 text-xs font-semibold">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            EN VIVO
          </span>
        </div>
      </div>

      {/* Main content: split when whiteboard is open */}
      <div className="flex-1 flex min-h-0">
        {/* Daily.co iframe */}
        <div className="flex-1 relative">
          {!embedUrl ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400 space-y-3">
                <div className="w-10 h-10 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto" />
                <p className="text-sm">Preparando sala...</p>
              </div>
            </div>
          ) : (
            <iframe
              src={embedUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
              title="Sesión en vivo"
            />
          )}
        </div>
        {/* Collaborative whiteboard panel */}
        {showWhiteboard && (
          <div className="w-[42%] flex-shrink-0 flex flex-col border-l border-white/10">
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-white/10">
              <span className="text-white text-xs font-semibold">Pizarra colaborativa</span>
              <a
                href={`https://www.tldraw.com/r/akademo-${streamId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-xs transition-colors"
                title="Abrir en nueva pestaña"
              >
                ↗ Nueva pestaña
              </a>
            </div>
            <iframe
              src={`https://www.tldraw.com/r/akademo-${streamId}`}
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
