'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';

// ─── Types ───
interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date
  type: 'lesson' | 'stream' | 'assignment';
  className?: string;
  classId?: string;
  extra?: string;
}

interface ClassSummary {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  academyName?: string;
  enrollmentCount?: number;
}

interface CalendarPageProps {
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER' | 'STUDENT';
}

type ViewMode = 'month' | 'week' | 'day';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const VIEW_LABELS: Record<ViewMode, string> = { month: 'Mes', week: 'Semana', day: 'Día' };

const EVENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  lesson: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  stream: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  assignment: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

const EVENT_LABELS: Record<string, string> = {
  lesson: 'Clase',
  stream: 'Stream',
  assignment: 'Ejercicio',
};

// ─── Helpers ───
function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  const result = new Date(d);
  result.setDate(d.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CalendarPage({ role }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const isStudent = role === 'STUDENT';

  // ─── Data loading ───
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load classes
      let classesData: ClassSummary[] = [];
      if (isStudent) {
        const res = await apiClient('/student/classes');
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) classesData = result.data;
      } else {
        const res = await apiClient('/classes');
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) classesData = result.data;
      }
      setClasses(classesData);

      const allEvents: CalendarEvent[] = [];

      // Fetch events per class
      for (const cls of classesData) {
        // Lessons
        try {
          const res = await apiClient(`/lessons?classId=${cls.id}`);
          const result = await res.json();
          if (result.success && Array.isArray(result.data)) {
            for (const lesson of result.data) {
              const date = lesson.releaseDate || lesson.createdAt;
              if (date) {
                allEvents.push({
                  id: `lesson-${lesson.id}`,
                  title: lesson.title || 'Sin título',
                  date,
                  type: 'lesson',
                  className: cls.name,
                  classId: cls.id,
                });
              }
            }
          }
        } catch { /* skip */ }

        // Assignments
        try {
          const res = await apiClient(`/assignments?classId=${cls.id}`);
          const result = await res.json();
          if (result.success && Array.isArray(result.data)) {
            for (const assignment of result.data) {
              const date = assignment.dueDate || assignment.createdAt;
              if (date) {
                allEvents.push({
                  id: `assignment-${assignment.id}`,
                  title: assignment.title || 'Sin título',
                  date,
                  type: 'assignment',
                  className: cls.name,
                  classId: cls.id,
                  extra: assignment.dueDate ? `Entrega: ${new Date(assignment.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` : undefined,
                });
              }
            }
          }
        } catch { /* skip */ }
      }

      // Streams (all via history for non-students, active for students)
      try {
        const endpoint = isStudent ? '/live/active' : '/live/history';
        const res = await apiClient(endpoint);
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          for (const stream of result.data) {
            const date = stream.startedAt || stream.createdAt;
            if (date) {
              allEvents.push({
                id: `stream-${stream.id}`,
                title: stream.title || 'Stream en vivo',
                date,
                type: 'stream',
                className: stream.className || '',
                classId: stream.classId || '',
                extra: stream.endedAt
                  ? `Duración: ${Math.round((new Date(stream.endedAt).getTime() - new Date(stream.startedAt).getTime()) / 60000)}min`
                  : 'En vivo',
              });
            }
          }
        }
      } catch { /* skip */ }

      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, [isStudent]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Filtered events ───
  const filteredEvents = useMemo(() => {
    if (selectedClass === 'all') return events;
    return events.filter(e => e.classId === selectedClass);
  }, [events, selectedClass]);

  // ─── Events grouped by date ───
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of filteredEvents) {
      const key = formatDateKey(new Date(event.date));
      const existing = map.get(key) || [];
      existing.push(event);
      map.set(key, existing);
    }
    return map;
  }, [filteredEvents]);

  // ─── Calendar grid computation ───
  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Start from Monday of the first week
      const start = startOfWeek(firstDay);
      const days: Date[] = [];
      const current = new Date(start);
      
      // Fill at least 35 days (5 weeks), up to 42 (6 weeks)
      while (days.length < 42) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
        if (days.length >= 35 && current.getMonth() !== month && current.getDay() === 1) break;
      }
      // Ensure we have at least through the end of month
      while (days[days.length - 1] < lastDay) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      return days;
    }
    
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    }
    
    // day
    return [new Date(currentDate)];
  }, [currentDate, viewMode]);

  // ─── Navigation ───
  const navigate = (direction: number) => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + direction);
    else if (viewMode === 'week') d.setDate(d.getDate() + direction * 7);
    else d.setDate(d.getDate() + direction);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const headerLabel = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const sameMonth = start.getMonth() === end.getMonth();
      if (sameMonth) {
        return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
      }
      return `${start.getDate()} ${start.toLocaleDateString('es-ES', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, [currentDate, viewMode]);

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-10 bg-gray-200 rounded w-56" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Calendario</h1>
          <p className="text-sm text-gray-500 mt-1">
            {role === 'ADMIN' ? 'AKADEMO PLATFORM' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {classes.length > 0 && (
            <ClassSearchDropdown
              classes={classes}
              value={selectedClass}
              onChange={setSelectedClass}
              allLabel="Todas las asignaturas"
              className="w-full sm:w-56"
            />
          )}
        </div>
      </div>

      {/* Calendar controls */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
          {/* View mode tabs */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {VIEW_LABELS[mode]}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center capitalize">
              {headerLabel}
            </h2>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={goToday}
              className="ml-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Hoy
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3">
            {Object.entries(EVENT_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${EVENT_COLORS[type].dot}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar body */}
        <div className="p-4 sm:p-6">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && renderDayDetail()}
    </div>
  );

  // ─── Month view ───
  function renderMonthView() {
    const today = new Date();
    const currentMonth = currentDate.getMonth();

    return (
      <div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const key = formatDateKey(day);
            const dayEvents = eventsByDate.get(key) || [];
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = isSameDay(day, today);
            const isSelected = selectedDay && isSameDay(day, selectedDay);

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(isSameDay(day, selectedDay || new Date(0)) ? null : day)}
                className={`min-h-[80px] sm:min-h-[100px] p-1.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                    : isToday
                      ? 'border-blue-200 bg-blue-50/50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                } ${!isCurrentMonth ? 'opacity-40' : ''}`}
              >
                <div className={`text-xs font-medium mb-1 ${
                  isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text}`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-gray-500 px-1">+{dayEvents.length - 3} más</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Week view ───
  function renderWeekView() {
    const today = new Date();

    return (
      <div>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const key = formatDateKey(day);
            const dayEvents = eventsByDate.get(key) || [];
            const isToday = isSameDay(day, today);
            const isSelected = selectedDay && isSameDay(day, selectedDay);

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(isSameDay(day, selectedDay || new Date(0)) ? null : day)}
                className={`min-h-[200px] p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                    : isToday
                      ? 'border-blue-200 bg-blue-50/50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-center mb-3">
                  <div className="text-xs text-gray-500">{WEEKDAYS[calendarDays.indexOf(day)]}</div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className={`text-xs px-2 py-1 rounded ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text}`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {event.className && (
                        <div className="text-[10px] opacity-70 truncate">{event.className}</div>
                      )}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Day view ───
  function renderDayView() {
    const day = calendarDays[0];
    const key = formatDateKey(day);
    const dayEvents = (eventsByDate.get(key) || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div>
        <div className="text-center mb-6">
          <div className="text-sm text-gray-500 capitalize">
            {day.toLocaleDateString('es-ES', { weekday: 'long' })}
          </div>
          <div className="text-3xl font-bold text-gray-900">{day.getDate()}</div>
          <div className="text-sm text-gray-500 capitalize">
            {day.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        {dayEvents.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500">No hay eventos para este día</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={`flex items-start gap-3 p-4 rounded-lg border ${EVENT_COLORS[event.type].bg} border-opacity-50`}
              >
                <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${EVENT_COLORS[event.type].dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text}`}>
                      {EVENT_LABELS[event.type]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{event.title}</p>
                  {event.className && (
                    <p className="text-xs text-gray-500 mt-0.5">{event.className}</p>
                  )}
                  {event.extra && (
                    <p className="text-xs text-gray-400 mt-0.5">{event.extra}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Day detail panel (when clicking a day in month/week view) ───
  function renderDayDetail() {
    if (!selectedDay) return null;
    const key = formatDateKey(selectedDay);
    const dayEvents = (eventsByDate.get(key) || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 capitalize">
            {selectedDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <button
            onClick={() => setSelectedDay(null)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {dayEvents.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No hay eventos para este día</p>
        ) : (
          <div className="space-y-2">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${EVENT_COLORS[event.type].bg}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${EVENT_COLORS[event.type].dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{event.title}</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${EVENT_COLORS[event.type].text}`}>
                      {EVENT_LABELS[event.type]}
                    </span>
                  </div>
                  {event.className && (
                    <p className="text-xs text-gray-500 mt-0.5">{event.className}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
