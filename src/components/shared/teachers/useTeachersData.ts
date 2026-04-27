import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { generateDemoTeachers, generateDemoClasses, generateDemoPaymentHistory } from '@/lib/demo-data';
import { usePeriod } from '@/contexts/PeriodContext';
import type { Teacher, ClassSummary, Academy } from './types';

export function useTeachersData(role: 'ACADEMY' | 'ADMIN') {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');
  const [academyName, setAcademyName] = useState<string>('');
  const [academyId, setAcademyId] = useState<string>('');
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<string>('ALL');
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ email: '', fullName: '', classId: '' });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editFormData, setEditFormData] = useState({ fullName: '', email: '', classIds: [] as string[] });
  const [updating, setUpdating] = useState(false);
  const [pendingWelcomeTeachers, setPendingWelcomeTeachers] = useState(0);
  const [sendingTeacherWelcome, setSendingTeacherWelcome] = useState(false);

  const isDemo = role === 'ACADEMY' && paymentStatus === 'NOT PAID';
  const { activePeriodId, isClassInPeriod } = usePeriod();

  const toggleExpand = (teacherId: string) => {
    setExpandedTeachers((prev) => {
      const next = new Set(prev);
      if (next.has(teacherId)) next.delete(teacherId);
      else next.add(teacherId);
      return next;
    });
  };

  const loadTeachers = useCallback(async () => {
    try {
      if (role === 'ACADEMY') {
        const [teachersRes, academiesRes] = await Promise.all([
          apiClient('/academies/teachers'),
          apiClient('/academies'),
        ]);

        const academiesJson = await academiesRes.json();
        if (academiesJson.success && Array.isArray(academiesJson.data) && academiesJson.data.length > 0) {
          const academy = academiesJson.data[0];
          setAcademyName(academy.name);
          setAcademyId(academy.id);
          const status = academy.paymentStatus || 'NOT PAID';
          setPaymentStatus(status);

          if (status === 'NOT PAID') {
            const demoTeachers = generateDemoTeachers();
            const demoClasses = generateDemoClasses();
            const demoPayments = generateDemoPaymentHistory();
            setTeachers(
              demoTeachers.map((t) => {
                const teacherFullName = `${t.firstName} ${t.lastName}`;
                const teacherClasses = demoClasses
                  .filter((c) => c.teacherId === t.id)
                  .map((c) => ({ id: c.id, name: c.name, studentCount: c.studentCount }));
                const teacherClassIds = new Set(teacherClasses.map((c) => c.id));
                const totalRevenue = Math.round(
                  demoPayments
                    .filter((p) => p.classId && teacherClassIds.has(p.classId) && p.paymentStatus === 'PAID')
                    .reduce((sum, p) => sum + p.paymentAmount, 0) * 100
                ) / 100;
                return {
                  id: t.id,
                  name: teacherFullName,
                  email: t.email,
                  classCount: teacherClasses.length,
                  studentCount: teacherClasses.reduce((sum, c) => sum + c.studentCount, 0),
                  classes: teacherClasses,
                  createdAt: new Date().toISOString(),
                  totalRevenue,
                };
              })
            );
            setLoading(false);
            return;
          }
        }

        const teachersJson = await teachersRes.json();
        const data = teachersJson.success && teachersJson.data ? teachersJson.data : teachersJson;
        setTeachers(Array.isArray(data) ? data : []);
      } else {
        const [teachersRes, academiesRes] = await Promise.all([
          apiClient('/admin/teachers'),
          apiClient('/admin/academies'),
        ]);

        const [teachersResult, academiesResult] = await Promise.all([
          teachersRes.json(),
          academiesRes.json(),
        ]);

        if (teachersResult.success) {
          interface AdminTeacher {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            academyName?: string;
            classCount: number;
            classNames?: string;
            studentCount: number;
            createdAt: string;
          }
          const teachersData: Teacher[] = (teachersResult.data || []).map((t: AdminTeacher) => ({
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
            email: t.email,
            academyName: t.academyName,
            classCount: t.classCount || 0,
            studentCount: t.studentCount || 0,
            classes: t.classNames
              ? t.classNames.split(',').map((n: string) => ({ name: n.trim() }))
              : [],
            createdAt: t.createdAt,
          }));
          setTeachers(teachersData);
        }
        if (academiesResult.success) {
          setAcademies(
            ((academiesResult.data || []) as { id: string; name: string; paymentStatus?: string }[])
              .filter(a => a.paymentStatus === 'PAID')
              .map((a) => ({ id: a.id, name: a.name }))
          );
        }
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  const loadClasses = useCallback(async () => {
    if (role !== 'ACADEMY') return;
    try {
      const res = await apiClient('/academies/classes');
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setClasses(result.data as ClassSummary[]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  }, [role]);

  useEffect(() => {
    loadTeachers();
    if (role === 'ACADEMY') loadClasses();
  }, [loadTeachers, loadClasses, role]);

  // For ACADEMY role, fetch pending welcome email count for teachers
  const loadPendingWelcomeTeachers = useCallback(async () => {
    if (role !== 'ACADEMY') return;
    try {
      const res = await apiClient('/academies/welcome-emails/pending');
      const data = await res.json();
      if (data.success) {
        setPendingWelcomeTeachers(data.data.teachers ?? 0);
      }
    } catch {
      // Non-critical
    }
  }, [role]);

  useEffect(() => {
    loadPendingWelcomeTeachers();
  }, [loadPendingWelcomeTeachers]);

  const sendTeacherWelcomeEmails = useCallback(async (): Promise<{ sent: number; failed: number }> => {
    setSendingTeacherWelcome(true);
    try {
      const res = await apiClient('/academies/welcome-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'TEACHER' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error sending emails');
      setPendingWelcomeTeachers(0);
      return data.data;
    } finally {
      setSendingTeacherWelcome(false);
    }
  }, []);

  const filteredTeachers = useMemo(() => {
    let result = teachers;

    if (role === 'ADMIN' && selectedAcademy !== 'ALL') {
      const academy = academies.find((a) => a.id === selectedAcademy);
      result = result.filter((t) => t.academyName === academy?.name);
    }

    if (role === 'ACADEMY' && activePeriodId !== 'all') {
      if (classes.length > 0) {
        const periodIds = new Set(classes.filter(c => isClassInPeriod(c.startDate)).map(c => c.id));
        result = result.filter(t => t.classes.some(c => c.id && periodIds.has(c.id)));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [teachers, role, selectedAcademy, academies, searchQuery, classes, activePeriodId, isClassInPeriod]);

  return {
    teachers, loading, expandedTeachers, paymentStatus, academyName, academyId,
    academies, selectedAcademy, setSelectedAcademy,
    classes, copiedId, setCopiedId,
    showCreateModal, setShowCreateModal,
    creating, setCreating,
    formData, setFormData,
    deleting, setDeleting,
    showEditModal, setShowEditModal,
    editingTeacher, setEditingTeacher,
    searchQuery, setSearchQuery,
    editFormData, setEditFormData,
    updating, setUpdating,
    isDemo, activePeriodId, isClassInPeriod,
    toggleExpand, loadTeachers, filteredTeachers,
    pendingWelcomeTeachers, sendingTeacherWelcome, sendTeacherWelcomeEmails,
  };
}
