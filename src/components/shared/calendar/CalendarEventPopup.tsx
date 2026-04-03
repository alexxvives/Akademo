'use client';

import type { CalendarEvent } from './calendar-types';
import { EVENT_COLORS, EVENT_LABELS } from './calendar-types';

interface CalendarEventPopupProps {
  popupEvent: CalendarEvent;
  setPopupEvent: (event: CalendarEvent | null) => void;
  canCreateEvents: boolean;
  isDemo: boolean;
  navigateToEvent: (event: CalendarEvent) => void;
  handleEditEvent: (event: CalendarEvent) => void;
  handleDeleteEvent: (eventId: string) => Promise<void>;
}

export function CalendarEventPopup({
  popupEvent, setPopupEvent, canCreateEvents, isDemo,
  navigateToEvent, handleEditEvent, handleDeleteEvent,
}: CalendarEventPopupProps) {
  const rawDate = popupEvent.date ? popupEvent.date.replace(' ', 'T') : '';
  const d = rawDate ? new Date(rawDate.includes('T') ? rawDate : rawDate + 'T12:00:00') : null;
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const dateLabel = d && !isNaN(d.getTime())
    ? `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
    : null;
  const accentColor = EVENT_COLORS[popupEvent.type]?.bg ?? 'bg-gray-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => setPopupEvent(null)}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ animation: 'popupIn 0.18s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`h-1.5 w-full ${accentColor}`} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${accentColor}`}>
              {EVENT_LABELS[popupEvent.type]}
            </span>
            <button
              onClick={() => setPopupEvent(null)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-3">{popupEvent.title}</h3>
          <div className="space-y-2">
            {(dateLabel || popupEvent.startTime) && (
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{[dateLabel, popupEvent.startTime].filter(Boolean).join(' · ')}</span>
              </div>
            )}
            {popupEvent.className && (
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="truncate">{popupEvent.className}</span>
              </div>
            )}
            {popupEvent.location && (
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{popupEvent.location}</span>
              </div>
            )}
            {popupEvent.zoomLink && (
              <div className="flex items-center gap-2.5 text-sm">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <a
                  href={popupEvent.zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline truncate font-medium"
                  onClick={(e) => {
                    if (!window.confirm('\u00bfQuieres unirte a la sesión de Zoom?')) e.preventDefault();
                  }}
                >
                  Unirse al Zoom
                </a>
              </div>
            )}
            {popupEvent.extra && !['En vivo', 'Programado'].includes(popupEvent.extra) && (
              <p className="text-xs text-gray-500 pl-[26px] leading-relaxed">{popupEvent.extra}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-5 pb-4">
          <button
            onClick={() => navigateToEvent(popupEvent)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${accentColor.replace('bg-', 'bg-').replace('-600', '-50').replace('-700', '-100')} text-gray-700 hover:bg-gray-100`}
            title="Ver detalle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Ver
          </button>
          {canCreateEvents && !isDemo && (
            (popupEvent.manual && !popupEvent.id.startsWith('stream-')) ||
            (popupEvent.id.startsWith('stream-') && popupEvent.status !== 'ended')
          ) && (
            <button
              onClick={() => { setPopupEvent(null); handleEditEvent(popupEvent); }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-medium transition-colors"
              title="Editar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
          )}
          {canCreateEvents && !isDemo && popupEvent.manual && !popupEvent.id.startsWith('stream-') && (
            <button
              onClick={async () => {
                await handleDeleteEvent(popupEvent.id);
                setPopupEvent(null);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium transition-colors ml-auto"
              title="Eliminar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes popupIn { from { opacity:0; transform:scale(0.95) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
