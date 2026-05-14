'use client';

import { apiClient } from '@/lib/api-client';
import { uploadFilesToServices } from './class-upload-utils';
import type { Lesson, LessonDetailResponse } from './types';
import type { ClassDetailState } from './useClassDetail';

const resetFormData = (defaults: { maxWatchTimeMultiplier: number; watermarkIntervalMins: number }) => {
  const today = new Date().toISOString().split('T')[0];
  return {
    title: '', description: '', externalUrl: '',
    releaseDate: today, releaseTime: '00:00', publishImmediately: true,
    publishMode: 'immediate' as const,
    availableFromDate: today, availableFromTime: '09:00',
    availableUntilDate: today, availableUntilTime: '21:00',
    maxWatchTimeMultiplier: defaults.maxWatchTimeMultiplier, watermarkIntervalMins: defaults.watermarkIntervalMins,
    topicId: '', videos: [] as { file: File; title: string; description: string; duration: number }[],
    documents: [] as { file: File; title: string; description: string }[], selectedStreamRecordings: [] as string[],
    links: [] as { title: string; url: string }[],
  };
};

export function useLessonCreateEdit(s: ClassDetailState) {
  const handleLessonCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Stream recording path
    if (s.lessonFormData.selectedStreamRecordings.length > 0) {
      try {
        const response = await apiClient('/live/create-lesson', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId: s.lessonFormData.selectedStreamRecordings[0], classId: s.classData?.id,
            title: s.lessonFormData.title || undefined, description: s.lessonFormData.description || undefined,
            topicId: s.lessonFormData.topicId || undefined, maxWatchTimeMultiplier: s.lessonFormData.maxWatchTimeMultiplier,
            watermarkIntervalMins: s.lessonFormData.watermarkIntervalMins,
            releaseDate: s.lessonFormData.publishMode === 'immediate' ? undefined : `${s.lessonFormData.releaseDate}T${s.lessonFormData.releaseTime}:00`,
            availableFrom: s.lessonFormData.publishMode === 'window' ? `${s.lessonFormData.availableFromDate}T${s.lessonFormData.availableFromTime}:00` : undefined,
            availableUntil: s.lessonFormData.publishMode === 'window' ? `${s.lessonFormData.availableUntilDate}T${s.lessonFormData.availableUntilTime}:00` : undefined,
          }),
        });
        const result = await response.json();
        if (result.success) {
          const topicToExpand = (!s.lessonFormData.topicId || s.lessonFormData.topicId === '') ? 'uncategorized' : s.lessonFormData.topicId;
          const url = new URL(window.location.href);
          if (url.searchParams.has('action')) { url.searchParams.delete('action'); url.searchParams.delete('recordingId'); url.searchParams.delete('streamTitle'); window.history.replaceState({}, '', url.toString()); }
          s.setShowLessonForm(false); s.setLessonFormData(resetFormData(s.academyDefaults));
          await s.loadData(); s.setExpandTopicId(topicToExpand);
        } else { alert(`Error: ${result.error || 'Unknown error'}`); }
      } catch { alert('Error al crear lección desde grabación'); }
      return;
    }

    if (s.lessonFormData.videos.length === 0 && s.lessonFormData.documents.length === 0 && s.lessonFormData.links.length === 0) {
      return alert('Agrega al menos un video, documento o enlace, o selecciona una grabación de stream');
    }

    const releaseTimestamp = s.lessonFormData.publishMode === 'immediate'
      ? new Date().toISOString()
      : new Date(`${s.lessonFormData.releaseDate}T${s.lessonFormData.releaseTime}:00`).toISOString();
    const availableFrom = s.lessonFormData.publishMode === 'window'
      ? new Date(`${s.lessonFormData.availableFromDate}T${s.lessonFormData.availableFromTime}:00`).toISOString()
      : undefined;
    const availableUntil = s.lessonFormData.publishMode === 'window'
      ? new Date(`${s.lessonFormData.availableUntilDate}T${s.lessonFormData.availableUntilTime}:00`).toISOString()
      : undefined;

    const tempLessonId = `temp_${Date.now()}`;
    const tempLesson: Lesson = {
      id: tempLessonId, title: s.lessonFormData.title || new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
      description: s.lessonFormData.description, releaseDate: releaseTimestamp, topicId: s.lessonFormData.topicId || null,
      maxWatchTimeMultiplier: s.lessonFormData.maxWatchTimeMultiplier, watermarkIntervalMins: s.lessonFormData.watermarkIntervalMins,
      videoCount: s.lessonFormData.videos.length, documentCount: s.lessonFormData.documents.length, isUploading: true, uploadProgress: 0,
    };

    s.setLessons(prev => [tempLesson, ...prev]); s.setShowLessonForm(false);
    s.setUploading(true); s.setUploadProgress(0);
    const topicToExpand = (s.lessonFormData.topicId === null || s.lessonFormData.topicId === undefined || s.lessonFormData.topicId === '') ? 'uncategorized' : s.lessonFormData.topicId;
    s.setExpandTopicId(topicToExpand);
    const url = new URL(window.location.href);
    if (url.searchParams.has('action')) { url.searchParams.delete('action'); window.history.replaceState({}, '', url.toString()); }

    const abortController = new AbortController();
    s.activeUploadRef.current = abortController;
    s.uploadStartTimeRef.current = Date.now();
    s.lastProgressRef.current = { loaded: 0, time: Date.now() };

    try {
      const { videos, documents } = await uploadFilesToServices(
        s.lessonFormData.videos, s.lessonFormData.documents,
        s.classData?.name || undefined,
        s.classData?.academy?.name || undefined,
        tempLessonId,
        { onOverallProgress: (p) => s.setUploadProgress(p), onSpeedUpdate: (speed, eta) => { s.setUploadSpeed(speed); s.setUploadETA(eta); },
          onLessonProgress: (id, p) => s.setLessons(prev => prev.map(l => l.id === id ? { ...l, uploadProgress: p } : l)) },
        s.lastProgressRef, abortController.signal,
      );

      const res = await apiClient('/lessons/create-with-uploaded', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: s.classData?.id, title: s.lessonFormData.title || new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
          description: s.lessonFormData.description, releaseDate: releaseTimestamp, topicId: s.lessonFormData.topicId || null,
          maxWatchTimeMultiplier: s.lessonFormData.maxWatchTimeMultiplier, watermarkIntervalMins: s.lessonFormData.watermarkIntervalMins, videos, documents,
          links: s.lessonFormData.links.length > 0 ? s.lessonFormData.links : undefined,
          availableFrom, availableUntil,
        }),
        signal: abortController.signal,
      });
      const result = await res.json();
      if (result.success) {
        s.setLessons(prev => prev.map(l => l.id === tempLessonId ? { ...result.data, isUploading: false } : l));
        s.setLessonFormData(resetFormData(s.academyDefaults)); s.setUploadProgress(0); await s.loadData();
      } else { s.setLessons(prev => prev.filter(l => l.id !== tempLessonId)); alert(result.error || 'Failed to create lesson'); }
    } catch (e: unknown) {
      const error = e instanceof Error ? e : null;
      s.setLessons(prev => prev.filter(l => l.id !== tempLessonId));
      if (error?.name !== 'AbortError') alert('Error uploading files. Please check your connection and try again.');
    } finally { s.setUploading(false); s.setUploadProgress(0); s.activeUploadRef.current = null; }
  };

  const handleEditLesson = async (lesson: Lesson) => {
    if (s.paymentStatus === 'NOT PAID') {
      s.setEditingLessonMedia({ videos: [], documents: [], links: [] });
      s.setLessonFormData({
        title: lesson.title, description: lesson.description || '', externalUrl: '', releaseDate: lesson.releaseDate.split('T')[0],
        releaseTime: '00:00', publishImmediately: true, publishMode: 'immediate',
        availableFromDate: new Date().toISOString().split('T')[0], availableFromTime: '09:00',
        availableUntilDate: new Date().toISOString().split('T')[0], availableUntilTime: '21:00',
        maxWatchTimeMultiplier: lesson.maxWatchTimeMultiplier,
        watermarkIntervalMins: lesson.watermarkIntervalMins, topicId: lesson.topicId || '', videos: [], documents: [], selectedStreamRecordings: [], links: [],
      });
      s.setEditingLessonId(lesson.id); s.setShowLessonForm(true); return;
    }
    try {
      const res = await apiClient(`/lessons/${lesson.id}`);
      const result = await res.json();
      if (!result.success || !result.data) { alert('Error loading lesson details'); return; }
      const detail: LessonDetailResponse = result.data;
      s.setEditingLessonMedia({
        videos: (detail.videos || []).map(v => ({ id: v.id, title: v.title || 'Video', durationSeconds: v.durationSeconds, bunnyGuid: v.upload?.bunnyGuid })),
        documents: (detail.documents || []).map(d => ({ id: d.id, title: d.title || d.upload?.fileName || 'Document', fileName: d.upload?.fileName || 'Unknown', storagePath: d.upload?.storagePath || '' })),
        links: (detail.links || []).map((l: { id: string; title: string; url: string; orderIndex: number }) => ({ id: l.id, title: l.title, url: l.url, orderIndex: l.orderIndex })),
      });
      const existingFrom = detail.availableFrom ? new Date(detail.availableFrom) : null;
      const existingUntil = detail.availableUntil ? new Date(detail.availableUntil) : null;
      const existingMode = existingFrom || existingUntil ? 'window' : 'immediate';
      s.setLessonFormData({
        title: detail.title, description: detail.description || '', externalUrl: detail.externalUrl || '', releaseDate: detail.releaseDate.split('T')[0],
        releaseTime: '00:00', publishImmediately: true, publishMode: existingMode,
        availableFromDate: existingFrom ? existingFrom.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        availableFromTime: existingFrom ? existingFrom.toTimeString().slice(0, 5) : '09:00',
        availableUntilDate: existingUntil ? existingUntil.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        availableUntilTime: existingUntil ? existingUntil.toTimeString().slice(0, 5) : '21:00',
        maxWatchTimeMultiplier: detail.maxWatchTimeMultiplier,
        watermarkIntervalMins: detail.watermarkIntervalMins, topicId: detail.topicId || '', videos: [], documents: [], selectedStreamRecordings: [], links: [],
      });
      s.setEditingLessonId(lesson.id); s.setShowLessonForm(true);
    } catch { alert('Error loading lesson details'); }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!s.editingLessonId) return;
    try {
      const res = await apiClient(`/lessons/${s.editingLessonId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: s.lessonFormData.title, description: s.lessonFormData.description, maxWatchTimeMultiplier: s.lessonFormData.maxWatchTimeMultiplier, watermarkIntervalMins: s.lessonFormData.watermarkIntervalMins, topicId: s.lessonFormData.topicId || null,
          availableFrom: s.lessonFormData.publishMode === 'window' ? `${s.lessonFormData.availableFromDate}T${s.lessonFormData.availableFromTime}:00` : null,
          availableUntil: s.lessonFormData.publishMode === 'window' ? `${s.lessonFormData.availableUntilDate}T${s.lessonFormData.availableUntilTime}:00` : null,
        }),
      });
      const result = await res.json();
      if (!result.success) { alert(result.error || 'Failed to update lesson'); return; }

      if (s.lessonFormData.videos.length > 0 || s.lessonFormData.documents.length > 0 || s.lessonFormData.selectedStreamRecordings.length > 0) {
        s.setUploading(true);
        const abortController = new AbortController();
        try {
          if (s.lessonFormData.selectedStreamRecordings.length > 0) {
            const streamRes = await apiClient(`/lessons/${s.editingLessonId}/add-stream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ streamId: s.lessonFormData.selectedStreamRecordings[0] }) });
            const streamResult = await streamRes.json();
            if (!streamResult.success) alert(`Error al añadir grabación de stream: ${streamResult.error}`);
          }
          if (s.lessonFormData.videos.length > 0 || s.lessonFormData.documents.length > 0) {
            s.lastProgressRef.current = { loaded: 0, time: Date.now() };
            const { videos, documents } = await uploadFilesToServices(
              s.lessonFormData.videos, s.lessonFormData.documents,
              s.classData?.name || undefined,
              s.classData?.academy?.name || undefined,
              s.editingLessonId,
              { onOverallProgress: (p) => s.setUploadProgress(p), onSpeedUpdate: (speed, eta) => { s.setUploadSpeed(speed); s.setUploadETA(eta); },
                onLessonProgress: () => {} }, s.lastProgressRef, abortController.signal,
            );
            if (videos.length > 0 || documents.length > 0) {
              const addRes = await apiClient(`/lessons/${s.editingLessonId}/add-files`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videos, documents }) });
              const addResult = await addRes.json();
              if (!addResult.success) console.error('Failed to add files:', addResult.error);
            }
          }
        } catch { alert('Error al subir archivos adicionales'); }
        finally { s.setUploading(false); s.setUploadProgress(0); }
      }

      s.setLessonFormData(resetFormData(s.academyDefaults));
      s.setEditingLessonId(null); s.setEditingLessonMedia(null); s.setShowLessonForm(false); s.loadData();
    } catch { alert('Error updating lesson'); }
  };

  const handleAddLink = async (title: string, url: string) => {
    if (!s.editingLessonId) return;
    try {
      const res = await apiClient(`/lessons/${s.editingLessonId}/links`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url }),
      });
      const result = await res.json();
      if (!result.success) { alert(result.error || 'Error al añadir enlace'); return; }
      // Optimistically update local state
      s.setEditingLessonMedia(prev => prev ? {
        ...prev,
        links: [...prev.links, result.data],
      } : prev);
    } catch { alert('Error al añadir enlace'); }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!s.editingLessonId) return;
    try {
      const res = await apiClient(`/lessons/${s.editingLessonId}/links/${linkId}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) { alert(result.error || 'Error al eliminar enlace'); return; }
      s.setEditingLessonMedia(prev => prev ? {
        ...prev,
        links: prev.links.filter(l => l.id !== linkId),
      } : prev);
    } catch { alert('Error al eliminar enlace'); }
  };

  return { handleLessonCreate, handleEditLesson, handleUpdateLesson, handleAddLink, handleDeleteLink };
}
