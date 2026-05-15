'use client';

import { useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { createVideoFormEntry } from './class-upload-utils';
import type { Lesson, StreamRecording } from './types';
import type { ClassDetailState } from './useClassDetail';

export function useClassActions(s: ClassDetailState) {
  // --- Effects ---
  useEffect(() => {
    if (s.classId) { s.loadData(); s.loadLiveClasses(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.classId]);

  useEffect(() => {
    if (s.classData?.id) s.loadLiveClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.classData?.id]);

  useEffect(() => {
    if (!s.classData?.id) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    let pollCount = 0;
    const MAX_POLLS = 120; // Cap at ~1 hour
    const pollLiveStreams = async () => {
      if (pollCount >= MAX_POLLS) return;
      pollCount++;
      try {
        const res = await apiClient(`/live?classId=${s.classData!.id}`);
        const result = await res.json();
        if (result.success) {
          const filtered = (result.data || []).filter((st: { status: string }) => st.status === 'active' || st.status === 'scheduled');
          s.setLiveClasses(filtered);
          timeoutId = setTimeout(pollLiveStreams, filtered.some((st: { status: string }) => st.status === 'active') ? 15000 : 30000);
        } else { timeoutId = setTimeout(pollLiveStreams, 30000); }
      } catch { timeoutId = setTimeout(pollLiveStreams, 30000); }
    };
    pollLiveStreams();
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.classData?.id]);

  // URL param effects
  useEffect(() => {
    if (s.lessons.length === 0) return;
    const lessonParam = s.searchParams.get('lesson');
    const watchVideoId = s.searchParams.get('watch');
    if (lessonParam) {
      s.loadLessonDetail(lessonParam).then(lesson => {
        if (lesson) {
          const video = watchVideoId ? lesson.videos.find(v => v.id === watchVideoId) : lesson.videos[0];
          if (video) s.setSelectedVideo(video);
        }
      });
    } else { s.setSelectedLesson(null); s.setSelectedVideo(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.searchParams.get('lesson'), s.searchParams.get('watch'), s.lessons]);

  useEffect(() => {
    const highlightParam = s.searchParams.get('highlight');
    if (!highlightParam || s.lessons.length === 0) return;
    if (s.lessons.find(l => l.id === highlightParam)) s.setHighlightLessonId(highlightParam);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.searchParams, s.lessons, s.setHighlightLessonId]);

  useEffect(() => {
    const createFromStreamId = s.searchParams.get('createFromStream');
    if (createFromStreamId) {
      s.loadAvailableStreamRecordings().then((recordings) => {
        s.setShowLessonForm(true); s.setEditingLessonId(null);
        if (recordings && recordings.length > 0) {
          const match = recordings.find((r: StreamRecording) => r.id === createFromStreamId);
          if (match) s.setLessonFormData(prev => ({ ...prev, selectedStreamRecordings: [match.id], title: match.title || 'Nueva Lección' }));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.searchParams]);

  useEffect(() => {
    const actionParam = s.searchParams.get('action');
    if (actionParam === 'create' || actionParam === 'create-lesson') {
      const recordingId = s.searchParams.get('recordingId');
      const streamTitle = s.searchParams.get('streamTitle');
      s.setShowLessonForm(true); s.setEditingLessonId(null);
      s.loadAvailableStreamRecordings().then((recordings) => {
        if (recordingId && streamTitle && recordings) {
          const match = recordings.find((r: StreamRecording) => r.recordingId === recordingId);
          if (match) s.setLessonFormData(prev => ({ ...prev, selectedStreamRecording: match.id, title: decodeURIComponent(streamTitle) }));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.searchParams.get('action')]);

  // --- Navigation ---
  const selectLesson = (lesson: Lesson) => s.router.push(`${s.basePath}/subject/${s.classId}?lesson=${lesson.id}`);

  const goBackToLessons = () => {
    if (s.selectedLesson?.topicId) s.setExpandTopicId(s.selectedLesson.topicId);
    s.router.push(`${s.basePath}/subject/${s.classId}`);
    s.setSelectedLesson(null); s.setSelectedVideo(null); s.loadData();
  };

  const selectVideoInLesson = (video: { id: string }) => {
    if (!s.selectedLesson) return;
    s.router.push(`${s.basePath}/subject/${s.classId}?lesson=${s.selectedLesson.id}&watch=${video.id}`);
  };

  // --- Stream Actions ---
  const createLiveClass = async () => {
    if (!s.classData) { alert('Error: Datos de clase no cargados'); return; }
    const now = new Date();
    const month = now.toLocaleString('es-ES', { month: 'long' });
    s.setStreamNameInput(`STREAM (${now.getDate()} ${month.charAt(0).toUpperCase() + month.slice(1)}, ${now.getFullYear()})`);
    s.setShowStreamNameModal(true);
  };

  const confirmCreateStream = async () => {
    const streamTitle = s.streamNameInput.trim();
    if (!streamTitle || !s.classData) return;
    s.setShowStreamNameModal(false); s.setCreatingStream(true);
    try {
      if (s.paymentStatus === 'NOT PAID') {
        s.setLiveClasses(prev => [{ id: `demo-stream-${Date.now()}`, classId: s.classData!.id, teacherId: 'demo-teacher', status: 'scheduled', title: streamTitle, createdAt: new Date().toISOString(), zoomLink: '#', zoomStartUrl: '#', zoomMeetingId: 'demo', participantCount: 0 }, ...prev]);
        s.setCreatingStream(false); return;
      }
      const res = await apiClient('/live', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classId: s.classData.id, title: streamTitle }) });
      const result = await res.json();
      if (result.success) { s.setLiveClasses(prev => [result.data, ...prev]); s.setShowStreamNameModal(false); }
      else { alert(`Error: ${result.error || 'No se pudo crear la sesión en vivo'}`); }
    } catch (e: unknown) {
      const error = e instanceof Error ? e : null;
      alert(`Error de conexión: ${error?.message || 'No se pudo conectar al servidor'}`);
    } finally { s.setCreatingStream(false); }
  };

  const deleteLiveClass = async (classLiveId: string) => {
    if (!confirm('¿Eliminar este stream? Se cerrará la sala y se eliminará el registro.')) return;
    try {
      const res = await apiClient(`/live/${classLiveId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) s.setLiveClasses(prev => prev.filter(st => st.id !== classLiveId));
      else alert(`Error al eliminar el stream: ${result.error || 'Inténtalo de nuevo'}`);
    } catch { alert('Error de conexión al intentar eliminar el stream'); }
  };

  // --- Enrollment ---
  const handleEnrollmentAction = async (enrollmentId: string, action: 'approve' | 'reject') => {
    try {
      const res = await apiClient('/enrollments/pending', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enrollmentId, action }) });
      const result = await res.json();
      if (result.success) { s.setPendingEnrollments(prev => prev.filter(e => e.id !== enrollmentId)); s.loadData(); }
      else alert(result.error || 'Failed to process enrollment');
    } catch { alert('Error processing enrollment'); }
  };

  // --- Lesson CRUD ---
  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('¿Eliminar esta lección?\n\n⚠️ IMPORTANTE: Los videos de esta lección serán eliminados permanentemente de la plataforma y no podrán recuperarse.\n\nNota: Las grabaciones de streams no se ven afectadas.\n\n¿Estás seguro?')) return;
    try {
      const res = await apiClient(`/lessons/${lessonId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) s.loadData(); else alert(result.error || 'Failed to delete');
    } catch { alert('Error occurred'); }
  };

  const handleToggleRelease = async (lesson: Lesson) => {
    const isReleasedNow = new Date(lesson.releaseDate) <= new Date();
    const msg = isReleasedNow ? `¿Estás seguro de que deseas ocultar la lección "${lesson.title}"? Los estudiantes perderán el acceso inmediatamente.` : `¿Estás seguro de que deseas publicar la lección "${lesson.title}"? Los estudiantes tendrán acceso inmediatamente.`;
    if (!window.confirm(msg)) return;
    try {
      const newReleaseDate = isReleasedNow ? '2099-12-31T23:59:59Z' : (lesson.createdAt || new Date().toISOString());
      const res = await apiClient(`/lessons/${lesson.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ releaseDate: newReleaseDate, resetTimers: false }) });
      const result = await res.json();
      if (result.success) s.setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, releaseDate: newReleaseDate } : l));
      else alert(result.error || 'Error al cambiar visibilidad');
    } catch { alert('Error al cambiar visibilidad'); }
  };

  // Bulk toggle without per-lesson confirm dialogs.
  // If any lesson in the group is currently released → hide all released ones.
  // If all are already hidden → show all of them.
  const handleBulkToggleRelease = async (lessons: Lesson[]) => {
    const now = new Date();
    const releasedLessons = lessons.filter(l => new Date(l.releaseDate) <= now);
    const toToggle = releasedLessons.length > 0 ? releasedLessons : lessons;
    await Promise.all(toToggle.map(async (lesson) => {
      const newReleaseDate = releasedLessons.length > 0 ? '2099-12-31T23:59:59Z' : (lesson.createdAt || new Date().toISOString());
      try {
        const res = await apiClient(`/lessons/${lesson.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ releaseDate: newReleaseDate, resetTimers: false }) });
        const result = await res.json();
        if (result.success) s.setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, releaseDate: newReleaseDate } : l));
      } catch { /* ignore individual errors */ }
    }));
  };

  const handleLessonMove = async (lessonId: string, topicId: string | null) => {
    try {
      const res = await apiClient(`/lessons/${lessonId}/move`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topicId }) });
      const result = await res.json();
      if (result.success) s.setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, topicId } : l));
      else alert(result.error || 'Failed to move lesson');
    } catch { alert('Error moving lesson'); }
  };

  const handleRescheduleLesson = (lesson: Lesson) => {
    s.setReschedulingLesson(lesson);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    s.setRescheduleDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    s.setRescheduleTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
    s.setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async (newDate: string, newTime: string) => {
    if (!s.reschedulingLesson) return;
    try {
      const newReleaseDate = new Date(`${newDate}T${newTime}:00`);
      const movingToFuture = newReleaseDate > new Date(s.reschedulingLesson.releaseDate);
      const res = await apiClient(`/lessons/${s.reschedulingLesson.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ releaseDate: newReleaseDate.toISOString(), resetTimers: movingToFuture }) });
      const result = await res.json();
      if (result.success) {
        s.setShowRescheduleModal(false); s.setReschedulingLesson(null); s.loadData();
        if (movingToFuture) alert('Lección reprogramada. Los tiempos de visualización de todos los estudiantes han sido reiniciados.');
      } else alert(result.error || 'Failed to reschedule lesson');
    } catch { alert('Error rescheduling lesson'); }
  };

  const handleHideLesson = async () => {
    if (!s.reschedulingLesson) return;
    try {
      const res = await apiClient(`/lessons/${s.reschedulingLesson.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ releaseDate: '2099-12-31T23:59:59Z', resetTimers: false }) });
      const result = await res.json();
      if (result.success) {
        s.setLessons(prev => prev.map(l => l.id === s.reschedulingLesson!.id ? { ...l, releaseDate: '2099-12-31T23:59:59Z' } : l));
        s.setShowRescheduleModal(false); s.setReschedulingLesson(null);
      } else alert(result.error || 'Error al ocultar la clase');
    } catch { alert('Error al ocultar la clase'); }
  };

  const addVideoToForm = (file: File) => createVideoFormEntry(file, (entry) => s.setLessonFormData(p => ({ ...p, videos: [...p.videos, entry] })));
  const addDocumentToForm = (file: File) => s.setLessonFormData(p => ({ ...p, documents: [...p.documents, { file, title: '', description: '', allowDownload: false }] }));

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('¿Estás seguro de eliminar este video?')) return;
    try {
      const res = await apiClient(`/lessons/video/${videoId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) { s.setEditingLessonMedia(prev => prev ? ({ ...prev, videos: prev.videos.filter(v => v.id !== videoId) }) : null); s.loadData(); }
      else alert(result.error || 'Error al eliminar video');
    } catch { alert('Error de conexión'); }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;
    try {
      const res = await apiClient(`/lessons/document/${documentId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) { s.setEditingLessonMedia(prev => prev ? ({ ...prev, documents: prev.documents.filter(d => d.id !== documentId) }) : null); s.loadData(); }
      else alert(result.error || 'Error al eliminar documento');
    } catch { alert('Error de conexión'); }
  };

  const handleToggleDocumentDownload = async (documentId: string, allowDownload: boolean) => {
    try {
      const res = await apiClient(`/lessons/document/${documentId}`, { method: 'PATCH', body: JSON.stringify({ allowDownload }) });
      const result = await res.json();
      if (result.success) {
        s.setEditingLessonMedia(prev => prev ? ({ ...prev, documents: prev.documents.map(d => d.id === documentId ? { ...d, allowDownload } : d) }) : null);
      } else alert(result.error || 'Error al actualizar documento');
    } catch { alert('Error de conexión'); }
  };

  const handleToggleTopicHidden = async (topicId: string, hidden: boolean) => {
    try {
      const res = await apiClient(`/topics/${topicId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hidden }) });
      const result = await res.json();
      if (result.success) {
        s.setTopics(prev => prev.map(t => t.id === topicId ? { ...t, hidden: hidden ? 1 : 0 } : t));
      } else alert(result.error || 'Error al actualizar el tema');
    } catch { alert('Error de conexión'); }
  };

  return {
    selectLesson, goBackToLessons, selectVideoInLesson,
    createLiveClass, confirmCreateStream, deleteLiveClass,
    handleEnrollmentAction, handleDeleteLesson, handleToggleRelease, handleBulkToggleRelease,
    handleLessonMove, handleRescheduleLesson, handleRescheduleSubmit, handleHideLesson,
    addVideoToForm, addDocumentToForm, handleDeleteVideo, handleDeleteDocument, handleToggleDocumentDownload,
    handleToggleTopicHidden,
  };
}
