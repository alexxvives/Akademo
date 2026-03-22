'use client';

import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';
import { QuizQuestionBuilder } from '@/components/shared/QuizQuestionBuilder';
import type { QuizQuestionForm } from '@/components/shared/QuizQuestionBuilder';
import type { AssignmentModalsProps } from './types';

function emptyQuestion(): QuizQuestionForm {
  const o1 = nanoid(6); const o2 = nanoid(6);
  return { questionText: '', options: [{ id: o1, text: '' }, { id: o2, text: '' }], correctOptionIds: [], explanation: '' };
}

export function CreateAssignmentModal(props: AssignmentModalsProps) {
  const {
    classes, paymentStatus,
    showCreateModal, setShowCreateModal, selectedClassForCreate, setSelectedClassForCreate,
    newTitle, setNewTitle, newDescription, setNewDescription, newDueDate, setNewDueDate,
    uploadFiles, setUploadFiles, uploadProgress, creating, handleCreateAssignment, resetForm,
    assignmentType, setAssignmentType, quizQuestions, setQuizQuestions,
    requireGrading = true,
  } = props;

  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [dueDatePart, setDueDatePart] = useState(() => newDueDate ? newDueDate.slice(0, 10) : '');
  const [dueTimePart, setDueTimePart] = useState(() => newDueDate ? newDueDate.slice(11, 16) : '');

  const handleDueDateChange = (date: string) => {
    setDueDatePart(date);
    setNewDueDate(date ? `${date}T${dueTimePart || '00:00'}` : '');
  };

  const handleDueTimeChange = (time: string) => {
    setDueTimePart(time);
    setNewDueDate(dueDatePart ? `${dueDatePart}T${time || '00:00'}` : '');
  };

  if (!showCreateModal) return null;

  const openQuizBuilder = () => {
    if (quizQuestions.length === 0) setQuizQuestions([emptyQuestion()]);
    setShowQuizBuilder(true);
  };

  const confirmQuiz = () => {
    for (const q of quizQuestions) {
      if (!q.questionText.trim()) { alert('Todas las preguntas deben tener texto'); return; }
      if (q.options.some(o => !o.text.trim())) { alert('Todas las opciones deben tener texto'); return; }
      if (!q.correctOptionIds?.length) { alert('Selecciona al menos una respuesta correcta para cada pregunta'); return; }
    }
    setAssignmentType('quiz');
    setUploadFiles([]);
    setShowQuizBuilder(false);
  };

  const cancelQuiz = () => {
    if (assignmentType !== 'quiz') setQuizQuestions([]);
    setShowQuizBuilder(false);
  };

  const quizReady = assignmentType === 'quiz' && quizQuestions.length > 0;

  return (
    <>
      {/* Main create modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
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
              <label htmlFor="create-title" className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input id="create-title" type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label htmlFor="create-description" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea id="create-description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
            </div>
            {requireGrading && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora límite</label>
                <div className="grid grid-cols-2 gap-3">
                  <CustomDatePicker
                    value={dueDatePart}
                    onChange={handleDueDateChange}
                    dropUp
                  />
                  <CustomTimePicker
                    value={dueTimePart}
                    onChange={handleDueTimeChange}
                    dropUp
                  />
                </div>
              </div>
            )}

            {/* Archivos adjuntos + Crear cuestionario — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Archivos adjuntos</label>
                <label className={`flex items-center justify-center gap-2 w-full h-[38px] px-3 text-sm border rounded-lg cursor-pointer transition-colors ${
                  uploadFiles.length > 0 ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="truncate">{uploadFiles.length > 0 ? `${uploadFiles.length} archivo(s)` : 'Adjuntar archivo'}</span>
                  <input type="file" multiple className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setUploadFiles(files);
                      if (files.length > 0) { setAssignmentType('file'); setQuizQuestions([]); }
                    }} />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuestionario</label>
                <button type="button" onClick={openQuizBuilder}
                  className={`w-full h-[38px] px-3 text-sm border rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    quizReady ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {quizReady ? (
                    <>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {quizQuestions.length} pregunta(s) ✓
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Crear cuestionario
                    </>
                  )}
                </button>
              </div>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button type="submit" disabled={creating || paymentStatus === 'NOT PAID'}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                title={paymentStatus === 'NOT PAID' ? 'No disponible en modo demostración' : ''}>
                {creating ? 'Creando...' : 'Crear Ejercicio'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quiz builder overlay modal */}
      {showQuizBuilder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl max-w-[800px] w-full flex flex-col max-h-[95vh]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-semibold text-gray-900">Crear cuestionario</h3>
              <button type="button" onClick={cancelQuiz} className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4 flex-1">
              <QuizQuestionBuilder
                questions={quizQuestions.length ? quizQuestions : [emptyQuestion()]}
                setQuestions={setQuizQuestions}
              />
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button type="button" onClick={cancelQuiz}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button type="button" onClick={confirmQuiz}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors">
                Confirmar cuestionario
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
