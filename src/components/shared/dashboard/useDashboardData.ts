import { useCallback, useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { usePeriod } from '@/contexts/PeriodContext';
import { launchNativeConfetti } from './confetti';
import { fetchAcademyData, fetchAdminData } from './dashboard-loaders';
import type {
  Academy, Class, EnrolledStudent, PendingEnrollment, RatingsData,
  StreamRecord, PaymentHistoryItem, StudentPaymentStatus,
} from './types';

export function useDashboardData(role: 'ACADEMY' | 'ADMIN') {
  const isAcademy = role === 'ACADEMY';
  const isAdmin = role === 'ADMIN';
  const { activePeriodId, isClassInPeriod } = usePeriod();

  // Shared state
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [allStreams, setAllStreams] = useState<StreamRecord[]>([]);
  const [classWatchTime, setClassWatchTime] = useState({ hours: 0, minutes: 0 });
  const [selectedClass, setSelectedClass] = useState('all');

  // Academy-only state
  const [academyInfo, setAcademyInfo] = useState<{ id: string; name: string; paymentStatus?: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState('NOT PAID');
  const [allCompletedPayments, setAllCompletedPayments] = useState<PaymentHistoryItem[]>([]);
  const [studentPaymentStatus, setStudentPaymentStatus] = useState<StudentPaymentStatus>(
    { alDia: 0, atrasados: 0, total: 0, uniqueAlDia: 0, uniqueAtrasados: 0, uniqueTotal: 0 },
  );

  // Admin-only state
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState('all');
  const [academyClasses, setAcademyClasses] = useState<Class[]>([]);
  const paymentStatusInitRef = useRef(true);
  const prevPeriodRef = useRef(activePeriodId);

  // Reset class/academy filters when period changes
  useEffect(() => {
    if (prevPeriodRef.current === activePeriodId) return;
    prevPeriodRef.current = activePeriodId;
    setSelectedClass('all');
    if (isAdmin) setSelectedAcademy('all');
  }, [activePeriodId, isAdmin]);

  // New-user welcome effect
  useEffect(() => {
    if (sessionStorage.getItem('akademo_new_user')) {
      sessionStorage.removeItem('akademo_new_user');
      launchNativeConfetti();
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      if (selectedAcademy !== 'all') {
        setAcademyClasses(classes.filter(c => c.academyId === selectedAcademy));
        setSelectedClass('all');
      } else {
        setAcademyClasses(classes);
      }
    }
  }, [selectedAcademy, classes, isAdmin]);

  // Re-fetch payment status when class or period filter changes
  useEffect(() => {
    if (paymentStatus === 'NOT PAID') return;
    if (paymentStatusInitRef.current) { paymentStatusInitRef.current = false; return; }
    let url: string;
    if (selectedClass !== 'all') {
      url = `/enrollments/payment-status?classId=${selectedClass}`;
    } else if (isAdmin && selectedAcademy !== 'all') {
      url = `/enrollments/payment-status?academyId=${selectedAcademy}`;
    } else if (activePeriodId !== 'all') {
      const periodIds = classes.filter(c => isClassInPeriod(c.startDate)).map(c => c.id);
      if (periodIds.length === 0) {
        setStudentPaymentStatus({ alDia: 0, atrasados: 0, total: 0, uniqueAlDia: 0, uniqueAtrasados: 0, uniqueTotal: 0 });
        return;
      }
      url = `/enrollments/payment-status?classIds=${periodIds.join(',')}`;
    } else {
      url = '/enrollments/payment-status';
    }
    apiClient(url).then(r => r.json()).then(result => {
      if (result.success && result.data) {
        setStudentPaymentStatus(result.data as StudentPaymentStatus);
      }
    }).catch(() => {/* silent */});
  }, [selectedClass, isAdmin, selectedAcademy, paymentStatus, activePeriodId, classes, isClassInPeriod]);

  // Apply fetched data to state
  const applyResult = useCallback((data: Awaited<ReturnType<typeof fetchAcademyData>>) => {
    if (data.academyInfo !== undefined) setAcademyInfo(data.academyInfo ?? null);
    setPaymentStatus(data.paymentStatus);
    setClasses(data.classes);
    setEnrolledStudents(data.enrolledStudents);
    setPendingEnrollments(data.pendingEnrollments);
    setRatingsData(data.ratingsData);
    setRejectedCount(data.rejectedCount);
    setAllStreams(data.allStreams);
    setClassWatchTime(data.classWatchTime);
    setAllCompletedPayments(data.allCompletedPayments);
    setStudentPaymentStatus(data.studentPaymentStatus);
    if (data.academies.length > 0) setAcademies(data.academies);
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = isAcademy ? await fetchAcademyData() : await fetchAdminData();
        applyResult(data);
        if (!isAcademy) paymentStatusInitRef.current = true;
      } catch (error) {
        console.error('❌ Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    void loadInitialData();
  }, [isAcademy, applyResult]);

  return {
    loading, classes, enrolledStudents, pendingEnrollments, ratingsData,
    rejectedCount, allStreams, classWatchTime, selectedClass, setSelectedClass,
    academyInfo, paymentStatus, allCompletedPayments, studentPaymentStatus,
    academies, selectedAcademy, setSelectedAcademy, academyClasses,
    isAcademy, isAdmin, activePeriodId, isClassInPeriod,
  };
}
