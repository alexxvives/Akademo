import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { ArchivedVideoItem } from '@/components/shared/media-library/types';

export function useArchivedVideos(role: string, selectedAcademy: string, selectedClass?: string) {
  const [archivedVideos, setArchivedVideos] = useState<ArchivedVideoItem[]>([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadArchived = useCallback(async () => {
    setLoadingArchived(true);
    try {
      const params = new URLSearchParams();
      if (role === 'ADMIN' && selectedAcademy !== 'all') params.set('academyId', selectedAcademy);
      if (selectedClass && selectedClass !== 'all') params.set('classId', selectedClass);
      const res = await apiClient(`/bunny/archive?${params}`);
      const data = await res.json();
      if (data.success) setArchivedVideos(data.data.videos || []);
    } catch { /* ignore */ } finally {
      setLoadingArchived(false);
    }
  }, [role, selectedAcademy, selectedClass]);

  const deleteArchived = useCallback(async (id: string) => {
    try {
      const res = await apiClient(`/bunny/archive/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setArchivedVideos(prev => prev.filter(v => v.id !== id));
    } catch { /* ignore */ }
  }, []);

  return { archivedVideos, loadingArchived, showUploadModal, setShowUploadModal, loadArchived, deleteArchived };
}
