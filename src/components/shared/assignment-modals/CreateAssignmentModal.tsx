'use client';

import React, { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { parseQuizTxt } from '@/components/shared/QuizQuestionBuilder';
import { apiClient } from '@/lib/api-client';
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

interface TopicOption {
  id: string;
  name: string;
}

export function CreateAssignmentModal(props: AssignmentModalsProps) {
  const {
    classes, paymentStatus,
    showCreateModal, setShowCreateModal, selectedClassForCreate, setSelectedClassForCreate,
    selectedTopicForCreate, setSelectedTopicForCreate,
    newTitle, setNewTitle, newDescription, setNewDescription, newDueDate, setNewDueDate,
    uploadFiles, setUploadFiles, uploadProgress, creating, handleCreateAssignment, resetForm,
    assignmentType, setAssignmentType, quizQuestions, setQuizQuestions,
    feedbackMode, setFeedbackMode,
    requireGrading = true,
  } = props;

  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
  const txtImportRef = useRef<HTMLInputElement>(null);
  const topicDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (topicDropdownRef.current && !topicDropdownRef.current.contains(e.target as Node)) {
        setTopicDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleTxtImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseQuizTxt(text, (n) => nanoid(n));
      if (parsed.length === 0) { alert('No se pudo leer ninguna pregunta del archivo. Revisa el formato.'); return; }
      setQuizQuestions(parsed);
      setAssignmentType('quiz');
      setUploadFiles([]);
      setShowQuizBuilder(true);
    } catch { alert('Error leyendo el archivo.'); }
    finally { if (txtImportRef.current) txtImportRef.current.value = ''; }
  };
  const [dueDatePart, setDueDatePart] = useState(() => newDueDate ? newDueDate.slice(0, 10) : '');
  const [dueTimePart, setDueTimePart] = useState(() => newDueDate ? newDueDate.slice(11, 16) : '');
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [selectedTopic, setSelectedTopic] = useState(selectedTopicForCreate || '');

  useEffect(() => {
    setSelectedTopic('');
    setSelectedTopicForCreate?.('');
    setTopics([]);
    if (!selectedClassForCreate) return;
    apiClient(`/topics?classId=${selectedClassForCreate}`)
      .then(r => r.json())
      .then(data => { if (data.success) setTopics(data.data || []); })
      .catch(() => {});
  }, [selectedClassForCreate]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (uploadFiles.length > 0) {
      if (!window.confirm('Si creas un cuestionario, el archivo adjunto se eliminará. ¿Continuar?')) return;
      setUploadFiles([]);
    }
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
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-6">
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
            {selectedClassForCreate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tema <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative" ref={topicDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setTopicDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm bg-white text-left"
                  >
                    <span className={selectedTopic ? 'text-gray-900' : 'text-gray-400'}>
                      {selectedTopic ? topics.find(t => t.id === selectedTopic)?.name ?? 'Sin tema' : 'Sin tema'}
                    </span>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {topicDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => { setSelectedTopic(''); setSelectedTopicForCreate?.(''); setTopicDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          !selectedTopic ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-500'
                        }`}
                      >
                        Sin tema
                      </button>
                      {topics.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => { setSelectedTopic(t.id); setSelectedTopicForCreate?.(t.id); setTopicDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            selectedTopic === t.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-900'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div>
              <label htmlFor="create-title" className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input id="create-title" type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm" />
            </div>
            <div>
              <label htmlFor="create-description" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea id="create-description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm" />
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
                  uploadFiles.length > 0 ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="truncate">{uploadFiles.length > 0 ? `${uploadFiles.length} archivo(s)` : 'Adjuntar archivo'}</span>
                  <input type="file" multiple className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0 && quizReady) {
                        if (!window.confirm('Si adjuntas un archivo, el cuestionario creado se eliminará. ¿Continuar?')) {
                          e.target.value = '';
                          return;
                        }
                      }
                      setUploadFiles(files);
                      if (files.length > 0) { setAssignmentType('file'); setQuizQuestions([]); }
                    }} />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuestionario</label>
                <div className="flex gap-1.5">
                  <button type="button" onClick={openQuizBuilder}
                    className={`flex-1 h-[38px] px-3 text-sm border rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      quizReady ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
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
                  <div className="relative group">
                    <input ref={txtImportRef} type="file" accept=".txt" className="hidden" onChange={handleTxtImport} />
                    <button
                      type="button"
                      onClick={() => txtImportRef.current?.click()}
                      className="h-[38px] w-[38px] flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
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
            </div>

            {quizReady && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mostrar respuestas</label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                  <button type="button" onClick={() => setFeedbackMode?.('at_end')}
                    className={`flex-1 py-2 transition-colors ${feedbackMode !== 'after_each' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    Al final
                  </button>
                  <button type="button" onClick={() => setFeedbackMode?.('after_each')}
                    className={`flex-1 py-2 transition-colors ${feedbackMode === 'after_each' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    Tras cada pregunta
                  </button>
                </div>
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button type="submit" disabled={creating || paymentStatus === 'NOT PAID'}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
          <div className="bg-white rounded-xl max-w-[800px] w-full flex flex-col max-h-[92dvh]">
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
