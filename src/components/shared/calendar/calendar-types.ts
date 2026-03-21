// ─── Types ───
export type EventType = 'lesson' | 'stream' | 'assignment';

export interface CalendarEvent {
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
  zoomLink?: string;
  zoomMeetingId?: string;
  status?: string; // 'scheduled' | 'active' | 'ended' — for stream events
}

export interface ClassSummary {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  academyId?: string;
  academyName?: string;
  enrollmentCount?: number;
  startDate?: string | null;
}

export interface CalendarPageProps {
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER' | 'STUDENT';
}

export type ViewMode = 'month' | 'week' | 'day';

// ─── Constants ───
export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const VIEW_LABELS: Record<ViewMode, string> = { month: 'Mes', week: 'Semana', day: 'Día' };

export const EVENT_COLORS: Record<EventType, { bg: string; text: string; dot: string }> = {
  lesson:     { bg: 'bg-blue-600',  text: 'text-white', dot: 'bg-blue-700' },
  assignment: { bg: 'bg-green-600', text: 'text-white', dot: 'bg-green-700' },
  stream:     { bg: 'bg-red-600',   text: 'text-white', dot: 'bg-red-700' },
};

export const EVENT_LABELS: Record<EventType, string> = {
  lesson:     'Clase',
  assignment: 'Ejercicio',
  stream:     'Stream',
};

export const WEEK_HOURS = Array.from({ length: 24 }, (_, i) => i); // 0 – 23

export const EVENT_BORDER_COLORS: Record<EventType, string> = {
  lesson:     '#2563eb',
  assignment: '#15803d',
  stream:     '#dc2626',
};

// ─── Helpers ───
export function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function offsetDate(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return formatDateKey(d);
}

export function generateDemoEvents(today: Date): CalendarEvent[] {
  return [
    { id: 'demo-l1', title: 'Álgebra Lineal — Matrices',       date: offsetDate(today, -10), type: 'lesson',          className: 'Matemáticas I',    classId: 'demo-c2', startTime: '09:00' },
    { id: 'demo-l2', title: 'Cálculo diferencial',             date: offsetDate(today, -7),  type: 'lesson',          className: 'Matemáticas I',    classId: 'demo-c2', startTime: '10:30' },
    { id: 'demo-s1', title: 'Repaso examen parcial',           date: offsetDate(today, -5),  type: 'stream',          className: 'Física General',   classId: 'demo-c4', extra: 'Duración: 67min', startTime: '16:00' },
    { id: 'demo-a1', title: 'Entrega Práctica 1',              date: offsetDate(today, -3),  type: 'assignment',      className: 'Química Orgánica', classId: 'demo-c3', startTime: '23:59' },
    { id: 'demo-l3', title: 'Termodinámica — Entropía',        date: offsetDate(today, -2),  type: 'lesson',          className: 'Física General',   classId: 'demo-c4', startTime: '11:00' },
    { id: 'demo-pc1', title: 'Stream — Laboratorio',            date: offsetDate(today, -1),  type: 'stream', className: 'Química Orgánica', classId: 'demo-c3', manual: true, startTime: '14:00' },
    { id: 'demo-l4', title: 'Vectores y espacios vectoriales',  date: offsetDate(today, 0),   type: 'lesson', className: 'Matemáticas I',    classId: 'demo-c2', startTime: '09:00' },
    { id: 'demo-a2', title: 'Ejercicio semana 3',               date: offsetDate(today, 2),   type: 'assignment', className: 'Física General',   classId: 'demo-c4', startTime: '23:59' },
    { id: 'demo-ss1', title: 'Stream: Dudas parcial',           date: offsetDate(today, 3),   type: 'stream', className: 'Matemáticas I',    classId: 'demo-c2', manual: true, startTime: '18:00' },
    { id: 'demo-l5', title: 'Reacciones electroquímicas',       date: offsetDate(today, 5),   type: 'lesson', className: 'Química Orgánica', classId: 'demo-c3', startTime: '10:00' },
    { id: 'demo-pc2', title: 'Stream — Tutoría',                date: offsetDate(today, 7),   type: 'stream', className: 'Física General',   classId: 'demo-c4', manual: true, startTime: '15:30' },
    { id: 'demo-a3', title: 'Entrega Práctica 2',               date: offsetDate(today, 10),  type: 'assignment', className: 'Química Orgánica', classId: 'demo-c3', startTime: '23:59' },
    { id: 'demo-l6', title: 'Integrales — Cambio de variable',  date: offsetDate(today, 12),  type: 'lesson', className: 'Matemáticas I',    classId: 'demo-c2', startTime: '09:00' },
    { id: 'demo-ss2', title: 'Stream especial — Examen final',  date: offsetDate(today, 14),  type: 'stream', className: 'Física General',   classId: 'demo-c4', manual: true, startTime: '17:00' },
  ];
}

export function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  const result = new Date(d);
  result.setDate(d.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Extract HH:MM from an ISO date string if it contains time info */
export function extractTime(isoDate: string): string | undefined {
  if (!isoDate) return undefined;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return undefined;
  if (isoDate.includes('T')) {
    const h = d.getHours();
    const m = d.getMinutes();
    if (h === 0 && m === 0) return undefined;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return undefined;
}

// ─── Overlap layout algorithm (Google Calendar style) ───
export function computeOverlapLayout(events: CalendarEvent[]): Array<{
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
