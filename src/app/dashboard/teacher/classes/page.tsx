'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Class {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  studentCount: number;
  lessonCount: number;
  videoCount: number;
  documentCount: number;
  createdAt: string;
}

export default function TeacherClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const result = await res.json();
      if (result.success) {
        setClasses(result.data || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Clases</h1>
            <p className="text-gray-500 mt-1">Gestiona tus clases y contenido</p>
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes clases</h3>
            <p className="text-gray-500">Las clases son asignadas por tu academia. Contacta con el administrador de tu academia para que te asigne clases.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/dashboard/teacher/class/${cls.slug || cls.id}`}
                className="block bg-white rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:shadow-xl transition-all p-6 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">{cls.name}</h3>
                    {cls.description ? (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic mb-4">Sin descripción</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="font-semibold text-gray-700">{cls.studentCount}</span> Estudiante{cls.studentCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="font-semibold text-gray-700">{cls.lessonCount}</span> Lección{cls.lessonCount !== 1 ? 'es' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold text-gray-700">{cls.videoCount}</span> Video{cls.videoCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-semibold text-gray-700">{cls.documentCount}</span> Documento{cls.documentCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Creada el {new Date(cls.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
