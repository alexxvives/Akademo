'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Stats {
  totalTeachers: number;
  totalClasses: number;
  totalStudents: number;
  totalLessons: number;
}

interface AcademyInfo {
  name: string;
}

export default function AcademyDashboard() {
  const [stats, setStats] = useState<Stats>({ 
    totalTeachers: 0, 
    totalClasses: 0, 
    totalStudents: 0,
    totalLessons: 0 
  });
  const [academyInfo, setAcademyInfo] = useState<AcademyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [teachersRes, classesRes, studentsRes, lessonsRes, academyRes] = await Promise.all([
        apiClient('/academies/teachers'),
        apiClient('/academies/classes'),
        apiClient('/academies/students'),
        apiClient('/lessons'),
        apiClient('/academies')
      ]);
      
      const teachers = teachersRes.ok ? await teachersRes.json() : [];
      const classes = classesRes.ok ? await classesRes.json() : [];
      const students = studentsRes.ok ? await studentsRes.json() : [];
      const lessons = lessonsRes.ok ? (await lessonsRes.json()).data || [] : [];
      
      if (academyRes.ok) {
        const academyData = await academyRes.json();
        if (academyData.success && academyData.data && academyData.data.length > 0) {
          setAcademyInfo({ name: academyData.data[0].name });
        }
      }
      
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
      <div className="w-full space-y-6">
        {/* Minimalist Page Header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Panel de Control</h1>
            {academyInfo?.name && (
              <p className="text-sm text-gray-500 mt-1">{academyInfo.name}</p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Clean Stats Grid */}
            {stats.totalStudents > 0 ? (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="text-xs font-medium text-gray-500">Profesores</div>
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalTeachers}</div>
                    <div className="text-xs text-gray-500 mt-1">en la academia</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="text-xs font-medium text-gray-500">Clases</div>
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalClasses}</div>
                    <div className="text-xs text-gray-500 mt-1">activas</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="text-xs font-medium text-gray-500">Estudiantes</div>
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</div>
                    <div className="text-xs text-gray-500 mt-1">inscritos</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                      </div>
                      <div className="text-xs font-medium text-gray-500">Lecciones</div>
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalLessons}</div>
                    <div className="text-xs text-gray-500 mt-1">disponibles</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Bienvenido a tu academia</h3>
                <p className="text-xs text-gray-500">Comienza invitando profesores para empezar a crear clases</p>
              </div>
            )}

            {/* Quick Access Links */}
            {stats.totalStudents > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acceso Rápido</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link 
                    href="/dashboard/academy/teachers" 
                    className="group bg-white border border-gray-100 hover:border-gray-200 rounded-lg p-5 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700">Profesores</h3>
                    <p className="text-xs text-gray-500 mt-1">Gestiona tu equipo de {stats.totalTeachers} profesores</p>
                  </Link>

                  <Link 
                    href="/dashboard/academy/classes" 
                    className="group bg-white border border-gray-100 hover:border-gray-200 rounded-lg p-5 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700">Clases</h3>
                    <p className="text-xs text-gray-500 mt-1">Administra las {stats.totalClasses} clases activas</p>
                  </Link>

                  <Link 
                    href="/dashboard/academy/requests" 
                    className="group bg-white border border-gray-100 hover:border-gray-200 rounded-lg p-5 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700">Solicitudes</h3>
                    <p className="text-xs text-gray-500 mt-1">Revisa inscripciones pendientes</p>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
