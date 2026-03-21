'use client';

import React from 'react';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { QuizQuestionBuilder } from '@/components/shared/QuizQuestionBuilder';
import type { AssignmentModalsProps } from './types';

export function CreateAssignmentModal(props: AssignmentModalsProps) {
  const {
    classes, paymentStatus,
    showCreateModal, setShowCreateModal, selectedClassForCreate, setSelectedClassForCreate,
    newTitle, setNewTitle, newDescription, setNewDescription, newDueDate, setNewDueDate,
    uploadFiles, setUploadFiles, uploadProgress, creating, handleCreateAssignment, resetForm,
    assignmentType, setAssignmentType, quizQuestions, setQuizQuestions,
    requireGrading = true,
  } = props;

  if (!showCreateModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-semibold mb-6">Crear Ejercicio</h2>
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button type="button"
              onClick={() => setAssignmentType('file')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                assignmentType === 'file' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}>
              Documento
            </button>
            <button type="button"
              onClick={() => setAssignmentType('quiz')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                assignmentType === 'quiz' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}>
              Cuestionario
            </button>
          </div>
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
            <label htmlFor="create-title" className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input id="create-title" name="title" type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label htmlFor="create-description" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea id="create-description" name="description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
          </div>
          {requireGrading && (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="create-due-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora límite</label>
              <input id="create-due-date" name="dueDate" type="datetime-local" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}
                min={(() => { const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); return now.toISOString().slice(0, 16); })()}
                className="w-full h-[38px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-gray-700" />
            </div>
          </div>
          )}
          {/* File upload (only for file type) */}
          {assignmentType === 'file' && (
          <div>
            <label htmlFor="create-files" className="block text-sm font-medium text-gray-700 mb-1">Archivos adjuntos</label>
            <input id="create-files" name="files" type="file" multiple
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
          )}
          {/* Quiz builder (only for quiz type) */}
          {assignmentType === 'quiz' && (
            <QuizQuestionBuilder questions={quizQuestions} setQuestions={setQuizQuestions} />
          )}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={creating || paymentStatus === 'NOT PAID'}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={paymentStatus === 'NOT PAID' ? 'No disponible en modo demostración' : ''}>
              {creating ? 'Creando...' : 'Crear Ejercicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
