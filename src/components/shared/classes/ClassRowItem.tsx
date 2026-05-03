'use client';

import Link from 'next/link';
import { DeleteIcon } from '@/components/ui/DeleteIcon';
import type { Class } from './types';

interface ClassRowItemProps {
  cls: Class;
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
  dashboardBase: string;
  onEdit: (cls: Class) => void;
  onDelete: (cls: Class) => void;
}

export function ClassRowItem({ cls, role, dashboardBase, onEdit, onDelete }: ClassRowItemProps) {
  return (
    <Link
      href={`${dashboardBase}/subject/${cls.slug || cls.id}`}
      className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 hover:border-brand-400 hover:shadow-md transition-all px-5 py-3.5 group cursor-pointer"
    >
      {/* Live dot */}
      {(cls.activeStreamCount ?? 0) > 0 && (
        <span className="relative flex h-2.5 w-2.5 shrink-0" title="Stream en vivo activo">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
      )}

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 truncate group-hover:text-brand-600 transition-colors">
            {cls.name}
          </span>
          {cls.university && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 shrink-0">
              {cls.university}
            </span>
          )}
          {cls.carrera && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 shrink-0">
              {cls.carrera}
            </span>
          )}
        </div>
        {role !== 'TEACHER' && (cls.teacherFirstName || cls.teacherName) && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {cls.teacherFirstName && cls.teacherLastName
              ? `${cls.teacherFirstName} ${cls.teacherLastName}`
              : cls.teacherName ?? ''}
            {role === 'ADMIN' && cls.academyName ? ` · ${cls.academyName}` : ''}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500 shrink-0">
        {cls.lessonCount !== undefined && (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-medium text-gray-700">{cls.lessonCount}</span>
          </span>
        )}
        {cls.studentCount !== undefined && (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-medium text-gray-700">{cls.studentCount}</span>
          </span>
        )}
      </div>

      {/* Actions */}
      {(role === 'ACADEMY' || role === 'ADMIN') && (
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.preventDefault()}>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(cls); }}
            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="Editar asignatura"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <DeleteIcon
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(cls); }}
            size={16}
          />
        </div>
      )}

      {/* Chevron */}
      <svg className="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
