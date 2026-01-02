'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalTeachers: number;
  totalClasses: number;
  totalStudents: number;
  totalLessons: number;
}

export default function AcademyDashboard() {
  const [stats, setStats] = useState<Stats>({ 
    totalTeachers: 0, 
    totalClasses: 0, 
    totalStudents: 0,
    totalLessons: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [teachersRes, classesRes, studentsRes, lessonsRes] = await Promise.all([
        fetch('/api/academies/teachers'),
        fetch('/api/academies/classes'),
        fetch('/api/academies/students'),
        fetch('/api/lessons')
      ]);
      
      const teachers = teachersRes.ok ? await teachersRes.json() : [];
      const classes = classesRes.ok ? await classesRes.json() : [];
      const students = studentsRes.ok ? await studentsRes.json() : [];
      const lessons = lessonsRes.ok ? (await lessonsRes.json()).data || [] : [];
      
      setStats({
        totalTeachers: Array.isArray(teachers) ? teachers.length : teachers.data?.length || 0,
        totalClasses: Array.isArray(classes) ? classes.length : 0,
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalLessons: lessons.length
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">Resumen de tu academia</p>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/dashboard/academy/teachers" className="block">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-900 mb-1">{stats.totalTeachers}</div>
                  <div className="text-sm font-medium text-blue-700">Profesores</div>
                  <div className="text-xs text-blue-600 mt-1">Total en la academia</div>
                </div>
              </Link>

              <Link href="/dashboard/academy/classes" className="block">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-900 mb-1">{stats.totalClasses}</div>
                  <div className="text-sm font-medium text-purple-700">Clases</div>
                  <div className="text-xs text-purple-600 mt-1">Activas en la academia</div>
                </div>
              </Link>

              <Link href="/dashboard/academy/students" className="block">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-900 mb-1">{stats.totalStudents}</div>
                  <div className="text-sm font-medium text-green-700">Estudiantes</div>
                  <div className="text-xs text-green-600 mt-1">Inscritos totales</div>
                </div>
              </Link>

              <Link href="/dashboard/academy/lessons" className="block">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-orange-900 mb-1">{stats.totalLessons}</div>
                  <div className="text-sm font-medium text-orange-700">Lecciones</div>
                  <div className="text-xs text-orange-600 mt-1">Contenido disponible</div>
                </div>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/dashboard/academy/requests"
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Solicitudes</div>
                    <div className="text-sm text-gray-600">Revisar inscripciones</div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/academy/streams"
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Streams</div>
                    <div className="text-sm text-gray-600">Clases en vivo</div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/academy/teachers"
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Profesores</div>
                    <div className="text-sm text-gray-600">Gestionar equipo</div>
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
