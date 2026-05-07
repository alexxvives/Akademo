'use client';

import type { Class } from '../types';

export interface ClassSelectionProps {
  classes: Class[];
  selectedClassIds: string[];
  toggleClass: (id: string) => void;
  authLoading: boolean;
  authError: string | null;
  handleRequestAccess: () => Promise<void>;
}

export function ClassSelection({
  classes, selectedClassIds, toggleClass,
  authLoading, authError, handleRequestAccess,
}: ClassSelectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">Selecciona tus clases</h2>

      {authError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
          {authError}
        </div>
      )}

      {classes.length === 0 ? (
        <p className="text-gray-600 text-center py-8">
          No hay clases disponibles en esta academia en este momento.
        </p>
      ) : (
        <div className="space-y-3 mb-5 max-h-[50vh] overflow-y-auto pr-1">
          {classes.map(classItem => (
            <div
              key={classItem.id}
              onClick={() => toggleClass(classItem.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedClassIds.includes(classItem.id)
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {classItem.name}
                  </h3>
                  {classItem.description && (
                    <p className="text-sm text-gray-600 mb-1">
                      {classItem.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Profesor: {classItem.teacherName}
                  </p>
                </div>
                <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                  selectedClassIds.includes(classItem.id) ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
                }`}>
                  {selectedClassIds.includes(classItem.id) && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {classes.length > 0 && (
        <button
          onClick={handleRequestAccess}
          disabled={selectedClassIds.length === 0 || authLoading}
          className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {authLoading ? 'Enviando solicitud...' : 'Solicitar Acceso'}
        </button>
      )}
    </div>
  );
}
