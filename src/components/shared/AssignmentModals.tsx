'use client';

import React from 'react';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';

interface Class { id: string; name: string; }
interface Assignment {
  id: string; title: string; description?: string; dueDate?: string; maxScore: number;
  submissionCount: number; gradedCount: number; attachmentName?: string; className?: string;
  academyName?: string; createdAt: string; classId?: string;
  uploadId?: string; attachmentIds?: string;
}
interface Submission {
  id: string; studentName: string; studentEmail: string; submissionFileName: string;
  submissionFileSize: number; submittedAt: string; score?: number; feedback?: string;
  gradedAt?: string; downloadedAt?: string; uploadId: string; version?: number;
}

export interface AssignmentModalsProps {
  classes: Class[];
  paymentStatus: string;
  selectedAssignment: Assignment | null;
  // Create
  showCreateModal: boolean;
  setShowCreateModal: (v: boolean) => void;
  selectedClassForCreate: string;
  setSelectedClassForCreate: (v: string) => void;
  newTitle: string; setNewTitle: (v: string) => void;
  newDescription: string; setNewDescription: (v: string) => void;
  newDueDate: string; setNewDueDate: (v: string) => void;
  uploadFiles: File[]; setUploadFiles: (v: File[]) => void;
  uploadProgress: number;
  creating: boolean;
  handleCreateAssignment: (e: React.FormEvent) => void;
  resetForm: () => void;
  // Edit
  showEditModal: boolean;
  setShowEditModal: (v: boolean) => void;
  editTitle: string; setEditTitle: (v: string) => void;
  editDescription: string; setEditDescription: (v: string) => void;
  editDueDate: string; setEditDueDate: (v: string) => void;
  editUploadFile: File | null; setEditUploadFile: (v: File | null) => void;
  updating: boolean;
  handleUpdateAssignment: (e: React.FormEvent) => void;
  // Edit uses newTitle/newDescription via the parent, but the edit modal uses editTitle/editDescription
  // Submissions
  showSubmissionsModal: boolean;
  setShowSubmissionsModal: (v: boolean) => void;
  submissions: Submission[];
  handleBulkDownload: (onlyNew: boolean) => void;
  downloadSingleSubmission: (sub: Submission) => void;
  openGradeModal: (sub: Submission) => void;
  // Grade
  showGradeModal: boolean;
  setShowGradeModal: (v: boolean) => void;
  selectedSubmission: Submission | null;
  gradeScore: number; setGradeScore: (v: number) => void;
  gradeFeedback: string; setGradeFeedback: (v: string) => void;
  handleGradeSubmission: (e: React.FormEvent) => void;
  requireGrading?: boolean;
}

export function AssignmentModals(props: AssignmentModalsProps) {
  const {
    classes, paymentStatus, selectedAssignment,
    showCreateModal, setShowCreateModal, selectedClassForCreate, setSelectedClassForCreate,
    newTitle, setNewTitle, newDescription, setNewDescription, newDueDate, setNewDueDate,
    uploadFiles, setUploadFiles, uploadProgress, creating, handleCreateAssignment, resetForm,
    showEditModal, setShowEditModal, editTitle, setEditTitle, editDescription, setEditDescription,
    editDueDate, setEditDueDate, editUploadFile, setEditUploadFile, updating, handleUpdateAssignment,
    showSubmissionsModal, setShowSubmissionsModal, submissions, handleBulkDownload,
    downloadSingleSubmission, openGradeModal,
    showGradeModal, setShowGradeModal, selectedSubmission, gradeScore, setGradeScore,
    gradeFeedback, setGradeFeedback, handleGradeSubmission,
    requireGrading = true,
  } = props;

  return (
    <>
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-semibold mb-6">Crear Ejercicio</h2>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignatura</label>
                <ClassSearchDropdown
                  classes={classes}
                  value={selectedClassForCreate}
                  onChange={setSelectedClassForCreate}
                  placeholder="Seleccionar asignatura..."
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
              </div>
              {requireGrading && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora límite</label>
                  <input type="datetime-local" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}
                    min={(() => { const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); return now.toISOString().slice(0, 16); })()}
                    className={`w-full h-[38px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 ${!newDueDate ? 'text-transparent' : ''}`} />
                </div>
              </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Archivos adjuntos</label>
                <input type="file" multiple
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                  className="w-full h-[38px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 file:mr-4 file:py-0.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                {uploadFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <div className="flex gap-4 justify-end pt-4">
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={creating || paymentStatus === 'NOT PAID'}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={paymentStatus === 'NOT PAID' ? 'No disponible en modo demostración' : ''}>
                  {creating ? 'Creando...' : 'Crear Ejercicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Editar Ejercicio</h2>
            </div>
            <form onSubmit={handleUpdateAssignment} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Actualizar archivo (opcional)</label>
                {selectedAssignment.attachmentName && (
                  <div className="mb-2 text-sm text-gray-600">Archivo actual: {selectedAssignment.attachmentName}</div>
                )}
                <input type="file"
                  onChange={(e) => setEditUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                {editUploadFile && (
                  <div className="mt-2 text-sm text-green-600">Nuevo archivo seleccionado: {editUploadFile.name}</div>
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
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">Entregas</h2>
                <p className="text-sm text-gray-500 mt-1">{submissions.length} entregas para &quot;{selectedAssignment.title}&quot;</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleBulkDownload(true)}
                  className="px-4 py-2 border border-gray-900 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">Descargar nuevas</button>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Versión</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className={`hover:bg-gray-50 ${!sub.downloadedAt ? 'bg-green-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sub.studentName}</div>
                        <div className="text-sm text-gray-500">{sub.studentEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => downloadSingleSubmission(sub)}
                          className="inline-flex items-center justify-center w-8 h-10 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sub.version || 1}</td>
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
      )}

      {/* Grade Modal */}
      {showGradeModal && selectedSubmission && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-semibold mb-4">Calificar Entrega</h2>
            <p className="text-sm text-gray-600 mb-6">{selectedSubmission.studentName}</p>
            <form onSubmit={handleGradeSubmission} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puntuación (de {selectedAssignment.maxScore})
                </label>
                <input type="number" value={gradeScore} onChange={(e) => setGradeScore(Number(e.target.value))}
                  min="0" max={selectedAssignment.maxScore} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
                <textarea value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} rows={4}
                  placeholder="Feedback para el estudiante..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex gap-4 justify-end pt-4">
                <button type="button" onClick={() => { setShowGradeModal(false); setGradeScore(0); setGradeFeedback(''); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit"
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                  Guardar Calificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
