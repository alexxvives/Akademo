'use client';

import React from 'react';
import { DeleteIcon } from '@/components/ui/DeleteIcon';
import type { Teacher, ClassSummary } from './types';

interface TeacherRowProps {
  teacher: Teacher;
  role: 'ACADEMY' | 'ADMIN';
  isExpanded: boolean;
  isDemo: boolean;
  copiedId: string | null;
  deleting: string | null;
  classes: ClassSummary[];
  activePeriodId: string;
  isClassInPeriod: (date: string | null | undefined) => boolean;
  onToggleExpand: (id: string) => void;
  onCopyJoinLink: (id: string) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (id: string, name: string, classes: import('./types').TeacherClass[]) => void;
}

export function TeacherRow({
  teacher, role, isExpanded, isDemo, copiedId, deleting,
  classes, activePeriodId, isClassInPeriod,
  onToggleExpand, onCopyJoinLink, onEdit, onDelete,
}: TeacherRowProps) {
  const hasClasses = teacher.classes && teacher.classes.length > 0;
  const expandedClasses = hasClasses && isExpanded
    ? (activePeriodId !== 'all'
        ? teacher.classes.filter(cls => {
            const pIds = new Set(classes.filter(c => isClassInPeriod(c.startDate)).map(c => c.id));
            return cls.id && pIds.has(cls.id);
          })
        : teacher.classes)
    : [];

  return (
    <React.Fragment>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => hasClasses && onToggleExpand(teacher.id)}
      >
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-3">
            {hasClasses ? (
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <div className="w-4 h-4 flex-shrink-0" />
            )}
            <div>
              <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
              <div className="text-sm text-gray-500">{teacher.email}</div>
            </div>
          </div>
        </td>
        {role === 'ADMIN' && (
          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
            <span className="text-sm text-gray-900">{teacher.academyName || '-'}</span>
          </td>
        )}
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
          <span className="text-sm text-gray-900">{teacher.classCount || 0}</span>
        </td>
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
          <span className="text-sm text-gray-900">{teacher.studentCount || 0}</span>
        </td>
        {(role === 'ACADEMY' || role === 'ADMIN') && (
          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
            <span className="text-sm font-medium text-gray-900">
              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(teacher.totalRevenue || 0)}
            </span>
          </td>
        )}
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
          <span className="text-sm text-gray-500">
            {new Date(teacher.createdAt).toLocaleDateString('es')}
          </span>
        </td>
        {(role === 'ACADEMY' || role === 'ADMIN') && (
          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
            <button
              onClick={(e) => { e.stopPropagation(); onCopyJoinLink(teacher.id); }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                copiedId === teacher.id
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              title={`Link para unirse a las asignaturas de ${teacher.name}`}
            >
              {copiedId === teacher.id ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copiar Link
                </>
              )}
            </button>
          </td>
        )}
        {(role === 'ACADEMY' || role === 'ADMIN') && (
          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(teacher); }}
                disabled={isDemo}
                className="text-gray-500 hover:text-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Editar profesor"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(teacher.id, teacher.name, teacher.classes ?? []); }}
                disabled={deleting === teacher.id || isDemo}
                className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Eliminar profesor"
              >
                {deleting === teacher.id ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <DeleteIcon size={16} />
                )}
              </button>
            </div>
          </td>
        )}
      </tr>
      {expandedClasses.map((cls, idx) => (
        <tr key={`${teacher.id}-cls-${idx}`} className="bg-gray-50/70">
          <td className="px-3 sm:px-6 py-3" colSpan={role === 'ADMIN' ? 2 : 1}></td>
          <td className="px-3 sm:px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">↳</span>
              <span className="text-xs font-medium text-indigo-600">{cls.name}</span>
            </div>
          </td>
          <td className="px-3 sm:px-6 py-3">
            {cls.studentCount !== undefined && (
              <span className="text-xs text-gray-700">{cls.studentCount}</span>
            )}
          </td>
          {(role === 'ACADEMY' || role === 'ADMIN') && (
            <td className="px-3 sm:px-6 py-3">
              <span className="text-xs font-medium text-gray-700">
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cls.revenue || 0)}
              </span>
            </td>
          )}
          <td
            className="px-3 sm:px-6 py-3"
            colSpan={(role === 'ACADEMY' || role === 'ADMIN') ? 3 : 1}
          ></td>
        </tr>
      ))}
    </React.Fragment>
  );
}
