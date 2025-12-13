'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

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

export default function TeacherDashboard() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [availableAcademies, setAvailableAcademies] = useState<Academy[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [showBrowse, setShowBrowse] = useState(false);
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({ email: '', firstName: '', lastName: '', classId: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [membershipsRes, academiesRes, classesRes] = await Promise.all([
        fetch('/api/requests/teacher'),
        fetch('/api/explore/academies'),
        fetch('/api/classes'),
      ]);

      const [membershipsResult, academiesResult, classesResult] = await Promise.all([
        membershipsRes.json(),
        academiesRes.json(),
        classesRes.json(),
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

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/create-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Estudiante creado exitosamente.\nEmail: ${studentForm.email}\nContraseña: password`);
        setStudentForm({ email: '', firstName: '', lastName: '', classId: '' });
        setShowCreateStudent(false);
      } else {
        alert(data.error || 'Failed to create student');
      }
    } catch (error) {
      alert('Error creating student');
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
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header with Academy Branding */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            {academyName && (
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {academyName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Classes with Students */}
        {classes.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mis Clases</h2>
            <div className="space-y-6">
              {classes.map((cls) => {
                const classStudents = enrolledStudents.filter(s => s.classId === cls.id);
                return (
                  <div key={cls.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Class Header */}
                    <Link
                      href={`/dashboard/teacher/class/${cls.id}`}
                      className="block p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200 hover:from-purple-100 hover:to-purple-150 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{cls.name}</h3>
                          {cls.description && (
                            <p className="text-sm text-gray-600 mt-1">{cls.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{cls.academyName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-white rounded-full border border-purple-300 text-purple-700 text-sm font-medium">
                            {classStudents.length} estudiantes
                          </span>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>

                    {/* Students in Class */}
                    {classStudents.length > 0 && (
                      <div className="p-4 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {classStudents.map((student) => (
                            <div key={student.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-green-600 font-semibold text-xs">
                                    {student.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">{student.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {classStudents.length === 0 && (
                      <div className="p-4 bg-gray-50 text-center text-sm text-gray-500">
                        No hay estudiantes inscritos en esta clase
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Mis Estudiantes</h2>
            <button
              onClick={() => setShowCreateStudent(true)}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Estudiante
            </button>
          </div>

          {enrolledStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No hay estudiantes inscritos aún.</p>
              <p className="text-sm">Crea estudiantes y ellos podrán inscribirse en tus clases.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {enrolledStudents.length} estudiante{enrolledStudents.length !== 1 ? 's' : ''} inscrito{enrolledStudents.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {enrolledStudents.map((student) => (
                  <div key={`${student.id}-${student.classId}`} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 font-semibold text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{student.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{student.email}</p>
                        <p className="text-xs text-gray-400 mt-1 truncate">Clase: {student.className}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Crear Estudiante</h2>
              <button
                onClick={() => {
                  setShowCreateStudent(false);
                  setStudentForm({ email: '', firstName: '', lastName: '', classId: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="estudiante@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={studentForm.firstName}
                  onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Juan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  value={studentForm.lastName}
                  onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Pérez"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> La contraseña del estudiante será: <strong>password</strong>
                </p>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
              >
                Crear Estudiante
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
