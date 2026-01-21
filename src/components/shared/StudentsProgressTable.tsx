'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
}

interface StudentsProgressTableProps {
  students: StudentProgress[];
  loading: boolean;
  searchQuery: string;
  selectedClass: string;
  onSearchChange: (query: string) => void;
  onClassFilterChange: (classId: string) => void;
  uniqueClasses: string[];
  showClassFilter?: boolean;
  showTeacherColumn?: boolean;
}

export function StudentsProgressTable({
  students,
  loading,
  searchQuery,
  selectedClass,
  onSearchChange,
  onClassFilterChange,
  uniqueClasses,
  showClassFilter = true,
  showTeacherColumn = false,
}: StudentsProgressTableProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProgressColor = (watched: number, total: number) => {
    const pct = total > 0 ? (watched / total) * 100 : 0;
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = selectedClass === 'all' || student.className === selectedClass;
      
      return matchesSearch && matchesClass;
    });
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
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando progreso...</p>
      </div>
    );
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Clase
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={showTeacherColumn ? 6 : 5} className="py-12 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900">No hay estudiantes</p>
                    <p className="text-xs text-gray-500 mt-1">Los estudiantes aparecerán aquí cuando se inscriban en las clases</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                const progress = student.totalVideos > 0 ? (student.videosWatched / student.totalVideos) * 100 : 0;
                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900">{student.className}</span>
                    </td>
                    {showTeacherColumn && (
                      <td className="py-4 px-6">
                        <span className="text-gray-900">{student.teacherName || '-'}</span>
                      </td>
                    )}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{student.videosWatched} / {student.totalVideos}</span>
                        <div className="flex-1 max-w-[100px]">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(student.videosWatched, student.totalVideos)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900">{formatTime(student.totalWatchTime)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500">
                        {student.lastActive
                          ? new Date(student.lastActive).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Sin actividad'}
                      </span>
                    </td>
                  </tr>
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
