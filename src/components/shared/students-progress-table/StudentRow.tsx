'use client';

import React from 'react';
import type { StudentProgress, VisibleColumns } from './types';
import { formatTime, getProgressBarColor, getActivityStatus } from './utils';
import { BreakdownRow } from './BreakdownRow';

interface StudentRowProps {
  student: StudentProgress;
  isExpanded: boolean;
  onToggleExpand: (studentId: string) => void;
  visibleColumns: VisibleColumns;
  showTeacherColumn: boolean;
  showBanButton: boolean;
  disableBanButton: boolean;
  onBanStudent?: (enrollmentId: string) => void;
  onReadmitStudent?: (enrollmentId: string) => void;
  onAlertStudent?: (studentId: string, studentName: string) => void;
}

export function StudentRow({
  student,
  isExpanded,
  onToggleExpand,
  visibleColumns,
  showTeacherColumn,
  showBanButton,
  disableBanButton,
  onBanStudent,
  onReadmitStudent,
  onAlertStudent,
}: StudentRowProps) {
  const progress = student.totalVideos > 0 ? (student.videosWatched / student.totalVideos) * 100 : 0;
  const activityStatus = getActivityStatus(student.lastActive);
  const hasBreakdown = student.classBreakdown && student.classBreakdown.length > 1;
  const isBanned = student.enrollmentStatus === 'BANNED';

  return (
    <React.Fragment key={`${student.id}-${student.classId}`}>
      <tr
        className={`hover:bg-gray-50 transition-colors ${hasBreakdown ? 'cursor-pointer' : ''}`}
        onClick={() => hasBreakdown && onToggleExpand(student.id)}
      >
        <td className="py-2 px-3 md:py-4 md:px-6">
          <div className="flex items-center gap-3">
            {hasBreakdown ? (
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <div className="w-4 h-4 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{student.name}</p>
              <p className="text-xs text-gray-500">{student.email}</p>
              {isBanned && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 mt-0.5">
                  Expulsado
                </span>
              )}
            </div>
          </div>
        </td>
        {visibleColumns.asignatura && (
        <td className="py-2 px-3 md:py-4 md:px-6">
          <span className="text-sm text-gray-900">{student.className}</span>
        </td>
        )}
        {showTeacherColumn && (
          <td className="py-2 px-3 md:py-4 md:px-6">
            {hasBreakdown ? (() => {
              const teacherNames = student.classBreakdown!.map(c => c.teacherName).filter((t): t is string => !!t);
              const uniqueTeachers = Array.from(new Set(teacherNames));
              return (
                <span className="text-sm text-gray-900">
                  {uniqueTeachers.length === 1 ? uniqueTeachers[0] : `${uniqueTeachers.length} profesores`}
                </span>
              );
            })() : (
              <span className="text-sm text-gray-900">{student.teacherName || '-'}</span>
            )}
          </td>
        )}
        {visibleColumns.videosVistos && (
        <td className="py-2 px-3 md:py-4 md:px-6">
          <div className="flex flex-col gap-1">
            <div className="flex-1 max-w-[100px]">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressBarColor(student.lastActive)}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-medium text-gray-500">{student.videosWatched} / {student.totalVideos}</span>
          </div>
        </td>
        )}
        {visibleColumns.tiempoTotal && (
        <td className="py-2 px-3 md:py-4 md:px-6">
          <span className="text-sm text-gray-900">{formatTime(student.totalWatchTime)}</span>
        </td>
        )}
        {visibleColumns.ultimaActividad && (
        <td className="py-2 px-3 md:py-4 md:px-6">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${activityStatus.textColor}`}>
              {student.lastActive
                ? (() => {
                    const date = new Date(student.lastActive);
                    const day = date.getDate();
                    const month = date.toLocaleDateString('es-ES', { month: 'short' });
                    const year = date.getFullYear();
                    const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
                    return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)} ${year} ${time}`;
                  })()
                : 'Sin actividad'}
            </span>
          </div>
        </td>
        )}
        {visibleColumns.pagos && (
        <td className="py-2 px-3 md:py-4 md:px-6">
          {student.paymentStatus === 'FREE' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              Gratis
            </span>
          ) : student.paymentStatus === 'UP_TO_DATE' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Al día
            </span>
          ) : student.paymentStatus === 'BEHIND' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              Atrasado{student.monthsBehind && student.monthsBehind > 1 ? ` (x${student.monthsBehind})` : ''}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
              —
            </span>
          )}
        </td>
        )}
        {visibleColumns.sospechas && (
        <td className="py-2 px-3 md:py-4 md:px-6">
          {(student.suspicionCount ?? 0) > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-900">{student.suspicionCount}</span>
              {onAlertStudent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`¿Enviar alerta de actividad sospechosa a ${student.name}? El estudiante verá el aviso en su próximo inicio de sesión.`)) {
                      onAlertStudent(student.id, student.name);
                    }
                  }}
                  title="Enviar aviso al estudiante"
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </td>
        )}
        {showBanButton && visibleColumns.acciones && (
          <td className="py-2 px-3 md:py-4 md:px-6">
            {!hasBreakdown ? (
              isBanned ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disableBanButton && window.confirm(`¿Readmitir a ${student.name} en ${student.className}?`)) {
                      onReadmitStudent?.(student.enrollmentId!);
                    }
                  }}
                  disabled={disableBanButton}
                  className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors ${
                    disableBanButton
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  title={disableBanButton ? 'No disponible en modo demostración' : 'Readmitir estudiante'}
                >
                  Readmitir
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disableBanButton && window.confirm(`¿Estás seguro de que deseas expulsar a ${student.name} de ${student.className}? Esta acción no se puede deshacer.`)) {
                      onBanStudent?.(student.enrollmentId!);
                    }
                  }}
                  disabled={disableBanButton}
                  className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors ${
                    disableBanButton
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  title={disableBanButton ? 'No disponible en modo demostración' : 'Expulsar estudiante'}
                >
                  Expulsar
                </button>
              )
            ) : (
              <span className="text-xs text-gray-400 italic">Ver detalle ↓</span>
            )}
          </td>
        )}
      </tr>
      {hasBreakdown && isExpanded && student.classBreakdown!.map((cls) => (
        <BreakdownRow
          key={`${student.id}-breakdown-${cls.classId}`}
          cls={cls}
          studentName={student.name}
          visibleColumns={visibleColumns}
          showTeacherColumn={showTeacherColumn}
          showBanButton={showBanButton}
          disableBanButton={disableBanButton}
          onBanStudent={onBanStudent}
          onReadmitStudent={onReadmitStudent}
        />
      ))}
    </React.Fragment>
  );
}

