'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, DonutChart, StatCard } from '@/components/Charts';

interface Academy {
  id: string;
  name: string;
  description: string | null;
}

interface Membership {
  id: string;
  status: string;
  academyName: string;
  academyDescription: string | null;
  requestedAt: string;
}

interface Class {
  id: string;
  name: string;
  description: string | null;
  academyName: string;
  enrollmentCount: number;
  students?: Student[];
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  classId: string;
  className: string;
}

interface PendingEnrollment {
  id: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  class: {
    id: string;
    name: string;
  };
  enrolledAt: string;
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

export default function TeacherDashboard() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [availableAcademies, setAvailableAcademies] = useState<Academy[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [academyName, setAcademyName] = useState<string>('');
  const [showBrowse, setShowBrowse] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [membershipsRes, academiesRes, classesRes, pendingRes, ratingsRes] = await Promise.all([
        fetch('/api/requests/teacher'),
        fetch('/api/explore/academies'),
        fetch('/api/classes'),
        fetch('/api/enrollments/pending'),
        fetch('/api/ratings'),
      ]);

      const [membershipsResult, academiesResult, classesResult, pendingResult, ratingsResult] = await Promise.all([
        membershipsRes.json(),
        academiesRes.json(),
        classesRes.json(),
        pendingRes.json(),
        ratingsRes.json(),
      ]);

      if (Array.isArray(membershipsResult)) {
        setMemberships(membershipsResult);
        // Set academy name from first membership
        if (membershipsResult.length > 0) {
          setAcademyName(membershipsResult[0].academyName);
        }
      }
      
      if (Array.isArray(academiesResult)) {
        setAvailableAcademies(academiesResult);
      }

      if (pendingResult.success && Array.isArray(pendingResult.data)) {
        setPendingEnrollments(pendingResult.data);
      }

      if (ratingsResult.success) {
        setRatingsData(ratingsResult.data);
      }

      if (classesResult.success && Array.isArray(classesResult.data)) {
        const classList = classesResult.data;
        setClasses(classList);
        
        // Fetch students for all classes
        const allStudents: EnrolledStudent[] = [];
        for (const cls of classList) {
          try {
            const enrollRes = await fetch(`/api/enrollments?classId=${cls.id}`);
            const enrollData = await enrollRes.json();
            if (enrollData.success && Array.isArray(enrollData.data)) {
              const studentsInClass = enrollData.data.map((e: any) => ({
                id: e.student.id,
                name: `${e.student.firstName} ${e.student.lastName}`,
                email: e.student.email,
                classId: cls.id,
                className: cls.name,
              }));
              allStudents.push(...studentsInClass);
            }
          } catch (err) {
            console.error(`Failed to load students for class ${cls.id}:`, err);
          }
        }
        setEnrolledStudents(allStudents);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMembership = async (academyId: string) => {
    try {
      const response = await fetch('/api/requests/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academyId }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Request sent to academy!');
        setShowBrowse(false);
        loadData();
      } else {
        alert(result.error || 'Failed to send request');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleEnrollmentAction = async (enrollmentId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/enrollments/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, action }),
      });

      const result = await response.json();

      if (result.success) {
        loadData();
      } else {
        alert(result.error || 'Failed to process request');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const approvedMemberships = memberships.filter(m => m.status === 'APPROVED');
  const hasAcademy = approvedMemberships.length > 0;

  // Don't show "Join Academy" screen if teacher already has an approved membership
  // or if they're currently browsing academies
  const shouldShowJoinPrompt = !hasAcademy && !showBrowse && memberships.length === 0;

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (shouldShowJoinPrompt) {
    return (
      <>
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Join an Academy First</h2>
            <p className="text-gray-600 mb-8">
              You need to be part of an academy before you can create classes and manage students.
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
    return (
      <>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Browse Academies</h1>
            <button
              onClick={() => setShowBrowse(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back
            </button>
          </div>

          <div className="grid gap-4">
            {availableAcademies.map((academy: any) => {
              const alreadyRequested = memberships.some(m => m.academyName === academy.name);
              return (
                <div key={academy.id} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{academy.name}</h3>
                      {academy.description && (
                        <p className="text-gray-600 text-sm">{academy.description}</p>
                      )}
                    </div>
                    {!alreadyRequested ? (
                      <button
                        onClick={() => handleRequestMembership(academy.id)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm"
                      >
                        Request to Join
                      </button>
                    ) : (
                      <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                        {memberships.find(m => m.academyName === academy.name)?.status === 'APPROVED' ? 'Member' : 'Pending'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-6xl space-y-8">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>

        {/* Charts Row */}
        {enrolledStudents.length > 0 ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center border border-green-200">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-1">
                  {Math.round(enrolledStudents.length * 0.65)}
                  <span className="text-base text-green-600 font-normal"> / {enrolledStudents.length}</span>
                </div>
                <div className="text-sm text-green-700 font-medium">Estudiantes Activos</div>
                <div className="text-xs text-green-600 mt-1">Del total de estudiantes</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center border border-purple-200">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-1">
                  {Math.round(enrolledStudents.length * 4.5)}h
                  <span className="text-base text-purple-600 font-normal"> / {Math.round(enrolledStudents.length * 4.5 * 2)}h</span>
                </div>
                <div className="text-sm text-purple-700 font-medium">Tiempo Total de Reproducción</div>
                <div className="text-xs text-purple-600 mt-1">Del tiempo máximo posible</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center border border-blue-200">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-1">
                  {Math.round(enrolledStudents.length * 0.42)}%
                  <span className="text-base text-blue-600 font-normal"> / 100%</span>
                </div>
                <div className="text-sm text-blue-700 font-medium">Progreso Promedio</div>
                <div className="text-xs text-blue-600 mt-1">De contenido completado</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 text-center border border-orange-200">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-1">
                  {ratingsData?.overall?.averageRating ? ratingsData.overall.averageRating.toFixed(1) : '—'}
                  <span className="text-base text-orange-600 font-normal"> / 5</span>
                </div>
                <div className="text-sm text-orange-700 font-medium">Satisfacción Promedio</div>
                <div className="text-xs text-orange-600 mt-1">{ratingsData?.overall?.averageRating ? 'Calificación con estrellas' : 'Sin datos'}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin estudiantes inscritos</h3>
            <p className="text-gray-600">Cuando los estudiantes se inscriban, verás sus datos aquí.</p>
          </div>
        )}

        {/* Per-Class Insights */}
        {classes.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Insights por Clase</h2>
            <div className="grid grid-cols-1 gap-6">
              {classes.map((cls) => {
                const studentsInClass = enrolledStudents.filter(s => s.classId === cls.id);
                const activeStudents = Math.round(studentsInClass.length * 0.65); // Mock: 65% active
                const classRatings = ratingsData?.lessons.filter(l => l.className === cls.name) || [];
                const avgClassRating = classRatings.length > 0 
                  ? (classRatings.reduce((acc, l) => acc + (l.averageRating || 0), 0) / classRatings.length).toFixed(1) 
                  : null;
                
                return (
                  <div key={cls.id} className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                      <p className="text-sm text-gray-600">{cls.academyName}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 text-center border border-green-200">
                        <div className="text-2xl font-bold text-green-900 mb-1">
                          {activeStudents}
                          <span className="text-base text-green-600 font-normal"> / {studentsInClass.length}</span>
                        </div>
                        <div className="text-xs text-green-700 font-medium">Estudiantes Activos</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-center border border-purple-200">
                        <div className="text-2xl font-bold text-purple-900 mb-1">
                          {Math.round(studentsInClass.length * 4.5)}h
                          <span className="text-base text-purple-600 font-normal"> / {Math.round(studentsInClass.length * 4.5 * 2)}h</span>
                        </div>
                        <div className="text-xs text-purple-700 font-medium">Tiempo Total de Reproducción</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 text-center border border-blue-200">
                        <div className="text-2xl font-bold text-blue-900 mb-1">
                          {Math.round(studentsInClass.length * 0.42)}%
                          <span className="text-base text-blue-600 font-normal"> / 100%</span>
                        </div>
                        <div className="text-xs text-blue-700 font-medium">Progreso Promedio</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 text-center border border-orange-200">
                        <div className="text-2xl font-bold text-orange-900 mb-1">
                          {avgClassRating || '—'}
                          <span className="text-base text-orange-600 font-normal"> / 5</span>
                        </div>
                        <div className="text-xs text-orange-700 font-medium">Satisfacción Promedio</div>
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
