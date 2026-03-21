import type { Stream } from './types';
import { StreamsTableRow } from './StreamsTableRow';

interface StreamsTableProps {
  streams: Stream[];
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
  dashboardBase: string;
  isDemo: boolean;
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

export function StreamsTable({
  streams, role, dashboardBase, isDemo,
  editingTitleId, editingTitleValue, setEditingTitleValue,
  deletingStreamId, glowId, highlightRef,
  onEditTitle, onSaveTitle, onCancelEdit, onDeleteStream,
}: StreamsTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título
              </th>
              {role === 'ADMIN' && (
                <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academia
                </th>
              )}
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profesor
              </th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asignatura
              </th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participantes
              </th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duración
              </th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grabación
              </th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {streams.length === 0 ? (
              <tr>
                <td colSpan={role === 'ADMIN' ? 10 : 9} className="py-8 sm:py-12 text-center">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-300 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-900">No hay streams</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Los profesores pueden crear streams desde sus clases
                  </p>
                </td>
              </tr>
            ) : (
              streams.map((stream) => (
                <StreamsTableRow
                  key={stream.id}
                  stream={stream}
                  role={role}
                  dashboardBase={dashboardBase}
                  editingTitleId={editingTitleId}
                  editingTitleValue={editingTitleValue}
                  setEditingTitleValue={setEditingTitleValue}
                  deletingStreamId={deletingStreamId}
                  glowId={glowId}
                  highlightRef={highlightRef}
                  onEditTitle={onEditTitle}
                  onSaveTitle={onSaveTitle}
                  onCancelEdit={onCancelEdit}
                  onDeleteStream={onDeleteStream}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
