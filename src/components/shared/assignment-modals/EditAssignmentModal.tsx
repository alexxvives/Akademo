'use client';

import React, { useState, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';
import { QuizQuestionBuilder, createEmptyQuestion, parseQuizTxt } from '@/components/shared/QuizQuestionBuilder';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { apiClient } from '@/lib/api-client';
import type { AssignmentModalsProps } from './types';

interface TopicOption { id: string; name: string; }

export function EditAssignmentModal(props: AssignmentModalsProps) {
  const {
    classes,
    selectedAssignment,
    showEditModal, setShowEditModal,
    editClassId = '', setEditClassId,
    editTopicId = '', setEditTopicId,
    setEditLessonId,
    editTitle, setEditTitle, editDescription, setEditDescription,
    editDueDate, setEditDueDate, editUploadFiles, setEditUploadFiles,
    editQuizQuestions, setEditQuizQuestions,
    updating, handleUpdateAssignment,
    editFeedbackMode, setEditFeedbackMode,
  } = props;

  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const txtImportRef = useRef<HTMLInputElement>(null);
  const [topics, setTopics] = useState<TopicOption[]>([]);

  useEffect(() => {
    if (!showEditModal || !editClassId) { setTopics([]); return; }
    apiClient(`/topics?classId=${editClassId}`).then(r => r.json())
      .then(topicsData => { if (topicsData.success) setTopics(topicsData.data || []); })
      .catch(() => {});
  }, [showEditModal, editClassId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClassChange = (newClassId: string) => {
    setEditClassId?.(newClassId);
    setEditTopicId?.('');
    setEditLessonId?.('');
    setTopics([]);
  };

  const handleTxtImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseQuizTxt(text, (n) => nanoid(n));
      if (parsed.length === 0) { alert('No se pudo leer ninguna pregunta del archivo. Revisa el formato.'); return; }
      setEditQuizQuestions(parsed);
      setShowQuizBuilder(true);
    } catch { alert('Error leyendo el archivo.'); }
    finally { if (txtImportRef.current) txtImportRef.current.value = ''; }
  };

  const confirmEditQuiz = () => {
    for (const q of editQuizQuestions) {
      if (!q.questionText.trim()) { alert('Todas las preguntas deben tener texto'); return; }
      if (q.options.some((o) => !o.text.trim())) { alert('Todas las opciones deben tener texto'); return; }
      if (!q.correctOptionIds?.length) { alert('Selecciona al menos una respuesta correcta para cada pregunta'); return; }
    }
    setShowQuizBuilder(false);
  };

  if (!showEditModal || !selectedAssignment) return null;

  const isQuiz = selectedAssignment.type === 'quiz';

  // Split editDueDate (YYYY-MM-DDTHH:MM) into parts
  const datePart = editDueDate ? editDueDate.split('T')[0] : '';
  const timePart = editDueDate ? (editDueDate.split('T')[1]?.slice(0, 5) || '') : '';

  const handleDateChange = (date: string) => {
    setEditDueDate(date + (timePart ? 'T' + timePart : ''));
  };
  const handleTimeChange = (time: string) => {
    setEditDueDate((datePart || '') + 'T' + time);
  };

  const quizReady = isQuiz && editQuizQuestions.length > 0 && editQuizQuestions.every(q => q.questionText.trim());

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92dvh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {isQuiz ? 'Editar Cuestionario' : 'Editar Ejercicio'}
            </h2>
          </div>
          <form onSubmit={handleUpdateAssignment} className="p-6 space-y-4">
            {classes && classes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignatura</label>
                <ClassSearchDropdown
                  classes={classes}
                  value={editClassId}
                  onChange={handleClassChange}
                  placeholder="Seleccionar asignatura..."
                  className="w-full"
                />
              </div>
            )}
            {editClassId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tema <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <select
                    value={editTopicId}
                    onChange={e => setEditTopicId?.(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm bg-white appearance-none pr-8"
                  >
                    <option value="">Sin tema</option>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input id="edit-title" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required
                className="w-full h-[38px] px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-y focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de entrega</label>
              <div className="grid grid-cols-2 gap-3">
                <CustomDatePicker value={datePart} onChange={handleDateChange} dropUp />
                <CustomTimePicker value={timePart} onChange={handleTimeChange} dropUp />
              </div>
            </div>

            {/* File attachment — only for file assignments */}
            {!isQuiz && (
              <div>
                <label htmlFor="edit-files" className="block text-sm font-medium text-gray-700 mb-1">
                  Actualizar archivos adjuntos (opcional, hasta 5)
                </label>
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
            )}

            {/* Quiz question builder button — only for quiz assignments */}
            {isQuiz && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preguntas del cuestionario</label>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setShowQuizBuilder(true)}
                    className={`flex-1 h-[38px] px-3 text-sm border rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      quizReady ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {quizReady ? (
                      <>
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {editQuizQuestions.length} pregunta(s) ✓
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Editar preguntas
                      </>
                    )}
                  </button>
                  <div className="relative group">
                    <input ref={txtImportRef} type="file" accept=".txt" className="hidden" onChange={handleTxtImport} />
                    <button
                      type="button"
                      onClick={() => txtImportRef.current?.click()}
                      className="h-[38px] w-[38px] flex items-center justify-center border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                      aria-label="Importar preguntas desde .txt"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      <p className="font-semibold mb-1">Importar desde .txt</p>
                      <p className="text-gray-300 leading-relaxed">Una pregunta por bloque separado por línea en blanco:<br/><span className="font-mono text-gray-200">Q: ¿Pregunta?<br/>A) Opción<br/>B) Correcta *<br/>E: Explicación (opcional)</span></p>
                      <p className="text-gray-400 mt-1">Marca la correcta con <span className="font-mono text-gray-200">*</span> al final.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {quizReady && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mostrar respuestas</label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                  <button type="button" onClick={() => setEditFeedbackMode?.('at_end')}
                    className={`flex-1 py-2 transition-colors ${editFeedbackMode !== 'after_each' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    Al final
                  </button>
                  <button type="button" onClick={() => setEditFeedbackMode?.('after_each')}
                    className={`flex-1 py-2 transition-colors ${editFeedbackMode === 'after_each' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    Tras cada pregunta
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setShowEditModal(false)} disabled={updating}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button type="submit" disabled={updating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
                {updating ? 'Actualizando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quiz builder overlay */}
      {showQuizBuilder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl max-w-[800px] w-full flex flex-col max-h-[92dvh]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-semibold text-gray-900">Editar preguntas</h3>
              <button type="button" onClick={() => setShowQuizBuilder(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4 flex-1">
              <QuizQuestionBuilder
                questions={editQuizQuestions.length ? editQuizQuestions : [createEmptyQuestion()]}
                setQuestions={setEditQuizQuestions}
              />
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button type="button" onClick={() => setShowQuizBuilder(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button type="button" onClick={confirmEditQuiz}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors">
                Confirmar preguntas
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
