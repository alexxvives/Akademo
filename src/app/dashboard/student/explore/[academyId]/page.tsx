'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { SkeletonClasses } from '@/components/ui/SkeletonLoader';

interface Academy {
  id: string;
  name: string;
  description: string | null;
}

interface AcademyClass {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  academyName: string;
  teacherName: string;
  teacherId: string;
  teacherEmail: string;
  studentCount: number;
  enrollmentStatus: string | null; // null = not enrolled, 'PENDING', 'APPROVED'
}

export default function AcademyClassesPage() {
  const params = useParams();
  const router = useRouter();
  const academyId = params.academyId as string;
  
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [academyId]);

  const loadData = async () => {
    try {
      const [academiesRes, classesRes] = await Promise.all([
        apiClient('/explore/academies'),
        apiClient(`/explore/academies/${academyId}/classes`),
      ]);

      const [academiesResult, classesResult] = await Promise.all([
        academiesRes.json(),
        classesRes.json(),
      ]);

      if (academiesResult.success && Array.isArray(academiesResult.data)) {
        const foundAcademy = academiesResult.data.find((a: Academy) => a.id === academyId);
        setAcademy(foundAcademy || null);
      }

      if (classesResult.success && Array.isArray(classesResult.data)) {
        setClasses(classesResult.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
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
        alert('¡Te has inscrito exitosamente! Ahora puedes acceder a la clase.');
        router.push('/dashboard/student/classes');
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

  if (!academy) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Academia no encontrada</h2>
          <p className="text-gray-600 mb-6">La academia que buscas no existe o ha sido eliminada.</p>
          <Link
            href="/dashboard/student/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium"
          >
            ← Volver a Explorar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{academy.name}</h1>
          <p className="text-gray-600 text-sm mt-1">{academy.description || 'Selecciona una clase para solicitar inscripción'}</p>
        </div>
        <Link
          href="/dashboard/student/explore"
          className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Volver a Academias
        </Link>
      </div>

      <div className="grid gap-4">
        {classes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay clases disponibles</h3>
            <p className="text-gray-600">Esta academia aún no tiene clases publicadas.</p>
          </div>
        ) : (
          classes.map((classItem) => (
            <div key={classItem.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{classItem.name}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {classItem.studentCount} estudiantes
                    </span>
                  </div>
                  {classItem.description && (
                    <p className="text-gray-600 text-sm mb-4">{classItem.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">{classItem.teacherName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{classItem.teacherEmail}</span>
                    </div>
                  </div>
                </div>
                {classItem.enrollmentStatus === 'APPROVED' ? (
                  <span className="px-6 py-3 bg-green-100 text-green-700 rounded-lg font-medium text-sm border border-green-200">
                    ✓ Ya inscrito
                  </span>
                ) : classItem.enrollmentStatus === 'PENDING' ? (
                  <span className="px-6 py-3 bg-yellow-100 text-yellow-700 rounded-lg font-medium text-sm border border-yellow-200">
                    ⏳ Solicitud pendiente
                  </span>
                ) : (
                  <button
                    onClick={() => handleRequestClass(classItem.id)}
                    disabled={requesting === classItem.id}
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {requesting === classItem.id ? 'Solicitando...' : 'Solicitar Inscripción'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
