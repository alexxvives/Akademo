'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

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
  recordingId: string | null;
}

export default function StreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [uploadingStreamId, setUploadingStreamId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    try {
      const response = await fetch('/api/live/history');
      const result = await response.json();
      if (result.success) {
        setStreams(result.data);
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

    try {
      const response = await fetch(`/api/live/${streamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitleValue.trim() }),
      });

      const result = await response.json();
      if (result.success) {
        setStreams(streams.map(s => 
          s.id === streamId ? { ...s, title: editingTitleValue.trim() } : s
        ));
      }
    } catch (error) {
      console.error('Error updating title:', error);
    } finally {
      setEditingTitleId(null);
      setEditingTitleValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingStreamId) return;

    const stream = streams.find(s => s.id === uploadingStreamId);
    if (!stream) return;

    setUploadProgress(0);

    try {
      // Step 1: Get upload URL
      const response = await fetch('/api/live/upload-recording', {
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
      const createLessonResponse = await fetch('/api/live/create-lesson', {
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
      alert('¡Grabación subida y lección creada exitosamente!');

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
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const filteredStreams = streams.filter(stream => {
    if (filter === 'all') return true;
    if (filter === 'active') return stream.status === 'active' || stream.status === 'scheduled';
    if (filter === 'ended') return stream.status === 'ended' || stream.status === 'recording_failed';
    return true;
  });

  const activeCount = streams.filter(s => s.status === 'active' || s.status === 'scheduled').length;
  const endedCount = streams.filter(s => s.status === 'ended' || s.status === 'recording_failed').length;
  const totalDurationMs = streams.reduce((acc, stream) => {
    if (!stream.startedAt && !stream.createdAt) return acc;
    const start = stream.startedAt || stream.createdAt;
    const end = stream.endedAt || (stream.status === 'active' ? new Date().toISOString() : stream.createdAt);
    return acc + (new Date(end).getTime() - new Date(start).getTime());
  }, 0);
  const totalHours = Math.floor(totalDurationMs / (1000 * 60 * 60));
  const totalMinutes = Math.floor((totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Streams</h1>
          <p className="text-gray-600 mt-1">Gestiona y visualiza el historial de tus clases en vivo</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                <p className="text-sm text-gray-500">En vivo ahora</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{endedCount}</p>
                <p className="text-sm text-gray-500">Streams anteriores</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`}
                </p>
                <p className="text-sm text-gray-500">Tiempo total transmitido</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({streams.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En Vivo ({activeCount})
          </button>
          <button
            onClick={() => setFilter('ended')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'ended'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Finalizados ({endedCount})
          </button>
        </div>

        {/* Streams List */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredStreams.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay streams</h3>
            <p className="text-gray-500">
              {filter === 'active' 
                ? 'No tienes ningún stream activo en este momento'
                : filter === 'ended'
                ? 'No tienes streams anteriores'
                : 'Inicia un stream desde una de tus clases'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stream
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clase
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStreams.map((stream) => (
                  <tr key={stream.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {stream.status === 'active' && (
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                        {editingTitleId === stream.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingTitleValue}
                              onChange={(e) => setEditingTitleValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle(stream.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="px-2 py-1 border border-blue-300 rounded text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveTitle(stream.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Guardar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                              title="Cancelar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <span className="font-medium text-gray-900">{stream.title}</span>
                            {stream.status === 'ended' && (
                              <button
                                onClick={() => handleEditTitle(stream.id, stream.title)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                title="Editar título"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            )}
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
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDate(stream.startedAt || stream.createdAt)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDuration(stream.startedAt || stream.createdAt, stream.endedAt)}
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
                      ) : stream.status === 'active' || stream.status === 'scheduled' ? (
                        <span className="text-gray-400 text-sm">En progreso</span>
                      ) : uploadingStreamId === stream.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-500 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{uploadProgress}%</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUploadClick(stream.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Subir Grabación
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      </div>
    </DashboardLayout>
  );
}
