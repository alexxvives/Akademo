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
  whatsappGroupLink?: string | null;
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
  const [inLobby, setInLobby] = useState(true);
  const [copiedLobbyLink, setCopiedLobbyLink] = useState(false);
  const [recordingReady, setRecordingReady] = useState(false);
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

        setStream(streamData.data);
        setEmbedUrl(`${tokenData.data.roomUrl}?t=${tokenData.data.token}`);
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
    if (!confirm('¿Finalizar la sesión? La grabación se procesará automáticamente.')) return;
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
      alert('Error al finalizar la sesión');
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
        {/* Back button (lobby only) */}
        {inLobby && (
          <button onClick={() => router.push(backUrl)} className="text-gray-400 hover:text-white transition-colors z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
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
        <div className="ml-auto flex items-center gap-3 z-10">
          <span className="hidden sm:flex items-center gap-1.5 text-red-400 text-xs font-semibold">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            EN VIVO
          </span>
        </div>
      </div>

      {/* Lobby screen */}
      {inLobby ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6 text-center">
            <div>
              <h1 className="text-white text-xl font-semibold mb-1">{stream?.title || 'Clase en vivo'}</h1>
              <p className="text-gray-400 text-sm">{stream?.className}</p>
            </div>

            {/* Status */}
            <div className="bg-white/5 rounded-xl p-4 text-left space-y-2">
              <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
                Estudiantes pueden unirse ahora
              </p>
              <p className="text-gray-400 text-xs">Comparte el link con tus estudiantes antes de entrar</p>
            </div>

            {/* Copy link */}
            <button
              onClick={() => {
                const link = stream?.dailyRoomUrl || '';
                if (link) { navigator.clipboard.writeText(link).catch(() => {}); }
                setCopiedLobbyLink(true);
                setTimeout(() => setCopiedLobbyLink(false), 2000);
              }}
              className={`w-full px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                copiedLobbyLink ? 'bg-green-500/20 text-green-400' : 'bg-white/10 hover:bg-white/15 text-gray-300'
              }`}
            >
              {copiedLobbyLink ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ¡Link copiado!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar Link para estudiantes
                </>
              )}
            </button>

            {/* WhatsApp notify */}
            {stream?.whatsappGroupLink ? (
              <button
                onClick={async () => {
                  const studentLink = stream.dailyRoomUrl || '';
                  const message = `*¡Clase en vivo iniciando!*\n\n*${stream.title}*\n\nÚnete ahora: ${studentLink}`;
                  try { await navigator.clipboard.writeText(message); } catch {}
                  window.open(stream.whatsappGroupLink!, '_blank');
                  const toast = document.createElement('div');
                  toast.textContent = '✓ Mensaje copiado — Pégalo en el grupo';
                  toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#25D366;color:white;padding:12px 24px;border-radius:8px;font-weight:500;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
                  document.body.appendChild(toast);
                  setTimeout(() => toast.remove(), 3000);
                }}
                className="w-full px-4 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Notificar por WhatsApp
              </button>
            ) : (
              <div className="relative group/tip">
                <button disabled className="w-full px-4 py-3 bg-white/5 text-gray-600 rounded-xl font-medium text-sm cursor-not-allowed flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Notificar
                </button>
                <div className="absolute bottom-full left-0 right-0 mb-2 hidden group-hover/tip:flex justify-center pointer-events-none">
                  <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 text-center shadow-lg max-w-xs">
                    Conecta un grupo de WhatsApp en los ajustes de la asignatura
                  </div>
                </div>
              </div>
            )}

            {/* Enter as host */}
            <button
              onClick={() => setInLobby(false)}
              disabled={!embedUrl}
              className="w-full px-4 py-4 bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-wait rounded-xl font-semibold text-base transition-colors flex items-center justify-center gap-2"
            >
              {!embedUrl ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                  Preparando sala...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Entrar como Host
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Daily.co iframe */
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
      )}
    </div>
  );
}
