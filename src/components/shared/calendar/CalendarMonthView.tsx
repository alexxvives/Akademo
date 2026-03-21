'use client';

import type { CalendarEvent } from './calendar-types';
import { EVENT_COLORS, WEEKDAYS, formatDateKey, isSameDay } from './calendar-types';

interface CalendarMonthViewProps {
  calendarDays: Date[];
  currentDate: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  dragOverDate: string | null;
  canCreateEvents: boolean;
  isDemo: boolean;
  setDragOverDate: (date: string | null) => void;
  setCurrentDate: (d: Date) => void;
  setViewMode: (mode: 'month' | 'week' | 'day') => void;
  setSelectedDay: (d: Date | null) => void;
  setAddEventDate: (d: Date | null) => void;
  handleDragStart: (e: React.DragEvent, eventId: string) => void;
  handleDragOver: (e: React.DragEvent, dateKey: string) => void;
  handleDrop: (e: React.DragEvent, date: Date) => void;
  handleEventClick: (event: CalendarEvent) => void;
}

export function CalendarMonthView({
  calendarDays, currentDate, eventsByDate, dragOverDate,
  canCreateEvents, isDemo, setDragOverDate,
  setCurrentDate, setViewMode, setSelectedDay, setAddEventDate,
  handleDragStart, handleDragOver, handleDrop, handleEventClick,
}: CalendarMonthViewProps) {
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const numRows = Math.ceil(calendarDays.length / 7);

  return (
    <div style={{ height: 'calc(100dvh - 330px)', minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
      <div className="grid grid-cols-7 gap-1 mb-2 flex-shrink-0">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: `repeat(${numRows}, 1fr)`, gap: '4px', minHeight: 0 }}>
        {calendarDays.map((day) => {
          const key = formatDateKey(day);
          const dayEvents = eventsByDate.get(key) || [];
          const isCurrentMonth = day.getMonth() === currentMonth;
          const isToday = isSameDay(day, today);
          const isPast = day < today && !isToday;
          const isDragOver = dragOverDate === key;

          return (
            <div
              key={key}
              onDragOver={!isPast ? (e) => handleDragOver(e, key) : undefined}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={!isPast ? (e) => handleDrop(e, day) : undefined}
              className={`group p-1.5 rounded-lg border text-left transition-all overflow-hidden ${
                isDragOver
                  ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-400'
                  : isToday
                    ? 'border-blue-200 bg-blue-50/50'
                    : isCurrentMonth
                      ? 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      : 'border-gray-50'
              } ${isPast ? 'opacity-40' : ''} ${!isCurrentMonth ? 'opacity-25' : ''}`}
            >
              <div className="relative flex justify-center mb-1">
                <span
                  onClick={() => { setCurrentDate(day); setViewMode('day'); setSelectedDay(null); }}
                  className={`text-xs font-semibold leading-none cursor-pointer rounded-full px-1 hover:bg-gray-200 transition-colors ${
                    isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >{day.getDate()}</span>
                {canCreateEvents && !isDemo && isCurrentMonth && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setAddEventDate(day); }}
                    className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded transition-opacity"
                  >
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(event => {
                  const isFuture = new Date(event.date + 'T12:00:00') >= today;
                  const isDraggable = !!(canCreateEvents && isFuture && (event.manual || event.id.startsWith('assignment-')));
                  return (
                  <div
                    key={event.id}
                    draggable={isDraggable}
                    onDragStart={isDraggable ? (e) => { e.stopPropagation(); handleDragStart(e, event.id); } : undefined}
                    onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                    className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text} hover:shadow-md hover:brightness-95 transition-all ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    {event.title}{event.manual && event.className ? ` · ${event.className}` : ''}
                  </div>
                );})}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-gray-500 px-1">+{dayEvents.length - 3} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
