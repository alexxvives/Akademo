import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { generateDemoClasses, generateDemoStudents, generateDemoLessonRatings, generateDemoStreams, generateDemoStats } from '@/lib/demo-data';

export interface Academy {
  id: string;
  name: string;
  description: string | null;
}

export interface Membership {
  id: string;
  status: string;
  academyName: string;
  academyDescription: string | null;
  requestedAt: string;
}

export interface Class {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  academyName: string;
  enrollmentCount: number;
  students?: Student[];
  zoomAccountName?: string | null;
  videoCount?: number;
  documentCount?: number;
  university?: string | null;
  carrera?: string | null;
}

export interface Student {
  id: string;
  name: string;
  email: string;
}

export interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  classId: string;
  className: string;
  lessonsCompleted?: number;
  totalLessons?: number;
  lastActive: string | null;
  totalWatchTime?: number;
}

export interface PendingEnrollment {
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

export interface RatingsData {
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

export function useTeacherDashboard() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [availableAcademies, setAvailableAcademies] = useState<Academy[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [academyName, setAcademyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [streamStats, setStreamStats] = useState({ total: 0, avgParticipants: 0, thisMonth: 0, totalHours: 0, totalMinutes: 0 });
  const [classWatchTime, setClassWatchTime] = useState({ hours: 0, minutes: 0 });
  const [paymentStatusCounts, setPaymentStatusCounts] = useState({ alDia: 0, atrasados: 0, uniqueAlDia: 0, uniqueAtrasados: 0 });

  const loadData = useCallback(async () => {
    try {
      // Check if teacher is in a demo (NOT PAID) academy
      let isDemoAcademy = false;
      try {
        const academyRes = await apiClient('/teacher/academy');
        const academyResult = await academyRes.json();
        const status = academyResult.data?.academy?.paymentStatus || 'PAID';
        if (status === 'NOT PAID') {
          isDemoAcademy = true;
          const demoName = academyResult.data?.academy?.name || 'Academia Demo';
          setAcademyName(demoName);
        }
      } catch { /* continue with normal load */ }

      if (isDemoAcademy) {
        // Use shared demo data (same source as academy dashboard)
        const demoClasses = generateDemoClasses();
        const demoStudentsRaw = generateDemoStudents();
        const demoRatings = generateDemoLessonRatings();
        const demoStreams = generateDemoStreams();
        const demoStats = generateDemoStats();

        setMemberships([{ id: 'demo-m1', status: 'APPROVED', academyName: 'Academia Demo', academyDescription: 'Academia de demostración', requestedAt: new Date().toISOString() }]);
        setAvailableAcademies([]);
        setClasses(demoClasses.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.name.toLowerCase().replace(/\s+/g, '-'),
          description: c.description || null,
          academyName: 'Academia Demo',
          enrollmentCount: c.studentCount || 0,
        })));

        // Map demo students to EnrolledStudent format (same mapping as academy)
        const classNameToId: Record<string, string> = {
          'Programación Web': 'demo-c1',
          'Matemáticas Avanzadas': 'demo-c2',
          'Física Cuántica': 'demo-c4',
          'Diseño Gráfico': 'demo-c3',
        };
        const seen = new Set<string>();
        const mappedStudents: EnrolledStudent[] = demoStudentsRaw
          .map(s => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            email: s.email,
            classId: classNameToId[s.className] || 'demo-c1',
            className: s.className,
            lessonsCompleted: Math.floor(Math.random() * 5) + 2,
            totalLessons: 10,
            lastActive: s.lastLoginAt || null,
          }))
          .filter(s => {
            const key = `${s.email}__${s.classId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        setEnrolledStudents(mappedStudents);
        setPendingEnrollments([]);
        setRatingsData(demoRatings);
        setRejectedCount(0);

        // Stream stats from demo data
        const streamsWithParticipants = demoStreams.filter(s => s.participantCount > 0);
        const totalParticipants = streamsWithParticipants.reduce((sum, s) => sum + s.participantCount, 0);
        setStreamStats({
          total: demoStreams.length,
          avgParticipants: streamsWithParticipants.length > 0 ? Math.round(totalParticipants / streamsWithParticipants.length) : 0,
          thisMonth: demoStats.totalStreams,
          totalHours: demoStats.totalStreamHours,
          totalMinutes: 0,
        });

        setClassWatchTime({ hours: 45, minutes: 30 });
        setPaymentStatusCounts({ alDia: 18, atrasados: 4, uniqueAlDia: 15, uniqueAtrasados: 3 });
        setLoading(false);
        return;
      }

      const [membershipsRes, academiesRes, classesRes, pendingRes, ratingsRes, rejectedRes, streamsRes, progressRes, paymentStatusRes] = await Promise.all([
        apiClient('/requests/teacher'),
        apiClient('/explore/academies'),
        apiClient('/classes'),
        apiClient('/enrollments/pending'),
        apiClient('/ratings'),
        apiClient('/enrollments/rejected'),
        apiClient('/live/history'),
        apiClient('/students/progress'), // Load student progress in parallel
        apiClient('/enrollments/payment-status'),
      ]);

      const [membershipsResult, academiesResult, classesResult, pendingResult, ratingsResult, rejectedResult, streamsResult, progressResult, paymentStatusResult] = await Promise.all([
        membershipsRes.json(),
        academiesRes.json(),
        classesRes.json(),
        pendingRes.json(),
        ratingsRes.json(),
        rejectedRes.json(),
        streamsRes.json(),
        progressRes.json(),
        paymentStatusRes.json(),
      ]);

      if (rejectedResult.success && rejectedResult.data) {
        setRejectedCount(rejectedResult.data.count || 0);
      }

      if (paymentStatusResult.success && paymentStatusResult.data) {
        setPaymentStatusCounts({
          alDia: paymentStatusResult.data.alDia || 0,
          atrasados: paymentStatusResult.data.atrasados || 0,
          uniqueAlDia: paymentStatusResult.data.uniqueAlDia || 0,
          uniqueAtrasados: paymentStatusResult.data.uniqueAtrasados || 0,
        });
      }

      if (streamsResult.success && Array.isArray(streamsResult.data)) {
        const streams = streamsResult.data;
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthStreams = streams.filter((s: { createdAt: string }) => new Date(s.createdAt) >= thisMonthStart);
        
        // Only count streams that have participants (exclude 0 and null)
        const streamsWithParticipants = streams.filter((s: { participantCount?: number | null }) => s.participantCount != null && s.participantCount > 0);
        const totalParticipants = streamsWithParticipants.reduce((sum: number, s: { participantCount?: number | null }) => sum + (s.participantCount || 0), 0);
        
        // Calculate total stream duration from startedAt/endedAt
        const totalDurationMinutes = streams.reduce((sum: number, s: { startedAt?: string | null; endedAt?: string | null }) => {
          if (s.startedAt && s.endedAt) {
            const start = new Date(s.startedAt).getTime();
            const end = new Date(s.endedAt).getTime();
            const durationMs = end - start;
            return sum + Math.floor(durationMs / (1000 * 60)); // Convert to minutes
          }
          return sum;
        }, 0);
        const totalHours = Math.floor(totalDurationMinutes / 60);
        const totalMinutes = totalDurationMinutes % 60;
        
        setStreamStats({
          total: streams.length,
          avgParticipants: streamsWithParticipants.length > 0 ? Math.round(totalParticipants / streamsWithParticipants.length) : 0,
          thisMonth: thisMonthStreams.length,
          totalHours: totalHours,
          totalMinutes: totalMinutes,
        });
      }

      // Calculate total class watch time from progress data (already fetched in parallel)
      if (progressResult.success && Array.isArray(progressResult.data)) {
        const totalSeconds = progressResult.data.reduce((sum: number, student: { totalWatchTime?: number }) => sum + (student.totalWatchTime || 0), 0);
        const totalMinutes = Math.floor(totalSeconds / 60);
        setClassWatchTime({
          hours: Math.floor(totalMinutes / 60),
          minutes: totalMinutes % 60,
        });
      }

      if (Array.isArray(membershipsResult)) {
        setMemberships(membershipsResult);
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
        
        // Fetch student progress which includes lastActive data
        const allStudents: EnrolledStudent[] = [];
        if (progressResult.success && Array.isArray(progressResult.data)) {
          // Map progress data to EnrolledStudent format
          for (const student of progressResult.data) {
            allStudents.push({
              id: student.id,
              name: `${student.firstName} ${student.lastName}`,
              email: student.email,
              classId: student.classId,
              className: student.className,
              lessonsCompleted: student.lessonsCompleted || 0,
              totalLessons: student.totalLessons || 0,
              lastActive: student.lastActive || null,
              totalWatchTime: student.totalWatchTime || 0,
            });
          }
        }
        setEnrolledStudents(allStudents);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    memberships,
    availableAcademies,
    classes,
    enrolledStudents,
    pendingEnrollments,
    ratingsData,
    academyName,
    loading,
    rejectedCount,
    streamStats,
    classWatchTime,
    paymentStatusCounts,
    setPaymentStatusCounts,
    loadData,
  };
}
