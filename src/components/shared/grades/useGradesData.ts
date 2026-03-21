'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { generateDemoClasses } from '@/lib/demo-data';
import { usePeriod } from '@/contexts/PeriodContext';
import type {
  StudentGrade, StudentAverage, ClassSummary, Academy,
  AssignmentSummary, AssignmentDetail, ApiResponse,
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
          endpoint = selectedClass === 'all' ? '/assignments/all' : `/assignments?classId=${selectedClass}`;
        } else {
          endpoint =
            selectedClass === 'all'
              ? `/assignments?academyId=${selectedAcademy}`
              : `/assignments?classId=${selectedClass}`;
        }
      } else {
        endpoint = selectedClass === 'all' ? '/assignments/all' : `/assignments?classId=${selectedClass}`;
      }

      console.log('[GradesPage] Fetching assignments from:', endpoint);
      const assignmentsRaw = await apiClient(endpoint);
      const assignmentsRes = (await assignmentsRaw.json()) as ApiResponse<AssignmentSummary[]>;
      if (!assignmentsRes.success) {
        console.error('[GradesPage] Failed to fetch assignments:', assignmentsRes.error);
        setLoading(false);
        return;
      }

      console.log('[GradesPage] Assignments fetched:', assignmentsRes.data.length);
      const allGrades: StudentGrade[] = [];
      const detailResults = await Promise.all(
        assignmentsRes.data.map(async (assignment) => {
          const res = await apiClient(`/assignments/${assignment.id}`);
          const detail = (await res.json()) as ApiResponse<AssignmentDetail>;
          return { assignment, detail };
        })
      );
      for (const { assignment, detail } of detailResults) {
        if (detail.success && detail.data.submissions) {
          detail.data.submissions.forEach((sub) => {
            if (sub.gradedAt) {
              allGrades.push({
                studentId: sub.studentId,
                studentName: sub.studentName,
                studentEmail: sub.studentEmail,
                assignmentId: assignment.id,
                assignmentTitle: assignment.title,
                score: sub.score,
                maxScore: assignment.maxScore,
                gradedAt: sub.gradedAt,
                className: assignment.className || '',
                assignmentUploadIds: assignment.attachmentIds,
                assignmentUploadId: assignment.uploadId ?? undefined,
                submissionUploadId: sub.uploadId ?? undefined,
                assignmentStoragePath: detail.data.attachmentStoragePath ?? undefined,
                submissionStoragePath: sub.submissionStoragePath ?? undefined,
              });
            }
          });
        }
      }

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
