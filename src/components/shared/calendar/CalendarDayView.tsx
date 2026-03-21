'use client';

import type { RefObject } from 'react';
import type { CalendarEvent } from './calendar-types';
import {
  EVENT_COLORS, EVENT_BORDER_COLORS, WEEKDAYS, WEEK_HOURS,
  formatDateKey, isSameDay, computeOverlapLayout,
} from './calendar-types';

interface CalendarDayViewProps {
  calendarDays: Date[];
  eventsByDate: Map<string, CalendarEvent[]>;
  canCreateEvents: boolean;
  isDemo: boolean;
  dayViewScrollRef: RefObject<HTMLDivElement>;
  setAddEventDate: (d: Date | null) => void;
  handleEventClick: (event: CalendarEvent) => void;
}

export function CalendarDayView({
  calendarDays, eventsByDate, canCreateEvents, isDemo,
  dayViewScrollRef, setAddEventDate, handleEventClick,
}: CalendarDayViewProps) {
  const day = calendarDays[0];
  const today = new Date();
  const key = formatDateKey(day);
  const dayEvents = (eventsByDate.get(key) || []);
  const isToday = isSameDay(day, today);

  const allDayEvents = dayEvents.filter(ev => !ev.startTime);
  const timedEvents = dayEvents.filter(ev => ev.startTime);

  return (
    <div>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: '64px 1fr' }}>
          <div className="border-r border-gray-100" />
          <div className={`text-center py-2 ${isToday ? 'bg-blue-50' : ''}`}>
            <div className="text-xs text-gray-500 font-medium">{WEEKDAYS[(day.getDay() + 6) % 7]}</div>
            <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
              {isToday ? (
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm">
                  {day.getDate()}
                </span>
              ) : day.getDate()}
            </div>
          </div>
        </div>
        {allDayEvents.length > 0 && (
          <div className="border-b border-gray-200 px-2 py-1.5 space-y-1">
            <div className="text-[10px] text-gray-400 mb-1">Todo el día</div>
            {allDayEvents.map(event => (
              <div
                key={event.id}
                className={`text-xs px-2 py-1 rounded ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text} cursor-pointer truncate`}
                onClick={() => handleEventClick(event)}
              >
                {event.title}{event.className ? ` — ${event.className}` : ''}
              </div>
            ))}
          </div>
        )}

        <div ref={dayViewScrollRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 380px)', minHeight: '400px' }}>
          <div className="flex">
            <div className="flex-shrink-0 w-16">
              {WEEK_HOURS.map((hour) => (
                <div key={hour} className="border-r border-b border-gray-100 relative bg-white" style={{ height: '48px' }}>
                  <span className="absolute -top-2 right-1 text-[10px] text-gray-400">
                    {String(hour).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            <div
              className={`flex-1 relative ${isToday ? 'bg-blue-50/30' : ''}`}
              style={{ height: `${WEEK_HOURS.length * 48}px` }}
              onClick={() => { if (canCreateEvents && !isDemo) setAddEventDate(day); }}
            >
              {WEEK_HOURS.map((_, i) => (
                <div key={i} className="absolute w-full border-b border-gray-100 pointer-events-none" style={{ top: `${i * 48}px`, height: '48px', left: 0 }} />
              ))}

              {isToday && (() => {
                const now = new Date();
                const h = now.getHours();
                const m = now.getMinutes();
                if (h < WEEK_HOURS[0] || h > WEEK_HOURS[WEEK_HOURS.length - 1]) return null;
                const topPx = (h - WEEK_HOURS[0]) * 48 + (m / 60) * 48;
                return (
                  <div className="absolute w-full pointer-events-none" style={{ top: `${topPx}px`, left: 0, zIndex: 20 }}>
                    <div className="relative">
                      <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                      <div className="h-0.5 bg-red-500 w-full" />
                    </div>
                  </div>
                );
              })()}

              {computeOverlapLayout(timedEvents).map(({ event, col, totalCols, topOffset, height }) => (
                <div
                  key={event.id}
                  style={{
                    position: 'absolute',
                    top: `${Math.max(topOffset, 0)}px`,
                    height: `${Math.max(height, 22)}px`,
                    left: `calc(${(col / totalCols) * 100}% + 1px)`,
                    width: `calc(${(1 / totalCols) * 100}% - 2px)`,
                    zIndex: 10,
                    borderLeftWidth: '2px',
                    borderLeftStyle: 'solid',
                    borderLeftColor: EVENT_BORDER_COLORS[event.type],
                  }}
                  className={`rounded px-2 py-1 overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if ((e.target as HTMLElement).closest('a')) return;
                    handleEventClick(event);
                  }}
                  title={`${event.startTime} — ${event.title}${event.className ? ` (${event.className})` : ''}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="text-xs font-medium truncate flex-1 flex items-center gap-0.5">
                      <span className="truncate">{event.title}</span>
                      {event.zoomLink && (
                        <span className="flex-shrink-0 opacity-70">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </span>
                      )}
                    </div>
                    {event.startTime && <div className="text-[10px] opacity-80 flex-shrink-0">{event.startTime}</div>}
                  </div>
                  {event.className && (
                    <div className="text-[10px] opacity-80 truncate">{event.className}</div>
                  )}
                  {event.location && (
                    <div className="text-[10px] opacity-70 truncate">📍 {event.location}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
