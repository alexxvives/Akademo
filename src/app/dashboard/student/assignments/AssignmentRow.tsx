'use client';

import { RefObject } from 'react';
import { openDocument } from '@/lib/api-client';
import type { Assignment } from './types';

interface AssignmentRowProps {
  assignment: Assignment;
  openDropdown: string | null;
  dropdownRef: RefObject<HTMLDivElement | null>;
  dropdownFiles: { uploadId: string; name: string; storagePath: string }[];
  loadingDropdown: boolean;
  onEjerciciosClick: (assignment: Assignment, e: React.MouseEvent) => void;
  onDeleteSubmission: (assignmentId: string) => void;
  onUpload: (assignment: Assignment) => void;
  onQuiz: (assignment: Assignment) => void;
  onCloseDropdown: () => void;
  isPastDue: (dueDate?: string) => boolean;
  getDueDateColor: (dueDate?: string) => string;
}

function getScoreColor(score: number, max: number) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct <= 50) return 'text-red-600';
  if (pct <= 69) return 'text-orange-500';
  if (pct <= 90) return 'text-green-500';
  return 'text-green-700';
}

export function AssignmentRow({
  assignment, openDropdown, dropdownRef, dropdownFiles, loadingDropdown,
  onEjerciciosClick, onDeleteSubmission, onUpload, onQuiz, onCloseDropdown,
  isPastDue, getDueDateColor,
}: AssignmentRowProps) {
  const isQuiz = assignment.type === 'quiz';
  const isCompleted = isQuiz ? !!assignment.quizAttemptId : !!assignment.submittedAt;

  let fileCount = 0;
  if (!isQuiz) {
    if (assignment.attachmentIds && assignment.attachmentIds.trim()) {
      fileCount = assignment.attachmentIds.split(',').filter((id: string) => id.trim()).length;
    } else if (assignment.uploadId) {
      fileCount = 1;
    }
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        {isCompleted ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completado
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Pendiente
          </span>
        )}
      </td>

      {/* Title */}
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
      </td>

      {/* Class */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {assignment.className || '—'}
      </td>

      {/* Ejercicios */}
      <td className="px-6 py-4 whitespace-nowrap">
        {isQuiz ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Cuestionario
          </span>
        ) : fileCount > 0 ? (
          <div className="relative" ref={openDropdown === assignment.id ? dropdownRef as React.RefObject<HTMLDivElement> : undefined}>
            <button
              onClick={(e) => onEjerciciosClick(assignment, e)}
              className="flex items-center gap-2 text-sm text-gray-900 hover:text-gray-700 transition-colors group"
            >
              <div className="w-8 h-10 flex items-center justify-center bg-gray-100 rounded border border-gray-200 group-hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs">{fileCount} archivo{fileCount > 1 ? 's' : ''}</span>
            </button>
            {openDropdown === assignment.id && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[200px]">
                {loadingDropdown ? (
                  <div className="p-3 text-xs text-gray-500">Cargando...</div>
                ) : (
                  <div className="py-1">
                    {dropdownFiles.map((file) => (
                      <button
                        key={file.uploadId}
                        onClick={async () => { onCloseDropdown(); try { await openDocument(file.storagePath); } catch { alert('Error al abrir'); } }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <span className="truncate max-w-[180px]">{file.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">Sin archivo</span>
        )}
      </td>

      {/* Entrega */}
      <td className="px-6 py-4 whitespace-nowrap">
        {isQuiz ? (
          assignment.quizAttemptId ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Realizado
            </span>
          ) : (
            <span className="text-xs text-gray-400">Sin realizar</span>
          )
        ) : assignment.submittedAt && assignment.submissionStoragePath ? (
          <div className="flex items-center gap-1.5 text-sm text-gray-900 group">
            <div className="relative">
              <a
                href="#"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-gray-700 transition-colors"
                onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (assignment.submissionStoragePath) try { await openDocument(assignment.submissionStoragePath); } catch { alert('Error al abrir'); } }}
              >
                <div className="w-6 h-8 flex items-center justify-center bg-gray-100 rounded border border-gray-200 group-hover:bg-gray-200 transition-colors">
                  <svg className="w-3.5 h-3.5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
              </a>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteSubmission(assignment.id); }}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                title="Eliminar entrega"
              >
                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <span className="text-xs">1 archivo</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Sin entregar</span>
        )}
      </td>

      {/* Due date */}
      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDueDateColor(assignment.dueDate)}`}>
        {assignment.dueDate ? (
          <div className="flex items-center">
            {new Date(assignment.dueDate).toLocaleDateString('es-ES')}
            <span className="text-xs ml-1">
              {new Date(assignment.dueDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ) : 'Sin fecha'}
      </td>

      {/* Grade */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        {isQuiz ? (
          assignment.quizAttemptId ? (
            <button onClick={() => onQuiz(assignment)} className="group">
              <div className={`text-lg font-bold ${getScoreColor(assignment.quizScore ?? 0, assignment.maxScore ?? 100)}`}>
                {assignment.quizScore ?? 0}/{assignment.maxScore ?? 100}
              </div>
              <span className="text-xs text-gray-400 group-hover:text-brand-600">Ver resultado</span>
            </button>
          ) : (
            <button
              onClick={() => onQuiz(assignment)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Realizar
            </button>
          )
        ) : isCompleted ? (
          assignment.gradedAt ? (
            <div className={`text-lg font-bold ${getScoreColor(assignment.score ?? 0, assignment.maxScore ?? 100)}`}>
              {assignment.score ?? 0}/{assignment.maxScore ?? 100}
            </div>
          ) : (
            <div className="flex justify-end">
              {!isPastDue(assignment.dueDate) ? (
                <button
                  onClick={() => onUpload(assignment)}
                  className="px-2.5 py-1 text-xs font-medium text-brand-600 hover:text-brand-700 border border-brand-300 rounded-lg hover:bg-brand-50 transition-colors whitespace-nowrap"
                >
                  Reenviar
                </button>
              ) : (
                <span className="text-xs text-gray-500">En corrección</span>
              )}
            </div>
          )
        ) : (
          <button
            onClick={() => onUpload(assignment)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Entregar
          </button>
        )}
      </td>
    </tr>
  );
}
