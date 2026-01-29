import { Stream } from '@/hooks/useStreamsData';
import { StreamRow } from './StreamRow';
import { SkeletonList } from '@/components/ui/SkeletonLoader';

interface StreamsTableProps {
  streams: Stream[];
  loading: boolean;
  deletingStreamId: string | null;
  onDelete: (streamId: string, streamTitle: string) => void;
  onUpdateStream: (streamId: string, updates: Partial<Stream>) => void;
}

export function StreamsTable({ streams, loading, deletingStreamId, onDelete, onUpdateStream }: StreamsTableProps) {
  if (loading) {
    return <SkeletonList rows={8} />;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="max-h-[750px] overflow-y-auto">
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
            {streams.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-900">No hay streams</p>
                  <p className="text-xs text-gray-500 mt-1">Inicia un stream desde una de tus clases</p>
                </td>
              </tr>
            ) : (
              streams.map((stream) => (
                <StreamRow
                  key={stream.id}
                  stream={stream}
                  onDelete={onDelete}
                  onUpdateStream={onUpdateStream}
                  deletingStreamId={deletingStreamId}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
