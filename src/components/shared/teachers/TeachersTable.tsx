'use client';

import React from 'react';
import type { Teacher, ClassSummary } from './types';
import { TeacherRow } from './TeacherRow';

interface TeachersTableProps {
  role: 'ACADEMY' | 'ADMIN';
  teachers: Teacher[];
  expandedTeachers: Set<string>;
  isDemo: boolean;
  copiedId: string | null;
  deleting: string | null;
  classes: ClassSummary[];
  activePeriodId: string;
  isClassInPeriod: (date: string | null | undefined) => boolean;
  onToggleExpand: (id: string) => void;
  onCopyJoinLink: (id: string) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (id: string, name: string) => void;
}

export function TeachersTable({
  role, teachers, expandedTeachers, isDemo, copiedId, deleting,
  classes, activePeriodId, isClassInPeriod,
  onToggleExpand, onCopyJoinLink, onEdit, onDelete,
}: TeachersTableProps) {
  if (teachers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay profesores</h3>
        <p className="text-gray-500">
          {role === 'ADMIN'
            ? 'Los profesores aparecerán aquí cuando se registren'
            : 'Los profesores aparecerán aquí cuando se unan a la academia'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-3 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-xs text-gray-600">
          Haz clic en la flecha para ver las asignaturas del profesor.
        </span>
      </div>
      <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profesor
              </th>
              {role === 'ADMIN' && (
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academia
                </th>
              )}
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asignaturas
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estudiantes
              </th>
              {(role === 'ACADEMY' || role === 'ADMIN') && (
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Generado
                </th>
              )}
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unido
              </th>
              {(role === 'ACADEMY' || role === 'ADMIN') && (
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link de Inscripción
                </th>
              )}
              {(role === 'ACADEMY' || role === 'ADMIN') && (
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teachers.map((teacher) => (
              <TeacherRow
                key={teacher.id}
                teacher={teacher}
                role={role}
                isExpanded={expandedTeachers.has(teacher.id)}
                isDemo={isDemo}
                copiedId={copiedId}
                deleting={deleting}
                classes={classes}
                activePeriodId={activePeriodId}
                isClassInPeriod={isClassInPeriod}
                onToggleExpand={onToggleExpand}
                onCopyJoinLink={onCopyJoinLink}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
