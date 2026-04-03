import { openDocument, downloadDocument } from '@/lib/api-client';
import { formatDate, formatBytes } from '@/lib/formatters';
import type { DocumentItem } from './types';

function _getDocIcon(mimeType: string) {
  if (mimeType?.includes('pdf')) return '📄';
  if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
  if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return '📊';
  if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return '📎';
  if (mimeType?.includes('image')) return '🖼️';
  return '📁';
}

export function DocumentsTable({ documents }: { documents: DocumentItem[] }) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="mx-auto w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="font-medium">No hay documentos</p>
        <p className="text-sm mt-1">Los documentos de tus lecciones aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th className="px-4 py-3">Documento</th>
            <th className="px-4 py-3 hidden sm:table-cell">Asignatura</th>
            <th className="px-4 py-3 hidden md:table-cell">Lección</th>
            <th className="px-4 py-3 hidden lg:table-cell">Tamaño</th>
            <th className="px-4 py-3 hidden lg:table-cell">Fecha</th>
            <th className="px-4 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={async () => { try { await openDocument(doc.storagePath); } catch { /* noop */ } }}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500 truncate sm:hidden">{doc.className}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{doc.className}</td>
              <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell truncate max-w-[200px]">{doc.lessonTitle}</td>
              <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{formatBytes(doc.fileSize)}</td>
              <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{formatDate(doc.createdAt)}</td>
              <td className="px-4 py-3">
                <button
                  title="Descargar"
                  onClick={async (e) => { e.stopPropagation(); try { await downloadDocument(doc.storagePath, doc.title); } catch { /* noop */ } }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
