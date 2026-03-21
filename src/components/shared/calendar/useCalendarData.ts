'use client';

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { usePeriod } from '@/contexts/PeriodContext';
import {
  type CalendarEvent, type ClassSummary, type ViewMode,
  formatDateKey, startOfWeek,
} from './calendar-types';
import { loadCalendarData } from './loadCalendarData';

export function useCalendarData(role: 'ACADEMY' | 'ADMIN' | 'TEACHER' | 'STUDENT') {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('cal_view') as ViewMode | null;
      if (saved === 'month' || saved === 'week' || saved === 'day') return saved;
    }
    return 'week';
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('cal_class') || 'all';
    return 'all';
  });
  const [adminAcademies, setAdminAcademies] = useState<{id: string, name: string}[]>([]);
  const [selectedAdminAcademy, setSelectedAdminAcademy] = useState<string>(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('cal_academy') || 'all';
    return 'all';
  });
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [addEventDate, setAddEventDate] = useState<Date | null>(null);
  const [academyName, setAcademyName] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [scrollToTime, setScrollToTime] = useState<string | null>(null);
  const [popupEvent, setPopupEvent] = useState<CalendarEvent | null>(null);
  const dayViewScrollRef = useRef<HTMLDivElement>(null);

  const isStudent = role === 'STUDENT';
  const canCreateEvents = ['ACADEMY', 'TEACHER', 'ADMIN'].includes(role);
  const { activePeriodId, isClassInPeriod } = usePeriod();

  // Persist selected view across navigation within the session
  useEffect(() => { sessionStorage.setItem('cal_view', viewMode); }, [viewMode]);
  useEffect(() => { sessionStorage.setItem('cal_class', selectedClass); }, [selectedClass]);
  useEffect(() => { sessionStorage.setItem('cal_academy', selectedAdminAcademy); }, [selectedAdminAcademy]);

  // Lock body scroll when popup is open
  useEffect(() => {
    if (popupEvent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [popupEvent]);

  // ─── Data loading ───
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadCalendarData(role, isStudent);
      setAcademyName(data.academyName);
      setIsDemo(data.isDemo);
      setEvents(data.events);
      setClasses(data.classes);
      if (data.adminAcademies.length > 0) setAdminAcademies(data.adminAcademies);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, [isStudent, role]);

  useEffect(() => { loadData(); }, [loadData]);

  // Scroll day-view to the event's time slot after navigating
  useEffect(() => {
    if (viewMode !== 'day' || !scrollToTime || !dayViewScrollRef.current) return;
    const [hStr, mStr] = scrollToTime.split(':');
    const hour = parseInt(hStr, 10);
    const min = parseInt(mStr || '0', 10);
    const pixelOffset = (hour - 0) * 48 + (min / 60) * 48;
    const containerHeight = dayViewScrollRef.current.clientHeight;
    dayViewScrollRef.current.scrollTop = Math.max(0, pixelOffset - containerHeight / 2);
    setScrollToTime(null);
  }, [viewMode, scrollToTime]);

  // ─── Filtered events ───
  const filteredEvents = useMemo(() => {
    let result = events;
    if (selectedClass !== 'all') {
      result = result.filter(e => e.classId === selectedClass);
    } else if (role === 'ADMIN' && selectedAdminAcademy !== 'all') {
      const academyClassIds = new Set(classes.filter(c => c.academyId === selectedAdminAcademy).map(c => c.id));
      result = result.filter(e => e.classId ? academyClassIds.has(e.classId) : false);
    } else if (activePeriodId !== 'all') {
      const periodIds = new Set(classes.filter(c => isClassInPeriod(c.startDate)).map(c => c.id));
      result = result.filter(e => e.classId ? periodIds.has(e.classId) : false);
    }
    return result;
  }, [events, selectedClass, selectedAdminAcademy, role, activePeriodId, classes, isClassInPeriod]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of filteredEvents) {
      const key = event.date.startsWith('20') ? event.date.slice(0, 10) : formatDateKey(new Date(event.date));
      const existing = map.get(key) || [];
      existing.push(event);
      map.set(key, existing);
    }
    return map;
  }, [filteredEvents]);

  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const start = startOfWeek(firstDay);
      const days: Date[] = [];
      const current = new Date(start);
      while (days.length < 42) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
        if (days.length >= 35 && current.getMonth() !== month && current.getDay() === 1) break;
      }
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

  return {
    currentDate, setCurrentDate, viewMode, setViewMode,
    events, setEvents, classes, selectedClass, setSelectedClass,
    adminAcademies, selectedAdminAcademy, setSelectedAdminAcademy,
    loading, selectedDay, setSelectedDay,
    addEventDate, setAddEventDate, academyName, isDemo,
    draggedEventId, setDraggedEventId, dragOverDate, setDragOverDate,
    editingEvent, setEditingEvent, scrollToTime, setScrollToTime,
    popupEvent, setPopupEvent, dayViewScrollRef,
    isStudent, canCreateEvents, activePeriodId, isClassInPeriod,
    filteredEvents, eventsByDate, calendarDays,
    navigate, goToday, headerLabel,
  };
}

export type CalendarState = ReturnType<typeof useCalendarData>;
