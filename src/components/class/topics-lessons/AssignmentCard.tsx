'use client';

import { useRouter } from 'next/navigation';
import { DeleteIcon } from '@/components/ui/DeleteIcon';
import { isReleased } from '@/lib/formatters';
import type { TopicAssignment } from './types';

interface AssignmentCardProps {
  assignment: TopicAssignment;
  viewMode?: 'cards' | 'rows';
  dashboardBase?: string;
  classId?: string;
  totalStudents?: number;
  isDisabled?: boolean;
  isStudentView?: boolean;
  completed?: boolean;
  onOpen?: (assignment: TopicAssignment) => void;
  onEditAssignment?: (assignmentId: string) => void;
  onDeleteAssignment?: (assignmentId: string, title: string) => void;
  onToggleRelease?: (assignment: TopicAssignment) => void;
}

export function AssignmentCard({
  assignment, viewMode = 'cards', dashboardBase, classId,
  totalStudents = 0, isDisabled, isStudentView, completed, onOpen, onEditAssignment, onDeleteAssignment, onToggleRelease,
}: AssignmentCardProps) {
  const router = useRouter();
  const isQuiz = assignment.type === 'quiz';
  const label = isQuiz ? 'Cuestionario' : 'Ejercicio';
  const href = dashboardBase ? `${dashboardBase}/assignments?open=${assignment.id}` : '#';

  const released = !assignment.releaseDate || isReleased(assignment.releaseDate);
  const submissions = assignment.submissionCount ?? 0;
  const pct = totalStudents > 0 ? Math.min(100, (submissions / totalStudents) * 100) : 0;

  const QuizIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );

  const FileIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const Icon = isQuiz ? QuizIcon : FileIcon;

  if (viewMode === 'rows') {
    return (
      <div
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-action-buttons]')) return;
          if (href !== '#') router.push(href);
        }}
        className="bg-[#1a1d29] rounded-lg border flex items-center gap-3 px-4 py-2.5 border-gray-700 hover:border-accent-500 hover:shadow-lg hover:shadow-accent-500/20 transition-all duration-200 cursor-pointer hover:scale-[1.01]"
      >
        <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
          <Icon className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{assignment.title}</p>
          {assignment.dueDate && (
            <p className="text-gray-400 text-xs mt-0.5">
              Entrega: {new Date(assignment.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
        <span className="flex-shrink-0 text-xs font-medium text-green-400 bg-green-500/20 px-2 py-1 rounded-lg border border-green-500/30">
          {label}
        </span>
        <div data-action-buttons className="flex gap-1 flex-shrink-0">
          {onToggleRelease && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleRelease(assignment); }}
              className={`p-1.5 rounded-lg transition-all border ${
                released ? 'bg-white/10 text-gray-300 border-gray-600 hover:bg-white/20' : 'bg-gray-700/50 text-gray-500 border-gray-700 hover:bg-gray-700'
              }`}
              title={released ? 'Visible: Click para ocultar' : 'Oculto: Click para publicar'}
            >
              {released ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          )}
          {onEditAssignment && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditAssignment(assignment.id); }}
              className="p-1.5 bg-accent-500/20 text-accent-400 rounded-lg hover:bg-accent-500/30 transition-all border border-accent-500/30"
              title="Editar ejercicio"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDeleteAssignment && (
            <button
              onClick={(e) => { e.stopPropagation(); if (!isDisabled) onDeleteAssignment(assignment.id, assignment.title); }}
              disabled={isDisabled}
              className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              title={isDisabled ? 'Active su academia para eliminar ejercicios' : 'Eliminar ejercicio'}
            >
              <DeleteIcon size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Cards view — same structure as LessonCard
  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-action-buttons]')) return;
        if (onOpen) { onOpen(assignment); return; }
        if (href !== '#') router.push(href);
      }}
      className={`bg-[#1a1d29] rounded-xl overflow-hidden transition-all duration-300 group border shadow-sm h-full border-gray-700 hover:border-accent-500 hover:shadow-xl hover:shadow-accent-500/20 cursor-pointer hover:scale-[1.03] ${!released ? 'opacity-70 grayscale sepia-[.2]' : ''}`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-white line-clamp-2 flex-1">{assignment.title}</h3>
            <div className="flex gap-1.5" data-action-buttons>
              {onEditAssignment && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEditAssignment(assignment.id); }}
                  className="p-2 bg-accent-500/20 text-accent-400 rounded-lg hover:bg-accent-500/30 hover:scale-105 transition-all border border-accent-500/30"
                  title="Editar ejercicio"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDeleteAssignment && (
                <button
                  onClick={(e) => { e.stopPropagation(); if (!isDisabled) onDeleteAssignment(assignment.id, assignment.title); }}
                  disabled={isDisabled}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 hover:scale-105 transition-all border border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={isDisabled ? 'Active su academia para eliminar ejercicios' : 'Eliminar ejercicio'}
                >
                  <DeleteIcon size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail — fixed 160px */}
        <div className="relative" style={{ height: '160px' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/50 to-gray-800/80 flex items-center justify-center">
            <Icon className="w-16 h-16 text-green-500/50" />
          </div>
          {/* Hidden badge — top left */}
          {!released && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-lg border border-violet-400/50 bg-violet-900/80 text-violet-200">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
              Oculto
            </div>
          )}
          {/* Top-right: date badge + eye toggle */}
          {(assignment.dueDate || onToggleRelease) && (
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
              {assignment.dueDate && (
                <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg backdrop-blur-sm shadow-md bg-gray-100/90 text-gray-600 border border-gray-300/50">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">
                    {new Date(assignment.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )}
              {onToggleRelease && (
                <button
                  data-action-buttons
                  onClick={(e) => { e.stopPropagation(); onToggleRelease(assignment); }}
                  className="p-1.5 rounded-lg backdrop-blur-sm shadow-lg transition-all border bg-white/90 text-gray-900 border-gray-300 hover:bg-white"
                  title={released ? 'Visible: Click para ocultar' : 'Oculto: Click para publicar'}
                >
                  {released ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer — ratings + progress bar (non-student) or completion status (student) */}
        <div className="p-4">
          {isStudentView ? (
            <div className="flex justify-center">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                completed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {completed ? 'Completado' : 'Pendiente'}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-base">{'★'.repeat(Math.round(assignment.avgRating || 0))}</span>
                  <span className="text-gray-600 text-base">{'★'.repeat(5 - Math.round(assignment.avgRating || 0))}</span>
                  {(assignment.ratingCount ?? 0) > 0 && (
                    <span className="text-xs text-gray-400 ml-1">({assignment.ratingCount})</span>
                  )}
                </div>
                <span
                  className="text-gray-300 font-bold text-sm cursor-help"
                  title="Estudiantes que han entregado"
                >
                  {submissions}/{totalStudents} estudiantes
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden" title="Porcentaje de entregas">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 75
                      ? 'linear-gradient(to right, #15803d, #166534)'
                      : pct >= 50
                      ? 'linear-gradient(to right, #22c55e, #15803d)'
                      : pct >= 25
                      ? 'linear-gradient(to right, #eab308, #22c55e)'
                      : 'linear-gradient(to right, #ef4444, #eab308)',
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

