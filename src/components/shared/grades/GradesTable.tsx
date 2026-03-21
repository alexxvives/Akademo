'use client';

import { apiClient, openDocument } from '@/lib/api-client';
import type { StudentGrade } from './types';

interface GradesTableProps {
  filteredGrades: StudentGrade[];
  filteredAveragesCount: number;
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
  onGradesUpdate: React.Dispatch<React.SetStateAction<StudentGrade[]>>;
}

export function GradesTable({ filteredGrades, filteredAveragesCount, role, onGradesUpdate }: GradesTableProps) {
  const handleDownload = async (storagePath: string) => {
    if (storagePath.startsWith('/demo/') || storagePath.startsWith('demo/')) {
      window.open(storagePath.startsWith('/') ? storagePath : `/${storagePath}`, '_blank');
    } else {
      try { await openDocument(storagePath); } catch { alert('Error al abrir el archivo'); }
    }
  };

  const handleRemoveAssignmentFiles = async (assignmentId: string) => {
    if (!confirm('¿Eliminar todos los archivos de este ejercicio?')) return;
    try {
      const res = await apiClient(`/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachmentIds: '' }),
      });
      const result = await res.json();
      if (result.success) {
        onGradesUpdate(prev => prev.map(g => g.assignmentId === assignmentId
          ? { ...g, assignmentUploadIds: undefined, assignmentUploadId: undefined, assignmentStoragePath: undefined }
          : g));
      }
    } catch (error) {
      console.error('Failed to remove exercise files:', error);
    }
  };

  const handleRemoveSubmissionFiles = async (assignmentId: string, studentId: string) => {
    if (!confirm('¿Eliminar la entrega de este estudiante?')) return;
    try {
      const res = await apiClient(`/assignments/${assignmentId}/submissions/${studentId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        onGradesUpdate(prev => prev.map(g =>
          g.assignmentId === assignmentId && g.studentId === studentId
            ? { ...g, submissionUploadId: undefined, submissionStoragePath: undefined }
            : g
        ));
      }
    } catch (error) {
      console.error('Failed to remove submission files:', error);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm text-gray-600">
          Mostrando <span className="font-semibold">{filteredAveragesCount}</span> estudiante
          {filteredAveragesCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="max-h-[700px] overflow-y-auto overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ejercicio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ejercicios</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrega</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredGrades.map((grade, idx) => {
              let fileCount = 0;
              if (grade.assignmentUploadIds) {
                fileCount = grade.assignmentUploadIds.split(',').filter((id) => id.trim()).length;
              } else if (grade.assignmentUploadId) {
                fileCount = 1;
              }

              return (
                <tr key={`${grade.studentId}-${grade.assignmentTitle}-${idx}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{grade.studentName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{grade.assignmentTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {fileCount > 0 && grade.assignmentStoragePath ? (
                      <button
                        onClick={() => handleDownload(grade.assignmentStoragePath!)}
                        className="flex items-center gap-2 text-sm text-gray-900 hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors group"
                      >
                        <div className="relative">
                          <div className="w-8 h-10 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
                            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          {(role === 'ACADEMY' || role === 'TEACHER') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveAssignmentFiles(grade.assignmentId); }}
                              className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                              title="Eliminar archivos">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <span className="text-xs">
                          {fileCount} archivo{fileCount > 1 ? 's' : ''}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Sin archivo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {grade.submissionStoragePath ? (
                      <button
                        onClick={() => handleDownload(grade.submissionStoragePath!)}
                        className="flex items-center gap-2 text-sm text-gray-900 hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors group"
                      >
                        <div className="relative">
                          <div className="w-8 h-10 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
                            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveSubmissionFiles(grade.assignmentId, grade.studentId); }}
                            className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                            title="Eliminar entrega"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <span className="text-xs">1 archivo</span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Sin entregar</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(grade.gradedAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span
                      className={`text-sm font-medium ${
                        grade.score === grade.maxScore
                          ? 'text-green-800'
                          : grade.score / grade.maxScore >= 0.7
                            ? 'text-green-600'
                            : grade.score / grade.maxScore >= 0.5
                              ? 'text-orange-500'
                              : 'text-red-600'
                      }`}
                    >
                      {grade.score} / {grade.maxScore}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
