'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { formatDuration, formatDate } from '@/lib/formatters';
import { generateDemoStudents, generateDemoClasses } from '@/lib/demo-data';

interface StudentProgress {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  classCount: number;
  lessonsCompleted: number;
  totalLessons: number;
  totalWatchTime: number;
  averageProgress: number;
  lastActivity: string | null;
}

export default function StudentProgressPage() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      // Check if teacher is in a demo (NOT PAID) academy
      const academyRes = await apiClient('/teacher/academy');
      if (academyRes.ok) {
        const academyResult = await academyRes.json();
        const name = academyResult.data?.academy?.name || '';
        const status = academyResult.data?.academy?.paymentStatus || 'PAID';
        setAcademyName(name);

        if (status === 'NOT PAID') {
          // Use shared demo data (same source as academy dashboard)
          const demoStudentsRaw = generateDemoStudents();
          const demoClasses = generateDemoClasses();
          const classNameToId: Record<string, string> = {
            'Programación Web': 'demo-c1',
            'Matemáticas Avanzadas': 'demo-c2',
            'Física Cuántica': 'demo-c4',
            'Diseño Gráfico': 'demo-c3',
          };
          // Aggregate students across classes
          const studentMap = new Map<string, StudentProgress>();
          for (const s of demoStudentsRaw) {
            const classId = classNameToId[s.className] || 'demo-c1';
            const key = s.email;
            const existing = studentMap.get(key);
            const lessonsCompleted = Math.floor(Math.random() * 5) + 2;
            const totalLessons = 10;
            if (existing) {
              existing.classCount += 1;
              existing.lessonsCompleted += lessonsCompleted;
              existing.totalLessons += totalLessons;
              existing.totalWatchTime += Math.floor(Math.random() * 3600) + 600;
              existing.averageProgress = Math.round((existing.lessonsCompleted / existing.totalLessons) * 100);
              if (s.lastLoginAt && (!existing.lastActivity || s.lastLoginAt > existing.lastActivity)) {
                existing.lastActivity = s.lastLoginAt;
              }
            } else {
              const watchTime = Math.floor(Math.random() * 3600) + 600;
              studentMap.set(key, {
                id: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
                email: s.email,
                classCount: 1,
                lessonsCompleted,
                totalLessons,
                totalWatchTime: watchTime,
                averageProgress: Math.round((lessonsCompleted / totalLessons) * 100),
                lastActivity: s.lastLoginAt,
              });
            }
          }
          // Deduplicate by email (same as academy does)
          setStudents(Array.from(studentMap.values()).slice(0, 60));
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fallback: try getting academy name from requests
      try {
        const response = await apiClient('/requests/teacher');
        const result = await response.json();
        if (Array.isArray(result) && result.length > 0) {
          setAcademyName(result[0].academyName);
        }
      } catch { /* ignore */ }
    }

    // Load real student progress
    try {
      const response = await apiClient('/students/progress');
      const result = await response.json();
      if (result.success) {
        setStudents(result.data);
      }
    } catch (error) {
      console.error('Error loading student progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateWithFallback = (date: string | null) => formatDate(date, 'Sin actividad');

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return 'from-green-500 to-emerald-600';
    if (progress >= 50) return 'from-blue-500 to-indigo-600';
    if (progress >= 25) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  const getProgressBg = (progress: number): string => {
    if (progress >= 80) return 'from-green-50 to-emerald-50';
    if (progress >= 50) return 'from-blue-50 to-indigo-50';
    if (progress >= 25) return 'from-yellow-50 to-orange-50';
    return 'from-red-50 to-rose-50';
  };

  const getProgressBorder = (progress: number): string => {
    if (progress >= 80) return 'border-green-200';
    if (progress >= 50) return 'border-blue-200';
    if (progress >= 25) return 'border-orange-200';
    return 'border-red-200';
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Progreso de Estudiantes</h1>
          {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
        </div>

        {/* Students Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"> 
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay estudiantes</h3>
            <p className="text-gray-500">Los estudiantes aparecerán aquí cuando se inscriban en tus clases</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"> 
            {students.map((student) => (
              <div
                key={student.id}
                className={`bg-gradient-to-br ${getProgressBg(student.averageProgress)} rounded-2xl border-2 ${getProgressBorder(student.averageProgress)} p-6 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300`}
              >
                {/* Student Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{student.firstName} {student.lastName}</h3>
                    <p className="text-xs text-gray-600">{student.email}</p>
                  </div>
                </div>

                {/* Progress Circle */}
                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-20 h-20 sm:w-28 sm:h-28">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="50"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="50"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - student.averageProgress / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" className={`text-${getProgressColor(student.averageProgress).split('-')[1]}-500`} stopColor="currentColor" />
                          <stop offset="100%" className={`text-${getProgressColor(student.averageProgress).split('-')[3]}-600`} stopColor="currentColor" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{Math.round(student.averageProgress)}%</p>
                        <p className="text-[10px] text-gray-600 font-medium">Progreso</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-xs text-gray-600 font-medium">Clases</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{student.classCount}</p>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-600 font-medium">Completadas</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{student.lessonsCompleted}<span className="text-sm text-gray-500">/{student.totalLessons}</span></p>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-600 font-medium">Tiempo</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatDuration(student.totalWatchTime)}</p>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-600 font-medium">Última</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700">{formatDateWithFallback(student.lastActivity)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span className="font-medium">Progreso General</span>
                    <span className="font-bold text-gray-900">{Math.round(student.averageProgress)}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getProgressColor(student.averageProgress)} rounded-full transition-all duration-1000`}
                      style={{ width: `${student.averageProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
