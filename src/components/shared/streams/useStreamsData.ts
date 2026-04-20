'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { generateDemoStreams } from '@/lib/demo-data';
import { usePeriod } from '@/contexts/PeriodContext';
import type { Stream, Academy, ClassOption } from './types';

export function useStreamsData(role: 'ACADEMY' | 'ADMIN' | 'TEACHER') {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const [deletingStreamId, setDeletingStreamId] = useState<string | null>(null);

  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState('all');

  const searchParams = useSearchParams();
  const [glowId, setGlowId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLTableRowElement | null>(null);
  const setHighlightRef = useCallback((el: HTMLTableRowElement | null) => {
    highlightRef.current = el;
  }, []);

  const isAcademy = role === 'ACADEMY';
  const isTeacher = role === 'TEACHER';
  const isAdmin = role === 'ADMIN';
  const isDemo = (isAcademy || isTeacher) && paymentStatus === 'NOT PAID';
  const { activePeriodId, isClassInPeriod } = usePeriod();
  const dashboardBase = isAcademy ? '/dashboard/academy' : isTeacher ? '/dashboard/teacher' : '/dashboard/admin';

  const loadStreams = useCallback(async () => {
    try {
      const response = await apiClient('/live/history');
      const result = await response.json();
      if (result.success) {
        setStreams(result.data || []);
      }
    } catch (error) {
      console.error('Error loading streams:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const demoClasses: ClassOption[] = [
    { id: 'demo-c1', name: 'Programación Web' },
    { id: 'demo-c2', name: 'Matemáticas Avanzadas' },
    { id: 'demo-c3', name: 'Diseño Gráfico' },
    { id: 'demo-c4', name: 'Física Cuántica' },
  ];

  const setDemoData = useCallback((status: string) => {
    if (status === 'NOT PAID') {
      const allDemoStreams = generateDemoStreams() as Stream[];
      // Teachers only see streams from their own classes (demo-c1: Programación Web)
      const filteredStreams = isTeacher
        ? allDemoStreams.filter(s => s.classId === 'demo-c1')
        : allDemoStreams;
      const filteredClasses = isTeacher
        ? demoClasses.filter(c => c.id === 'demo-c1')
        : demoClasses;
      setStreams(filteredStreams.map((stream) => ({
        ...stream,
        classSlug: stream.className.toLowerCase().replace(/\s+/g, '-'),
      })));
      setClasses(filteredClasses);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher]);

  const loadData = useCallback(async () => {
    try {
      if (role === 'TEACHER') {
        const academyRes = await apiClient('/teacher/academy');
        if (academyRes.ok) {
          const academyResult = await academyRes.json() as { data?: { academy?: { name?: string; paymentStatus?: string } } };
          if (academyResult.data?.academy) {
            setAcademyName(academyResult.data.academy.name || '');
            const status = academyResult.data.academy.paymentStatus || 'NOT PAID';
            setPaymentStatus(status);
            if (status === 'NOT PAID') { setDemoData(status); return; }
          }
        }
        const [classesRes, streamsRes] = await Promise.all([apiClient('/classes'), apiClient('/live/history')]);
        const [classesResult, streamsResult] = await Promise.all([classesRes.json(), streamsRes.json()]);
        if (classesResult.success && Array.isArray(classesResult.data)) setClasses(classesResult.data);
        if (streamsResult.success && Array.isArray(streamsResult.data)) setStreams(streamsResult.data);
        setLoading(false);
      } else if (role === 'ACADEMY') {
        const [academiesRes, classesRes] = await Promise.all([apiClient('/academies'), apiClient('/academies/classes')]);
        const [academiesResult, classesResult] = await Promise.all([academiesRes.json(), classesRes.json()]);
        if (academiesResult.success && Array.isArray(academiesResult.data) && academiesResult.data.length > 0) {
          const academy = academiesResult.data[0];
          setAcademyName(academy.name);
          const status = academy.paymentStatus || 'NOT PAID';
          setPaymentStatus(status);
          if (status === 'NOT PAID') { setDemoData(status); return; }
          await loadStreams();
        }
        if (classesResult.success && Array.isArray(classesResult.data)) setClasses(classesResult.data);
      } else {
        const [academiesRes, classesRes, streamsRes] = await Promise.all([
          apiClient('/admin/academies'), apiClient('/classes'), apiClient('/live/history'),
        ]);
        const [academiesResult, classesResult, streamsResult] = await Promise.all([
          academiesRes.json(), classesRes.json(), streamsRes.json(),
        ]);
        if (academiesResult.success && Array.isArray(academiesResult.data)) {
          setAcademies(academiesResult.data.filter((a: { paymentStatus?: string }) => a.paymentStatus === 'PAID'));
        }
        if (classesResult.success && Array.isArray(classesResult.data)) setClasses(classesResult.data);
        if (streamsResult.success && Array.isArray(streamsResult.data)) setStreams(streamsResult.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  }, [role, loadStreams, setDemoData]);

  useEffect(() => {
    loadData();
    // No polling — this is a history page, not real-time monitoring.
    // Data refreshes on navigation or manual action (edit/delete).
  }, [loadData, role]);

  const filteredStreams = useMemo(() => {
    let result = streams;
    if (role === 'ADMIN' && selectedAcademy !== 'all') {
      result = result.filter((s) => s.academyId === selectedAcademy);
    }
    if (selectedClass !== 'all') {
      result = result.filter((s) => s.classId === selectedClass);
    } else if (!isAdmin && activePeriodId !== 'all') {
      const periodIds = new Set(classes.filter(c => isClassInPeriod(c.startDate)).map(c => c.id));
      result = result.filter((s) => periodIds.has(s.classId));
    }
    return result.sort((a, b) => {
      const dateA = new Date(a.startedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.startedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [streams, selectedClass, selectedAcademy, role, isAdmin, classes, activePeriodId, isClassInPeriod]);

  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (!highlightId || filteredStreams.length === 0) return;
    setGlowId(highlightId);
    setTimeout(() => {
      if (highlightRef.current) {
        highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
    const timer = setTimeout(() => setGlowId(null), 3300);
    return () => clearTimeout(timer);
  }, [searchParams, filteredStreams.length]);

  const filteredClassOptions = useMemo(() => {
    if (role !== 'ADMIN' || selectedAcademy === 'all') return [];
    return classes.filter((c) => c.academyId === selectedAcademy);
  }, [role, classes, selectedAcademy]);

  const handleEditTitle = (streamId: string, currentTitle: string) => {
    if (isDemo) return;
    setEditingTitleId(streamId);
    setEditingTitleValue(currentTitle);
  };

  const handleCancelEdit = () => {
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const handleSaveTitle = async (streamId: string) => {
    if (!editingTitleValue.trim()) { setEditingTitleId(null); return; }
    setEditingTitleId(null);
    try {
      const response = await apiClient(`/live/${streamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitleValue.trim() }),
      });
      const result = await response.json();
      if (result.success) {
        setStreams(prev => prev.map((s) => (s.id === streamId ? { ...s, title: editingTitleValue.trim() } : s)));
      } else {
        alert(`Error al actualizar el título: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error updating title:', error);
      alert('Error al actualizar el título');
    } finally {
      setEditingTitleValue('');
    }
  };

  const handleDeleteStream = async (streamId: string, streamTitle: string) => {
    if (isDemo) return;
    const streamData = streams.find(s => s.id === streamId);
    const hasRecording = !!streamData?.recordingId;
    const confirmMsg = hasRecording
      ? `¿Estás seguro que deseas eliminar el stream "${streamTitle}"?\n\nEste stream tiene una grabación. Si lo eliminas, la grabación también será eliminada de la base de datos y dejará de estar accesible.`
      : `¿Estás seguro que deseas eliminar el stream "${streamTitle}"? Esta acción no se puede deshacer.`;
    if (!confirm(confirmMsg)) return;
    setDeletingStreamId(streamId);
    try {
      const response = await apiClient(`/live/${streamId}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success || response.status === 404) {
        setStreams(prev => prev.filter((s) => s.id !== streamId));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting stream:', error);
      alert('Error al eliminar stream');
    } finally {
      setDeletingStreamId(null);
    }
  };

  return {
    streams, loading, classes, academyName, academies,
    selectedClass, setSelectedClass,
    selectedAcademy, setSelectedAcademy,
    editingTitleId, editingTitleValue, setEditingTitleValue,
    deletingStreamId, glowId, setHighlightRef,
    isAcademy, isTeacher, isAdmin, isDemo, dashboardBase,
    filteredStreams, filteredClassOptions, activePeriodId, isClassInPeriod,
    handleEditTitle, handleCancelEdit, handleSaveTitle, handleDeleteStream,
  };
}
