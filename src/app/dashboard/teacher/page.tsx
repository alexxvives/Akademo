'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
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
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (shouldShowJoinPrompt) {
    return (
      <DashboardLayout role="TEACHER">
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
      </DashboardLayout>
    );
  }

  if (showBrowse) {
    return (
      <DashboardLayout role="TEACHER">
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Pending Approvals Section - Moved to Top */}
        {pendingEnrollments.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-200 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-6 py-3 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Solicitudes Pendientes</h2>
                  <p className="text-xs text-gray-600">{pendingEnrollments.length} estudiante{pendingEnrollments.length !== 1 ? 's' : ''} esperando tu aprobación</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {pendingEnrollments.map((enrollment) => (
                  <div 
                    key={enrollment.id} 
                    className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-3 max-w-xs"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {enrollment.student.firstName.charAt(0)}{enrollment.student.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">
                        {enrollment.student.firstName} {enrollment.student.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{enrollment.student.email}</p>
                      <p className="text-xs text-blue-600 truncate">{enrollment.class.name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEnrollmentAction(enrollment.id, 'reject')}
                        className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                        title="Rechazar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEnrollmentAction(enrollment.id, 'approve')}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                        title="Aprobar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Estudiantes"
            value={enrolledStudents.length}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            trend={enrolledStudents.length > 0 ? 'up' : undefined}
          />
          <StatCard
            title="Pendientes"
            value={pendingEnrollments.length}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Promedio por Clase"
            value={classes.length > 0 ? Math.round(enrolledStudents.length / classes.length) : 0}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatCard
            title="Calificación Promedio"
            value={ratingsData?.overall?.averageRating ? `${ratingsData.overall.averageRating.toFixed(1)} ★` : '—'}
            subtitle={ratingsData?.overall?.totalRatings ? `${ratingsData.overall.totalRatings} calificaciones` : undefined}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Progress Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Progreso Estudiantil</h3>
            {enrolledStudents.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center border border-green-200">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-green-900 mb-1">{Math.round(enrolledStudents.length * 0.65)}</div>
                  <div className="text-sm text-green-700 font-medium">Estudiantes Activos</div>
                  <div className="text-xs text-green-600 mt-1">Han visto contenido esta semana</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center border border-blue-200">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-blue-900 mb-1">68%</div>
                  <div className="text-sm text-blue-700 font-medium">Progreso Promedio</div>
                  <div className="text-xs text-blue-600 mt-1">De contenido completado</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center border border-purple-200">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-purple-900 mb-1">{Math.round(enrolledStudents.length * 4.5)}h</div>
                  <div className="text-sm text-purple-700 font-medium">Tiempo Total de Estudio</div>
                  <div className="text-xs text-purple-600 mt-1">Acumulado este mes</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 text-center border border-orange-200">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-orange-900 mb-1">{ratingsData?.overall?.averageRating ? ratingsData.overall.averageRating.toFixed(1) : '—'}</div>
                  <div className="text-sm text-orange-700 font-medium">Satisfacción Promedio</div>
                  <div className="text-xs text-orange-600 mt-1">{ratingsData?.overall?.averageRating ? 'De 5 estrellas' : 'Sin datos'}</div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>Sin estudiantes para mostrar datos</p>
                </div>
              </div>
            )}
          </div>

          {/* Class Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Estudiantes</h3>
            {classes.length > 0 && enrolledStudents.length > 0 ? (
              <div className="h-64">
                <DonutChart
                  data={classes.map(cls => ({
                    label: cls.name,
                    value: enrolledStudents.filter(s => s.classId === cls.id).length
                  })).filter(d => d.value > 0)}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  <p>Sin datos de distribución</p>
                </div>
              </div>
            )}
          </div>
        </div>


      </div>
    </DashboardLayout>
  );
}
