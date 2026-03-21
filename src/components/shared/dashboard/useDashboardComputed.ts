import { useMemo } from 'react';
import { usePeriod } from '@/contexts/PeriodContext';
import type {
  Class, EnrolledStudent, StreamRecord, PaymentHistoryItem,
  StudentPaymentStatus, StreamStats, PaymentStats,
} from './types';

interface UseDashboardComputedParams {
  role: 'ACADEMY' | 'ADMIN';
  enrolledStudents: EnrolledStudent[];
  selectedAcademy: string;
  selectedClass: string;
  classes: Class[];
  allStreams: StreamRecord[];
  paymentStatus: string;
  studentPaymentStatus: StudentPaymentStatus;
  classWatchTime: { hours: number; minutes: number };
  allCompletedPayments: PaymentHistoryItem[];
}

export function useDashboardComputed(params: UseDashboardComputedParams) {
  const {
    role, enrolledStudents, selectedAcademy, selectedClass, classes,
    allStreams, paymentStatus, studentPaymentStatus, classWatchTime, allCompletedPayments,
  } = params;
  const isAcademy = role === 'ACADEMY';
  const isAdmin = role === 'ADMIN';
  const { activePeriodId, isClassInPeriod } = usePeriod();

  const filteredStudents = useMemo(() => {
    let filtered = enrolledStudents;
    if (isAdmin && selectedAcademy !== 'all') filtered = filtered.filter(s => s.academyId === selectedAcademy);
    if (selectedClass !== 'all') {
      filtered = filtered.filter(s => s.classId === selectedClass);
    } else if (isAcademy && activePeriodId !== 'all') {
      const periodClassIds = new Set(classes.filter(c => isClassInPeriod(c.startDate)).map(c => c.id));
      filtered = filtered.filter(s => periodClassIds.has(s.classId));
    }
    return filtered;
  }, [enrolledStudents, selectedAcademy, selectedClass, isAdmin, isAcademy, activePeriodId, classes, isClassInPeriod]);

  const uniqueStudentCount = useMemo(() => new Set(filteredStudents.map(s => s.email)).size, [filteredStudents]);

  const avgLessonProgress = useMemo(() => {
    if (filteredStudents.length === 0) return 0;
    const withLessons = filteredStudents.filter(s => s.totalLessons && s.totalLessons > 0);
    if (withLessons.length === 0) return 0;
    const totalCompleted = withLessons.reduce((sum, s) => sum + (s.lessonsCompleted || 0), 0);
    const totalLessons = withLessons.reduce((sum, s) => sum + (s.totalLessons || 0), 0);
    return totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;
  }, [filteredStudents]);

  const filteredStreamStats: StreamStats = useMemo(() => {
    let filtered = allStreams;
    if (isAdmin && selectedAcademy !== 'all') filtered = filtered.filter(s => s.academyId === selectedAcademy);
    if (selectedClass !== 'all') {
      filtered = filtered.filter(s => s.classId === selectedClass);
    } else if (isAcademy && activePeriodId !== 'all') {
      const periodClassIds = new Set(classes.filter(c => isClassInPeriod(c.startDate)).map(c => c.id));
      filtered = filtered.filter(s => s.classId ? periodClassIds.has(s.classId) : false);
    }
    if (filtered.length === 0) return { avgParticipants: 0, total: 0, totalHours: 0, totalMinutes: 0, dailyCoHours: 0, dailyCoMinutes: 0 };
    const withP = filtered.filter(s => s.participantCount != null && s.participantCount > 0);
    const totalP = withP.reduce((sum, s) => sum + (s.participantCount || 0), 0);
    const totalMs = filtered.reduce((sum, s) => {
      if (s.startedAt && s.endedAt) return sum + (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime());
      return sum;
    }, 0);
    const totalMin = Math.floor(totalMs / (1000 * 60));
    const dailyCoMs = filtered.filter(s => s.dailyRoomName && !s.zoomMeetingId).reduce((sum, s) => {
      if (s.startedAt && s.endedAt) return sum + (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime());
      return sum;
    }, 0);
    const dailyCoMin = Math.floor(dailyCoMs / (1000 * 60));
    return {
      avgParticipants: withP.length > 0 ? Math.round(totalP / withP.length) : 0,
      total: filtered.length,
      totalHours: Math.floor(totalMin / 60), totalMinutes: totalMin % 60,
      dailyCoHours: Math.floor(dailyCoMin / 60), dailyCoMinutes: dailyCoMin % 60,
    };
  }, [allStreams, selectedAcademy, selectedClass, isAdmin, isAcademy, activePeriodId, classes, isClassInPeriod]);

  const displayedPaymentStatus = useMemo(() => {
    if (paymentStatus !== 'NOT PAID') return studentPaymentStatus;
    if (selectedClass === 'all' || enrolledStudents.length === 0) return studentPaymentStatus;
    const ratio = filteredStudents.length / enrolledStudents.length;
    return {
      alDia: Math.round(studentPaymentStatus.alDia * ratio),
      atrasados: Math.round(studentPaymentStatus.atrasados * ratio),
      total: filteredStudents.length,
      uniqueAlDia: studentPaymentStatus.uniqueAlDia != null ? Math.round(studentPaymentStatus.uniqueAlDia * ratio) : undefined,
      uniqueAtrasados: studentPaymentStatus.uniqueAtrasados != null ? Math.round(studentPaymentStatus.uniqueAtrasados * ratio) : undefined,
      uniqueTotal: new Set(filteredStudents.map(s => s.email)).size,
    };
  }, [studentPaymentStatus, paymentStatus, selectedClass, filteredStudents, enrolledStudents]);

  const paymentStats: PaymentStats = useMemo(() => {
    let filtered = allCompletedPayments;
    if (selectedClass !== 'all') {
      filtered = filtered.filter(p => p.classId === selectedClass);
    } else if (activePeriodId !== 'all') {
      const periodClassIds = new Set(classes.filter(c => isClassInPeriod(c.startDate)).map(c => c.id));
      filtered = filtered.filter(p => p.classId ? periodClassIds.has(p.classId) : false);
    }
    return {
      totalPaid: filtered.reduce((sum, p) => sum + (p.paymentAmount ?? 0), 0),
      transferenciaCount: filtered.filter(p => p.paymentMethod === 'transferencia').length,
      cashCount: filtered.filter(p => p.paymentMethod === 'cash').length,
      stripeCount: filtered.filter(p => p.paymentMethod === 'stripe').length,
    };
  }, [allCompletedPayments, selectedClass, activePeriodId, classes, isClassInPeriod]);

  const filteredClassWatchTime = useMemo(() => {
    if (isAcademy && paymentStatus === 'NOT PAID') {
      const demoData = [
        { classId: 'demo-c1', hours: 7, minutes: 54 }, { classId: 'demo-c2', hours: 5, minutes: 55 },
        { classId: 'demo-c3', hours: 1, minutes: 58 }, { classId: 'demo-c4', hours: 0, minutes: 0 },
      ];
      if (selectedClass === 'all') return { hours: 15, minutes: 45 };
      return demoData.find(d => d.classId === selectedClass) || { hours: 0, minutes: 0 };
    }
    return classWatchTime;
  }, [selectedClass, classWatchTime, paymentStatus, isAcademy]);

  return {
    filteredStudents, uniqueStudentCount, avgLessonProgress,
    filteredStreamStats, displayedPaymentStatus, paymentStats, filteredClassWatchTime,
  };
}
