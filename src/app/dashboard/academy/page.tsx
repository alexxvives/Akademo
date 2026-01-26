'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { BarChart, DonutChart } from '@/components/Charts';
import { apiClient } from '@/lib/api-client';
import { useAnimatedNumber } from '@/hooks';
import { generateDemoStudents, generateDemoStats, generateDemoStreams, generateDemoClasses, generateDemoPendingPayments, generateDemoPaymentHistory } from '@/lib/demo-data';

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
  lessonsCompleted?: number;
  totalLessons?: number;
  lastLoginAt?: string | null;
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
    classId: string;
    averageRating: number | null;
    ratingCount: number;
  }>;
}

// Animated Number Component
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const animatedValue = useAnimatedNumber(value);
  return <div className={className}>{animatedValue}</div>;
}

export default function AcademyDashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [academyInfo, setAcademyInfo] = useState<{ id: string; name: string; paymentStatus?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [streamStats, setStreamStats] = useState({ total: 0, avgParticipants: 0, thisMonth: 0, totalHours: 0, totalMinutes: 0 });
  const [allStreams, setAllStreams] = useState<any[]>([]);
  const [classWatchTime, setClassWatchTime] = useState({ hours: 0, minutes: 0 });
  const [selectedClass, setSelectedClass] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [academiesRes, classesRes, pendingRes, ratingsRes, rejectedRes, streamsRes, progressRes] = await Promise.all([
        apiClient('/academies'),
        apiClient('/academies/classes'),
        apiClient('/enrollments/pending'),
        apiClient('/ratings'),
        apiClient('/enrollments/rejected'),
        apiClient('/live/history'),
        apiClient('/students/progress'), // Load student progress data
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

      if (academiesResult.success && Array.isArray(academiesResult.data) && academiesResult.data.length > 0) {
        const academy = academiesResult.data[0];
        setAcademyInfo(academy);
        setPaymentStatus(academy.paymentStatus || 'NOT PAID');
        
        // If academy hasn't paid, use demo data
        if (academy.paymentStatus === 'NOT PAID') {
          const demoStats = generateDemoStats();
          const demoStudents = generateDemoStudents(); // Uses DEMO_STUDENT_COUNT.TOTAL by default
          const demoStreams = generateDemoStreams();
          const demoClasses = generateDemoClasses();
          
          const mappedClasses = (demoClasses || []).map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            slug: c.name.toLowerCase().replace(/\s+/g, '-'),
            academyName: 'Mi Academia Demo',
            teacherName: c.teacherName,
            studentCount: c.studentCount,
            videoCount: c.videoCount,
            documentCount: c.documentCount,
            enrollmentCount: c.studentCount,
          }));
          setClasses(mappedClasses);
          
          const mappedStudents = (demoStudents || []).map(s => {
            // Map class names to demo class IDs
            const classNameToId: Record<string, string> = {
              'Programación Web': 'demo-c1',
              'Matemáticas Avanzadas': 'demo-c2',
              'Física Cuántica': 'demo-c4',
              'Diseño Gráfico': 'demo-c3',
            };
            return {
              id: s.id,
              name: `${s.firstName} ${s.lastName}`,
              email: s.email,
              classId: classNameToId[s.className] || 'demo-c1',
              className: s.className,
              lessonsCompleted: Math.floor(Math.random() * 5) + 2, // 2-6 lessons completed (avg ~4 out of 10 = 40%)
              totalLessons: 10,
              lastLoginAt: s.lastLoginAt,
            };
          });
          setEnrolledStudents(mappedStudents);
          
          // More varied ratings (1-5 stars) with realistic distribution
          const lessonsData = [
            // Programación Web (demo-c1) - varied ratings
            { lessonId: 'demo-l1', lessonTitle: 'Introducción a React', className: 'Programación Web', classId: 'demo-c1', averageRating: 4.8, ratingCount: 25 },
            { lessonId: 'demo-l2', lessonTitle: 'Variables y Tipos', className: 'Programación Web', classId: 'demo-c1', averageRating: 3.5, ratingCount: 23 },
            { lessonId: 'demo-l3', lessonTitle: 'Funciones y Scope', className: 'Programación Web', classId: 'demo-c1', averageRating: 4.7, ratingCount: 22 },
            { lessonId: 'demo-l4', lessonTitle: 'Arrays y Objetos', className: 'Programación Web', classId: 'demo-c1', averageRating: 2.1, ratingCount: 21 },
            { lessonId: 'demo-l5', lessonTitle: 'Programación Asíncrona', className: 'Programación Web', classId: 'demo-c1', averageRating: 5.0, ratingCount: 19 },
            { lessonId: 'demo-l6', lessonTitle: 'React Hooks', className: 'Programación Web', classId: 'demo-c1', averageRating: 4.2, ratingCount: 18 },
            // Matemáticas (demo-c2) - varied ratings
            { lessonId: 'demo-l7', lessonTitle: 'Límites y Continuidad', className: 'Matemáticas Avanzadas', classId: 'demo-c2', averageRating: 4.3, ratingCount: 18 },
            { lessonId: 'demo-l8', lessonTitle: 'Derivadas', className: 'Matemáticas Avanzadas', classId: 'demo-c2', averageRating: 1.8, ratingCount: 17 },
            { lessonId: 'demo-l9', lessonTitle: 'Integrales Definidas', className: 'Matemáticas Avanzadas', classId: 'demo-c2', averageRating: 4.9, ratingCount: 16 },
            { lessonId: 'demo-l10', lessonTitle: 'Series y Sucesiones', className: 'Matemáticas Avanzadas', classId: 'demo-c2', averageRating: 2.4, ratingCount: 15 },
            // Diseño Gráfico (demo-c3) - varied ratings
            { lessonId: 'demo-l11', lessonTitle: 'Principios de Diseño', className: 'Diseño Gráfico', classId: 'demo-c3', averageRating: 4.9, ratingCount: 20 },
            { lessonId: 'demo-l12', lessonTitle: 'Photoshop Básico', className: 'Diseño Gráfico', classId: 'demo-c3', averageRating: 3.2, ratingCount: 19 },
            { lessonId: 'demo-l13', lessonTitle: 'Tipografía', className: 'Diseño Gráfico', classId: 'demo-c3', averageRating: 5.0, ratingCount: 18 },
            { lessonId: 'demo-l14', lessonTitle: 'Teoría del Color', className: 'Diseño Gráfico', classId: 'demo-c3', averageRating: 2.7, ratingCount: 17 },
            // Física Cuántica (demo-c4) - varied ratings
            { lessonId: 'demo-l15', lessonTitle: 'Mecánica Cuántica', className: 'Física Cuántica', classId: 'demo-c4', averageRating: 4.5, ratingCount: 14 },
            { lessonId: 'demo-l16', lessonTitle: 'Partículas y Ondas', className: 'Física Cuántica', classId: 'demo-c4', averageRating: 1.9, ratingCount: 13 },
            { lessonId: 'demo-l17', lessonTitle: 'Dualidad Onda-Partícula', className: 'Física Cuántica', classId: 'demo-c4', averageRating: 3.8, ratingCount: 12 },
          ];
          
          const ratingsDataObj = {
            overall: {
              averageRating: 3.8,  // Average of varied ratings
              totalRatings: demoStats.totalRatings || 250,
              ratedLessons: 17,  // Now we have 17 lessons with ratings
            },
            lessons: lessonsData,
          };
          setRatingsData(ratingsDataObj);
          
          setAllStreams(demoStreams);
          setStreamStats({
            total: demoStats.totalStreams,
            avgParticipants: demoStats.avgParticipants,
            thisMonth: demoStats.streamsThisMonth,
            totalHours: demoStats.totalStreamHours,
            totalMinutes: demoStats.totalStreamMinutes,
          });
          
          // Demo class watch time per class (will be filtered)
          const demoClassWatchData = [
            { classId: 'demo-c1', hours: 15, minutes: 45 },  // Programación Web
            { classId: 'demo-c2', hours: 12, minutes: 30 },  // Matemáticas
            { classId: 'demo-c3', hours: 10, minutes: 15 },  // Diseño Gráfico
            { classId: 'demo-c4', hours: 7, minutes: 0 },    // Física Cuántica
          ];
          
          // Store raw class watch data for filtering
          const allClassWatchData: any[] = [];
          mappedStudents.forEach(s => {
            const classData = demoClassWatchData.find(d => d.classId === s.classId);
            if (classData) {
              allClassWatchData.push({ ...s, watchHours: classData.hours, watchMinutes: classData.minutes });
            }
          });
          
          // Calculate initial total (all classes)
          const totalMinutes = demoClassWatchData.reduce((sum, d) => sum + d.hours * 60 + d.minutes, 0);
          setClassWatchTime({
            hours: Math.floor(totalMinutes / 60),
            minutes: totalMinutes % 60,
          });
          
          // Get payment data for enrollment stats
          const demoPendingPayments = generateDemoPendingPayments(); // 5 pending
          const demoHistoryPayments = generateDemoPaymentHistory(); // 20 total: 18 paid, 2 rejected
          
          // Map payments to enrollments (pending)
          const demoPending = demoPendingPayments.map((payment, i) => ({
            id: `demo-pending-${i + 1}`,
            student: {
              id: `demo-student-pending-${i + 1}`,
              firstName: payment.studentFirstName,
              lastName: payment.studentLastName,
              email: payment.studentEmail,
            },
            class: {
              id: payment.className === 'Programación Web' ? 'demo-c1' : 
                 payment.className === 'Matemáticas Avanzadas' ? 'demo-c2' : 
                 payment.className === 'Diseño Gráfico' ? 'demo-c3' : 'demo-c4',
              name: payment.className,
            },
            enrolledAt: payment.createdAt,
          }));
          setPendingEnrollments(demoPending);
          
          // Count rejected from payment history
          const rejectedCount = demoHistoryPayments.filter(p => p.paymentStatus === 'REJECTED').length;
          setRejectedCount(rejectedCount); // 2 rejected
          setLoading(false);
          return;
        }
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
        // Calculate duration from startedAt and endedAt timestamps
        const totalDurationMs = streams.reduce((sum: number, s: any) => {
          if (s.startedAt && s.endedAt) {
            const start = new Date(s.startedAt).getTime();
            const end = new Date(s.endedAt).getTime();
            return sum + (end - start);
          }
          return sum;
        }, 0);
        const totalDuration = Math.floor(totalDurationMs / (1000 * 60)); // Convert to minutes
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

      // Calculate total class watch time from progress data
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
        const classList = classesResult.data;
        setClasses(classList);
        
        // Use progress data instead of loading enrollments separately
        if (progressResult.success && Array.isArray(progressResult.data)) {
          // Create a map of student ID to classes they're enrolled in
          const allStudents: EnrolledStudent[] = [];
          
          for (const student of progressResult.data) {
            // Need to get actual classId from enrollments
            // The progress API doesn't return individual classIds properly
            try {
              // Find which classes this student is in
              for (const cls of classList) {
                const enrollRes = await apiClient(`/enrollments?classId=${cls.id}`);
                const enrollData = await enrollRes.json();
                if (enrollData.success && Array.isArray(enrollData.data)) {
                  const studentInClass = enrollData.data.find((e: any) => e.student.id === student.id);
                  if (studentInClass) {
                    allStudents.push({
                      id: student.id,
                      name: `${student.firstName} ${student.lastName}`,
                      email: student.email,
                      classId: cls.id, // Correct classId
                      className: cls.name,
                      lessonsCompleted: student.lessonsCompleted || 0,
                      totalLessons: student.totalLessons || 0,
                    });
                  }
                }
              }
            } catch (err) {
              console.error(`Failed to map student ${student.id}:`, err);
            }
          }
          setEnrolledStudents(allStudents);
        } else {
          // Fallback to old method if progress API fails
          const allStudents: EnrolledStudent[] = [];
          for (const cls of classList) {
            try {
              const enrollRes = await apiClient(`/enrollments?classId=${cls.id}`);
              const enrollData = await enrollRes.json();
              if (enrollData.success && Array.isArray(enrollData.data)) {
                const studentsInClass = enrollData.data.map((e: any) => ({
                  id: e.student.id,
                  name: `${e.student.firstName} ${e.student.lastName}`,
                  email: e.student.email,
                  classId: cls.id,
                  className: cls.name,
                  lessonsCompleted: 0,
                  totalLessons: 0,
                }));
                allStudents.push(...studentsInClass);
              }
            } catch (err) {
              console.error(`Failed to load students for class ${cls.id}:`, err);
            }
          }
          setEnrolledStudents(allStudents);
        }
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
    if (selectedClass === 'all') return enrolledStudents;
    return enrolledStudents.filter(s => s.classId === selectedClass);
  }, [enrolledStudents, selectedClass]);

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
    const filtered = selectedClass === 'all' ? allStreams : allStreams.filter(s => s.classId === selectedClass);
    if (filtered.length === 0) return { avgParticipants: 0, total: 0, totalHours: 0, totalMinutes: 0 };
    
    const totalParticipants = filtered.reduce((sum, s) => sum + (s.participantCount || 0), 0);
    const totalDuration = filtered.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalHours = Math.floor(totalDuration / 60);
    const totalMinutes = totalDuration % 60;
    
    return {
      avgParticipants: Math.round(totalParticipants / filtered.length),
      total: filtered.length,
      totalHours,
      totalMinutes,
    };
  }, [allStreams, selectedClass]);

  // Calculate filtered class watch time
  const filteredClassWatchTime = useMemo(() => {
    if (paymentStatus === 'NOT PAID') {
      // Demo data: using DEMO_STATS constants from demo-data.ts
      // Total: 15h 45min across all classes (from DEMO_STATS.totalClassHours/Minutes)
      // Distributed per class based on lesson count
      const demoClassWatchData = [
        { classId: 'demo-c1', hours: 7, minutes: 54 },  // Programación Web: 4 lessons × 118.5min = 7h 54min
        { classId: 'demo-c2', hours: 5, minutes: 55 },  // Matemáticas: 3 lessons × 118.5min = 5h 55min  
        { classId: 'demo-c3', hours: 1, minutes: 58 },  // Diseño Gráfico: 1 lesson × 118min = 1h 58min
        { classId: 'demo-c4', hours: 0, minutes: 0 },   // Física Cuántica: 0 lessons = 0h
      ];
      
      if (selectedClass === 'all') {
        // Return total from DEMO_STATS
        return { hours: 15, minutes: 45 };
      } else {
        const classData = demoClassWatchData.find(d => d.classId === selectedClass);
        return classData || { hours: 0, minutes: 0 };
      }
    }
    return classWatchTime;  // Use state value for real data
  }, [selectedClass, classWatchTime, paymentStatus]);

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
        {/* Page Header with Class Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Panel de Control</h1>
            {academyInfo && (
              <p className="text-sm text-gray-500 mt-1">{academyInfo.name}</p>
            )}
          </div>
          
          {/* Class Filter */}
          {classes.length > 0 && (
            <div className='relative'>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className='appearance-none w-full md:w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
              >
                <option value='all'>Todas las clases</option>
                {classes.map((cls) => (
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
                {/* Tiempo de visualización total removed - needs proper tracking */}
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
                    <AnimatedNumber value={selectedClass === 'all' ? pendingEnrollments.length : pendingEnrollments.filter(p => p.class.id === selectedClass).length} className="text-2xl font-bold text-amber-600" />
                    <div className="text-xs text-gray-500">pendientes</div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/pending:opacity-100 group-hover/pending:visible transition-all duration-200 whitespace-nowrap z-20">
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                      Esperando aprobación
                    </div>
                  </div>
                  <div className="flex-1 text-center group/rejected relative cursor-help">
                    <AnimatedNumber value={selectedClass === 'all' ? rejectedCount : Math.round(rejectedCount * (filteredStudents.length / enrolledStudents.length))} className="text-2xl font-bold text-red-600" />
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
            {ratingsData && ratingsData.overall.totalRatings > 0 && ratingsData.lessons ? (
              <>
                <BarChart
                  data={(() => {
                    const filteredLessons = ratingsData.lessons.filter(l => selectedClass === 'all' || l.classId === selectedClass);
                    const totalRatings = filteredLessons.reduce((sum, l) => sum + l.ratingCount, 0);
                    // Distribution: 35% 5-star, 30% 4-star, 20% 2-star, 10% 3-star, 5% 1-star
                    return [
                      { label: '1★', value: Math.round(totalRatings * 0.05), color: '#ef4444' },
                      { label: '2★', value: Math.round(totalRatings * 0.20), color: '#f97316' },
                      { label: '3★', value: Math.round(totalRatings * 0.10), color: '#a3e635' },
                      { label: '4★', value: Math.round(totalRatings * 0.30), color: '#84cc16' },
                      { label: '5★', value: Math.round(totalRatings * 0.35), color: '#22c55e' },
                    ];
                  })()}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <p className="text-sm font-medium">Sin valoraciones</p>
                <p className="text-xs text-gray-400 mt-1">Las valoraciones de los estudiantes aparecerán aquí</p>
              </div>
            )}
          </div>

          {/* Student Status - BOTTOM RIGHT (Pie Chart) */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Actividad</h3>
            {filteredStudents.length > 0 ? (
              <div className="h-40 flex items-center justify-center">
                <DonutChart
                  data={(() => {
                    const now = Date.now();
                    const oneDayAgo = now - (24 * 60 * 60 * 1000);
                    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
                    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
                    
                    const activos = filteredStudents.filter(s => {
                      if (!s.lastLoginAt) return false;
                      const loginTime = new Date(s.lastLoginAt).getTime();
                      return loginTime >= oneDayAgo;
                    }).length;
                    
                    const activos7dias = filteredStudents.filter(s => {
                      if (!s.lastLoginAt) return false;
                      const loginTime = new Date(s.lastLoginAt).getTime();
                      return loginTime < oneDayAgo && loginTime >= sevenDaysAgo;
                    }).length;
                    
                    const activos30dias = filteredStudents.filter(s => {
                      if (!s.lastLoginAt) return false;
                      const loginTime = new Date(s.lastLoginAt).getTime();
                      return loginTime < sevenDaysAgo && loginTime >= thirtyDaysAgo;
                    }).length;
                    
                    const inactivos = filteredStudents.filter(s => {
                      if (!s.lastLoginAt) return true;
                      const loginTime = new Date(s.lastLoginAt).getTime();
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
