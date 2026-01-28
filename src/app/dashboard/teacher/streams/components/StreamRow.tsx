import Link from 'next/link';
import { Stream } from '@/hooks/useStreamsData';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface StreamRowProps {
  stream: Stream;
  onDelete: (streamId: string, streamTitle: string) => void;
  onUpdateStream: (streamId: string, updates: Partial<Stream>) => void;
  deletingStreamId: string | null;
}

export function StreamRow({ stream, onDelete, onUpdateStream, deletingStreamId }: StreamRowProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(stream.title);

  const handleSaveTitle = async () => {
    if (!titleValue.trim()) {
      setEditingTitle(false);
      return;
    }

    setEditingTitle(false);

    try {
      const response = await apiClient(`/live/${stream.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleValue.trim() }),
      });

      const result = await response.json();
      if (result.success) {
        onUpdateStream(stream.id, { title: titleValue.trim() });
      } else {
        alert(`Error al actualizar el título: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error updating title:', error);
      alert(`Error al actualizar el título: ${error}`);
    }
  };

  const formatDuration = (start: string | null, end: string | null): string => {
    if (!start) return '-';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
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

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onDelete(stream.id, stream.title)}
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
          {editingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                else if (e.key === 'Escape') {
                  setEditingTitle(false);
                  setTitleValue(stream.title);
                }
              }}
              autoFocus
              className="px-2 py-1 border border-blue-500 rounded text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{stream.title}</span>
              <button
                onClick={() => {
                  setEditingTitle(true);
                  setTitleValue(stream.title);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Editar título"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
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
      <td className="py-4 px-4">{getStatusBadge(stream.status)}</td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {stream.participantCount != null ? (
            <span className="text-sm text-gray-600 font-medium">{stream.participantCount}</span>
          ) : (
            <span className="text-sm text-gray-400">0</span>
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
            Crear clase
          </Link>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </td>
    </tr>
  );
}
