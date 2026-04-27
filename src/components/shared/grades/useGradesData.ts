'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { generateDemoClasses } from '@/lib/demo-data';
import { usePeriod } from '@/contexts/PeriodContext';
import type {
  StudentGrade, StudentAverage, ClassSummary, Academy,
  ApiResponse,
} from './types';
import { buildDemoGrades, calcAverages } from './grades-utils';

export function useGradesData(role: 'ACADEMY' | 'ADMIN' | 'TEACHER') {
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [averages, setAverages] = useState<StudentAverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [academyName, setAcademyName] = useState<string>('');
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<string>('');

  const isDemo = (role === 'ACADEMY' || role === 'TEACHER') && paymentStatus === 'NOT PAID';
  const { activePeriodId, isClassInPeriod } = usePeriod();

  // --- Data loading ---

  const loadGrades = useCallback(async () => {
    if (!selectedClass || selectedClass === '') {
      console.log('[GradesPage] loadGrades called but no class selected');
      return;
    }
    console.log('[GradesPage] loadGrades starting for:', selectedClass, 'isDemo:', isDemo);
    setLoading(true);
    try {
      if (isDemo) {
        const gradesData = buildDemoGrades(selectedClass);
        setGrades(gradesData);
        setAverages(calcAverages(gradesData));
        console.log('[GradesPage] Demo grades loaded:', gradesData.length);
        setLoading(false);
        return;
      }

      let endpoint: string;
      if (role === 'ADMIN') {
        if (selectedAcademy === 'all') {
          endpoint = selectedClass === 'all' ? '/assignments/grades' : `/assignments/grades?classId=${selectedClass}`;
        } else {
          endpoint = selectedClass === 'all'
            ? `/assignments/grades?academyId=${selectedAcademy}`
            : `/assignments/grades?academyId=${selectedAcademy}&classId=${selectedClass}`;
        }
      } else {
        endpoint = selectedClass === 'all' ? '/assignments/grades' : `/assignments/grades?classId=${selectedClass}`;
      }

      console.log('[GradesPage] Fetching grades from:', endpoint);
      const gradesRaw = await apiClient(endpoint);
      const gradesRes = (await gradesRaw.json()) as ApiResponse<Array<{
        studentId: string; studentName: string; studentEmail: string;
        assignmentId: string; assignmentTitle: string; score: number; maxScore: number;
        gradedAt: string; className: string;
        assignmentUploadId?: string; assignmentAttachmentIds?: string;
        submissionUploadId?: string; assignmentStoragePath?: string; submissionStoragePath?: string;
      }>>;

      if (!gradesRes.success) {
        console.error('[GradesPage] Failed to fetch grades:', gradesRes.error);
        setLoading(false);
        return;
      }

      const allGrades: StudentGrade[] = gradesRes.data.map(g => ({
        studentId: g.studentId,
        studentName: g.studentName,
        studentEmail: g.studentEmail,
        assignmentId: g.assignmentId,
        assignmentTitle: g.assignmentTitle,
        score: g.score,
        maxScore: g.maxScore,
        gradedAt: g.gradedAt,
        className: g.className,
        assignmentUploadIds: g.assignmentAttachmentIds ?? undefined,
        assignmentUploadId: g.assignmentUploadId ?? undefined,
        submissionUploadId: g.submissionUploadId ?? undefined,
        assignmentStoragePath: g.assignmentStoragePath ?? undefined,
        submissionStoragePath: g.submissionStoragePath ?? undefined,
      }));

      console.log('[GradesPage] Total graded submissions:', allGrades.length);
      setGrades(allGrades);
      setAverages(calcAverages(allGrades));
      setLoading(false);
    } catch (error) {
      console.error('Error loading grades:', error);
      setLoading(false);
    }
  }, [isDemo, selectedClass, selectedAcademy, role]);

  const loadInitial = useCallback(async () => {
    try {
      if (role === 'ACADEMY' || role === 'TEACHER') {
        const [academyRes] = await Promise.all([apiClient('/academies')]);
        const academyResult = await academyRes.json();
        if (academyResult.success && Array.isArray(academyResult.data) && academyResult.data.length > 0) {
          const academy = academyResult.data[0];
          const status = academy.paymentStatus || 'NOT PAID';
          setPaymentStatus(status);
          if (academy.name) setAcademyName(academy.name);

          if (status === 'NOT PAID') {
            const demoClasses = generateDemoClasses();
            setClasses(demoClasses.map((c) => ({ id: c.id, name: c.name })));
            setSelectedClass('all');
            setLoading(false);
            return;
          }
        }
        const res = await apiClient('/classes');
        const response = (await res.json()) as ApiResponse<ClassSummary[]>;
        if (response.success) {
          setClasses(response.data);
          if (response.data.length > 0) setSelectedClass('all');
          else setLoading(false);
        } else {
          setLoading(false);
        }
      } else {
        const res = await apiClient('/admin/academies');
        const response = await res.json() as { success: boolean; data: (Academy & { paymentStatus?: string })[] };
        if (response.success) {
          const paid = (response.data || []).filter(a => a.paymentStatus === 'PAID');
          setAcademies(paid);
          if (response.data.length > 0) setSelectedAcademy('all');
          else setLoading(false);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setLoading(false);
    }
  }, [role]);

  const loadClasses = useCallback(async () => {
    if (role !== 'ADMIN' || !selectedAcademy) return;
    try {
      const endpoint = selectedAcademy === 'all' ? '/classes' : `/classes?academyId=${selectedAcademy}`;
      const res = await apiClient(endpoint);
      const response: { success: boolean; data: ClassSummary[] } = await res.json();
      if (response.success) {
        setClasses(response.data);
        if (response.data.length > 0) setSelectedClass('all');
        else {
          setSelectedClass('');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setLoading(false);
    }
  }, [role, selectedAcademy]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (role === 'ADMIN' && selectedAcademy) loadClasses();
  }, [role, selectedAcademy, loadClasses]);

  useEffect(() => {
    if (selectedClass && selectedClass !== '') {
      console.log('[GradesPage] Loading grades for class:', selectedClass);
      loadGrades();
    }
  }, [selectedClass, loadGrades]);

  // When the active period changes, clear selected class if it's no longer in the period
  useEffect(() => {
    if (!selectedClass || selectedClass === '') return;
    if (activePeriodId === 'all') return;
    if (selectedClass === 'all') {
      setSelectedClass('');
      setGrades([]);
      setAverages([]);
      return;
    }
    const cls = classes.find(c => c.id === selectedClass);
    if (cls && !isClassInPeriod(cls.startDate ?? null)) {
      setSelectedClass('');
      setGrades([]);
      setAverages([]);
    }
  }, [activePeriodId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    grades, averages, loading, selectedClass, setSelectedClass,
    classes, searchQuery, setSearchQuery,
    academyName, academies, selectedAcademy, setSelectedAcademy,
    isDemo, activePeriodId, isClassInPeriod, setGrades,
  };
}
