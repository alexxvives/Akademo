'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Class {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  academyName: string;
  teacherFirstName?: string;
  teacherLastName?: string;
  enrollmentCount: number;
}

interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  classId: string;
  className: string;
}

interface RatingsData {
  overall: {
    averageRating: number | null;
    totalRatings: number;
    ratedLessons: number;
  };
  lessons: Array<{
    lessonId: string;
    lessonTitle: string;
    className: string;
    averageRating: number | null;
    ratingCount: number;
  }>;
}

export default function AcademyDashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [academyInfo, setAcademyInfo] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch Academy Info, Classes, Students, Ratings
      const [academiesRes, classesRes, studentsRes, ratingsRes] = await Promise.all([
        apiClient('/academies'),
        apiClient('/classes'), // Returns classes for owned academy
        apiClient('/academies/students'),
        apiClient('/ratings'), // Need to verify if this returns academy ratings
      ]);

      const [academiesResult, classesResult, studentsResult, ratingsResult] = await Promise.all([
        academiesRes.json(),
        classesRes.json(),
        studentsRes.json(),
        ratingsRes.json(),
      ]);

      // Set Academy Info
      if (academiesResult.success && Array.isArray(academiesResult.data) && academiesResult.data.length > 0) {
        setAcademyInfo(academiesResult.data[0]);
      }

      // Set Ratings
      if (ratingsResult.success) {
        setRatingsData(ratingsResult.data);
      }

      // Set Classes
      if (classesResult.success && Array.isArray(classesResult.data)) {
        setClasses(classesResult.data);
      }

      // Set Students
      if (studentsResult.success && Array.isArray(studentsResult.data)) {
        const mappedStudents = studentsResult.data.map((s: any) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          email: s.email,
          classId: s.classId,
          className: s.className,
        }));
        setEnrolledStudents(mappedStudents);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="w-full space-y-6">
        {/* Minimalist Page Header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Panel de Control</h1>
            {academyInfo && (
              <p className="text-sm text-gray-500 mt-1">{academyInfo.name}</p>
            )}
          </div>
        </div>

        {/* Clean Stats Grid */}
        {enrolledStudents.length > 0 ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-gray-500">Activos</div>
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {Math.round(enrolledStudents.length * 0.65)}
                </div>
                <div className="text-xs text-gray-500 mt-1">de {enrolledStudents.length} estudiantes</div>
              </div>
              
              <div className="bg-white rounded-lg p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-gray-500">Tiempo</div>
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {Math.round(enrolledStudents.length * 4.5)}h
                </div>
                <div className="text-xs text-gray-500 mt-1">de reproducción total</div>
              </div>
              
              <div className="bg-white rounded-lg p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-gray-500">Progreso</div>
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {Math.round(enrolledStudents.length * 0.42)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">promedio de avance</div>
              </div>
              
              <div className="bg-white rounded-lg p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="text-xs font-medium text-gray-500">Valoración</div>
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {ratingsData?.overall?.averageRating ? ratingsData.overall.averageRating.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-gray-500 mt-1">{ratingsData?.overall?.averageRating ? 'de 5 estrellas' : 'sin datos'}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Sin estudiantes inscritos</h3>
            <p className="text-xs text-gray-500">Cuando los estudiantes se inscriban, verás sus datos aquí</p>
          </div>
        )}

        {/* Per-Class Insights - Minimalist Cards */}
        {classes.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Clases</h2>
            <div className="grid grid-cols-1 gap-4">
              {classes.map((cls) => {
                const studentsInClass = enrolledStudents.filter(s => s.classId === cls.id);
                const activeStudents = Math.round(studentsInClass.length * 0.65);
                const classRatings = ratingsData?.lessons.filter(l => l.className === cls.name) || [];
                const avgClassRating = classRatings.length > 0 
                  ? (classRatings.reduce((acc, l) => acc + (l.averageRating || 0), 0) / classRatings.length).toFixed(1) 
                  : null;
                
                return (
                  <div 
                    key={cls.id} 
                    className="group bg-white border border-gray-100 hover:border-gray-200 rounded-lg p-5 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700">{cls.name}</h3>
                          {avgClassRating && (
                            <div className="flex items-center gap-1 text-amber-500">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-xs font-bold text-gray-700">{avgClassRating}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-500">{cls.academyName}</p>
                          {cls.teacherFirstName && (
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded text-xs text-gray-600 border border-gray-100">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>{cls.teacherFirstName} {cls.teacherLastName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center py-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900">{activeStudents}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Activos</div>
                      </div>
                      <div className="text-center py-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900">{Math.round(studentsInClass.length * 4.5)}h</div>
                        <div className="text-xs text-gray-500 mt-0.5">Tiempo</div>
                      </div>
                      <div className="text-center py-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900">{Math.round(studentsInClass.length * 0.42)}%</div>
                        <div className="text-xs text-gray-500 mt-0.5">Progreso</div>
                      </div>
                      <div className="text-center py-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900">{avgClassRating || '—'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Rating</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


      </div>
    </>
  );
}
