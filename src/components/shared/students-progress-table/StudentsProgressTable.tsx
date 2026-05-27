'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import type { StudentsProgressTableProps, VisibleColumns } from './types';
import { COLUMN_LABELS } from './types';
import { WatchTimeChart } from './WatchTimeChart';
import { StudentRow } from './StudentRow';

export function StudentsProgressTable({
  students,
  loading,
  searchQuery,
  selectedClass,
  showTeacherColumn = false,
  showBanButton = false,
  disableBanButton = false,
  onBanStudent,
  onReadmitStudent,
  onAlertStudent,
}: StudentsProgressTableProps) {
  const [tiempoTooltipPos, setTiempoTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [sospechasTooltipPos, setSospechasTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({ asignatura: true, videosVistos: true, tiempoTotal: true, ultimaActividad: true, pagos: true, sospechas: true, acciones: false });
  const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!columnDropdownOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(e.target as Node)) {
        setColumnDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [columnDropdownOpen]);

  const toggleExpand = (studentId: string) => {
    setExpandedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const filteredStudents = useMemo(() => {
    return students
      .filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             student.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClass = selectedClass === 'all'
          || student.classId === selectedClass
          || (student.classBreakdown?.some(b => b.classId === selectedClass) ?? false);

        return matchesSearch && matchesClass;
      })
      .sort((a, b) => b.totalWatchTime - a.totalWatchTime);
  }, [students, searchQuery, selectedClass]);

  if (loading) {
    return <SkeletonTable rows={10} cols={5} />;
  }

  const colCount = 1 + (visibleColumns.asignatura ? 1 : 0) + (showTeacherColumn ? 1 : 0) + (visibleColumns.videosVistos ? 1 : 0) + (visibleColumns.tiempoTotal ? 1 : 0) + (visibleColumns.ultimaActividad ? 1 : 0) + (visibleColumns.pagos ? 1 : 0) + (visibleColumns.sospechas ? 1 : 0) + (showBanButton && visibleColumns.acciones ? 1 : 0);

  return (
    <div className="space-y-6">
      <WatchTimeChart filteredStudents={filteredStudents} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{filteredStudents.length}</span> {filteredStudents.length === 1 ? 'estudiante' : 'estudiantes'}
          </p>
          <div className="relative" ref={columnDropdownRef}>
            <button
              onClick={() => setColumnDropdownOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Columnas
            </button>
            {columnDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                {(['asignatura', 'videosVistos', 'tiempoTotal', 'ultimaActividad', 'pagos', 'sospechas', ...(showBanButton ? ['acciones'] : [])] as const).map((key) => (
                  <label key={key} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns[key as keyof VisibleColumns]}
                      onChange={(e) => setVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{COLUMN_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 overflow-visible">
              <tr>
                <th className="text-left py-2 px-3 md:py-4 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estudiante
                </th>
                {visibleColumns.asignatura && (
                <th className="text-left py-2 px-3 md:py-4 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asignatura
                </th>
                )}
                {showTeacherColumn && (
                  <th className="text-left py-2 px-3 md:py-4 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profesor
                  </th>
                )}
                {visibleColumns.videosVistos && (
                <th className="text-left py-2 px-3 md:py-4 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Videos Vistos
                </th>
                )}
                {visibleColumns.tiempoTotal && (
                <th className="text-left py-2 px-3 md:py-4 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span
                    className="inline-flex items-center gap-1 cursor-help"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTiempoTooltipPos({ x: rect.left, y: rect.top });
                    }}
                    onMouseLeave={() => setTiempoTooltipPos(null)}
                  >
                    Tiempo Total
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  {tiempoTooltipPos && (
                    <div
                      style={{
                        position: 'fixed',
                        left: tiempoTooltipPos.x,
                        top: tiempoTooltipPos.y,
                        transform: 'translateY(calc(-100% - 8px))',
                        zIndex: 9999,
                      }}
                      className="px-3 py-2 bg-gray-900 text-white text-xs rounded-lg w-72 normal-case tracking-normal leading-relaxed pointer-events-none"
                    >
                      Tiempo acumulado viendo vídeos. Puede aparecer en negativo si se han otorgado minutos extra que superan el tiempo ya consumido.
                    </div>
                  )}
                </th>
                )}
                {visibleColumns.ultimaActividad && (
                <th className="text-left py-2 px-3 md:py-4 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Actividad
                </th>
                )}
                {visibleColumns.pagos && (
                  <th className="text-left py-2 px-3 md:py-4 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagos
                  </th>
                )}
                {visibleColumns.sospechas && (
                  <th className="text-left py-2 px-3 md:py-4 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span
                      className="inline-flex items-center gap-1 cursor-help"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setSospechasTooltipPos({ x: rect.right, y: rect.top });
                      }}
                      onMouseLeave={() => setSospechasTooltipPos(null)}
                    >
                      Sospechas
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    {sospechasTooltipPos && (
                      <div
                        style={{
                          position: 'fixed',
                          right: `calc(100vw - ${sospechasTooltipPos.x}px)`,
                          top: sospechasTooltipPos.y,
                          transform: 'translateY(calc(-100% - 8px))',
                          zIndex: 9999,
                        }}
                        className="px-3 py-2 bg-gray-900 text-white text-xs rounded-lg w-72 normal-case tracking-normal leading-relaxed pointer-events-none whitespace-pre-line"
                      >
                        {`Se incrementa en dos situaciones:\n\n• Viaje imposible: el alumno aparece en dos ubicaciones muy alejadas en muy poco tiempo (movimiento geográficamente imposible).\n\n• Sesión duplicada: alguien inició sesión con esta cuenta mientras ya había otra sesión activa (posible uso compartido de contraseña).`}
                      </div>
                    )}
                  </th>
                )}
                {showBanButton && visibleColumns.acciones && (
                  <th className="text-left py-2 px-3 md:py-4 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="py-12 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900">No hay estudiantes</p>
                    <p className="text-xs text-gray-500 mt-1">Los estudiantes aparecerán aquí cuando se inscriban en las asignaturas</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <StudentRow
                    key={`${student.id}-${student.classId}`}
                    student={student}
                    isExpanded={expandedStudents.has(student.id)}
                    onToggleExpand={toggleExpand}
                    visibleColumns={visibleColumns}
                    showTeacherColumn={showTeacherColumn}
                    showBanButton={showBanButton}
                    disableBanButton={disableBanButton}
                    onBanStudent={onBanStudent}
                    onReadmitStudent={onReadmitStudent}
                    onAlertStudent={onAlertStudent}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
