import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { generateDemoClasses, generateDemoTeachers, generateDemoZoomAccounts } from '@/lib/demo-data';
import { usePeriod } from '@/contexts/PeriodContext';
import type { Class, Teacher, ZoomAccount, Academy, ClassFormData, TeacherApiItem } from './types';
import { emptyForm } from './types';

export function useClassesData(role: 'ACADEMY' | 'ADMIN' | 'TEACHER') {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [zoomAccounts, setZoomAccounts] = useState<ZoomAccount[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState<ClassFormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [paymentOptionsError, setPaymentOptionsError] = useState(false);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const isDemo = role === 'ACADEMY' && paymentStatus === 'NOT PAID';
  const { isClassInPeriod, activePeriodId } = usePeriod();

  const loadData = useCallback(async () => {
    try {
      if (role === 'ACADEMY') {
        const [classesRes, teachersRes, academiesRes, zoomRes] = await Promise.all([
          apiClient('/academies/classes'),
          apiClient('/academies/teachers'),
          apiClient('/academies'),
          apiClient('/zoom-accounts'),
        ]);

        if (academiesRes.ok) {
          const academiesJson = await academiesRes.json();
          if (academiesJson.success && Array.isArray(academiesJson.data) && academiesJson.data.length > 0) {
            const academy = academiesJson.data[0];
            setAcademyName(academy.name);
            const status = academy.paymentStatus || 'NOT PAID';
            setPaymentStatus(status);

            if (status === 'NOT PAID') {
              const demoClasses = generateDemoClasses();
              const demoTeachers = generateDemoTeachers();
              setClasses(
                demoClasses.map((c) => ({
                  id: c.id,
                  name: c.name,
                  slug: c.name.toLowerCase().replace(/\s+/g, '-'),
                  description: c.description,
                  teacherName: c.teacherName,
                  teacherEmail: demoTeachers.find((t) => t.id === c.teacherId)?.email || null,
                  teacherId: c.teacherId,
                  teacherFirstName: demoTeachers.find((t) => t.id === c.teacherId)?.firstName,
                  teacherLastName: demoTeachers.find((t) => t.id === c.teacherId)?.lastName,
                  studentCount: c.studentCount,
                  videoCount: c.videoCount,
                  lessonCount: c.videoCount,
                  documentCount: c.documentCount,
                  avgRating: c.avgRating,
                  monthlyPrice: c.monthlyPrice,
                  oneTimePrice: c.oneTimePrice,
                  zoomAccountId: c.zoomAccountId,
                  zoomAccountName: c.zoomAccountName,
                  whatsappGroupLink: c.whatsappGroupLink,
                  maxStudents: c.maxStudents,
                  startDate: c.startDate,
                  university: c.university,
                  carrera: c.carrera,
                }))
              );
              setZoomAccounts(generateDemoZoomAccounts());
              setTeachers(
                demoTeachers.map((t) => ({
                  id: t.id,
                  userId: t.id,
                  firstName: t.firstName,
                  lastName: t.lastName,
                  email: t.email,
                }))
              );
              setLoading(false);
              return;
            }
          }
        }

        if (classesRes.ok) {
          const json = await classesRes.json();
          const data = json.success && json.data ? json.data : json;
          setClasses(Array.isArray(data) ? data : []);
        }
        if (teachersRes.ok) {
          const json = await teachersRes.json();
          const teacherData = json.success && json.data ? json.data : json;
          setTeachers(
            Array.isArray(teacherData)
              ? teacherData.map((t: TeacherApiItem) => ({
                  id: t.id,
                  userId: t.id,
                  firstName: t.name?.split(' ')[0] || '',
                  lastName: t.name?.split(' ').slice(1).join(' ') || '',
                  email: t.email || '',
                }))
              : []
          );
        }
        if (zoomRes.ok) {
          const json = await zoomRes.json();
          if (json.success && json.data) setZoomAccounts(json.data);
        }
      } else if (role === 'TEACHER') {
        const [classesRes, membershipRes] = await Promise.all([
          apiClient('/classes'),
          apiClient('/requests/teacher'),
        ]);
        if (classesRes.ok) {
          const json = await classesRes.json();
          if (json.success) setClasses(json.data || []);
        }
        if (membershipRes.ok) {
          const membershipResult = await membershipRes.json();
          if (Array.isArray(membershipResult) && membershipResult.length > 0) {
            setAcademyName(membershipResult[0].academyName);
          }
        }
      } else {
        const [classesRes, academiesRes] = await Promise.all([
          apiClient('/admin/classes'),
          apiClient('/admin/academies'),
        ]);
        if (classesRes.ok) {
          const json = await classesRes.json();
          const data = json.success && json.data ? json.data : json;
          setClasses(Array.isArray(data) ? data : []);
        }
        if (academiesRes.ok) {
          const json = await academiesRes.json();
          const raw = json.success && json.data ? json.data : json;
          const paid = Array.isArray(raw) ? raw.filter((a: { paymentStatus?: string }) => a.paymentStatus === 'PAID') : [];
          setAcademies(paid);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredClasses = (() => {
    let result =
      role === 'ADMIN' && selectedAcademy !== 'all'
        ? classes.filter((c) => c.academyId === selectedAcademy)
        : role === 'ACADEMY' && selectedClassId !== 'all'
          ? classes.filter((c) => c.id === selectedClassId)
          : classes;
    if (role === 'ACADEMY' && activePeriodId !== 'all') {
      result = result.filter((c) => isClassInPeriod(c.startDate));
    }
    return result;
  })();

  const dashboardBase =
    role === 'ACADEMY' ? '/dashboard/academy' : role === 'TEACHER' ? '/dashboard/teacher' : '/dashboard/admin';

  return {
    classes, teachers, zoomAccounts, academyName, loading,
    showCreateModal, setShowCreateModal, showEditModal, setShowEditModal,
    editingClass, setEditingClass, formData, setFormData,
    saving, setSaving, error, setError,
    paymentOptionsError, setPaymentOptionsError,
    academies, selectedAcademy, setSelectedAcademy,
    selectedClassId, setSelectedClassId,
    isDemo, filteredClasses, dashboardBase, loadData,
    activePeriodId, isClassInPeriod,
  };
}
