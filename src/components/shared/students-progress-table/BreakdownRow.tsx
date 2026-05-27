'use client';

import React from 'react';
import type { ClassBreakdownItem, VisibleColumns } from './types';
import { formatTime, getProgressBarColor, getActivityStatus } from './utils';

export interface BreakdownRowProps {
  cls: ClassBreakdownItem;
  studentName: string;
  visibleColumns: VisibleColumns;
  showTeacherColumn: boolean;
  showBanButton: boolean;
  disableBanButton: boolean;
  onBanStudent?: (enrollmentId: string) => void;
  onReadmitStudent?: (enrollmentId: string) => void;
}

export function BreakdownRow({ cls, studentName, visibleColumns, showTeacherColumn, showBanButton, disableBanButton, onBanStudent, onReadmitStudent }: BreakdownRowProps) {
  const clsProgress = cls.totalVideos > 0 ? (cls.videosWatched / cls.totalVideos) * 100 : 0;
  const clsActivity = getActivityStatus(cls.lastActive);
  const isBanned = cls.enrollmentStatus === 'BANNED';

  return (
    <tr className="bg-gray-50/70">
      <td className="py-2 px-3 md:py-3 md:px-6">
        <div className="flex items-center gap-3 pl-10">
          <span className="text-xs text-gray-500 italic">↳ detalle por asignatura</span>
        </div>
      </td>
      {visibleColumns.asignatura && (
      <td className="py-2 px-3 md:py-3 md:px-6">
        <span className="text-xs font-medium text-indigo-600">{cls.className}</span>
      </td>
      )}
      {showTeacherColumn && (
        <td className="py-2 px-3 md:py-3 md:px-6">
          <span className="text-xs text-gray-600">{cls.teacherName || '-'}</span>
        </td>
      )}
      {visibleColumns.videosVistos && (
      <td className="py-2 px-3 md:py-3 md:px-6">
        <div className="flex flex-col gap-1">
          <div className="flex-1 max-w-[100px]">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${getProgressBarColor(cls.lastActive)}`}
                style={{ width: `${clsProgress}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-medium text-gray-500">{cls.videosWatched} / {cls.totalVideos}</span>
        </div>
      </td>
      )}
      {visibleColumns.tiempoTotal && (
      <td className="py-2 px-3 md:py-3 md:px-6">
        <span className="text-xs text-gray-600">{formatTime(cls.totalWatchTime)}</span>
      </td>
      )}
      {visibleColumns.ultimaActividad && (
      <td className="py-2 px-3 md:py-3 md:px-6">
        <span className={`text-xs ${clsActivity.textColor}`}>
          {cls.lastActive
            ? (() => {
                const date = new Date(cls.lastActive);
                const day = date.getDate();
                const month = date.toLocaleDateString('es-ES', { month: 'short' });
                const year = date.getFullYear();
                const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
                return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)} ${year} ${time}`;
              })()
            : 'Sin actividad'}
        </span>
      </td>
      )}
      {visibleColumns.pagos && (
      <td className="py-2 px-3 md:py-3 md:px-6">
        {cls.paymentStatus === 'FREE' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            Gratis
          </span>
        ) : cls.paymentStatus === 'UP_TO_DATE' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
            Al día
          </span>
        ) : cls.paymentStatus === 'BEHIND' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
            Atrasado{cls.monthsBehind && cls.monthsBehind > 1 ? ` (x${cls.monthsBehind})` : ''}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      )}
      {visibleColumns.sospechas && (
      <td className="py-2 px-3 md:py-3 md:px-6">
        <span className="text-xs text-gray-400">—</span>
      </td>
      )}
      {showBanButton && visibleColumns.acciones && (
        <td className="py-2 px-3 md:py-3 md:px-6">
          {cls.enrollmentId && (
            isBanned ? (
              <button
                onClick={() => {
                  if (!disableBanButton && window.confirm(`¿Readmitir a ${studentName} en ${cls.className}?`)) {
                    onReadmitStudent?.(cls.enrollmentId!);
                  }
                }}
                disabled={disableBanButton}
                className={`px-2 py-1 text-xs font-medium text-white rounded-lg transition-colors ${
                  disableBanButton
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                title={disableBanButton ? 'No disponible en modo demostración' : `Readmitir en ${cls.className}`}
              >
                Readmitir
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!disableBanButton && window.confirm(`¿Estás seguro de que deseas expulsar a ${studentName} de ${cls.className}? Esta acción no se puede deshacer.`)) {
                    onBanStudent?.(cls.enrollmentId!);
                  }
                }}
                disabled={disableBanButton}
                className={`px-2 py-1 text-xs font-medium text-white rounded-lg transition-colors ${
                  disableBanButton
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                title={disableBanButton ? 'No disponible en modo demostración' : `Expulsar de ${cls.className}`}
              >
                Expulsar
              </button>
            )
          )}
        </td>
      )}
    </tr>
  );
}
