'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import type { StudentProgress } from '../StudentsProgressTable';
import { usePeriod } from '@/contexts/PeriodContext';
import type { Academy, Class } from './types';
import { DEMO_CLASSES } from './constants';
import { buildDemoStudentProgress } from './build-demo-students';
import { fetchStudentProgress } from './fetch-progress';

export function useStudentsData(role: 'TEACHER' | 'ACADEMY' | 'ADMIN') {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [academyName, setAcademyName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');
  const [userEmail, setUserEmail] = useState<string>('');
  const [pendingWelcomeStudents, setPendingWelcomeStudents] = useState(0);
  const [sendingWelcome, setSendingWelcome] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcademy, setSelectedAcademy] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const { activePeriodId, isClassInPeriod } = usePeriod();

  useEffect(() => {
    // Filter classes when academy is selected (for ADMIN role)
    if (role === 'ADMIN' && selectedAcademy && selectedAcademy !== 'all') {
      const filtered = classes.filter(c => c.academyId === selectedAcademy);
      setFilteredClasses(filtered);
      setSelectedClass('all');
    } else {
      setFilteredClasses(classes);
    }
  }, [selectedAcademy, classes, role]);

  const loadProgress = useCallback(async () => {
    try {
      const result = await fetchStudentProgress(role);
      if (result.academies.length > 0) setAcademies(result.academies);
      if (result.classes.length > 0) {
        setClasses(result.classes);
        setFilteredClasses(result.classes);
      }
      if (result.students.length > 0) setStudents(result.students);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  const loadAcademyName = useCallback(async () => {
    try {
      // For TEACHER role, check /teacher/academy for demo mode
      if (role === 'TEACHER') {
        const [teacherAcademyRes, userRes] = await Promise.all([
          apiClient('/teacher/academy'),
          apiClient('/auth/me')
        ]);
        const userResult = await userRes.json();
        if (userResult.success && userResult.data?.email) {
          setUserEmail(userResult.data.email);
        }
        if (teacherAcademyRes.ok) {
          const teacherAcademyData = await teacherAcademyRes.json();
          const academy = teacherAcademyData.data?.academy;
          if (academy) {
            setAcademyName(academy.name || '');
            const status = academy.paymentStatus || 'PAID';
            setPaymentStatus(status);
            if (status === 'NOT PAID') {
              setStudents(buildDemoStudentProgress());
              setClasses(DEMO_CLASSES);
              setLoading(false);
              return;
            }
          }
        }
        await loadProgress();
        return;
      }

      const endpoint = role === 'ADMIN' ? '/admin/academies' : '/academies';
      const [res, userRes] = await Promise.all([
        apiClient(endpoint),
        apiClient('/auth/me')
      ]);
      const result = await res.json();
      const userResult = await userRes.json();

      // Load user email
      if (userResult.success && userResult.data?.email) {
        setUserEmail(userResult.data.email);
      }

      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        // Academy/Admin endpoint returns { success, data }
        const academy = result.data[0];
        setAcademyName(academy.name || '');
        const status = academy.paymentStatus || 'PAID';
        setPaymentStatus(status);

        // If NOT PAID, show demo students
        if (status === 'NOT PAID' && role === 'ACADEMY') {
          setStudents(buildDemoStudentProgress());
          setClasses(DEMO_CLASSES);
          setLoading(false);
          return;
        }
        await loadProgress();
      } else {
        // If API returns unexpected format, show demo data as fallback
        if (role === 'ACADEMY') {
          setStudents(buildDemoStudentProgress());
          setClasses(DEMO_CLASSES);
          setLoading(false);
        } else {
          await loadProgress();
        }
      }
    } catch (error) {
      console.error('Failed to load academy name:', error);
      // On error, show demo data for academy/teacher role
      if (role === 'ACADEMY' || role === 'TEACHER') {
        setStudents(buildDemoStudentProgress());
        setClasses(DEMO_CLASSES);
      }
      setLoading(false);
    }
  }, [loadProgress, role]);

  useEffect(() => {
    loadAcademyName();
  }, [loadAcademyName]);

  const handleBanStudent = async (enrollmentId: string) => {
    try {
      const res = await apiClient(`/enrollments/${enrollmentId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        alert('Estudiante expulsado exitosamente');
        loadProgress();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to ban student:', error);
      alert('Error al expulsar estudiante');
    }
  };

  // Filter students by academy and period
  const visibleStudents = useMemo(() => {
    let filtered = students;

    // Filter by selected academy (admin only)
    if (role === 'ADMIN' && selectedAcademy !== 'all') {
      const academyClassIds = new Set(classes.filter(c => c.academyId === selectedAcademy).map(c => c.id));
      filtered = filtered.filter(s => {
        if (s.classBreakdown && s.classBreakdown.length > 0) {
          return s.classBreakdown.some((b: { classId: string }) => academyClassIds.has(b.classId));
        }
        return s.classId ? academyClassIds.has(s.classId) : false;
      });
    }

    if (activePeriodId === 'all') return filtered;
    const periodIds = new Set(filteredClasses.filter(c => isClassInPeriod(c.startDate)).map(c => c.id));
    return filtered.filter(s => {
      if (s.classBreakdown && s.classBreakdown.length > 0) {
        return s.classBreakdown.some((b: { classId: string }) => periodIds.has(b.classId));
      }
      return s.classId ? periodIds.has(s.classId) : false;
    });
  }, [students, activePeriodId, filteredClasses, isClassInPeriod, selectedAcademy, role, classes]);

  // For ACADEMY role, fetch pending welcome email count
  const loadPendingWelcome = useCallback(async () => {
    if (role !== 'ACADEMY') return;
    try {
      const res = await apiClient('/academies/welcome-emails/pending');
      const data = await res.json();
      if (data.success) {
        setPendingWelcomeStudents(data.data.students ?? 0);
      }
    } catch {
      // Non-critical — ignore errors
    }
  }, [role]);

  useEffect(() => {
    loadPendingWelcome();
  }, [loadPendingWelcome]);

  const sendStudentWelcomeEmails = useCallback(async (): Promise<{ sent: number; failed: number }> => {
    setSendingWelcome(true);
    try {
      const res = await apiClient('/academies/welcome-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'STUDENT' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error sending emails');
      setPendingWelcomeStudents(0);
      return data.data;
    } finally {
      setSendingWelcome(false);
    }
  }, []);

  return {
    students: visibleStudents,
    academies,
    loading,
    academyName,
    paymentStatus,
    userEmail,
    searchQuery,
    setSearchQuery,
    selectedAcademy,
    setSelectedAcademy,
    selectedClass,
    setSelectedClass,
    filteredClasses,
    activePeriodId,
    isClassInPeriod,
    handleBanStudent,
    pendingWelcomeStudents,
    sendingWelcome,
    sendStudentWelcomeEmails,
  };
}
