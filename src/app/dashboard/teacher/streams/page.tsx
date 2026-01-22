'use client';

import { useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import ConfirmModal from '@/components/ConfirmModal';
import { useStreamsData, Stream } from '@/hooks/useStreamsData';
import { StreamsHeader } from './components/StreamsHeader';
import { StreamsTable } from './components/StreamsTable';

export default function StreamsPage() {
  const { streams, setStreams, classes, academyName, loading } = useStreamsData();
  const [selectedClass, setSelectedClass] = useState('all');
  const [deletingStreamId, setDeletingStreamId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; streamId: string; streamTitle: string }>({ 
    isOpen: false, 
    streamId: '', 
    streamTitle: '' 
  });

  const openDeleteConfirmation = (streamId: string, streamTitle: string) => {
    setConfirmModal({ isOpen: true, streamId, streamTitle });
  };

  const updateStream = (streamId: string, updates: Partial<Stream>) => {
    setStreams(prev => prev.map(s => s.id === streamId ? { ...s, ...updates } : s));
  };

  const handleDeleteStream = async () => {
    const { streamId } = confirmModal;
    setConfirmModal({ isOpen: false, streamId: '', streamTitle: '' });
    setDeletingStreamId(streamId);
    
    try {
      const response = await apiClient(`/live/${streamId}`, { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        setStreams(streams.filter(s => s.id !== streamId));
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

  const filteredStreams = useMemo(() => {
    if (selectedClass === 'all') return streams;
    return streams.filter(s => s.classId === selectedClass);
  }, [streams, selectedClass]);

  return (
    <div className="space-y-6">
      <StreamsHeader 
        academyName={academyName}
        classes={classes}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
      />

      <StreamsTable
        streams={filteredStreams}
        loading={loading}
        deletingStreamId={deletingStreamId}
        onDelete={openDeleteConfirmation}
        onUpdateStream={updateStream}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Eliminar Stream"
        message={`¿Estás seguro que deseas eliminar el stream "${confirmModal.streamTitle}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="warning"
        onConfirm={handleDeleteStream}
        onCancel={() => setConfirmModal({ isOpen: false, streamId: '', streamTitle: '' })}
      />
    </div>
  );
}
