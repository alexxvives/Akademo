'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Teacher {
  id: string;
  name: string;
  email: string;
  academyId: string;
  academyName: string;
  classCount: number;
  studentCount: number;
}

interface Class {
  id: number;
  name: string;
  description: string;
  teacherName: string | null;
  teacherEmail: string | null;
  studentCount: number;
  videoCount: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
  classCount: number;
}

interface Stats {
  totalTeachers: number;
  totalClasses: number;
  totalStudents: number;
}

export default function AcademyDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ totalTeachers: 0, totalClasses: 0, totalStudents: 0 });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'teachers' | 'classes' | 'students'>('overview');
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [teacherForm, setTeacherForm] = useState({ email: '', firstName: '', lastName: '', password: '' });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/?modal=login');
        return;
      }
      
      const result = await res.json();
      if (!result.success || !result.data) {
        router.push('/?modal=login');
        return;
      }

      if (result.data.role !== 'ACADEMY' && result.data.role !== 'ADMIN') {
        router.push('/dashboard/' + result.data.role.toLowerCase());
        return;
      }

      await loadData();
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/?modal=login');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load teachers, classes, and students
      const [teachersRes, classesRes, studentsRes] = await Promise.all([
        fetch('/api/academies/teachers'),
        fetch('/api/academies/classes'),
        fetch('/api/academies/students')
      ]);
      
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData);
      }

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData);
      }

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }
      
      // Calculate stats from loaded data
      const totalTeachers = teachers.length;
      const totalClasses = classes.length;
      const totalStudents = students.length;
      
      setStats({
        totalTeachers,
        totalClasses,
        totalStudents
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/create-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherForm),
      });
      const data = await res.json();
      if (data.success) {
        alert('Profesor creado exitosamente');
        setTeacherForm({ email: '', firstName: '', lastName: '', password: '' });
        setShowCreateTeacher(false);
        await loadData(); // Reload teachers
      } else {
        alert(data.error || 'Failed to create teacher');
      }
    } catch (error) {
      alert('Error creating teacher');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ACADEMO</h1>
              <p className="text-sm text-gray-500">Panel de Academia</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profesores</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Clases</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estudiantes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Vista General
              </button>
              <button
                onClick={() => setActiveTab('teachers')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'teachers'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profesores
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'classes'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Todas las Clases
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'students'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Estudiantes
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Estructura de la Academia</h2>
                
                {classes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No hay clases aún. Los profesores pueden crear clases desde su dashboard.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {classes.map((cls) => {
                      const classTeachers = teachers.filter(t => t.classCount > 0);
                      const classStudents = students.filter(s => s.classCount > 0);
                      
                      return (
                        <div key={cls.id} className="border border-gray-300 rounded-lg overflow-hidden">
                          {/* Class Header */}
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-blue-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                  {cls.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-lg">{cls.name}</h3>
                                <p className="text-sm text-gray-600">{cls.description}</p>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="px-3 py-1 bg-white rounded-full border border-blue-300 text-blue-700 font-medium">
                                  {cls.studentCount || 0} estudiantes
                                </span>
                                <span className="px-3 py-1 bg-white rounded-full border border-blue-300 text-blue-700 font-medium">
                                  {cls.videoCount || 0} videos
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Teacher Section */}
                          <div className="bg-gray-50 p-4 border-b border-gray-200">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700 mb-1">Profesor</p>
                                {cls.teacherName ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{cls.teacherName}</span>
                                    <span className="text-sm text-gray-500">({cls.teacherEmail})</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500 italic">Sin asignar</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Students Section */}
                          {cls.studentCount > 0 && (
                            <div className="bg-white p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-700">Estudiantes inscritos</p>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pl-8">
                                {classStudents.slice(0, 8).map((student) => (
                                  <div key={student.id} className="text-xs bg-gray-50 rounded px-2 py-1 truncate" title={student.email}>
                                    {student.name}
                                  </div>
                                ))}
                                {classStudents.length > 8 && (
                                  <div className="text-xs text-gray-500 px-2 py-1">
                                    +{classStudents.length - 8} más
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'teachers' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Profesores</h2>
                  <button
                    onClick={() => { setShowCreateTeacher(true); setCreatedPassword(null); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    + Crear Profesor
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teachers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No hay profesores aún. Crea uno para empezar.
                    </div>
                  ) : (
                    teachers.map((teacher) => (
                      <div key={teacher.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-semibold text-sm">
                              {teacher.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{teacher.name}</h3>
                            <p className="text-sm text-gray-500 truncate">{teacher.email}</p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                              <span>{teacher.classCount || 0} clases</span>
                              <span>{teacher.studentCount || 0} estudiantes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {teachers.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No hay profesores registrados</p>
                )}
              </div>
            )}

            {activeTab === 'classes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Todas las Clases</h2>
                </div>
                <div className="space-y-3">
                  {classes.map((cls) => (
                    <div key={cls.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-900 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {cls.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{cls.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{cls.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Profesor: {cls.teacherName || 'Sin asignar'}</span>
                            <span>•</span>
                            <span>{cls.studentCount || 0} estudiantes</span>
                            <span>•</span>
                            <span>{cls.videoCount || 0} videos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {classes.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No hay clases disponibles</p>
                )}
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Estudiantes</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => (
                    <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 font-semibold text-sm">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{student.name}</h3>
                          <p className="text-sm text-gray-500 truncate">{student.email}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            <span>{student.classCount || 0} clases inscritas</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {students.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No hay estudiantes registrados</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Teacher Modal */}
      {showCreateTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <form onSubmit={handleCreateTeacher}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Crear Profesor</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="profesor@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.firstName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.lastName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={teacherForm.password}
                    onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateTeacher(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
