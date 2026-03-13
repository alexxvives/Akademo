'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { SkeletonClasses } from '@/components/ui/SkeletonLoader';

interface AcademyClass {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  academyId: string;
  academyName: string;
  teacherName: string; // Full name from backend
  teacherFirstName?: string;
  teacherLastName?: string;
  teacherId: string;
  teacherEmail: string;
  studentCount: number;
  enrollmentStatus: string | null; // null = not enrolled, 'PENDING', 'APPROVED'
}

export default function EnrolledAcademiesClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await apiClient('/explore/enrolled-academies/classes');
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClass = async (classId: string) => {
    setRequesting(classId);
    try {
      const response = await apiClient('/requests/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/dashboard/student/subjects');
      } else {
        alert(result.error || 'Failed to send request');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setRequesting(null);
    }
  };

  if (loading) {
    return <SkeletonClasses />;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Unirse a Más Clases</h1>
          <p className="text-gray-600 text-sm mt-1">
            {classes.length > 0 
              ? `${classes[0].academyName}${classes.some(c => c.academyName !== classes[0].academyName) ? ' y más' : ''}` 
              : 'Clases disponibles en las academias donde ya estás inscrito'}
          </p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No hay más clases disponibles</h2>
          <p className="text-gray-600 mb-8">
            Ya estás inscrito en todas las clases disponibles de tu academia
          </p>
          <Link
            href="/dashboard/student/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Explorar Nuevas Academias
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group classes by academy */}
          {Object.entries(
            classes.reduce((acc, classItem) => {
              if (!acc[classItem.academyName]) {
                acc[classItem.academyName] = [];
              }
              acc[classItem.academyName].push(classItem);
              return acc;
            }, {} as Record<string, AcademyClass[]>)
          ).map(([academyName, academyClasses]) => (
            <div key={academyName}>
              <div className="space-y-4">
                {academyClasses.map((classItem) => (
                  <div key={classItem.id} className="bg-white rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:shadow-xl transition-all p-4 sm:p-6 group relative">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900">{classItem.name}</h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            {academyName}
                          </span>
                        </div>
                        {classItem.description ? (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{classItem.description}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic mb-3">Sin descripción</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="font-medium">Profesor:</span>
                          <span>{classItem.teacherName || 'Sin asignar'}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-2 sm:mt-0">
                        {classItem.enrollmentStatus === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm border border-green-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Ya inscrito
                          </span>
                        ) : classItem.enrollmentStatus === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium text-sm border border-yellow-200">
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Solicitud pendiente
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRequestClass(classItem.id)}
                            disabled={requesting === classItem.id}
                            className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {requesting === classItem.id ? 'Solicitando...' : 'Solicitar Inscripción'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
