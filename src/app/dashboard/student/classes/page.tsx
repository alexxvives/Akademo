'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

export default function StudentClassesPage() {
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [activeStreams, setActiveStreams] = useState<ActiveStream[]>([]);
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
      const [classesRes, streamsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/live/active'),
      ]);

      const [classesResult, streamsResult] = await Promise.all([
        classesRes.json(),
        streamsRes.json(),
      ]);

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

  const hasClasses = enrolledClasses.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasClasses) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Únete a una Academia</h2>
          <p className="text-gray-600 mb-8">
            Necesitas unirte a una academia e inscribirte en clases para comenzar a aprender.
          </p>
          <Link
            href="/dashboard/student/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Explorar Academias
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Clases</h1>
        </div>
        <Link
          href="/dashboard/student/explore"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Unirse a Más Clases
        </Link>
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
  );
}
