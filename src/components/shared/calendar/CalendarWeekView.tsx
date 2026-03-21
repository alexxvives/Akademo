'use client';

import type { CalendarEvent } from './calendar-types';
import {
  EVENT_COLORS, EVENT_BORDER_COLORS, WEEKDAYS, WEEK_HOURS,
  formatDateKey, isSameDay, computeOverlapLayout,
} from './calendar-types';

interface CalendarWeekViewProps {
  calendarDays: Date[];
  eventsByDate: Map<string, CalendarEvent[]>;
  canCreateEvents: boolean;
  isDemo: boolean;
  setAddEventDate: (d: Date | null) => void;
  handleEventClick: (event: CalendarEvent) => void;
}

export function CalendarWeekView({
  calendarDays, eventsByDate, canCreateEvents, isDemo,
  setAddEventDate, handleEventClick,
}: CalendarWeekViewProps) {
  const today = new Date();

  const allDayByDate = new Map<string, CalendarEvent[]>();
  const timedByDate = new Map<string, CalendarEvent[]>();

  calendarDays.forEach(day => {
    const key = formatDateKey(day);
    const dayEvents = eventsByDate.get(key) || [];
    const allDay: CalendarEvent[] = [];
    const timed: CalendarEvent[] = [];
    dayEvents.forEach(ev => {
      if (ev.startTime) timed.push(ev);
      else allDay.push(ev);
    });
    allDayByDate.set(key, allDay);
    timedByDate.set(key, timed);
  });

  const hasAnyAllDay = Array.from(allDayByDate.values()).some(arr => arr.length > 0);

  return (
    <div className="border border-gray-200 rounded-lg bg-white" style={{ overflow: 'clip' }}>
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 320px)', minHeight: '460px' }}>

        {/* Sticky day header — inside the scroll container so widths always match */}
        <div className="grid border-b border-gray-200 sticky top-0 bg-white z-20" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div className="border-r border-gray-100" />
          {calendarDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div key={i} className={`text-center py-2 border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
                <div className="text-xs text-gray-500 font-medium">{WEEKDAYS[i]}</div>
                <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {isToday ? (
                    <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm">
                      {day.getDate()}
                    </span>
                  ) : day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {hasAnyAllDay && (
          <div className="grid border-b border-gray-200 bg-white" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
            <div className="border-r border-gray-100 px-1 py-1.5 text-[10px] text-gray-400 text-right">Todo el día</div>
            {calendarDays.map((day, i) => {
              const key = formatDateKey(day);
              const events = allDayByDate.get(key) || [];
              const dayMidnight = new Date(day.getFullYear(), day.getMonth(), day.getDate());
              const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const isAllDayPast = dayMidnight < todayMidnight;
              return (
                <div key={i} className="border-r border-gray-100 last:border-r-0 px-0.5 py-1 space-y-0.5 min-h-[28px]">
                  {events.map(event => (
                    <div
                      key={event.id}
                      style={{ opacity: isAllDayPast ? 0.4 : 1 }}
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text} cursor-pointer`}
                      onClick={() => handleEventClick(event)}
                      title={`${event.title}${event.className ? ` — ${event.className}` : ''}`}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div>
            {WEEK_HOURS.map((hour) => (
              <div key={hour} className="border-r border-b border-gray-100 relative bg-white" style={{ height: '48px' }}>
                <span className="absolute -top-2 right-1 text-[10px] text-gray-400">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {calendarDays.map((day, dayIdx) => {
            const key = formatDateKey(day);
            const isToday = isSameDay(day, today);
            const layout = computeOverlapLayout(timedByDate.get(key) || []);
            const dayMidnight = new Date(day.getFullYear(), day.getMonth(), day.getDate());
            const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isDayPast = dayMidnight < todayMidnight;
            return (
              <div
                key={dayIdx}
                className={`relative border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-blue-50/30' : ''}`}
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

                {layout.map(({ event, col, totalCols, topOffset, height }) => {
                  const isEventPast = isDayPast || (isToday && event.startTime
                    ? (() => {
                        const [h, m] = event.startTime.split(':').map(Number);
                        return (h * 60 + m) < (today.getHours() * 60 + today.getMinutes());
                      })()
                    : false);
                  return (
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
                    className={`rounded px-1.5 py-0.5 overflow-hidden cursor-pointer hover:shadow-md transition-shadow transition-opacity ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text} ${isEventPast ? 'opacity-50' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if ((e.target as HTMLElement).closest('a')) return;
                      handleEventClick(event);
                    }}
                    title={`${event.startTime} — ${event.title}${event.className ? ` (${event.className})` : ''}`}
                  >
                    <div className="flex items-start justify-between gap-0.5">
                      <div className="text-[10px] font-medium truncate flex-1 flex items-center gap-0.5">
                        <span className="truncate">{event.title}</span>
                        {event.zoomLink && (
                          <span className="flex-shrink-0 opacity-70">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </span>
                        )}
                      </div>
                      {event.startTime && <div className="text-[9px] opacity-80 flex-shrink-0">{event.startTime}</div>}
                    </div>
                    {event.className && (
                      <div className="text-[9px] opacity-80 truncate">{event.className}</div>
                    )}
                    {event.location && (
                      <div className="text-[9px] opacity-70 truncate">📍 {event.location}</div>
                    )}
                  </div>
                );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
