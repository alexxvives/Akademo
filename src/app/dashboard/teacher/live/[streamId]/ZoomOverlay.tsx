'use client';

import { useRef } from 'react';
import type { StreamInfo } from './types';

interface ZoomOverlayProps {
  stream: StreamInfo | null;
  zoomJoinUrl: string;
  zoomMeetingId: string | null;
  streamId: string;
  showWhiteboard: boolean;
}

export default function ZoomOverlay({ stream, zoomJoinUrl, zoomMeetingId, streamId, showWhiteboard }: ZoomOverlayProps) {
  const whiteboardUrl = `https://wbo.ophir.dev/boards/akademo-${streamId}`;
  const openLinkRef = useRef<HTMLAnchorElement>(null);

  return (
    <div className="flex-1 flex min-h-0">
      <div className="flex-1 relative">
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
            ref={openLinkRef}
            href={zoomJoinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (zoomMeetingId) {
                e.preventDefault();
                window.location.href = `gotomeeting://join/${zoomMeetingId}`;
                setTimeout(() => window.open(zoomJoinUrl, '_blank', 'noopener,noreferrer'), 2500);
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
      </div>
      {showWhiteboard && (
        <div className="w-[42%] flex-shrink-0 flex flex-col border-l border-white/10">
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-white/10">
            <span className="text-white text-xs font-semibold">Pizarra colaborativa</span>
            <a
              href={whiteboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white text-xs transition-colors"
              title="Abrir en nueva pestaña"
            >
              ↗ Nueva pestaña
            </a>
          </div>
          <iframe
            src={whiteboardUrl}
            className="flex-1 border-0 bg-white"
            title="Pizarra"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      )}
    </div>
  );
}
