'use client';

import { useEffect, useState, useMemo } from 'react';
import { BarChart, DonutChart } from '@/components/Charts';
import { apiClient } from '@/lib/api-client';
import { useAnimatedNumber } from '@/hooks';
import { generateDemoStudents, generateDemoStats, generateDemoStreams, generateDemoClasses, generateDemoPendingPayments, generateDemoPaymentHistory, generateDemoRatings } from '@/lib/demo-data';
import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';

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

interface StreamRecord {
  classId?: string | null;
  participantCount?: number | null;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string | null;
}

interface ProgressRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  classId: string;
  className: string;
  lessonsCompleted?: number | null;
  totalLessons?: number | null;
  lastActive?: string | null;
  totalWatchTime?: number | null;
}

interface PaymentHistoryItem {
  status?: string | null;
  amount?: number | null;
  paymentMethod?: string | null;
}

interface EnrollmentRecord {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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
  const [allStreams, setAllStreams] = useState<StreamRecord[]>([]);
  const [classWatchTime, setClassWatchTime] = useState({ hours: 0, minutes: 0 });
  const [selectedClass, setSelectedClass] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');
  const [paymentStats, setPaymentStats] = useState({ totalPaid: 0, bizumCount: 0, cashCount: 0, stripeCount: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [academiesRes, classesRes, pendingRes, ratingsRes, rejectedRes, streamsRes, progressRes, paymentsRes] = await Promise.all([
        apiClient('/academies'),
        apiClient('/academies/classes'),
        apiClient('/enrollments/pending'),
        apiClient('/ratings'),
        apiClient('/enrollments/rejected'),
        apiClient('/live/history'),
        apiClient('/students/progress'), // Load student progress data
        apiClient('/payments/history'), // Load payment history
      ]);

      const [academiesResult, classesResult, pendingResult, ratingsResult, rejectedResult, streamsResult, progressResult, paymentsResult] = await Promise.all([
        academiesRes.json(),
        classesRes.json(),
        pendingRes.json(),
        ratingsRes.json(),
        rejectedRes.json(),
        streamsRes.json(),
        progressRes.json(),
        paymentsRes.json(),
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
              lastActive: s.lastLoginAt,
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
          
          // Demo class watch time per class (will be filtered)
          const demoClassWatchData = [
            { classId: 'demo-c1', hours: 15, minutes: 45 },  // Programación Web
            { classId: 'demo-c2', hours: 12, minutes: 30 },  // Matemáticas
            { classId: 'demo-c3', hours: 10, minutes: 15 },  // Diseño Gráfico
            { classId: 'demo-c4', hours: 7, minutes: 0 },    // Física Cuántica
          ];
          
          // Calculate initial total (all classes)
          const totalMinutes = demoClassWatchData.reduce((sum, d) => sum + d.hours * 60 + d.minutes, 0);
          setClassWatchTime({
            hours: Math.floor(totalMinutes / 60),
            minutes: totalMinutes % 60,
          });
          
          // Get payment data for enrollment stats
          const demoPendingPayments = generateDemoPendingPayments(); // 5 pending
          const demoHistoryPayments = generateDemoPaymentHistory(); // 23 total: 21 paid, 2 rejected
          
          // Calculate demo payment statistics
          const paidPayments = demoHistoryPayments.filter(p => p.paymentStatus === 'PAID');
          const totalPaid = paidPayments.reduce((sum, p) => sum + p.paymentAmount, 0);
          const bizumCount = paidPayments.filter(p => p.paymentMethod === 'bizum').length;
          const cashCount = paidPayments.filter(p => p.paymentMethod === 'cash').length;
          const stripeCount = paidPayments.filter(p => p.paymentMethod === 'stripe').length;
          setPaymentStats({ totalPaid, bizumCount, cashCount, stripeCount });
          
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
          
          // Set demo streams data
          setAllStreams(demoStreams);
          
          setLoading(false);
          return;
        }
      }

      if (rejectedResult.success && rejectedResult.data) {
        setRejectedCount(rejectedResult.data.count || 0);
      }

      // Calculate payment statistics from completed/paid payments
      if (paymentsResult.success && Array.isArray(paymentsResult.data)) {
        const paymentsData = paymentsResult.data as PaymentHistoryItem[];
        const completedPayments = paymentsData.filter((p) => p.status === 'COMPLETED' || p.status === 'PAID');
        const totalPaid = completedPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
        const bizumCount = completedPayments.filter((p) => p.paymentMethod === 'bizum').length;
        const cashCount = completedPayments.filter((p) => p.paymentMethod === 'cash').length;
        const stripeCount = completedPayments.filter((p) => p.paymentMethod === 'stripe').length;
        setPaymentStats({ totalPaid, bizumCount, cashCount, stripeCount });
      }

      if (streamsResult.success && Array.isArray(streamsResult.data)) {
        const streams = streamsResult.data;
        setAllStreams(streams);
      }

      // Calculate total class watch time from progress data
      if (progressResult.success && Array.isArray(progressResult.data)) {
        const progressData = progressResult.data as ProgressRecord[];
        const totalSeconds = progressData.reduce((sum, student) => sum + (student.totalWatchTime ?? 0), 0);
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
        
        // FIXED: Progress API already returns one row per student per class
        if (progressResult.success && Array.isArray(progressResult.data)) {
          const progressData = progressResult.data as ProgressRecord[];
          // Transform progress data directly - no need to query enrollments again
          const allStudents: EnrolledStudent[] = progressData.map((student) => ({
            id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            email: student.email,
            classId: student.classId,
            className: student.className,
            lessonsCompleted: student.lessonsCompleted ?? 0,
            totalLessons: student.totalLessons ?? 0,
            lastActive: student.lastActive,
          }));
          setEnrolledStudents(allStudents);
        } else {
          // Fallback: Parallelize enrollment loading
          const enrollmentResponses = await Promise.all(
            classList.map((cls: Class) => apiClient(`/enrollments?classId=${cls.id}`).then(r => r.json()))
          );
          
          const allStudents: EnrolledStudent[] = [];
          classList.forEach((cls: Class, idx: number) => {
            const enrollData = enrollmentResponses[idx] as { success?: boolean; data?: EnrollmentRecord[] };
            if (enrollData.success && Array.isArray(enrollData.data)) {
              const studentsInClass = enrollData.data.map((e) => ({
                id: e.student.id,
                name: `${e.student.firstName} ${e.student.lastName}`,
                email: e.student.email,
                classId: cls.id,
                className: cls.name,
                lessonsCompleted: 0,
                totalLessons: 0,
                lastActive: null,
              }));
              allStudents.push(...studentsInClass);
            }
          });
          setEnrolledStudents(allStudents);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (selectedClass === 'all') return enrolledStudents;
    return enrolledStudents.filter(s => s.classId === selectedClass);
  }, [enrolledStudents, selectedClass]);

  // Calculate unique student count (deduplicate by email to handle same student in multiple classes)
  const uniqueStudentCount = useMemo(() => {
    const uniqueEmails = new Set(filteredStudents.map(s => s.email));
    return uniqueEmails.size;
  }, [filteredStudents]);

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
    
    // Only count streams with participants > 0
    const streamsWithParticipants = filtered.filter(s => s.participantCount != null && s.participantCount > 0);
    const totalParticipants = streamsWithParticipants.reduce((sum, s) => sum + (s.participantCount || 0), 0);
    
    // Calculate duration from startedAt and endedAt timestamps
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
      avgParticipants: streamsWithParticipants.length > 0 ? Math.round(totalParticipants / streamsWithParticipants.length) : 0,
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
    return <SkeletonDashboard />;
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
          <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full animate-fade-in order-4 lg:order-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Participación</h3>
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
                      {filteredStreamStats.total > 0 && filteredStudents.length > 0 && filteredStreamStats.avgParticipants > 0
                        ? Math.round((filteredStreamStats.avgParticipants / filteredStudents.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ 
                        width: `${filteredStreamStats.total > 0 && filteredStudents.length > 0 && filteredStreamStats.avgParticipants > 0
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
          <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full order-1 lg:order-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Estudiantes</h3>
            {filteredStudents.length > 0 || pendingEnrollments.length > 0 || rejectedCount > 0 ? (
              <div className="space-y-4">
                {/* Side by side: Estudiantes and Matriculados */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                  <div className="text-center">
                    <AnimatedNumber value={uniqueStudentCount} className="text-3xl sm:text-4xl font-bold text-brand-600 mb-1" />
                    <div className="text-xs text-gray-500">Estudiantes</div>
                  </div>
                  <div className="text-center">
                    <AnimatedNumber value={filteredStudents.length} className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1" />
                    <div className="text-xs text-gray-500">Matriculados</div>
                  </div>
                </div>
                {/* Payment statistics - Total left, methods right */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-xs text-gray-500 mb-1">Total Cobrado</div>
                    <div className="flex items-baseline whitespace-nowrap">
                      <AnimatedNumber value={paymentStats.totalPaid} className="text-2xl font-bold text-green-600" />
                      <span className="text-lg text-gray-600 ml-1">€</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <AnimatedNumber value={paymentStats.bizumCount} className="text-lg font-bold text-purple-600" />
                      <div className="text-xs text-gray-500">Bizum</div>
                    </div>
                    <div className="text-center">
                      <AnimatedNumber value={paymentStats.cashCount} className="text-lg font-bold text-amber-600" />
                      <div className="text-xs text-gray-500">Efectivo</div>
                    </div>
                    <div className="text-center">
                      <AnimatedNumber value={paymentStats.stripeCount} className="text-lg font-bold text-blue-600" />
                      <div className="text-xs text-gray-500">Stripe</div>
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
          <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full order-3 lg:order-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Valoraciones</h3>
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
              
              const filteredLessons = ratingsData.lessons.filter(l => selectedClass === 'all' || l.classId === selectedClass);
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
              
              // Calculate actual distribution from individual ratings (not averages)
              const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
              
              if (paymentStatus === 'NOT PAID') {
                // Use actual demo ratings distribution: 134★5, 71★4, 36★3, 40★2, 26★1
                const allDemoRatings = generateDemoRatings();
                allDemoRatings.forEach(rating => {
                  ratingCounts[rating.rating as 1|2|3|4|5]++;
                });
              } else {
                // For real data, estimate from averages (we don't have individual rating access here)
                filteredLessons.forEach(lesson => {
                  if (lesson.averageRating !== null && lesson.averageRating !== undefined) {
                    const avgRating = Math.round(lesson.averageRating);
                    if (avgRating >= 1 && avgRating <= 5) {
                      ratingCounts[avgRating as 1|2|3|4|5] += lesson.ratingCount;
                    }
                  }
                });
              }
              
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
          <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full flex flex-col order-2 lg:order-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Actividad</h3>
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
