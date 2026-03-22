'use client';

import { useState } from 'react';
import { countNewDemoSubmissions } from '@/lib/demo-data';
import { DeleteIcon } from '@/components/ui/DeleteIcon';
import { getDueDateColor, getFileCount } from './assignments-types';
import type { Assignment } from './assignments-types';

interface AssignmentsTableProps {
  assignments: Assignment[];
  isAdmin: boolean;
  isAcademy: boolean;
  isTeacher: boolean;
  canManage: boolean;
  requireGrading: boolean;
  glowId: string | null;
  highlightRef: React.Ref<HTMLTableRowElement>;
  paymentStatus: string;
  userEmail: string;
  deletingAssignmentId: string | null;
  uploadingSolutionId: string | null;
  onOpenFiles: (assignment: Assignment) => void;
  onRemoveFiles: (assignmentId: string) => void;
  onOpenSolution: (solutionUploadId: string) => void;
  onRemoveSolution: (assignmentId: string) => void;
  onTriggerSolutionUpload: (assignmentId: string) => void;
  onEdit: (assignment: Assignment) => void;
  onViewSubmissions: (assignment: Assignment) => void;
  onDelete: (assignmentId: string, title: string) => void;
  onViewQuizQuestions?: (assignment: Assignment) => void;
}

export function AssignmentsTable({
  assignments, isAdmin, isAcademy, isTeacher, canManage, requireGrading,
  glowId, highlightRef, paymentStatus, userEmail,
  deletingAssignmentId, uploadingSolutionId,
  onOpenFiles, onRemoveFiles, onOpenSolution, onRemoveSolution,
  onTriggerSolutionUpload, onEdit, onViewSubmissions, onDelete,
  onViewQuizQuestions,
}: AssignmentsTableProps) {
  const isDemo = (isAcademy || isTeacher) && paymentStatus === 'NOT PAID';
  const [activeTab, setActiveTab] = useState<'file' | 'quiz'>('file');

  const fileAssignments = assignments.filter(a => a.type !== 'quiz');
  const quizAssignments = assignments.filter(a => a.type === 'quiz');
  const filtered = activeTab === 'file' ? fileAssignments : quizAssignments;

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4 bg-gray-50/50">
        <button
          onClick={() => setActiveTab('file')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'file'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Ejercicios ({fileAssignments.length})
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'quiz'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Cuestionarios ({quizAssignments.length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          {activeTab === 'file' ? 'No hay ejercicios' : 'No hay cuestionarios'}
        </div>
      ) : activeTab === 'file' ? (
        <FileAssignmentsTable
          assignments={filtered} isAdmin={isAdmin} isDemo={isDemo} canManage={canManage}
          requireGrading={requireGrading} glowId={glowId} highlightRef={highlightRef}
          userEmail={userEmail} deletingAssignmentId={deletingAssignmentId}
          uploadingSolutionId={uploadingSolutionId}
          onOpenFiles={onOpenFiles} onRemoveFiles={onRemoveFiles}
          onOpenSolution={onOpenSolution} onRemoveSolution={onRemoveSolution}
          onTriggerSolutionUpload={onTriggerSolutionUpload}
          onEdit={onEdit} onViewSubmissions={onViewSubmissions} onDelete={onDelete}
        />
      ) : (
        <QuizAssignmentsTable
          assignments={filtered} isAdmin={isAdmin} isDemo={isDemo} canManage={canManage}
          requireGrading={requireGrading} glowId={glowId} highlightRef={highlightRef}
          userEmail={userEmail} deletingAssignmentId={deletingAssignmentId}
          onEdit={onEdit} onViewSubmissions={onViewSubmissions} onDelete={onDelete}
          onViewQuizQuestions={onViewQuizQuestions}
        />
      )}
    </div>
  );
}

/* ───── File Assignments Table ───── */
function FileAssignmentsTable({ assignments, isAdmin, isDemo, canManage, requireGrading, glowId, highlightRef, userEmail, deletingAssignmentId, uploadingSolutionId, onOpenFiles, onRemoveFiles, onOpenSolution, onRemoveSolution, onTriggerSolutionUpload, onEdit, onViewSubmissions, onDelete }: {
  assignments: Assignment[]; isAdmin: boolean; isDemo: boolean; canManage: boolean; requireGrading: boolean;
  glowId: string | null; highlightRef: React.Ref<HTMLTableRowElement>; userEmail: string;
  deletingAssignmentId: string | null; uploadingSolutionId: string | null;
  onOpenFiles: (a: Assignment) => void; onRemoveFiles: (id: string) => void;
  onOpenSolution: (id: string) => void; onRemoveSolution: (id: string) => void;
  onTriggerSolutionUpload: (id: string) => void; onEdit: (a: Assignment) => void;
  onViewSubmissions: (a: Assignment) => void; onDelete: (id: string, title: string) => void;
}) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50 sticky top-0 z-10">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
          {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academia</th>}
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignatura</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ejercicios</th>
          {requireGrading && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha límite</th>}
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregas</th>
          {requireGrading && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificadas</th>}
          {canManage && <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Solucionario</th>}
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {assignments.map((assignment) => (
          <tr key={assignment.id}
            id={`assignment-${assignment.id}`}
            ref={glowId === assignment.id ? highlightRef : undefined}
            className={`hover:bg-gray-50 transition-colors group ${glowId === assignment.id ? 'ring-1 ring-blue-300/60 bg-blue-50/20 shadow-[inset_0_0_12px_rgba(96,165,250,0.12)]' : ''}`}>
            <td className="px-6 py-4">
              <div className="text-sm font-medium text-gray-900 truncate max-w-[14rem]">{assignment.title}</div>
            </td>
            {isAdmin && (
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.academyName || 'N/A'}</td>
            )}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.className || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              {(() => {
                const fileCount = getFileCount(assignment);
                return fileCount > 0 ? (
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onOpenFiles(assignment); }}
                      className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 transition-colors group/file">
                      <div className="relative">
                        <div className="w-8 h-10 flex items-center justify-center bg-gray-100 rounded border border-gray-200 group-hover/file:bg-gray-200 transition-colors">
                          <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemoveFiles(assignment.id); }}
                          className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors opacity-0 group-hover/file:opacity-100">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <span className="text-xs font-medium">{fileCount} archivo{fileCount > 1 ? 's' : ''}</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Sin archivo</span>
                );
              })()}
            </td>
            {requireGrading && (
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDueDateColor(assignment.dueDate)}`}>
                {assignment.dueDate ? (
                  <>
                    {new Date(assignment.dueDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                    <span className="text-xs ml-1">
                      {new Date(assignment.dueDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                ) : 'Sin fecha'}
              </td>
            )}
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <div className="inline-flex items-center gap-2">
                <span>{assignment.submissionCount}</span>
                {isDemo && (() => {
                  const newCount = countNewDemoSubmissions(assignment.id);
                  return newCount > 0 ? (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-green-800 bg-green-200 rounded">
                      +{newCount}
                    </span>
                  ) : null;
                })()}
              </div>
            </td>
            {requireGrading && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.gradedCount} / {assignment.submissionCount}</td>}
            {canManage && (
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                {assignment.solutionUploadId ? (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onOpenSolution(assignment.solutionUploadId!)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors group/sol"
                      title="Ver solucionario">
                      <div className="relative">
                        <div className="w-8 h-10 flex items-center justify-center bg-gray-100 rounded border border-gray-200 group-hover/sol:bg-gray-200 transition-colors">
                          <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemoveSolution(assignment.id); }}
                          className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors opacity-0 group-hover/sol:opacity-100"
                          title="Eliminar solucionario">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <span className="text-xs font-medium text-gray-500">1 archivo</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onTriggerSolutionUpload(assignment.id)}
                    disabled={uploadingSolutionId === assignment.id}
                    className="inline-flex items-center gap-1 px-2 py-1 text-gray-500 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:text-brand-600 transition-colors text-xs font-medium disabled:opacity-50"
                    title="Subir solucionario">
                    {uploadingSolutionId === assignment.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                    Subir
                  </button>
                )}
              </td>
            )}
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => onViewSubmissions(assignment)}
                  className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Ver entregas">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </button>
                {canManage && (
                  <>
                    <button onClick={() => onEdit(assignment)}
                      className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar ejercicio">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (!(isDemo && userEmail.toLowerCase().includes('demo'))) {
                          onDelete(assignment.id, assignment.title);
                        }
                      }}
                      disabled={deletingAssignmentId === assignment.id || (isDemo && userEmail.toLowerCase().includes('demo'))}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={isDemo && userEmail.toLowerCase().includes('demo') ? 'No disponible en modo demostración' : 'Eliminar ejercicio'}>
                      {deletingAssignmentId === assignment.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <DeleteIcon size={16} />
                      )}
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ───── Quiz Assignments Table ───── */
function QuizAssignmentsTable({ assignments, isAdmin, isDemo, canManage, requireGrading, glowId, highlightRef, userEmail, deletingAssignmentId, onEdit, onViewSubmissions, onDelete, onViewQuizQuestions }: {
  assignments: Assignment[]; isAdmin: boolean; isDemo: boolean; canManage: boolean; requireGrading: boolean;
  glowId: string | null; highlightRef: React.Ref<HTMLTableRowElement>; userEmail: string;
  deletingAssignmentId: string | null;
  onEdit: (a: Assignment) => void; onViewSubmissions: (a: Assignment) => void;
  onDelete: (id: string, title: string) => void; onViewQuizQuestions?: (a: Assignment) => void;
}) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50 sticky top-0 z-10">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
          {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academia</th>}
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignatura</th>
          {requireGrading && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha límite</th>}
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intentos</th>
          {canManage && <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Preguntas</th>}
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {assignments.map((assignment) => (
          <tr key={assignment.id}
            id={`assignment-${assignment.id}`}
            ref={glowId === assignment.id ? highlightRef : undefined}
            className={`hover:bg-gray-50 transition-colors group ${glowId === assignment.id ? 'ring-1 ring-blue-300/60 bg-blue-50/20 shadow-[inset_0_0_12px_rgba(96,165,250,0.12)]' : ''}`}>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-purple-100 flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-gray-900 truncate max-w-[14rem]">{assignment.title}</span>
              </div>
            </td>
            {isAdmin && (
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.academyName || 'N/A'}</td>
            )}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.className || 'N/A'}</td>
            {requireGrading && (
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDueDateColor(assignment.dueDate)}`}>
                {assignment.dueDate ? (
                  <>
                    {new Date(assignment.dueDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                    <span className="text-xs ml-1">
                      {new Date(assignment.dueDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                ) : 'Sin fecha'}
              </td>
            )}
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                {assignment.submissionCount} intento{assignment.submissionCount !== 1 ? 's' : ''}
              </span>
            </td>
            {canManage && (
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                {onViewQuizQuestions ? (
                  <button
                    onClick={() => onViewQuizQuestions(assignment)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors text-xs font-medium"
                    title="Ver preguntas del cuestionario"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
            )}
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => onViewSubmissions(assignment)}
                  className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Ver intentos">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </button>
                {canManage && (
                  <>
                    <button onClick={() => onEdit(assignment)}
                      className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar cuestionario">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (!(isDemo && userEmail.toLowerCase().includes('demo'))) {
                          onDelete(assignment.id, assignment.title);
                        }
                      }}
                      disabled={deletingAssignmentId === assignment.id || (isDemo && userEmail.toLowerCase().includes('demo'))}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={isDemo && userEmail.toLowerCase().includes('demo') ? 'No disponible en modo demostración' : 'Eliminar cuestionario'}>
                      {deletingAssignmentId === assignment.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <DeleteIcon size={16} />
                      )}
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
