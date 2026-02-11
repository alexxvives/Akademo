'use client';

import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';

export interface ClassBreakdownItem {
  className: string;
  classId: string;
  teacherName?: string;
  totalWatchTime: number;
  videosWatched: number;
  totalVideos: number;
  lastActive: string | null;
  enrollmentId?: string;
  paymentStatus?: 'UP_TO_DATE' | 'BEHIND' | 'FREE';
}

export interface StudentProgress {
  id: string;
  name: string;
  email: string;
  className: string;
  classId?: string;
  teacherName?: string;
  totalWatchTime: number;
  videosWatched: number;
  totalVideos: number;
  lastActive: string | null;
  enrollmentId?: string;
  classBreakdown?: ClassBreakdownItem[];
  paymentStatus?: 'UP_TO_DATE' | 'BEHIND' | 'FREE';
}

interface StudentsProgressTableProps {
  students: StudentProgress[];
  loading: boolean;
  searchQuery: string;
  selectedClass: string;
  showTeacherColumn?: boolean;
  showBanButton?: boolean;
  disableBanButton?: boolean;
  onBanStudent?: (enrollmentId: string) => void;
}

export function StudentsProgressTable({
  students,
  loading,
  searchQuery,
  selectedClass,
  showTeacherColumn = false,
  showBanButton = false,
  disableBanButton = false,
  onBanStudent,
}: StudentsProgressTableProps) {
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

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

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const getProgressBarColor = (_lastActive: string | null) => {
    return 'bg-blue-500';
  };

  const getActivityStatus = (lastActive: string | null) => {
    if (!lastActive) return { color: 'bg-gray-400', label: 'Sin actividad', textColor: 'text-gray-500' };
    
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const hoursSinceActive = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceActive <= 24) {
      return { color: 'bg-green-500', label: 'Activo hace menos de 24h', textColor: 'text-green-600' };
    } else if (hoursSinceActive <= 168) { // 7 days
      return { color: 'bg-yellow-500', label: 'Activo hace menos de 7 días', textColor: 'text-yellow-600' };
    } else {
      return { color: 'bg-red-500', label: 'Inactivo hace más de 7 días', textColor: 'text-red-600' };
    }
  };

  const filteredStudents = useMemo(() => {
    return students
      .filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             student.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClass = selectedClass === 'all' || student.classId === selectedClass;
        
        return matchesSearch && matchesClass;
      })
      .sort((a, b) => b.totalWatchTime - a.totalWatchTime); // Sort by highest tiempo total first
  }, [students, searchQuery, selectedClass]);

  const chartData = useMemo(() => {
    return filteredStudents
      .slice(0, 10)
      .map((student, index) => {
        const parts = student.name.split(' ');
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ');
        // Create unique display name by adding index if duplicate firstNames exist
        const displayName = `${firstName}_${index}`;
        return {
          id: student.id,
          name: displayName, // Unique identifier for X-axis
          displayFirstName: firstName, // For display
          lastName: lastName,
          fullName: student.name,
          minutes: student.totalWatchTime,
        };
      });
  }, [filteredStudents]);

  if (loading) {
    return <SkeletonTable rows={10} cols={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tiempo de Visualización</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">No hay datos</p>
          </div>
        </div>
      ) : chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tiempo de Visualización</h3>
            <p className="text-sm text-gray-500">Solo muestra los top 10 estudiantes</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                tick={({ x, y, payload }) => {
                  const dataPoint = chartData.find(d => d.name === payload.value);
                  return (
                    <text x={x} y={y} textAnchor="middle" fill="#6b7280">
                      <tspan x={x} dy="0.71em" fontSize="12">{dataPoint?.displayFirstName}</tspan>
                      <tspan x={x} dy="1.2em" fontSize="11">{dataPoint?.lastName}</tspan>
                    </text>
                  );
                }}
                height={50}
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                        <p className="font-medium text-gray-900">{data.fullName}</p>
                        <p className="text-sm text-gray-600">{formatTime(data.minutes)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="minutes" radius={[8, 8, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.id}`} fill="#6366f1" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{filteredStudents.length}</span> {filteredStudents.length === 1 ? 'estudiante' : 'estudiantes'}
          </p>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Asignatura
                </th>
                {showTeacherColumn && (
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Profesor
                  </th>
                )}
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Videos Vistos
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tiempo Total
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Última Actividad
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pagos
                </th>
                {showBanButton && (
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={(showTeacherColumn ? 7 : 6) + (showBanButton ? 1 : 0)} className="py-12 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900">No hay estudiantes</p>
                    <p className="text-xs text-gray-500 mt-1">Los estudiantes aparecerán aquí cuando se inscriban en las asignaturas</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                const progress = student.totalVideos > 0 ? (student.videosWatched / student.totalVideos) * 100 : 0;
                const activityStatus = getActivityStatus(student.lastActive);
                const hasBreakdown = student.classBreakdown && student.classBreakdown.length > 1;
                const isExpanded = expandedStudents.has(student.id);
                const colCount = (showTeacherColumn ? 7 : 6) + (showBanButton ? 1 : 0);
                return (
                  <React.Fragment key={`${student.id}-${student.classId}`}>
                    <tr
                      className={`hover:bg-gray-50 transition-colors ${hasBreakdown ? 'cursor-pointer' : ''}`}
                      onClick={() => hasBreakdown && toggleExpand(student.id)}
                    >
                      <td className="py-4 px-6">
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
                            <p className="text-xs font-medium text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs text-gray-900">{student.className}</span>
                      </td>
                      {showTeacherColumn && (
                        <td className="py-4 px-6">
                          {hasBreakdown ? (() => {
                            const teacherNames = student.classBreakdown!.map(c => c.teacherName).filter((t): t is string => !!t);
                            const uniqueTeachers = Array.from(new Set(teacherNames));
                            return (
                              <span className="text-xs text-gray-900">
                                {uniqueTeachers.length === 1 ? uniqueTeachers[0] : `${uniqueTeachers.length} profesores`}
                              </span>
                            );
                          })() : (
                            <span className="text-xs text-gray-900">{student.teacherName || '-'}</span>
                          )}
                        </td>
                      )}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-900">{student.videosWatched} / {student.totalVideos}</span>
                          <div className="flex-1 max-w-[100px]">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${getProgressBarColor(student.lastActive)}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs text-gray-900">{formatTime(student.totalWatchTime)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${activityStatus.textColor}`}>
                            {student.lastActive
                              ? (() => {
                                  const date = new Date(student.lastActive);
                                  const day = date.getDate();
                                  const month = date.toLocaleDateString('es-ES', { month: 'long' });
                                  const year = date.getFullYear();
                                  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
                                  return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)} ${year} a las ${time}`;
                                })()
                              : 'Sin actividad'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
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
                            Atrasado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                            —
                          </span>
                        )}
                      </td>
                      {showBanButton && (
                        <td className="py-4 px-6">
                          {!hasBreakdown ? (
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
                          ) : (
                            <span className="text-xs text-gray-400 italic">Ver detalle ↓</span>
                          )}
                        </td>
                      )}
                    </tr>
                    {/* Per-class breakdown sub-rows */}
                    {hasBreakdown && isExpanded && student.classBreakdown!.map((cls) => {
                      const clsProgress = cls.totalVideos > 0 ? (cls.videosWatched / cls.totalVideos) * 100 : 0;
                      const clsActivity = getActivityStatus(cls.lastActive);
                      return (
                        <tr key={`${student.id}-breakdown-${cls.classId}`} className="bg-gray-50/70">
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-3 pl-10">
                              <span className="text-xs text-gray-500 italic">↳ detalle por asignatura</span>
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <span className="text-xs font-medium text-indigo-600">{cls.className}</span>
                          </td>
                          {showTeacherColumn && (
                            <td className="py-3 px-6">
                              <span className="text-xs text-gray-600">{cls.teacherName || '-'}</span>
                            </td>
                          )}
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">{cls.videosWatched} / {cls.totalVideos}</span>
                              <div className="flex-1 max-w-[100px]">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${getProgressBarColor(cls.lastActive)}`}
                                    style={{ width: `${clsProgress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <span className="text-xs text-gray-600">{formatTime(cls.totalWatchTime)}</span>
                          </td>
                          <td className="py-3 px-6">
                            <span className={`text-xs ${clsActivity.textColor}`}>
                              {cls.lastActive
                                ? (() => {
                                    const date = new Date(cls.lastActive);
                                    const day = date.getDate();
                                    const month = date.toLocaleDateString('es-ES', { month: 'long' });
                                    const year = date.getFullYear();
                                    const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
                                    return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)} ${year} a las ${time}`;
                                  })()
                                : 'Sin actividad'}
                            </span>
                          </td>
                          <td className="py-3 px-6">
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
                                Atrasado
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          {showBanButton && (
                            <td className="py-3 px-6">
                              {cls.enrollmentId && (
                                <button
                                  onClick={() => {
                                    if (!disableBanButton && window.confirm(`¿Estás seguro de que deseas expulsar a ${student.name} de ${cls.className}? Esta acción no se puede deshacer.`)) {
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
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
