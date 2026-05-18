'use client';

import Link from 'next/link';
import type { TopicAssignment } from './types';

interface AssignmentCardProps {
  assignment: TopicAssignment;
  viewMode?: 'cards' | 'rows';
  dashboardBase?: string;
  classId?: string;
}

export function AssignmentCard({ assignment, viewMode = 'cards', dashboardBase, classId }: AssignmentCardProps) {
  const isQuiz = assignment.type === 'quiz';
  const label = isQuiz ? 'Cuestionario' : 'Ejercicio';
  const tabParam = isQuiz ? 'tab=quiz' : 'tab=file';
  const href = dashboardBase && classId
    ? `${dashboardBase}/assignments?${tabParam}&classId=${classId}${assignment.topicId ? `&topicId=${assignment.topicId}` : ''}`
    : '#';

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
      <Link
        href={href}
        className="bg-[#1a1d29] rounded-lg border flex items-center gap-3 px-4 py-2.5 border-gray-700 hover:border-accent-500 hover:shadow-lg hover:shadow-accent-500/20 transition-all duration-200 cursor-pointer hover:scale-[1.01] no-underline"
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
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="bg-[#1a1d29] rounded-xl overflow-hidden transition-all duration-300 group border shadow-sm border-gray-700 hover:border-accent-500 hover:shadow-xl hover:shadow-accent-500/20 cursor-pointer hover:scale-[1.03] flex flex-col no-underline h-full"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <h3 className="text-lg font-bold text-white line-clamp-2">{assignment.title}</h3>
        </div>

        {/* Icon area */}
        <div className="relative flex-1 min-h-[120px]">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 to-gray-800 flex items-center justify-center">
            <Icon className="w-12 h-12 text-green-500/60" />
          </div>
          {/* Green tag at bottom left */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-green-500/90 px-2.5 py-1 rounded-lg border border-green-400/50">
                <Icon className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-bold text-xs">{label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4">
          {assignment.dueDate && (
            <p className="text-gray-400 text-sm">
              Entrega: {new Date(assignment.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
          {assignment.submissionCount !== undefined && assignment.submissionCount > 0 && (
            <p className="text-gray-500 text-xs mt-1">{assignment.submissionCount} {assignment.submissionCount === 1 ? 'entrega' : 'entregas'}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
