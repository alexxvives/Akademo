'use client';

import React from 'react';
import type { AssignmentModalsProps } from './types';

export function EditAssignmentModal(props: AssignmentModalsProps) {
  const {
    selectedAssignment,
    showEditModal, setShowEditModal,
    editTitle, setEditTitle, editDescription, setEditDescription,
    editDueDate, setEditDueDate, editUploadFiles, setEditUploadFiles,
    updating, handleUpdateAssignment,
    requireGrading = true,
  } = props;

  if (!showEditModal || !selectedAssignment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Editar Ejercicio</h2>
        </div>
        <form onSubmit={handleUpdateAssignment} className="p-6 space-y-6">
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input id="edit-title" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required
              className="w-full h-[38px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-brand-500" />
          </div>
          {requireGrading && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de entrega</label>
            <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
          </div>
          )}
          <div>
            <label htmlFor="edit-files" className="block text-sm font-medium text-gray-700 mb-1">Actualizar archivos adjuntos (opcional, hasta 5)</label>
            {selectedAssignment.attachmentName && (
              <div className="mb-2 text-sm text-gray-600">Archivos actuales: {selectedAssignment.attachmentName}</div>
            )}
            <input id="edit-files" type="file" multiple
              onChange={(e) => setEditUploadFiles(Array.from(e.target.files || []).slice(0, 5))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
            {editUploadFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {editUploadFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span>{f.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-4 justify-end pt-4">
            <button type="button" onClick={() => setShowEditModal(false)} disabled={updating}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={updating}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
              {updating ? 'Actualizando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
