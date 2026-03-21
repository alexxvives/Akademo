'use client';

import React from 'react';
import type { AssignmentModalsProps } from './types';

export function SubmissionsModal(props: AssignmentModalsProps) {
  const {
    selectedAssignment,
    showSubmissionsModal, setShowSubmissionsModal,
    submissions, handleBulkDownload, downloadSingleSubmission, openGradeModal,
  } = props;

  if (!showSubmissionsModal || !selectedAssignment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">Entregas</h2>
            <p className="text-sm text-gray-500 mt-1">{submissions.length} entregas para &quot;{selectedAssignment.title}&quot;</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleBulkDownload(false)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">Descargar todas</button>
            <button onClick={() => setShowSubmissionsModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cerrar</button>
          </div>
        </div>
        {submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay entregas aún</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Archivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{sub.studentName}</div>
                    <div className="text-sm text-gray-500">{sub.studentEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => downloadSingleSubmission(sub)}
                      className="inline-flex items-center justify-center w-8 h-10 bg-gray-100 hover:bg-gray-200 rounded border border-gray-200 transition-colors">
                      <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sub.submittedAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sub.gradedAt ? (
                      <div>
                        <div className="text-sm font-medium">{sub.score} / {selectedAssignment.maxScore}</div>
                        {sub.feedback && <div className="text-xs text-gray-500 truncate max-w-xs">{sub.feedback}</div>}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Sin calificar</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button onClick={() => openGradeModal(sub)} className="text-brand-600 hover:text-brand-900">
                      {sub.gradedAt ? 'Editar nota' : 'Calificar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
