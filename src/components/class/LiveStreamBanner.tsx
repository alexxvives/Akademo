'use client';

import { apiClient } from '@/lib/api-client';
import type { LiveClass, ClassData } from './types';

interface LiveStreamBannerProps {
  liveClasses: LiveClass[];
  classData: ClassData;
  basePath: string;
  copiedLink: boolean;
  setCopiedLink: (v: boolean) => void;
  onDeleteStream: (id: string) => void;
  onNavigate: (path: string) => void;
}

export default function LiveStreamBanner({
  liveClasses,
  classData,
  basePath,
  copiedLink,
  setCopiedLink,
  onDeleteStream,
  onNavigate,
}: LiveStreamBannerProps) {
  if (liveClasses.length === 0 || liveClasses[0].status === 'recording_failed') return null;

  const stream = liveClasses[0];

  return (
    <div className="relative group rounded-xl p-4 bg-gray-100 border-2 border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{stream.title}</p>
              {stream.participantCount != null && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full inline-flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  {stream.participantCount || 0}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm">
              {stream.status === 'active'
                ? 'Estudiantes pueden unirse ahora'
                : 'Haz clic en "Entrar como Host" para iniciar'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!stream.zoomMeetingId ? (
            <button
              onClick={() => onNavigate(`${basePath}/live/${stream.id}`)}
              className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg font-semibold text-sm transition-colors"
            >
              Entrar como Host
            </button>
          ) : (
            <button
              onClick={async () => {
                const isGTM = !!(stream.zoomLink?.includes('meet.goto.com') || stream.zoomLink?.includes('gotomeeting'));
                if (isGTM && stream.zoomMeetingId) {
                  let hostUrl = stream.zoomStartUrl || `https://app.gotomeeting.com/join/${stream.zoomMeetingId}`;
                  try {
                    const patchRes = await apiClient(`/live/${stream.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'active' }),
                    });
                    const patchData = await patchRes.json() as { success?: boolean; data?: { freshHostUrl?: string } };
                    if (patchData?.data?.freshHostUrl) {
                      hostUrl = patchData.data.freshHostUrl;
                    }
                  } catch {
                    // non-fatal
                  }
                  window.open(hostUrl, '_blank', 'noopener,noreferrer');
                } else {
                  window.open(stream.zoomStartUrl || stream.zoomLink || '', '_blank', 'noopener,noreferrer');
                }
              }}
              className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg font-semibold text-sm transition-colors"
            >
              Entrar como Host
            </button>
          )}
          <button
            onClick={() => {
              const link = stream.dailyRoomUrl || stream.zoomLink || '';
              navigator.clipboard.writeText(link);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
              copiedLink
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title="Copiar link para estudiantes"
          >
            {copiedLink ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">¡Copiado!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Copiar Link</span>
              </>
            )}
          </button>
          {classData?.whatsappGroupLink ? (
            <button
              onClick={async () => {
                const studentLink = stream.dailyRoomUrl || stream.zoomLink || '';
                const message = `*¡Clase en vivo iniciando!*\n\n*${stream.title}*\n\nÚnete ahora: ${studentLink}`;
                try {
                  await navigator.clipboard.writeText(message);
                } catch {
                  // clipboard not available
                }
                window.open(classData.whatsappGroupLink!, '_blank');
                const toast = document.createElement('div');
                toast.textContent = '✓ Mensaje copiado — Pégalo en el grupo';
                toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#25D366;color:white;padding:12px 24px;border-radius:8px;font-weight:500;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
              }}
              className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors flex items-center gap-2"
              title="Notificar por WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-sm font-medium">Notificar</span>
            </button>
          ) : (
            <div className="relative group/tip">
              <button
                disabled
                className="px-3 py-2 bg-gray-100 text-gray-400 rounded-lg flex items-center gap-2 cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-sm font-medium">Notificar</span>
              </button>
              <div className="absolute top-full right-0 mt-2 hidden group-hover/tip:block z-20 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  Conecta un grupo de WhatsApp en los ajustes de la asignatura
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Delete stream button */}
      <button
        onClick={() => onDeleteStream(stream.id)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 flex"
        title="Eliminar stream"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
