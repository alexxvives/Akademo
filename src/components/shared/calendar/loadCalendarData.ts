import { apiClient } from '@/lib/api-client';
import type { CalendarEvent, ClassSummary, EventType } from './calendar-types';
import { extractTime, generateDemoEvents } from './calendar-types';

interface LoadDataResult {
  events: CalendarEvent[];
  classes: ClassSummary[];
  adminAcademies: { id: string; name: string }[];
  academyName: string;
  isDemo: boolean;
}

export async function loadCalendarData(
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER' | 'STUDENT',
  isStudent: boolean,
): Promise<LoadDataResult> {
  let academyName = '';
  let isDemo = false;

  if (role === 'ACADEMY' || role === 'TEACHER') {
    try {
      const res = await apiClient('/academies');
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const academy = result.data[0];
        if (academy.name) academyName = academy.name;
        if ((academy.paymentStatus || 'NOT PAID') === 'NOT PAID') {
          return {
            events: generateDemoEvents(new Date()),
            classes: [], adminAcademies: [], academyName, isDemo: true,
          };
        }
      }
    } catch { /* continue */ }
  }

  let classesData: ClassSummary[] = [];
  const adminAcademies: { id: string; name: string }[] = [];

  if (isStudent) {
    const res = await apiClient('/enrollments');
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      classesData = result.data
        .filter((e: { status: string }) => e.status === 'APPROVED')
        .map((e: { classId: string; className: string; academyName?: string }) => ({
          id: e.classId, name: e.className, description: null, academyName: e.academyName,
        }));
    }
  } else if (role === 'ADMIN') {
    try {
      const acadRes = await apiClient('/admin/academies');
      const acadResult = await acadRes.json();
      if (acadResult.success && Array.isArray(acadResult.data)) {
        for (const a of acadResult.data) adminAcademies.push({ id: a.id, name: a.name });
      }
    } catch { /* continue */ }
    const res = await apiClient('/admin/classes');
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) classesData = result.data;
  } else {
    const res = await apiClient('/classes');
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) classesData = result.data;
  }

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
                id: `lesson-${lesson.id}`, title: lesson.title || 'Sin título', date,
                type: 'lesson', className: cls.name, classId: cls.id, startTime: extractTime(date),
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
                id: `assignment-${assignment.id}`, title: assignment.title || 'Sin título', date,
                type: 'assignment', className: cls.name, classId: cls.id,
                extra: assignment.dueDate ? `Entrega: ${new Date(assignment.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` : undefined,
                startTime: extractTime(date),
              });
            }
          }
        }
      } catch { /* skip */ }
    }
  }

  if (streamRes) {
    try {
      const result = await streamRes.json();
      if (result.success && Array.isArray(result.data)) {
        for (const stream of result.data) {
          const date = stream.startedAt || stream.scheduledAt || stream.createdAt;
          if (date) {
            allEvents.push({
              id: `stream-${stream.id}`, title: stream.title || 'Stream en vivo', date,
              type: 'stream' as EventType, className: stream.className || '', classId: stream.classId || '',
              extra: stream.endedAt
                ? `Duración: ${Math.round((new Date(stream.endedAt).getTime() - new Date(stream.startedAt).getTime()) / 60000)}min`
                : stream.status === 'scheduled'
                  ? (new Date(date) < new Date() ? 'Finalizado' : 'Programado')
                  : 'En vivo',
              startTime: extractTime(date), status: stream.status,
              zoomLink: stream.zoomLink || undefined, zoomMeetingId: stream.zoomMeetingId || undefined,
              location: stream.location || undefined,
            });
          }
        }
      }
    } catch { /* skip */ }
  }

  if (calendarRes) {
    try {
      const result = await calendarRes.json();
      if (result.success && Array.isArray(result.data)) {
        for (const ev of result.data) {
          const evType: EventType = (ev.type === 'physicalClass' || ev.type === 'scheduledStream') ? 'stream' : (ev.type as EventType) || 'stream';
          allEvents.push({
            id: `manual-${ev.id}`, title: ev.title, date: ev.eventDate,
            type: evType, className: ev.className || '', classId: ev.classId || '',
            extra: ev.notes || undefined, manual: true,
            startTime: ev.startTime || undefined, location: ev.location || undefined,
            zoomLink: ev.zoomLink || undefined,
          });
        }
      }
    } catch { /* skip */ }
  }

  return { events: allEvents, classes: classesData, adminAcademies, academyName, isDemo };
}
