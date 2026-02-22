'use client';

/**
 * Shared StudentsList Component
 * Used by: Academy, Admin, and Teacher class detail pages
 */

export interface StudentsListProps {
  enrollments: Array<{
    id: string;
    enrolledAt: string;
    status: string;
    student: {
      firstName: string;
      lastName: string;
      email: string;
      lastLoginAt?: string | null;
      suspicionCount?: number;
    };
  }>;
}

export default function StudentsList({ enrollments }: StudentsListProps) {
  const visibleEnrollments = (enrollments || []).filter(e => e.status === 'APPROVED');

  const getActivityColor = (lastLoginAt: string | null | undefined) => {
    if (!lastLoginAt) return 'bg-gray-400';
    const hoursSinceActive = (Date.now() - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceActive <= 24) return 'bg-green-500';
    if (hoursSinceActive <= 168) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getActivityLabel = (lastLoginAt: string | null | undefined) => {
    if (!lastLoginAt) return 'Sin actividad';
    const hoursSinceActive = (Date.now() - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceActive <= 24) return 'Activo hace menos de 24h';
    if (hoursSinceActive <= 168) return 'Activo hace menos de 7 días';
    return 'Inactivo hace más de 7 días';
  };

  return (
    <div className="pb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Estudiantes</h2>
      {visibleEnrollments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">No hay estudiantes inscritos</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estudiante</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Última actividad</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Sospechas
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleEnrollments.map(e => {
                const suspicionCount = e.student.suspicionCount ?? 0;
                return (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {e.student.firstName[0]}{e.student.lastName[0]}
                          <div
                            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${getActivityColor(e.student.lastLoginAt)}`}
                            title={getActivityLabel(e.student.lastLoginAt)}
                          />
                        </div>
                        <span className="font-medium text-gray-900">{e.student.firstName} {e.student.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{e.student.email}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-medium ${getActivityColor(e.student.lastLoginAt) === 'bg-green-500' ? 'text-green-600' : getActivityColor(e.student.lastLoginAt) === 'bg-yellow-500' ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {getActivityLabel(e.student.lastLoginAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {suspicionCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {suspicionCount}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
