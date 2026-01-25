'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function TeacherGrading() {
  const [academyName, setAcademyName] = useState<string>('');

  useEffect(() => {
    loadAcademyName();
  }, []);

  const loadAcademyName = async () => {
    try {
      const res = await apiClient('/requests/teacher');
      const result = await res.json();
      if (Array.isArray(result) && result.length > 0) {
        // Teacher endpoint returns array directly
        setAcademyName(result[0].academyName || '');
      } else if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        // Fallback for wrapped response
        setAcademyName(result.data[0].academyName || '');
      }
    } catch (error) {
      console.error('Failed to load academy name:', error);
      // Continue gracefully - page still works without academy name
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Calificaciones</h1>
          {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Próximamente</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            El sistema de calificaciones estará disponible pronto. Podrás calificar tareas, cuestionarios y ver el rendimiento de cada estudiante.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            En desarrollo
          </div>
        </div>
      </div>
    </>
  );
}
