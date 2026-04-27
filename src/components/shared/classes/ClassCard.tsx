'use client';

import Link from 'next/link';
import { DeleteIcon } from '@/components/ui/DeleteIcon';
import type { Class } from './types';

interface ClassCardProps {
  cls: Class;
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
  dashboardBase: string;
  dailycoEnabled?: boolean;
  onEdit: (cls: Class) => void;
  onDelete: (cls: Class) => void;
}

export function ClassCard({ cls, role, dashboardBase, dailycoEnabled = false, onEdit, onDelete }: ClassCardProps) {
  return (
    <Link
      href={`${dashboardBase}/subject/${cls.slug || cls.id}`}
      className="block bg-white rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:shadow-xl transition-all p-6 group cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
            {(cls.activeStreamCount ?? 0) > 0 && (
              <span className="relative flex h-3 w-3" title="Stream en vivo activo">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
            {(cls.university || cls.carrera) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {cls.university && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {cls.university}
                  </span>
                )}
                {cls.carrera && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {cls.carrera}
                  </span>
                )}
              </div>
            )}
            {cls.whatsappGroupLink && (
              <a
                href={cls.whatsappGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Grupo WhatsApp"
              >
                <svg className="w-5 h-5 text-green-500 hover:text-green-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            )}
          </div>

          {cls.description ? (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description}</p>
          ) : (
            <p className="text-sm text-gray-400 italic mb-4">Sin descripción</p>
          )}

          {role !== 'TEACHER' && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">Profesor:</span>
              <span>
                {cls.teacherFirstName && cls.teacherLastName
                  ? `${cls.teacherFirstName} ${cls.teacherLastName}${role === 'ADMIN' && cls.academyName ? ` (${cls.academyName})` : ''}`
                  : cls.teacherName
                    ? `${cls.teacherName}${role === 'ADMIN' && cls.academyName ? ` (${cls.academyName})` : ''}`
                    : 'Sin asignar'}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {cls.startDate
                ? new Date(cls.startDate + 'T00:00:00').toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : new Date(cls.createdAt || Date.now()).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
            </span>
            {cls.lessonCount !== undefined && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="font-semibold text-gray-700">{cls.lessonCount}</span> Clase
                {cls.lessonCount !== 1 ? 's' : ''}
              </span>
            )}
            {cls.studentCount !== undefined && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="font-semibold text-gray-700">{cls.studentCount}</span> Estudiante
                {cls.studentCount !== 1 ? 's' : ''}
              </span>
            )}
            {(cls.assignmentCount ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-semibold text-gray-700">{cls.assignmentCount}</span> Ejercicio
                {cls.assignmentCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {(role === 'ACADEMY' || role === 'TEACHER' || role === 'ADMIN') && (
          <div className="flex flex-col items-end gap-2 ml-4">
            {(role === 'ACADEMY' || role === 'ADMIN') && (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(cls);
                  }}
                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  title="Editar asignatura"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(cls);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar asignatura"
                >
                  <DeleteIcon size={20} />
                </button>
              </div>
            )}
            {cls.zoomAccountName ? (
              <span className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                <svg className="w-[18px] h-[18px] text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-green-700">{cls.zoomAccountName}</span>
              </span>
            ) : dailycoEnabled ? (
              <span className="flex items-center gap-2 px-3 py-2 bg-brand-50 border border-brand-200 rounded-md">
                <svg className="w-[18px] h-[18px] text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-brand-600">AKADEMO Live</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                <svg className="w-[18px] h-[18px] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span className="text-sm font-medium text-gray-400">Sin cuenta de streaming</span>
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
