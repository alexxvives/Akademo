import Link from 'next/link';
import { DeleteIcon } from '@/components/ui/DeleteIcon';
import type { Stream } from './types';
import { formatDuration, formatDate, getStatusBadge } from './utils';

interface StreamsTableRowProps {
  stream: Stream;
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
  dashboardBase: string;
  editingTitleId: string | null;
  editingTitleValue: string;
  setEditingTitleValue: (value: string) => void;
  deletingStreamId: string | null;
  glowId: string | null;
  highlightRef: React.RefCallback<HTMLTableRowElement>;
  onEditTitle: (streamId: string, currentTitle: string) => void;
  onSaveTitle: (streamId: string) => void;
  onCancelEdit: () => void;
  onDeleteStream: (streamId: string, streamTitle: string) => void;
}

export function StreamsTableRow({
  stream, role, dashboardBase,
  editingTitleId, editingTitleValue, setEditingTitleValue,
  deletingStreamId, glowId, highlightRef,
  onEditTitle, onSaveTitle, onCancelEdit, onDeleteStream,
}: StreamsTableRowProps) {
  return (
    <tr
      id={`stream-${stream.id}`}
      ref={glowId === stream.id ? highlightRef : undefined}
      className={`hover:bg-gray-50/50 transition-colors ${glowId === stream.id ? 'ring-1 ring-blue-300/60 bg-blue-50/20 shadow-[inset_0_0_12px_rgba(96,165,250,0.12)]' : ''}`}
    >
      {/* Title */}
      <td className="py-3 px-2 sm:px-4">
        <div className="flex items-center gap-2">
          {stream.status === 'active' && (
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
          {editingTitleId === stream.id ? (
            <input
              type="text"
              value={editingTitleValue}
              onChange={(e) => setEditingTitleValue(e.target.value)}
              onBlur={() => onSaveTitle(stream.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveTitle(stream.id);
                else if (e.key === 'Escape') onCancelEdit();
              }}
              autoFocus
              className="px-2 py-1 border border-blue-500 rounded text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span className="text-sm font-medium text-gray-900">{stream.title}</span>
          )}
        </div>
      </td>

      {/* Academy — admin only */}
      {role === 'ADMIN' && (
        <td className="py-3 px-2 sm:px-4">
          <span className="text-sm text-gray-700">{stream.academyName || '—'}</span>
        </td>
      )}

      <td className="py-3 px-2 sm:px-4">
        <span className="text-sm text-gray-700">{stream.teacherName || '—'}</span>
      </td>
      <td className="py-3 px-2 sm:px-4">
        <Link
          href={`${dashboardBase}/subject/${stream.classSlug || stream.classId}`}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          {stream.className}
        </Link>
      </td>
      <td className="py-3 px-2 sm:px-4">{getStatusBadge(stream.status)}</td>
      <td className="py-3 px-2 sm:px-4">
        {stream.status === 'scheduled' || (!stream.zoomLink && !stream.dailyRoomName) ? (
          <span className="text-sm text-gray-400">—</span>
        ) : stream.participantCount != null ? (
          <span className="text-sm text-gray-600 font-medium">{stream.participantCount}</span>
        ) : (
          <span className="text-sm text-gray-400">0</span>
        )}
      </td>
      <td className="py-3 px-2 sm:px-4 text-sm text-gray-600">
        {formatDate(stream.startedAt || stream.createdAt)}
      </td>
      <td className="py-3 px-2 sm:px-4">
        {stream.status === 'ended' && (stream.duration || (stream.startedAt && stream.endedAt)) ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {stream.duration ? `${stream.duration} min` : formatDuration(stream.startedAt, stream.endedAt)}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      <td className="py-3 px-2 sm:px-4">
        {!stream.zoomLink && !stream.dailyRoomName ? (
          <span className="text-sm text-gray-400">Sin grabación</span>
        ) : stream.recordingId && (stream.bunnyStatus === null || stream.bunnyStatus === undefined || stream.bunnyStatus >= 4) && stream.bunnyStatus !== 6 ? (
          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Disponible
          </span>
        ) : stream.recordingId && stream.bunnyStatus !== null && stream.bunnyStatus !== undefined && stream.bunnyStatus < 4 ? (
          <span className="text-xs text-orange-400">Procesando...</span>
        ) : stream.status === 'ended' ? (
          stream.zoomLink?.includes('gotomeeting') ? (
            <span className="text-xs text-gray-400">No disponible</span>
          ) : (
            <span className="text-xs text-gray-400">Procesando...</span>
          )
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </td>
      {/* Actions */}
      <td className="py-3 px-2 sm:px-4">
        <div className="flex items-center gap-1.5">
          {stream.validRecordingId ? (
            <Link
              href={`${dashboardBase}/subject/${stream.classSlug || stream.classId}?lesson=${stream.validRecordingId}`}
              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ver clase"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Link>
          ) : stream.classDeleted && stream.recordingId ? (
            <div
              className="p-1.5 text-amber-500 rounded-lg cursor-help"
              title="La asignatura fue eliminada. Ve a cualquier asignatura y selecciona esta grabación desde el formulario de nueva clase."
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          ) : stream.recordingId ? (
            <button
              onClick={() =>
                (window.location.href = `${dashboardBase}/subject/${stream.classId}?${role === 'ADMIN' ? `action=create-lesson&recordingId=${stream.recordingId}&streamTitle=${encodeURIComponent(stream.title)}` : `createFromStream=${stream.id}`}`)
              }
              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              title="Crear clase"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ) : null}
          <button
            onClick={() => onEditTitle(stream.id, stream.title)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Editar título"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDeleteStream(stream.id, stream.title)}
            disabled={deletingStreamId === stream.id}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Eliminar stream"
          >
            {deletingStreamId === stream.id ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <DeleteIcon size={16} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
