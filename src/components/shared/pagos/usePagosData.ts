'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { generateDemoPendingPayments, generateDemoPaymentHistory } from '@/lib/demo-data';
import { usePeriod } from '@/contexts/PeriodContext';
import type {
  PendingPayment, PaymentHistory, Academy, RegisterForm,
  SelectedStudent, DemoPendingPayment, DemoHistoryPayment,
} from './pagos-types';

export function usePagosData(role: 'ACADEMY' | 'ADMIN') {
  const isAdmin = role === 'ADMIN';
  const isAcademy = role === 'ACADEMY';
  const { activePeriodId, isClassInPeriod } = usePeriod();

  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; startDate?: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [academyName, setAcademyName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    studentId: '', classId: '', amount: '', paymentMethod: 'cash', status: 'PAID',
  });
  const [students, setStudents] = useState<{ id: string; firstName: string; lastName: string; email: string }[]>([]);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [reversingPaymentId, setReversingPaymentId] = useState<string | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [studentEnrollments, setStudentEnrollments] = useState<{ [key: string]: { classId: string; className: string }[] }>({});
  const [pendingPaymentsCollapsed, setPendingPaymentsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('pagos_pending_collapsed') === 'true';
  });
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState('all');

  const loadData = useCallback(async () => {
    const addToMap = (map: { [k: string]: { classId: string; className: string }[] }, sId: string, cId: string, cName: string) => {
      if (!map[sId]) map[sId] = [];
      if (!map[sId].some(e => e.classId === cId)) map[sId].push({ classId: cId, className: cName });
    };

    try {
      if (isAdmin) {
        const academiesRes = await apiClient('/admin/academies');
        const academiesResult = await academiesRes.json();
        if (academiesResult.success && Array.isArray(academiesResult.data)) {
          setAcademies(academiesResult.data.map((a: Academy & { ownerName?: string }) => ({ id: a.id, name: a.name })));
        }
        const academyParam = selectedAcademy !== 'all' ? `?academyId=${selectedAcademy}` : '';
        const [pendingRes, historyRes] = await Promise.all([
          apiClient(`/payments/pending-cash${academyParam}`),
          apiClient(`/payments/history${academyParam}`),
        ]);
        const [pendingResult, historyResult] = await Promise.all([pendingRes.json(), historyRes.json()]);
        const realPending: PendingPayment[] = pendingResult.success ? (pendingResult.data || []) : [];
        setPendingPayments(realPending);
        if (historyResult.success) setPaymentHistory(historyResult.data || []);
        const classMap = new Map<string, string>();
        [...realPending, ...(historyResult.data || [])].forEach((p: PendingPayment | PaymentHistory) => {
          if (p.classId && p.className) classMap.set(p.classId, p.className);
        });
        setClasses(Array.from(classMap.entries()).map(([id, name]) => ({ id, name })));
      } else {
        const academyRes = await apiClient('/academies');
        const academyResult = await academyRes.json();
        if (academyResult.success && Array.isArray(academyResult.data) && academyResult.data.length > 0) {
          const academy = academyResult.data[0];
          setAcademyName(academy.name);
          const status = academy.paymentStatus || 'PAID';
          setPaymentStatus(status);
          if (status === 'NOT PAID') {
            const demoPending: DemoPendingPayment[] = generateDemoPendingPayments();
            const demoHistory: DemoHistoryPayment[] = generateDemoPaymentHistory();
            setPendingPayments(demoPending as unknown as PendingPayment[]);
            setPaymentHistory(demoHistory as unknown as PaymentHistory[]);
            setClasses([
              { id: 'demo-c1', name: 'Programación Web' }, { id: 'demo-c2', name: 'Matemáticas Avanzadas' },
              { id: 'demo-c3', name: 'Diseño Gráfico' }, { id: 'demo-c4', name: 'Física Cuántica' },
            ]);
            const enrollmentMap: { [key: string]: { classId: string; className: string }[] } = {};
            const studentMap = new Map<string, { id: string; firstName: string; lastName: string; email: string }>();
            const getDemoClassId = (name: string) =>
              name === 'Programación Web' ? 'demo-c1' : name === 'Matemáticas Avanzadas' ? 'demo-c2' :
              name === 'Diseño Gráfico' ? 'demo-c3' : 'demo-c4';
            demoPending.forEach(p => {
              addToMap(enrollmentMap, p.studentEmail, getDemoClassId(p.className), p.className);
              if (!studentMap.has(p.studentEmail)) studentMap.set(p.studentEmail, {
                id: p.studentEmail, firstName: p.studentFirstName, lastName: p.studentLastName, email: p.studentEmail,
              });
            });
            demoHistory.forEach(p => {
              addToMap(enrollmentMap, p.studentEmail, p.classId || getDemoClassId(p.className), p.className);
              if (!studentMap.has(p.studentEmail)) studentMap.set(p.studentEmail, {
                id: p.studentEmail, firstName: p.studentFirstName, lastName: p.studentLastName, email: p.studentEmail,
              });
            });
            setStudents(Array.from(studentMap.values()));
            setStudentEnrollments(enrollmentMap);
            setLoading(false);
            return;
          }
        }
        const [pendingRes, historyRes, classesRes, studentsRes] = await Promise.all([
          apiClient('/payments/pending-cash'), apiClient('/payments/history'),
          apiClient('/academies/classes'), apiClient('/academies/students'),
        ]);
        const [pendingResult, historyResult, classesResult, studentsResult] = await Promise.all([
          pendingRes.json(), historyRes.json(), classesRes.json(), studentsRes.json(),
        ]);
        const realPending: PendingPayment[] = pendingResult.success ? (pendingResult.data || []) : [];
        setPendingPayments(realPending);
        if (historyResult.success) setPaymentHistory(historyResult.data || []);
        if (classesResult.success && Array.isArray(classesResult.data)) setClasses(classesResult.data);
        if (studentsResult.success && Array.isArray(studentsResult.data)) {
          setStudents(studentsResult.data);
          const enrollmentMap: { [key: string]: { classId: string; className: string }[] } = {};
          if (pendingResult.success && Array.isArray(pendingResult.data)) {
            pendingResult.data.forEach((p: PendingPayment) => addToMap(enrollmentMap, p.studentId, p.classId, p.className));
          }
          if (historyResult.success && Array.isArray(historyResult.data)) {
            historyResult.data.forEach((p: PaymentHistory) => addToMap(enrollmentMap, p.studentId, p.classId, p.className));
          }
          setStudentEnrollments(enrollmentMap);
        }
      }
    } catch (error) {
      console.error('Failed to load payments data:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, selectedAcademy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const periodClassIds = activePeriodId !== 'all' && !isAdmin
    ? new Set(classes.filter(c => !c.startDate || isClassInPeriod(c.startDate)).map(c => c.id))
    : null;

  const filteredPendingPayments = pendingPayments.filter(p => {
    const matchesSearch = searchQuery === '' ||
      `${p.studentFirstName} ${p.studentLastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || p.classId === selectedClass;
    const matchesPeriod = !periodClassIds || periodClassIds.has(p.classId);
    return matchesSearch && matchesClass && matchesPeriod;
  });

  const filteredPaymentHistory = paymentHistory.filter(p => {
    const matchesSearch = searchQuery === '' ||
      `${p.studentFirstName} ${p.studentLastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' ||
      (p.classId && p.classId === selectedClass) ||
      (!p.classId && p.className === classes.find(c => c.id === selectedClass)?.name);
    const matchesPeriod = !periodClassIds || (p.classId ? periodClassIds.has(p.classId) : false);
    return matchesSearch && matchesClass && matchesPeriod;
  });

  return {
    isAdmin, isAcademy, activePeriodId, isClassInPeriod,
    pendingPayments, setPendingPayments, paymentHistory, setPaymentHistory,
    classes, selectedClass, setSelectedClass,
    academyName, searchQuery, setSearchQuery,
    loading, setLoading, processingIds, setProcessingIds, paymentStatus,
    selectedStudent, setSelectedStudent,
    showRegisterModal, setShowRegisterModal,
    editingPaymentId, setEditingPaymentId,
    registerForm, setRegisterForm,
    students, deletingPaymentId, setDeletingPaymentId,
    reversingPaymentId, setReversingPaymentId,
    studentSearchTerm, setStudentSearchTerm,
    showStudentDropdown, setShowStudentDropdown,
    studentEnrollments, pendingPaymentsCollapsed, setPendingPaymentsCollapsed,
    academies, selectedAcademy, setSelectedAcademy,
    filteredPendingPayments, filteredPaymentHistory, loadData,
  };
}

export type PagosState = ReturnType<typeof usePagosData>;
