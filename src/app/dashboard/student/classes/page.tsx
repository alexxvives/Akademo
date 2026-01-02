'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Academy {
  id: string;
  name: string;
  description: string | null;
  ownerName: string;
  teacherCount: number;
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
}

interface EnrolledClass {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  academyName: string;
  videoCount: number;
  documentCount: number;
  lessonCount: number;
  studentCount: number;
  createdAt: string;
  enrollmentStatus?: 'PENDING' | 'APPROVED';
}

interface ActiveStream {
  id: string;
  classId: string;
  title: string;
  zoomLink: string;
  className: string;
  teacherName: string;
}

export default function StudentDashboard() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
  const [academyClasses, setAcademyClasses] = useState<AcademyClass[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [activeStreams, setActiveStreams] = useState<ActiveStream[]>([]);
  const [showBrowse, setShowBrowse] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Poll for active streams every 10 seconds
    const interval = setInterval(() => {
      fetch('/api/live/active')
        .then(res => res.json())
        .then(result => {
          if (result.success && Array.isArray(result.data)) {
            setActiveStreams(result.data);
          }
        })
        .catch(err => console.error('Failed to check streams:', err));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [academiesRes, classesRes, streamsRes] = await Promise.all([
        fetch('/api/explore/academies'),
        fetch('/api/classes'),
        fetch('/api/live/active'),
      ]);

      const [academiesResult, classesResult, streamsResult] = await Promise.all([
        academiesRes.json(),
        classesRes.json(),
        streamsRes.json(),
      ]);

      if (Array.isArray(academiesResult)) {
        setAcademies(academiesResult);
      }

      if (classesResult.success && Array.isArray(classesResult.data)) {
        setEnrolledClasses(classesResult.data.map((c: any) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description,
          academyName: c.academy?.name || 'Unknown',
          videoCount: c._count?.videos || 0,
          documentCount: c._count?.documents || 0,
          lessonCount: c._count?.lessons || 0,
          studentCount: c._count?.enrollments || 0,
          createdAt: c.createdAt,
          enrollmentStatus: c.enrollmentStatus || 'APPROVED',
        })));
      }

      if (streamsResult.success && Array.isArray(streamsResult.data)) {
        setActiveStreams(streamsResult.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAcademyClasses = async (academyId: string) => {
    try {
      const response = await fetch(`/api/explore/academies/${academyId}/classes`);
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setAcademyClasses(result.data);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const handleSelectAcademy = (academy: Academy) => {
    setSelectedAcademy(academy);
    loadAcademyClasses(academy.id);
  };

  const handleRequestClass = async (classId: string) => {
    try {
      const response = await fetch('/api/requests/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      });

      const result = await response.json();

      if (result.success) {
        alert('¡Solicitud enviada! El profesor la revisará pronto.');
        setShowBrowse(false);
        setSelectedAcademy(null);
        loadData();
      } else {
        alert(result.error || 'Failed to send request');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const hasClasses = enrolledClasses.length > 0;

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!hasClasses && !showBrowse) {
    return (
      <>
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Join an Academy First</h2>
            <p className="text-gray-600 mb-8">
              You need to join an academy and enroll in classes to start learning.
            </p>
            <button
              onClick={() => setShowBrowse(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Academies
            </button>
          </div>
        </div>
      </>
    );
  }

  if (showBrowse) {
    if (selectedAcademy) {
      return (
        <>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedAcademy.name}</h1>
                <p className="text-gray-600 text-sm mt-1">{selectedAcademy.description || 'Selecciona una clase para solicitar inscripción'}</p>
              </div>
              <button
                onClick={() => setSelectedAcademy(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Volver a Academias
              </button>
            </div>

            <div className="grid gap-4">
              {academyClasses.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay clases disponibles</h3>
                  <p className="text-gray-600">Esta academia aún no tiene clases publicadas.</p>
                </div>
              ) : (
                academyClasses.map((classItem) => (
                  <div key={classItem.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gray-900 hover:shadow-lg transition-all">
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
                      <button
                        onClick={() => handleRequestClass(classItem.id)}
                        className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-all"
                      >
                        Solicitar Inscripción
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Explorar Academias</h1>
            <button
              onClick={() => setShowBrowse(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Volver
            </button>
          </div>

          <div className="grid gap-4">
            {academies.map((academy) => (
              <div key={academy.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{academy.name}</h3>
                    {academy.description && (
                      <p className="text-gray-600 text-sm mb-2">{academy.description}</p>
                    )}
                    <p className="text-gray-500 text-sm">{academy.teacherCount} teachers</p>
                  </div>
                  <button
                    onClick={() => handleSelectAcademy(academy)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm"
                  >
                    Ver Clases
                  </button>
                </div>
              </div>
            ))}
          </div>
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
          </div>
          <button
            onClick={() => setShowBrowse(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Join More Classes
          </button>
        </div>

        <div className="space-y-4">
          {enrolledClasses.map((classItem) => {
            const liveStream = activeStreams.find(s => s.classId === classItem.id);
            return (
              <Link
                key={classItem.id}
                href={`/dashboard/student/class/${classItem.slug || classItem.id}`}
                className="block bg-white rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:shadow-xl transition-all p-6 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{classItem.name}</h3>
                      {liveStream && (
                        <span className="flex items-center gap-1.5 text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold border border-red-200">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          EN VIVO
                        </span>
                      )}
                      {classItem.enrollmentStatus === 'PENDING' && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-semibold border border-yellow-200">
                          Pendiente
                        </span>
                      )}
                    </div>
                    {classItem.description ? (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{classItem.description}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic mb-4">Sin descripción</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="font-semibold text-gray-700">{classItem.studentCount}</span> Estudiante{classItem.studentCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="font-semibold text-gray-700">{classItem.lessonCount}</span> Lección{classItem.lessonCount !== 1 ? 'es' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold text-gray-700">{classItem.videoCount}</span> Video{classItem.videoCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-semibold text-gray-700">{classItem.documentCount}</span> Documento{classItem.documentCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Creada el {new Date(classItem.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Arrow Icon */}
                  <div className="ml-4 flex items-center">
                    <div className="text-gray-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
