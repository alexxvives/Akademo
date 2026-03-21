'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { CalendarEvent, EventType } from './calendar-types';
import { formatDateKey } from './calendar-types';
import type { CalendarState } from './useCalendarData';

export function useCalendarActions(state: CalendarState, role: 'ACADEMY' | 'ADMIN' | 'TEACHER' | 'STUDENT') {
  const router = useRouter();
  const rolePrefix = role === 'ACADEMY' ? 'academy' : role === 'TEACHER' ? 'teacher' : role === 'STUDENT' ? 'student' : 'admin';
  const {
    classes, events, setEvents, canCreateEvents, isDemo,
    draggedEventId, setDraggedEventId, setDragOverDate,
    setEditingEvent, setAddEventDate, setPopupEvent,
    setCurrentDate, setViewMode, setScrollToTime,
  } = state;

  const handleEventAdded = useCallback((ev: { id: string; title: string; type: string; eventDate: string; notes?: string | null; classId?: string | null; startTime?: string | null; location?: string | null; zoomLink?: string | null }) => {
    const cls = classes.find(c => c.id === ev.classId);
    const evType: EventType = (ev.type === 'physicalClass' || ev.type === 'scheduledStream') ? 'stream' : (ev.type as EventType) || 'stream';
    setEvents(prev => [...prev, {
      id: `manual-${ev.id}`, title: ev.title, date: ev.eventDate, type: evType,
      className: cls?.name || '', classId: ev.classId || '', extra: ev.notes || undefined, manual: true,
      startTime: ev.startTime || undefined, location: ev.location || undefined, zoomLink: ev.zoomLink || undefined,
    }]);
  }, [classes, setEvents]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    const rawId = eventId.replace('manual-', '');
    try {
      const res = await apiClient(`/calendar-events/${rawId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch { /* skip */ }
  }, [setEvents]);

  const handleDragStart = useCallback((e: React.DragEvent, eventId: string) => {
    setDraggedEventId(eventId);
    e.dataTransfer.effectAllowed = 'move';
  }, [setDraggedEventId]);

  const handleDragOver = useCallback((e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateKey);
  }, [setDragOverDate]);

  const handleDrop = useCallback(async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDate(null);
    if (!draggedEventId) return;
    const draggedEv = events.find(ev => ev.id === draggedEventId);
    if (!draggedEv) { setDraggedEventId(null); return; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (targetDate < today) { setDraggedEventId(null); return; }
    const newDate = formatDateKey(targetDate);
    try {
      if (draggedEv.manual) {
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
  }, [draggedEventId, events, setDraggedEventId, setDragOverDate, setEvents]);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    if (!canCreateEvents || isDemo) return;
    const isEditableStream = event.id.startsWith('stream-') && event.status !== 'ended';
    if (!event.manual && !isEditableStream) return;
    setEditingEvent(event);
    setAddEventDate(new Date((event.date.includes('T') ? event.date : event.date + 'T12:00:00')));
  }, [canCreateEvents, isDemo, setEditingEvent, setAddEventDate]);

  const navigateToEvent = useCallback((event: CalendarEvent) => {
    setPopupEvent(null);
    if (event.manual) {
      const eventDate = new Date(event.date + (event.date.includes('T') ? '' : 'T12:00:00'));
      setCurrentDate(eventDate);
      setViewMode('day');
      setScrollToTime(event.startTime || null);
      return;
    }
    const rawId = event.id.replace(/^(lesson|stream|assignment|manual)-/, '');
    if (event.type === 'lesson' && event.classId) {
      router.push(`/dashboard/${rolePrefix}/subject/${event.classId}?highlight=${rawId}`);
    } else if (event.type === 'assignment') {
      router.push(`/dashboard/${rolePrefix}/assignments?highlight=${rawId}`);
    } else if (event.type === 'stream') {
      router.push(`/dashboard/${rolePrefix}/streams?highlight=${rawId}`);
    }
  }, [rolePrefix, router, setPopupEvent, setCurrentDate, setViewMode, setScrollToTime]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setPopupEvent(event);
  }, [setPopupEvent]);

  return {
    handleEventAdded, handleDeleteEvent, handleDragStart,
    handleDragOver, handleDrop, handleEditEvent, navigateToEvent, handleEventClick,
  };
}

export type CalendarActions = ReturnType<typeof useCalendarActions>;
