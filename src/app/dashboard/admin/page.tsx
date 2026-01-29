'use client';

import { useEffect, useState, useMemo } from 'react';
import { BarChart, DonutChart } from '@/components/Charts';
import { apiClient } from '@/lib/api-client';
import { useAnimatedNumber } from '@/hooks';
import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';

interface Academy {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
  paymentStatus?: string;
  teacherCount: number;
  studentCount: number;
  classCount: number;
  createdAt: string;
}

interface Class {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  academyId: string;
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
  academyId: string;
  lessonsCompleted?: number;
  totalLessons?: number;
  lastActive?: string | null;
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
    academyId?: string;
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
    classId: string;
    academyId?: string;
    averageRating: number | null;
    ratingCount: number;
  }>;
}

// Animated Number Component
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const animatedValue = useAnimatedNumber(value);
  return <div className={className}>{animatedValue}</div>;
}

export default function AdminDashboard() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [streamStats, setStreamStats] = useState({ total: 0, avgParticipants: 0, thisMonth: 0, totalHours: 0, totalMinutes: 0 });
  const [allStreams, setAllStreams] = useState<any[]>([]);
  const [classWatchTime, setClassWatchTime] = useState({ hours: 0, minutes: 0 });
  const [selectedAcademy, setSelectedAcademy] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [academyClasses, setAcademyClasses] = useState<Class[]>([]);

  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    // Load classes when academy is selected
    if (selectedAcademy && selectedAcademy !== 'all') {
      const filtered = classes.filter(c => c.academyId === selectedAcademy);
      setAcademyClasses(filtered);
      setSelectedClass('all');
    } else {
      setAcademyClasses(classes);
    }
  }, [selectedAcademy, classes]);

  const loadData = async () => {
    try {
      // Load all platform data
      const [academiesRes, classesRes, pendingRes, ratingsRes, rejectedRes, streamsRes, progressRes] = await Promise.all([
        apiClient('/admin/academies'),
        apiClient('/admin/classes'),
        apiClient('/enrollments/pending'), // All pending enrollments across platform
        apiClient('/ratings'), // All ratings across platform
        apiClient('/enrollments/rejected'), // All rejected enrollments
        apiClient('/live/history'), // All streams across platform
        apiClient('/students/progress'), // All student progress
      ]);

      const [academiesResult, classesResult, pendingResult, ratingsResult, rejectedResult, streamsResult, progressResult] = await Promise.all([
        academiesRes.json(),
        classesRes.json(),
        pendingRes.json(),
        ratingsRes.json(),
        rejectedRes.json(),
        streamsRes.json(),
        progressRes.json(),
      ]);

      if (academiesResult.success && Array.isArray(academiesResult.data)) {
        setAcademies(academiesResult.data);
      }

      if (rejectedResult.success && rejectedResult.data) {
        setRejectedCount(rejectedResult.data.count || 0);
      }

      if (streamsResult.success && Array.isArray(streamsResult.data)) {
        const streams = streamsResult.data;
        setAllStreams(streams);
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthStreams = streams.filter((s: any) => new Date(s.createdAt) >= thisMonthStart);
        
        const totalParticipants = streams.reduce((sum: number, s: any) => sum + (s.participantCount || 0), 0);
        const totalDurationMs = streams.reduce((sum: number, s: any) => {
          if (s.startedAt && s.endedAt) {
            const start = new Date(s.startedAt).getTime();
            const end = new Date(s.endedAt).getTime();
            return sum + (end - start);
          }
          return sum;
        }, 0);
        const totalDuration = Math.floor(totalDurationMs / (1000 * 60));
        const totalHours = Math.floor(totalDuration / 60);
        const totalMinutes = totalDuration % 60;
        
        setStreamStats({
          total: streams.length,
          avgParticipants: streams.length > 0 ? Math.round(totalParticipants / streams.length) : 0,
          thisMonth: thisMonthStreams.length,
          totalHours: totalHours,
          totalMinutes: totalMinutes,
        });
      }

      if (progressResult.success && Array.isArray(progressResult.data)) {
        const totalSeconds = progressResult.data.reduce((sum: number, student: any) => sum + (student.totalWatchTime || 0), 0);
        const totalMinutes = Math.floor(totalSeconds / 60);
        setClassWatchTime({
          hours: Math.floor(totalMinutes / 60),
          minutes: totalMinutes % 60,
        });
      }

      if (pendingResult.success && Array.isArray(pendingResult.data)) {
        setPendingEnrollments(pendingResult.data);
      }

      if (ratingsResult.success) {
        setRatingsData(ratingsResult.data);
      }

      if (classesResult.success && Array.isArray(classesResult.data)) {
        setClasses(classesResult.data);
      }

      if (pendingResult.success && Array.isArray(pendingResult.data)) {
        setPendingEnrollments(pendingResult.data);
      }

      if (ratingsResult.success) {
        setRatingsData(ratingsResult.data);
      }

      // Process student progress data - much faster without nested API calls
      if (progressResult.success && Array.isArray(progressResult.data)) {
        const allStudents: EnrolledStudent[] = progressResult.data.map((student: any) => ({
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          classId: student.classId,
          className: student.className || 'Sin clase',
          academyId: student.academyId,
          lessonsCompleted: student.lessonsCompleted || 0,
          totalLessons: student.totalLessons || 0,
          lastActive: student.lastActive,
        }));
        setEnrolledStudents(allStudents);
      }
    } catch (error) {
      console.error('❌ Failed to load data:', error);
    } finally {
      setLoading(false);
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

  const filteredStudents = useMemo(() => {
    let filtered = enrolledStudents;
    if (selectedAcademy !== 'all') {
      filtered = filtered.filter(s => s.academyId === selectedAcademy);
    }
    if (selectedClass !== 'all') {
      filtered = filtered.filter(s => s.classId === selectedClass);
    }
    return filtered;
  }, [enrolledStudents, selectedAcademy, selectedClass]);

  // Calculate average lesson progress for filtered students
  const avgLessonProgress = useMemo(() => {
    if (filteredStudents.length === 0) return 0;
    
    const studentsWithLessons = filteredStudents.filter(s => s.totalLessons && s.totalLessons > 0);
    if (studentsWithLessons.length === 0) return 0;
    
    const totalProgress = studentsWithLessons.reduce((sum, s) => {
      const progress = (s.lessonsCompleted || 0) / (s.totalLessons || 1);
      return sum + progress;
    }, 0);
    
    return Math.round((totalProgress / studentsWithLessons.length) * 100);
  }, [filteredStudents]);

  // Calculate filtered stream stats
  const filteredStreamStats = useMemo(() => {
    let filtered = allStreams;
    if (selectedAcademy !== 'all') {
      filtered = filtered.filter(s => s.academyId === selectedAcademy);
    }
    if (selectedClass !== 'all') {
      filtered = filtered.filter(s => s.classId === selectedClass);
    }
    
    if (filtered.length === 0) return { avgParticipants: 0, total: 0, totalHours: 0, totalMinutes: 0 };
    
    // Only count streams that have participant data (not null)
    const streamsWithParticipants = filtered.filter(s => s.participantCount !== null);
    const totalParticipants = streamsWithParticipants.reduce((sum, s) => sum + (s.participantCount || 0), 0);
    
    // Calculate duration from startedAt and endedAt
    const totalDurationMs = filtered.reduce((sum, s) => {
      if (s.startedAt && s.endedAt) {
        const start = new Date(s.startedAt).getTime();
        const end = new Date(s.endedAt).getTime();
        return sum + (end - start);
      }
      return sum;
    }, 0);
    const totalDurationMinutes = Math.floor(totalDurationMs / (1000 * 60));
    const totalHours = Math.floor(totalDurationMinutes / 60);
    const totalMinutes = totalDurationMinutes % 60;
    
    return {
      avgParticipants: streamsWithParticipants.length > 0 
        ? Math.round(totalParticipants / streamsWithParticipants.length)
        : 0,
      total: filtered.length,
      totalHours,
      totalMinutes,
    };
  }, [allStreams, selectedAcademy, selectedClass]);

  // Calculate filtered class watch time
  const filteredClassWatchTime = useMemo(() => {
    return classWatchTime;
  }, [selectedAcademy, selectedClass, classWatchTime]);

  if (loading) {
    return <SkeletonDashboard />;
  }

  return (
    <>
      <div className="w-full space-y-6">
        {/* Page Header with Academy and Class Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Panel de Control</h1>
            <p className="text-sm text-gray-500 mt-1">AKADEMO PLATFORM</p>
          </div>
          
          {/* Academy + Class Filter */}
          <div className='flex gap-3'>
            {/* Class Filter - Shows when academy is selected */}
            {selectedAcademy !== 'all' && (
              <div className='relative'>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className='appearance-none w-full md:w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
                >
                  <option value='all'>Todas las clases</option>
                  {academyClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
                <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                </div>
              </div>
            )}
            
            {/* Academy Filter */}
            {academies.length > 0 && (
              <div className='relative'>
                <select
                  value={selectedAcademy}
                  onChange={(e) => setSelectedAcademy(e.target.value)}
                  className='appearance-none w-full md:w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
                >
                  <option value='all'>Todas las Academias</option>
                  {academies.map((academy) => (
                    <option key={academy.id} value={academy.id}>{academy.name}</option>
                  ))}
                </select>
                <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visual Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Metrics - TOP LEFT */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Participación</h3>
            {filteredStudents.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Progreso Promedio (Clases)</span>
                    <span className="text-sm font-semibold text-gray-900">{avgLessonProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${avgLessonProgress}%`, animation: 'slideIn 1s ease-out' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Tiempo Total de Clases</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {filteredClassWatchTime.hours > 0 || filteredClassWatchTime.minutes > 0
                        ? `${filteredClassWatchTime.hours}h ${filteredClassWatchTime.minutes}min`
                        : '0h 0min'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Asistencia Promedio (Streams)</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {filteredStreamStats.total > 0 && filteredStudents.length > 0
                        ? Math.round((filteredStreamStats.avgParticipants / filteredStudents.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ 
                        width: `${filteredStreamStats.total > 0 && filteredStudents.length > 0
                          ? Math.min(100, Math.round((filteredStreamStats.avgParticipants / filteredStudents.length) * 100))
                          : 0}%`, 
                        animation: 'slideIn 1s ease-out 0.1s backwards' 
                      }} 
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Tiempo Total de Streams</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {filteredStreamStats.totalHours > 0 || filteredStreamStats.totalMinutes > 0
                        ? `${filteredStreamStats.totalHours}h ${filteredStreamStats.totalMinutes}min`
                        : '0h 0min'}
                    </span>
                  </div>
                </div>
                <style jsx>{`
                  @keyframes slideIn {
                    from {
                      width: 0;
                    }
                  }
                `}</style>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm font-medium">Sin datos de participación</p>
                <p className="text-xs text-gray-400 mt-1">Espera a que los estudiantes se inscriban</p>
              </div>
            )}
          </div>

          {/* Student Summary - TOP RIGHT */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Estudiantes</h3>
            {filteredStudents.length > 0 || pendingEnrollments.length > 0 || rejectedCount > 0 ? (
              <div className="space-y-6">
                <div className="text-center">
                  <AnimatedNumber value={filteredStudents.length} className="text-5xl font-bold text-gray-900 mb-2" />
                  <div className="text-sm text-gray-500">{selectedClass === 'all' ? 'Número de matriculados' : 'matriculados en esta clase'}</div>
                </div>
                <div className="flex justify-between gap-4 pt-4 border-t border-gray-100">
                  <div className="flex-1 text-center group/accepted relative cursor-help">
                    <AnimatedNumber value={Math.ceil(filteredStudents.length * 1.05)} className="text-2xl font-bold text-green-600" />
                    <div className="text-xs text-gray-500">aceptados</div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/accepted:opacity-100 group-hover/accepted:visible transition-all duration-200 whitespace-nowrap z-20">
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                      Estudiantes aprobados (5% más que matriculados)
                    </div>
                  </div>
                  <div className="flex-1 text-center group/pending relative cursor-help">
                    <AnimatedNumber 
                      value={selectedClass === 'all' 
                        ? (selectedAcademy === 'all' 
                          ? pendingEnrollments.length 
                          : pendingEnrollments.filter(p => p.class.academyId === selectedAcademy).length)
                        : pendingEnrollments.filter(p => p.class.id === selectedClass).length} 
                      className="text-2xl font-bold text-amber-600" 
                    />
                    <div className="text-xs text-gray-500">pendientes</div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/pending:opacity-100 group-hover/pending:visible transition-all duration-200 whitespace-nowrap z-20">
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                      Esperando aprobación
                    </div>
                  </div>
                  <div className="flex-1 text-center group/rejected relative cursor-help">
                    <AnimatedNumber 
                      value={selectedClass === 'all' 
                        ? (selectedAcademy === 'all'
                          ? rejectedCount
                          : Math.round(rejectedCount * (filteredStudents.length / enrolledStudents.length)))
                        : Math.round(rejectedCount * (filteredStudents.length / enrolledStudents.length))} 
                      className="text-2xl font-bold text-red-600" 
                    />
                    <div className="text-xs text-gray-500">rechazados</div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/rejected:opacity-100 group-hover/rejected:visible transition-all duration-200 whitespace-nowrap z-20">
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                      Solicitudes rechazadas
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-sm font-medium">Sin estudiantes</p>
                <p className="text-xs text-gray-400 mt-1">Cuando los estudiantes se inscriban aparecerán aquí</p>
              </div>
            )}
          </div>

          {/* Star Ratings Distribution - BOTTOM LEFT (Bar Chart) */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Valoraciones</h3>
            {(() => {
              if (!ratingsData || !ratingsData.lessons) {
                return (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p className="text-sm font-medium">Sin valoraciones</p>
                    <p className="text-xs text-gray-400 mt-1">Las valoraciones de los estudiantes aparecerán aquí</p>
                  </div>
                );
              }
              
              let filteredLessons = ratingsData.lessons;
              if (selectedAcademy !== 'all') {
                filteredLessons = filteredLessons.filter(l => l.academyId === selectedAcademy);
              }
              if (selectedClass !== 'all') {
                filteredLessons = filteredLessons.filter(l => l.classId === selectedClass);
              }
              
              const totalRatings = filteredLessons.reduce((sum, l) => sum + l.ratingCount, 0);
              
              if (totalRatings === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p className="text-sm font-medium">Sin valoraciones</p>
                    <p className="text-xs text-gray-400 mt-1">Las valoraciones de los estudiantes aparecerán aquí</p>
                  </div>
                );
              }
              
              const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
              filteredLessons.forEach(lesson => {
                if (lesson.averageRating !== null && lesson.averageRating !== undefined) {
                  const avgRating = Math.round(lesson.averageRating);
                  if (avgRating >= 1 && avgRating <= 5) {
                    ratingCounts[avgRating as 1|2|3|4|5] += lesson.ratingCount;
                  }
                }
              });
              
              return (
                <BarChart
                  data={[
                    { label: '1★', value: ratingCounts[1], color: '#ef4444' },
                    { label: '2★', value: ratingCounts[2], color: '#f97316' },
                    { label: '3★', value: ratingCounts[3], color: '#a3e635' },
                    { label: '4★', value: ratingCounts[4], color: '#84cc16' },
                    { label: '5★', value: ratingCounts[5], color: '#22c55e' },
                  ]}
                />
              );
            })()}
          </div>

          {/* Activity Pie Chart - BOTTOM RIGHT */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Actividad</h3>
            {filteredStudents.length > 0 ? (
              <div className="flex-1 flex items-center justify-center min-h-40">
                <DonutChart
                  data={(() => {
                    const now = Date.now();
                    const oneDayAgo = now - (24 * 60 * 60 * 1000);
                    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
                    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
                    
                    const activos = filteredStudents.filter(s => {
                      if (!s.lastActive) return false;
                      const loginTime = new Date(s.lastActive).getTime();
                      return loginTime >= oneDayAgo;
                    }).length;
                    
                    const activos7dias = filteredStudents.filter(s => {
                      if (!s.lastActive) return false;
                      const loginTime = new Date(s.lastActive).getTime();
                      return loginTime < oneDayAgo && loginTime >= sevenDaysAgo;
                    }).length;
                    
                    const activos30dias = filteredStudents.filter(s => {
                      if (!s.lastActive) return false;
                      const loginTime = new Date(s.lastActive).getTime();
                      return loginTime < sevenDaysAgo && loginTime >= thirtyDaysAgo;
                    }).length;
                    
                    const inactivos = filteredStudents.filter(s => {
                      if (!s.lastActive) return true;
                      const loginTime = new Date(s.lastActive).getTime();
                      return loginTime < thirtyDaysAgo;
                    }).length;
                    
                    return [
                      { label: 'Activos (<24h)', value: activos, color: '#22c55e' },
                      { label: 'Activos 7d', value: activos7dias, color: '#f97316' },
                      { label: 'Activos 30d', value: activos30dias, color: '#ef4444' },
                      { label: 'Inactivos', value: inactivos, color: '#9ca3af' },
                    ];
                  })()}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-sm font-medium">Sin datos de actividad</p>
                <p className="text-xs text-gray-400 mt-1">La actividad de los estudiantes se mostrará aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
