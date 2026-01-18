'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import ConfirmModal from '@/components/ConfirmModal';

interface Stream {
  id: string;
  title: string;
  classId: string;
  classSlug?: string;
  className: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  zoomMeetingId: string | null;
  zoomStartUrl?: string; // Teacher host url
  zoomLink?: string; // Student join url
  recordingId: string | null;
  participantCount?: number | null;
  participantsFetchedAt?: string | null;
  bunnyStatus?: number | null; // Bunny video processing status
}

export default function StreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploadingStreamId, setUploadingStreamId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const [creatingLessonId, setCreatingLessonId] = useState<string | null>(null);
  const [deletingStreamId, setDeletingStreamId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; streamId: string; streamTitle: string }>({ isOpen: false, streamId: '', streamTitle: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStreams();
    loadAcademyName();
    
    // Poll for stream status updates and recording availability every 10 seconds
    const pollInterval = setInterval(() => {
      loadStreams();
      checkRecordingAvailability();
    }, 10000);
    
    return () => clearInterval(pollInterval);
  }, []);

  const checkRecordingAvailability = async () => {
    // Find streams that ended but don't have a recordingId yet
    const endedWithoutRecording = streams.filter(
      s => s.status === 'ended' && !s.recordingId && s.zoomMeetingId
    );

    if (endedWithoutRecording.length === 0) return;

    try {
      // Check Bunny for each stream's recording
      const checks = endedWithoutRecording.map(async (stream) => {
        const response = await apiClient(`/live/${stream.id}/check-recording`);
        const result = await response.json();
        
        if (result.success && result.recordingId) {
          // Update the stream with the recordingId
          setStreams(prev => prev.map(s => 
            s.id === stream.id 
              ? { ...s, recordingId: result.recordingId, bunnyStatus: result.bunnyStatus }
              : s
          ));
        }
      });

      await Promise.all(checks);
    } catch (error) {
      console.error('Error checking recording availability:', error);
    }
  };

  const loadAcademyName = async () => {
    try {
      const response = await apiClient('/requests/teacher');
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        setAcademyName(result[0].academyName);
      }
    } catch (error) {
      console.error('Error loading academy name:', error);
    }
  };

  const loadStreams = async () => {
    try {
      const response = await apiClient('/live/history');
      const result = await response.json();
      if (result.success) {
        // Show ALL streams including scheduled/waiting ones
        setStreams(result.data || []);
      }
    } catch (error) {
      console.error('Error loading streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = (streamId: string) => {
    setUploadingStreamId(streamId);
    fileInputRef.current?.click();
  };

  const handleEditTitle = (streamId: string, currentTitle: string) => {
    setEditingTitleId(streamId);
    setEditingTitleValue(currentTitle);
  };

  const handleSaveTitle = async (streamId: string) => {
    if (!editingTitleValue.trim()) {
      setEditingTitleId(null);
      return;
    }

    // Exit edit mode immediately for better UX
    setEditingTitleId(null);

    try {
      const response = await apiClient(`/live/${streamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitleValue.trim() }),
      });

      const result = await response.json();
      if (result.success) {
        setStreams(streams.map(s => 
          s.id === streamId ? { ...s, title: editingTitleValue.trim() } : s
        ));
      } else {
        // Show the actual error message from the API
        alert(`Error al actualizar el título: ${result.error || 'Error desconocido'}`);
        console.error('API Error:', result);
      }
    } catch (error) {
      console.error('Error updating title:', error);
      alert(`Error al actualizar el título: ${error}`);
    } finally {
      setEditingTitleValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const handleCreateLesson = async (streamId: string) => {
    if (!confirm('¿Crear lección desde esta grabación?')) return;
    
    setCreatingLessonId(streamId);
    try {
      const response = await apiClient('/live/create-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadStreams();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating lesson:', error);
      alert('Error al crear lección');
    } finally {
      setCreatingLessonId(null);
    }
  };

  const openDeleteConfirmation = (streamId: string, streamTitle: string) => {
    setConfirmModal({ isOpen: true, streamId, streamTitle });
  };

  const handleDeleteStream = async () => {
    const { streamId, streamTitle } = confirmModal;
    setConfirmModal({ isOpen: false, streamId: '', streamTitle: '' });
    setDeletingStreamId(streamId);
    try {
      const response = await apiClient(`/live/${streamId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove from local state immediately
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

  const syncRecording = async (streamId: string) => {
    try {
      if (!confirm('¿Buscar grabación en Zoom y sincronizar? Esto puede tardar unos segundos.')) return;
      
      const res = await apiClient(`/live/${streamId}/check-recording`, { method: 'POST' });
      const result = await res.json();
      
      if (result.success) {
        alert('✅ Grabación encontrada y sincronizada. Puede tardar unos minutos en procesarse en CDN.');
        loadStreams(); // Refresh list
      } else {
        alert(`⚠️ ${result.error || 'No se encontró grabación'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert('Error de conexión');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingStreamId) return;

    const stream = streams.find(s => s.id === uploadingStreamId);
    if (!stream) return;

    setUploadProgress(0);

    try {
      // Step 1: Get upload URL
      const response = await apiClient('/live/upload-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: uploadingStreamId,
          filename: file.name,
          contentType: file.type,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        alert(`Error: ${result.error}`);
        return;
      }

      // Step 2: Upload to Bunny CDN
      setUploadProgress(10);
      const uploadResponse = await fetch(result.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'AccessKey': result.accessKey,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to CDN');
      }

      setUploadProgress(70);

      // Step 3: Create lesson from recording
      const createLessonResponse = await apiClient('/live/create-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: uploadingStreamId,
          videoPath: result.videoPath,
        }),
      });

      const lessonResult = await createLessonResponse.json();
      if (!lessonResult.success) {
        alert(`Error creando lección: ${lessonResult.error}`);
        return;
      }

      setUploadProgress(100);

      // Refresh streams list
      await loadStreams();

    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Error subiendo grabación: ${error.message}`);
    } finally {
      setUploadingStreamId(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatDuration = (start: string | null, end: string | null): string => {
    if (!start) return '-';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (date: string): string => {
    const formatted = new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            En Vivo
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Esperando
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            Finalizado
          </span>
        );
      case 'recording_failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            Error de grabación
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {status}
          </span>
        );
    }
  };

  const activeCount = streams.filter(s => s.status === 'active' || s.status === 'scheduled').length;
  const endedCount = streams.filter(s => s.status === 'ended' || s.status === 'recording_failed').length;
  
  // Calculate average participants per stream
  const streamsWithParticipants = streams.filter(s => s.participantCount != null);
  const avgParticipants = streamsWithParticipants.length > 0
    ? Math.round(streamsWithParticipants.reduce((acc, s) => acc + (s.participantCount || 0), 0) / streamsWithParticipants.length)
    : 0;
  
  const totalDurationMs = streams.reduce((acc, stream) => {
    if (!stream.startedAt && !stream.createdAt) return acc;
    const start = stream.startedAt || stream.createdAt;
    const end = stream.endedAt || (stream.status === 'active' ? new Date().toISOString() : stream.createdAt);
    return acc + (new Date(end).getTime() - new Date(start).getTime());
  }, 0);
  const totalHours = Math.floor(totalDurationMs / (1000 * 60 * 60));
  const totalMinutes = Math.floor((totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Historial de Streams</h1>
          {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{avgParticipants}</p>
                <p className="text-sm text-purple-100">Participantes promedio</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{endedCount}</p>
                <p className="text-sm text-blue-100">Streams anteriores</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`}
                </p>
                <p className="text-sm text-green-100">Tiempo total transmitido</p>
              </div>
            </div>
          </div>
        </div>

        {/* Streams List */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : streams.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay streams</h3>
            <p className="text-gray-500">
              Inicia un stream desde una de tus clases
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TÍTULO
                    </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clase
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participantes
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inicio
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grabación
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lección
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {streams.map((stream) => (
                  <tr key={stream.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {/* Delete button on the left */}
                        <button
                          onClick={() => openDeleteConfirmation(stream.id, stream.title)}
                          disabled={deletingStreamId === stream.id}
                          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar stream"
                        >
                          {deletingStreamId === stream.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                        
                        {stream.status === 'active' && (
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                        {editingTitleId === stream.id ? (
                          <input
                            type="text"
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            onBlur={() => handleSaveTitle(stream.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveTitle(stream.id);
                              } else if (e.key === 'Escape') {
                                setEditingTitleId(null);
                                setEditingTitleValue('');
                              }
                            }}
                            autoFocus
                            className="px-2 py-1 border border-blue-500 rounded text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{stream.title}</span>
                              <button
                                onClick={() => {
                                  setEditingTitleId(stream.id);
                                  setEditingTitleValue(stream.title);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Editar título"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Link 
                        href={`/dashboard/teacher/class/${stream.classSlug || stream.classId}`}
                        className="text-brand-600 hover:text-brand-700 font-medium"
                      >
                        {stream.className}
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(stream.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {stream.participantCount != null && stream.participantCount > 0 ? (
                          <span className="text-sm text-gray-600 font-medium">
                            {stream.participantCount}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDate(stream.startedAt || stream.createdAt)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {stream.status === 'active' && !stream.endedAt 
                          ? '—' 
                          : formatDuration(stream.startedAt || stream.createdAt, stream.endedAt)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {stream.recordingId ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Disponible
                        </span>
                      ) : (stream.status === 'ended' || stream.status === 'active') ? (
                        <span className="text-gray-400 text-sm">Procesando...</span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {(stream as any).validRecordingId ? (
                        <Link
                          href={`/dashboard/teacher/class/${stream.classSlug || stream.classId}?lesson=${(stream as any).validRecordingId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-blue-700 border-2 border-blue-200 hover:border-blue-300 rounded-lg text-xs font-semibold transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver lección
                        </Link>
                      ) : stream.recordingId ? (
                        <Link
                          href={`/dashboard/teacher/class/${stream.classSlug || stream.classId}?action=create-lesson&recordingId=${stream.recordingId}&streamTitle=${encodeURIComponent(stream.title)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-blue-700 border-2 border-blue-200 hover:border-blue-300 rounded-lg text-xs font-semibold transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Crear Lección
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Hidden file input for video upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title="Eliminar Stream"
          message={`¿Estás seguro que deseas eliminar el stream "${confirmModal.streamTitle}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
          onConfirm={handleDeleteStream}
          onCancel={() => setConfirmModal({ isOpen: false, streamId: '', streamTitle: '' })}
        />
      </div>
  );
}
