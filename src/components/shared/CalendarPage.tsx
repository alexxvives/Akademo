'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { CalendarAddEventModal } from './CalendarAddEventModal';

// ─── Types ───
type EventType = 'lesson' | 'stream' | 'assignment' | 'physicalClass' | 'scheduledStream';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date
  type: EventType;
  className?: string;
  classId?: string;
  extra?: string;
  manual?: boolean; // true = CalendarScheduledEvent (deletable)
  startTime?: string; // HH:MM format e.g. "09:30"
  location?: string;
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

const EVENT_COLORS: Record<EventType, { bg: string; text: string; dot: string }> = {
  lesson:          { bg: 'bg-blue-600',   text: 'text-white',   dot: 'bg-blue-700' },
  assignment:      { bg: 'bg-green-600',  text: 'text-white',   dot: 'bg-green-700' },
  stream:          { bg: 'bg-red-600',    text: 'text-white',   dot: 'bg-red-700' },
  scheduledStream: { bg: 'bg-red-600',    text: 'text-white',   dot: 'bg-red-700' },
  physicalClass:   { bg: 'bg-violet-600', text: 'text-white',   dot: 'bg-violet-700' },
};

const EVENT_LABELS: Record<EventType, string> = {
  lesson:          'Clase online',
  assignment:      'Ejercicio',
  stream:          'Stream',
  scheduledStream: 'Stream programado',
  physicalClass:   'Clase presencial',
};

// ─── Demo data generator (relative to today) ───
function offsetDate(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return formatDateKey(d);
}

function generateDemoEvents(today: Date): CalendarEvent[] {
  return [
    { id: 'demo-l1', title: 'Álgebra Lineal — Matrices',       date: offsetDate(today, -10), type: 'lesson',          className: 'Matemáticas I', startTime: '09:00' },
    { id: 'demo-l2', title: 'Cálculo diferencial',             date: offsetDate(today, -7),  type: 'lesson',          className: 'Matemáticas I', startTime: '10:30' },
    { id: 'demo-s1', title: 'Repaso examen parcial',           date: offsetDate(today, -5),  type: 'stream',          className: 'Física General', extra: 'Duración: 67min', startTime: '16:00' },
    { id: 'demo-a1', title: 'Entrega Práctica 1',              date: offsetDate(today, -3),  type: 'assignment',      className: 'Química Orgánica', startTime: '23:59' },
    { id: 'demo-l3', title: 'Termodinámica — Entropía',        date: offsetDate(today, -2),  type: 'lesson',          className: 'Física General', startTime: '11:00' },
    { id: 'demo-pc1', title: 'Clase presencial — Laboratorio', date: offsetDate(today, -1),  type: 'physicalClass',   className: 'Química Orgánica', manual: true, startTime: '14:00' },
    { id: 'demo-l4', title: 'Vectores y espacios vectoriales', date: offsetDate(today, 0),   type: 'lesson',          className: 'Matemáticas I', startTime: '09:00' },
    { id: 'demo-a2', title: 'Ejercicio semana 3',              date: offsetDate(today, 2),   type: 'assignment',      className: 'Física General', startTime: '23:59' },
    { id: 'demo-ss1', title: 'Stream: Dudas parcial',          date: offsetDate(today, 3),   type: 'scheduledStream', className: 'Matemáticas I', manual: true, startTime: '18:00' },
    { id: 'demo-l5', title: 'Reacciones electroquímicas',      date: offsetDate(today, 5),   type: 'lesson',          className: 'Química Orgánica', startTime: '10:00' },
    { id: 'demo-pc2', title: 'Tutoría presencial',             date: offsetDate(today, 7),   type: 'physicalClass',   className: 'Física General', manual: true, startTime: '15:30' },
    { id: 'demo-a3', title: 'Entrega Práctica 2',              date: offsetDate(today, 10),  type: 'assignment',      className: 'Química Orgánica', startTime: '23:59' },
    { id: 'demo-l6', title: 'Integrales — Cambio de variable', date: offsetDate(today, 12),  type: 'lesson',          className: 'Matemáticas I', startTime: '09:00' },
    { id: 'demo-ss2', title: 'Stream especial — Examen final', date: offsetDate(today, 14),  type: 'scheduledStream', className: 'Física General', manual: true, startTime: '17:00' },
  ];
}

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

/** Extract HH:MM from an ISO date string if it contains time info */
function extractTime(isoDate: string): string | undefined {
  if (!isoDate) return undefined;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return undefined;
  // If the string contains 'T' it has time info  
  if (isoDate.includes('T')) {
    const h = d.getHours();
    const m = d.getMinutes();
    if (h === 0 && m === 0) return undefined; // midnight = probably no real time
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return undefined;
}

const WEEK_HOURS = Array.from({ length: 24 }, (_, i) => i); // 0 – 23

const EVENT_BORDER_COLORS: Record<EventType, string> = {
  lesson:          '#2563eb',
  assignment:      '#15803d',
  stream:          '#dc2626',
  scheduledStream: '#dc2626',
  physicalClass:   '#7c3aed',
};

// ─── Overlap layout algorithm (Google Calendar style) ───
function computeOverlapLayout(events: CalendarEvent[]): Array<{
  event: CalendarEvent;
  col: number;
  totalCols: number;
  topOffset: number;
  height: number;
}> {
  if (events.length === 0) return [];
  const toMin = (time: string) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
  const items = events
    .filter(ev => ev.startTime)
    .map(ev => ({ ev, startMin: toMin(ev.startTime!), endMin: toMin(ev.startTime!) + 60 }));
  items.sort((a, b) => a.startMin - b.startMin);
  const cols: number[] = new Array(items.length).fill(0);
  const totalColsArr: number[] = new Array(items.length).fill(1);
  let i = 0;
  while (i < items.length) {
    let groupEnd = items[i].endMin;
    let j = i + 1;
    while (j < items.length && items[j].startMin < groupEnd) {
      groupEnd = Math.max(groupEnd, items[j].endMin);
      j++;
    }
    const colEnds: number[] = [];
    for (let k = i; k < j; k++) {
      const { startMin, endMin } = items[k];
      let assignedCol = -1;
      for (let c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= startMin) { assignedCol = c; colEnds[c] = endMin; break; }
      }
      if (assignedCol === -1) { assignedCol = colEnds.length; colEnds.push(endMin); }
      cols[k] = assignedCol;
    }
    const groupCols = colEnds.length;
    for (let k = i; k < j; k++) totalColsArr[k] = groupCols;
    i = j;
  }
  return items.map(({ ev, startMin, endMin }, idx) => ({
    event: ev,
    col: cols[idx],
    totalCols: totalColsArr[idx],
    topOffset: ((startMin - WEEK_HOURS[0] * 60) / 60) * 48,
    height: ((endMin - startMin) / 60) * 48 - 2,
  }));
}

export function CalendarPage({ role }: CalendarPageProps) {
  const router = useRouter();
  const rolePrefix = role === 'ACADEMY' ? 'academy' : role === 'TEACHER' ? 'teacher' : role === 'STUDENT' ? 'student' : 'admin';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [addEventDate, setAddEventDate] = useState<Date | null>(null);
  const [academyName, setAcademyName] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const isStudent = role === 'STUDENT';
  const canCreateEvents = ['ACADEMY', 'TEACHER', 'ADMIN'].includes(role);

  // ─── Data loading ───
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Academy info + demo detection
      if (role === 'ACADEMY' || role === 'TEACHER') {
        try {
          const res = await apiClient('/academies');
          const result = await res.json();
          if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            const academy = result.data[0];
            if (academy.name) setAcademyName(academy.name);
            if ((academy.paymentStatus || 'NOT PAID') === 'NOT PAID') {
              setIsDemo(true);
              setEvents(generateDemoEvents(new Date()));
              setLoading(false);
              return;
            }
          }
        } catch { /* continue */ }
      }

      // 2. Load classes (needed before per-class fetches)
      let classesData: ClassSummary[] = [];
      if (isStudent) {
        // Students use /enrollments to get their classes (no /student/classes route)
        const res = await apiClient('/enrollments');
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          classesData = result.data
            .filter((e: { status: string }) => e.status === 'APPROVED')
            .map((e: { classId: string; className: string; academyName?: string }) => ({
              id: e.classId,
              name: e.className,
              description: null,
              academyName: e.academyName,
            }));
        }
      } else {
        const res = await apiClient('/classes');
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) classesData = result.data;
      }
      setClasses(classesData);

      // 3. Fetch all events in parallel
      const streamEndpoint = isStudent ? '/live/active' : '/live/history';
      const [streamRes, calendarRes, ...classResults] = await Promise.all([
        apiClient(streamEndpoint).catch(() => null),
        apiClient('/calendar-events').catch(() => null),
        ...classesData.flatMap(cls => [
          apiClient(`/lessons?classId=${cls.id}`).catch(() => null),
          apiClient(`/assignments?classId=${cls.id}`).catch(() => null),
        ]),
      ]);

      const allEvents: CalendarEvent[] = [];

      // Process per-class results (lessons + assignments interleaved)
      for (let i = 0; i < classesData.length; i++) {
        const cls = classesData[i];
        const lessonRes = classResults[i * 2];
        const assignmentRes = classResults[i * 2 + 1];

        if (lessonRes) {
          try {
            const result = await lessonRes.json();
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
                    startTime: extractTime(date),
                  });
                }
              }
            }
          } catch { /* skip */ }
        }

        if (assignmentRes) {
          try {
            const result = await assignmentRes.json();
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
                    startTime: extractTime(date),
                  });
                }
              }
            }
          } catch { /* skip */ }
        }
      }

      // Process streams
      if (streamRes) {
        try {
          const result = await streamRes.json();
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
                  startTime: extractTime(date),
                });
              }
            }
          }
        } catch { /* skip */ }
      }

      // Process manual calendar events
      if (calendarRes) {
        try {
          const result = await calendarRes.json();
          if (result.success && Array.isArray(result.data)) {
            for (const ev of result.data) {
              allEvents.push({
                id: `manual-${ev.id}`, title: ev.title, date: ev.eventDate,
                type: ev.type as EventType, className: ev.className || '', classId: ev.classId || '',
                extra: ev.notes || undefined, manual: true,
                startTime: ev.startTime || undefined,
                location: ev.location || undefined,
              });
            }
          }
        } catch { /* skip */ }
      }

      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, [isStudent, role]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleEventAdded = useCallback((ev: { id: string; title: string; type: 'physicalClass' | 'scheduledStream'; eventDate: string; notes?: string | null; classId?: string | null; startTime?: string | null; location?: string | null }) => {
    const cls = classes.find(c => c.id === ev.classId);
    setEvents(prev => [...prev, {
      id: `manual-${ev.id}`, title: ev.title, date: ev.eventDate, type: ev.type,
      className: cls?.name || '', classId: ev.classId || '', extra: ev.notes || undefined, manual: true,
      startTime: ev.startTime || undefined,
      location: ev.location || undefined,
    }]);
  }, [classes]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    const rawId = eventId.replace('manual-', '');
    try {
      const res = await apiClient(`/calendar-events/${rawId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch { /* skip */ }
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, eventId: string) => {
    setDraggedEventId(eventId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateKey);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDate(null);
    if (!draggedEventId) return;
    const draggedEv = events.find(ev => ev.id === draggedEventId);
    if (!draggedEv) { setDraggedEventId(null); return; }
    // Only allow dropping on today or future dates
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (targetDate < today) { setDraggedEventId(null); return; }
    const newDate = formatDateKey(targetDate);
    try {
      if (draggedEv.manual) {
        // Manual calendar event
        const rawId = draggedEventId.replace('manual-', '');
        const res = await apiClient(`/calendar-events/${rawId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventDate: newDate }),
        });
        const result = await res.json();
        if (result.success) {
          setEvents(prev => prev.map(ev => ev.id === draggedEventId ? { ...ev, date: newDate } : ev));
        }
      } else if (draggedEv.id.startsWith('assignment-')) {
        // Assignment event — update dueDate
        const rawId = draggedEventId.replace('assignment-', '');
        const res = await apiClient(`/assignments/${rawId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dueDate: newDate + 'T12:00:00.000Z' }),
        });
        const result = await res.json();
        if (result.success) {
          setEvents(prev => prev.map(ev => ev.id === draggedEventId ? { ...ev, date: newDate } : ev));
        }
      }
    } catch { /* skip */ }
    setDraggedEventId(null);
  }, [draggedEventId, events]);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    if (!canCreateEvents || !event.manual || isDemo) return;
    setEditingEvent(event);
    setAddEventDate(new Date(event.date + 'T12:00:00'));
  }, [canCreateEvents, isDemo]);

  // Navigate to the relevant page when clicking a non-manual event
  const handleEventClick = useCallback((event: CalendarEvent) => {
    if (event.manual) {
      // physicalClass / scheduledStream → open edit popup
      if (canCreateEvents && !isDemo) handleEditEvent(event);
      return;
    }
    if (event.type === 'lesson' && event.classId) {
      router.push(`/dashboard/${rolePrefix}/subject/${event.classId}`);
    } else if (event.type === 'assignment') {
      router.push(`/dashboard/${rolePrefix}/assignments`);
    } else if (event.type === 'stream' || event.type === 'scheduledStream') {
      router.push(`/dashboard/${rolePrefix}/streams`);
    }
  }, [canCreateEvents, isDemo, rolePrefix, router, handleEditEvent]);

  // ─── Filtered events ───
  const filteredEvents = useMemo(() => {
    if (selectedClass === 'all') return events;
    return events.filter(e => e.classId === selectedClass);
  }, [events, selectedClass]);

  // ─── Events grouped by date ───
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of filteredEvents) {
      // Use the date string directly (YYYY-MM-DD) as the key to avoid timezone shifting
      const key = event.date.startsWith('20') ? event.date.slice(0, 10) : formatDateKey(new Date(event.date));
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
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 bg-gray-200 rounded w-32" />
            <div className="h-8 bg-gray-200 rounded w-28" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-52" />
        </div>
        {/* Calendar card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Controls bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="h-8 bg-gray-200 rounded w-28" />
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="flex items-center gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-4 bg-gray-100 rounded w-16" />)}
            </div>
          </div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 px-6 pt-4 pb-2">
            {WEEKDAYS.map(d => <div key={d} className="h-4 bg-gray-100 rounded mx-1" />)}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1 px-6 pb-6">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">Calendario</h1>
            {canCreateEvents && (
              <button onClick={() => setAddEventDate(currentDate)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Añadir evento
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{role === 'ADMIN' ? 'AKADEMO PLATFORM' : academyName || 'AKADEMO'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {classes.length > 0 && !isDemo && (
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100 relative">
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

          {/* Navigation — absolutely centered */}
          <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-base font-semibold text-gray-900 min-w-[180px] text-center capitalize">
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
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Hoy
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2">
            {([['lesson','Clase online'],['assignment','Ejercicio'],['stream','Stream'],['physicalClass','Clase presencial']] as [EventType,string][]).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${EVENT_COLORS[type].dot}`} />
                <span className="text-[11px] text-gray-500">{label}</span>
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

      {/* Add/Edit event modal */}
      {addEventDate && (
        <CalendarAddEventModal
          date={addEventDate}
          classes={classes}
          disabled={isDemo}
          editEvent={editingEvent ? {
            id: editingEvent.id,
            title: editingEvent.title,
            type: editingEvent.type,
            classId: editingEvent.classId,
            extra: editingEvent.extra,
            location: editingEvent.location,
            startTime: editingEvent.startTime,
          } : undefined}
          onClose={() => { setAddEventDate(null); setEditingEvent(null); }}
          onSaved={(ev) => {
            if (editingEvent) {
              // Update existing event
              setEvents(prev => prev.map(e =>
                e.id === editingEvent.id
                  ? { ...e, title: ev.title, type: ev.type as EventType, date: ev.eventDate, classId: ev.classId || '', extra: ev.notes || undefined, startTime: ev.startTime || undefined, location: ev.location || undefined }
                  : e
              ));
              setEditingEvent(null);
            } else {
              handleEventAdded(ev);
            }
            setAddEventDate(null);
          }}
        />
      )}
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
            const isPast = day < today && !isToday;
            const isDragOver = dragOverDate === key;

            return (
              <div
                key={key}
                onDragOver={!isPast ? (e) => handleDragOver(e, key) : undefined}
                onDragLeave={() => setDragOverDate(null)}
                onDrop={!isPast ? (e) => handleDrop(e, day) : undefined}
                className={`group min-h-[80px] sm:min-h-[100px] p-1.5 rounded-lg border text-left transition-all ${
                  isDragOver
                    ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-400'
                    : isToday
                      ? 'border-blue-200 bg-blue-50/50'
                      : isCurrentMonth
                        ? 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        : 'border-gray-50'
                } ${isPast ? 'opacity-40' : ''} ${!isCurrentMonth ? 'opacity-25' : ''}`}
              >
                {/* Top row: day number (click to navigate) + add button */}
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
                      {event.title}
                    </div>
                  )})}
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

  // ─── Week view (Google Calendar style with time slots) ───
  function renderWeekView() {
    const today = new Date();

    // Separate all-day events (no startTime) from timed events
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
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Day headers */}
        <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
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

        {/* All-day events section */}
        {hasAnyAllDay && (
          <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
            <div className="border-r border-gray-100 px-1 py-1.5 text-[10px] text-gray-400 text-right">Todo el día</div>
            {calendarDays.map((day, i) => {
              const key = formatDateKey(day);
              const events = allDayByDate.get(key) || [];
              return (
                <div key={i} className="border-r border-gray-100 last:border-r-0 px-0.5 py-1 space-y-0.5 min-h-[28px]">
                  {events.map(event => (
                    <div
                      key={event.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text} cursor-pointer`}
                      onClick={() => canCreateEvents && event.manual ? handleEditEvent(event) : undefined}
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

        {/* Time grid */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <div className="grid" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
            {/* Time label column */}
            <div>
              {WEEK_HOURS.map((hour) => (
                <div key={hour} className="border-r border-b border-gray-100 relative bg-white" style={{ height: '48px' }}>
                  <span className="absolute -top-2 right-1 text-[10px] text-gray-400">
                    {String(hour).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns — full height, events overlaid absolutely */}
            {calendarDays.map((day, dayIdx) => {
              const key = formatDateKey(day);
              const isToday = isSameDay(day, today);
              const layout = computeOverlapLayout(timedByDate.get(key) || []);
              return (
                <div
                  key={dayIdx}
                  className={`relative border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-blue-50/30' : ''}`}
                  style={{ height: `${WEEK_HOURS.length * 48}px` }}
                  onClick={() => { if (canCreateEvents && !isDemo) setAddEventDate(day); }}
                >
                  {/* Hour separator lines */}
                  {WEEK_HOURS.map((_, i) => (
                    <div key={i} className="absolute w-full border-b border-gray-100 pointer-events-none" style={{ top: `${i * 48}px`, height: '48px', left: 0 }} />
                  ))}

                  {/* Current time indicator */}
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

                  {/* Events */}
                  {layout.map(({ event, col, totalCols, topOffset, height }) => (
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
                      className={`rounded px-1.5 py-0.5 overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                      title={`${event.startTime} — ${event.title}${event.className ? ` (${event.className})` : ''}`}
                    >
                      <div className="flex items-start justify-between gap-0.5">
                        <div className="text-[10px] font-medium truncate flex-1">{event.title}</div>
                        {event.startTime && <div className="text-[9px] opacity-80 flex-shrink-0">{event.startTime}</div>}
                      </div>
                      {event.className && (
                        <div className="text-[9px] opacity-80 truncate">{event.className}</div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Day view (Google Calendar style with time grid, single column) ───
  function renderDayView() {
    const day = calendarDays[0];
    const today = new Date();
    const key = formatDateKey(day);
    const dayEvents = (eventsByDate.get(key) || []);
    const isToday = isSameDay(day, today);

    // Separate all-day events (no startTime) from timed events
    const allDayEvents = dayEvents.filter(ev => !ev.startTime);
    const timedEvents = dayEvents.filter(ev => ev.startTime);

    return (
      <div>
        {/* Day header */}
        <div className="text-center mb-4">
          <div className="text-sm text-gray-500 capitalize">
            {day.toLocaleDateString('es-ES', { weekday: 'long' })}
          </div>
          <div className={`text-3xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {isToday ? (
              <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-blue-600 text-white text-xl">
                {day.getDate()}
              </span>
            ) : day.getDate()}
          </div>
          <div className="text-sm text-gray-500 capitalize">
            {day.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white max-w-2xl mx-auto">
          {/* All-day events */}
          {allDayEvents.length > 0 && (
            <div className="border-b border-gray-200 px-2 py-1.5 space-y-1">
              <div className="text-[10px] text-gray-400 mb-1">Todo el día</div>
              {allDayEvents.map(event => (
                <div
                  key={event.id}
                  className={`text-xs px-2 py-1 rounded ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].text} cursor-pointer truncate`}
                  onClick={() => canCreateEvents && event.manual ? handleEditEvent(event) : undefined}
                >
                  {event.title}{event.className ? ` — ${event.className}` : ''}
                </div>
              ))}
            </div>
          )}

          {/* Time grid */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
            <div className="flex">
              {/* Time labels */}
              <div className="flex-shrink-0 w-16">
                {WEEK_HOURS.map((hour) => (
                  <div key={hour} className="border-r border-b border-gray-100 relative bg-white" style={{ height: '48px' }}>
                    <span className="absolute -top-2 right-1 text-[10px] text-gray-400">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Event column — full height, events overlaid absolutely */}
              <div
                className={`flex-1 relative ${isToday ? 'bg-blue-50/30' : ''}`}
                style={{ height: `${WEEK_HOURS.length * 48}px` }}
                onClick={() => { if (canCreateEvents && !isDemo) setAddEventDate(day); }}
              >
                {/* Hour separator lines */}
                {WEEK_HOURS.map((_, i) => (
                  <div key={i} className="absolute w-full border-b border-gray-100 pointer-events-none" style={{ top: `${i * 48}px`, height: '48px', left: 0 }} />
                ))}

                {/* Current time indicator */}
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

                {/* Events */}
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
                      handleEventClick(event);
                    }}
                    title={`${event.startTime} — ${event.title}${event.className ? ` (${event.className})` : ''}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="text-xs font-medium truncate flex-1">{event.title}</div>
                      {event.startTime && <div className="text-[10px] opacity-80 flex-shrink-0">{event.startTime}</div>}
                    </div>
                    {event.className && (
                      <div className="text-[10px] opacity-80 truncate">{event.className}</div>
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
          <div className="flex items-center gap-2">
            {canCreateEvents && !isDemo && (
              <button onClick={() => setAddEventDate(selectedDay)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Añadir
              </button>
            )}
            <button
              onClick={() => setSelectedDay(null)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {dayEvents.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No hay eventos para este día</p>
        ) : (
          <div className="space-y-2">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={`group flex items-center gap-3 p-3 rounded-lg ${EVENT_COLORS[event.type].bg}`}
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
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                {canCreateEvents && !isDemo && event.manual && (
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditEvent(event)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors" title="Editar">
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDeleteEvent(event.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors" title="Eliminar">
                        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
