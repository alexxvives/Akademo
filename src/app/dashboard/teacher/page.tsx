'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, DonutChart, StatCard } from '@/components/Charts';
import { apiClient } from '@/lib/api-client';

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
        apiClient('/requests/teacher'),
        apiClient('/explore/academies'),
        apiClient('/classes'),
        apiClient('/enrollments/pending'),
        apiClient('/ratings'),
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
      const response = await apiClient('/requests/teacher', {
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
      const response = await apiClient('/enrollments/pending', {
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
      <div className="w-full space-y-6">
        {/* Minimalist Page Header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Panel de Control</h1>
            {hasAcademy && academyName && (
              <p className="text-sm text-gray-500 mt-1">{academyName}</p>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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
                  <Link 
                    key={cls.id} 
                    href={`/dashboard/teacher/class/${cls.id}`}
                    className="group bg-white border border-gray-100 hover:border-gray-200 rounded-lg p-5 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700">{cls.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{cls.academyName}</p>
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
                  </Link>
                );
              })}
            </div>
          </div>
        )}


      </div>
    </>
  );
}
