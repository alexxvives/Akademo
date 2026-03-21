import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { buildDemoTeacherData } from './teacher-dashboard-demo';
import type { Academy, Membership, Class, EnrolledStudent, PendingEnrollment, RatingsData, StreamStats, ClassWatchTime, PaymentStatusCounts } from './teacher-dashboard-types';

// Re-export all types so existing imports from '@/hooks/useTeacherDashboard' keep working
export type { Academy, Membership, Class, Student, EnrolledStudent, PendingEnrollment, RatingsData, StreamStats, ClassWatchTime, PaymentStatusCounts } from './teacher-dashboard-types';

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
  const [streamStats, setStreamStats] = useState<StreamStats>({ total: 0, avgParticipants: 0, thisMonth: 0, totalHours: 0, totalMinutes: 0 });
  const [classWatchTime, setClassWatchTime] = useState<ClassWatchTime>({ hours: 0, minutes: 0 });
  const [paymentStatusCounts, setPaymentStatusCounts] = useState<PaymentStatusCounts>({ alDia: 0, atrasados: 0, uniqueAlDia: 0, uniqueAtrasados: 0 });

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
        const demo = buildDemoTeacherData();
        setMemberships(demo.memberships);
        setAvailableAcademies([]);
        setClasses(demo.classes);
        setEnrolledStudents(demo.enrolledStudents);
        setPendingEnrollments(demo.pendingEnrollments);
        setRatingsData(demo.ratingsData);
        setRejectedCount(demo.rejectedCount);
        setStreamStats(demo.streamStats);
        setClassWatchTime(demo.classWatchTime);
        setPaymentStatusCounts(demo.paymentStatusCounts);
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

      if (membershipsResult.success && Array.isArray(membershipsResult.data)) {
        setMemberships(membershipsResult.data);
        if (membershipsResult.data.length > 0) {
          setAcademyName(membershipsResult.data[0].academyName);
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
