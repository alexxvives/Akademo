'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { SkeletonAcademyCards } from '@/components/ui/SkeletonLoader';

interface Academy {
  id: string;
  name: string;
  description: string | null;
  ownerName: string;
  teacherCount: number;
}

export default function ExploreAcademiesPage() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAcademies();
  }, []);

  const loadAcademies = async () => {
    try {
      const response = await apiClient('/explore/academies');
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setAcademies(result.data);
      }
    } catch (error) {
      console.error('Failed to load academies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SkeletonAcademyCards />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Explorar Academias</h1>
          <p className="text-gray-600 text-sm mt-1">Encuentra una academia y solicita inscripción a sus clases</p>
        </div>
        <Link
          href="/dashboard/student/subjects"
          className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Mis Clases
        </Link>
      </div>

      {academies.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay academias disponibles</h3>
          <p className="text-gray-600">Aún no hay academias registradas en la plataforma.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {academies.map((academy) => (
            <Link
              key={academy.id}
              href={`/dashboard/student/explore/${academy.id}`}
              className="block bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-brand-400 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">{academy.name}</h3>
                  {academy.description && (
                    <p className="text-gray-600 text-sm mb-3">{academy.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {academy.teacherCount} profesores
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {academy.ownerName}
                    </span>
                  </div>
                </div>
                <div className="text-gray-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
