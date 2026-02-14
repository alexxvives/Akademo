'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { generateDemoClasses, generateDemoTeachers, generateDemoZoomAccounts } from '@/lib/demo-data';
import { SkeletonClasses } from '@/components/ui/SkeletonLoader';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { ClassFormModal } from './ClassFormModal';

interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ZoomAccount {
  id: string;
  accountName: string;
  accountId: string;
}

interface TeacherApiItem {
  id: string;
  name?: string | null;
  email?: string | null;
}

interface Class {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  academyId?: string;
  academyName?: string;
  teacherName: string | null;
  teacherEmail?: string | null;
  teacherId: string | null;
  teacherFirstName?: string;
  teacherLastName?: string;
  studentCount: number;
  videoCount: number;
  lessonCount: number;
  documentCount: number;
  avgRating?: number | null;
  createdAt?: string;
  monthlyPrice?: number | null;
  oneTimePrice?: number | null;
  zoomAccountId?: string | null;
  zoomAccountName?: string | null;
  whatsappGroupLink?: string | null;
  maxStudents?: number | null;
  startDate?: string | null;
  university?: string | null;
  carrera?: string | null;
}

interface Academy {
  id: string;
  name: string;
}

interface ClassFormData {
  name: string;
  description: string;
  teacherId: string;
  monthlyPrice: string;
  oneTimePrice: string;
  allowMonthly: boolean;
  allowOneTime: boolean;
  zoomAccountId: string;
  whatsappGroupLink: string;
  maxStudents: string;
  startDate: string;
  university: string;
  carrera: string;
}

const emptyForm: ClassFormData = {
  name: '',
  description: '',
  teacherId: '',
  monthlyPrice: '',
  oneTimePrice: '',
  allowMonthly: true,
  allowOneTime: false,
  zoomAccountId: '',
  whatsappGroupLink: '',
  maxStudents: '',
  startDate: '',
  university: '',
  carrera: '',
};

interface ClassesPageProps {
  role: 'ACADEMY' | 'ADMIN';
}

export function ClassesPage({ role }: ClassesPageProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [zoomAccounts, setZoomAccounts] = useState<ZoomAccount[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');
  const [allowMultipleTeachers, setAllowMultipleTeachers] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState<ClassFormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [paymentOptionsError, setPaymentOptionsError] = useState(false);

  // Admin-only
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const isDemo = role === 'ACADEMY' && paymentStatus === 'NOT PAID';

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
            setAllowMultipleTeachers(academy.allowMultipleTeachers === 1);

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
      } else {
        // ADMIN
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
          const data = json.success && json.data ? json.data : json;
          setAcademies(Array.isArray(data) ? data : []);
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

  const filteredClasses =
    role === 'ADMIN' && selectedAcademy !== 'all'
      ? classes.filter((c) => c.academyId === selectedAcademy)
      : role === 'ACADEMY' && selectedClassId !== 'all'
        ? classes.filter((c) => c.id === selectedClassId)
        : classes;

  // --- CRUD handlers (Academy only) ---
  const validateForm = (): boolean => {
    setError('');
    setPaymentOptionsError(false);
    if (isDemo) {
      setError('Activa tu academia para gestionar asignaturas reales');
      return false;
    }
    if (!formData.allowMonthly && !formData.allowOneTime) {
      setPaymentOptionsError(true);
      setError('Debes seleccionar al menos una opción de pago');
      return false;
    }
    if (formData.allowMonthly && (!formData.monthlyPrice || parseFloat(formData.monthlyPrice) <= 0)) {
      setPaymentOptionsError(true);
      setError('Debes ingresar el precio mensual');
      return false;
    }
    if (formData.allowOneTime && (!formData.oneTimePrice || parseFloat(formData.oneTimePrice) <= 0)) {
      setPaymentOptionsError(true);
      setError('Debes ingresar el precio del pago único');
      return false;
    }
    if (!formData.startDate) {
      setError('Debes ingresar la fecha de inicio');
      return false;
    }
    return true;
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const academiesRes = await apiClient('/academies');
      const academiesResult = await academiesRes.json();
      if (!academiesResult.success || !academiesResult.data || academiesResult.data.length === 0) {
        throw new Error('No academy found');
      }
      const academyId = academiesResult.data[0].id;
      const res = await apiClient('/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          teacherId: formData.teacherId,
          monthlyPrice: formData.allowMonthly ? parseFloat(formData.monthlyPrice) || null : null,
          oneTimePrice: formData.allowOneTime ? parseFloat(formData.oneTimePrice) || null : null,
          allowMonthly: formData.allowMonthly ? 1 : 0,
          allowOneTime: formData.allowOneTime ? 1 : 0,
          zoomAccountId: formData.zoomAccountId || null,
          whatsappGroupLink: formData.whatsappGroupLink || null,
          maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
          startDate: formData.startDate || null,
          university: formData.university || null,
          carrera: formData.carrera || null,
          academyId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creating class');
      setShowCreateModal(false);
      setFormData({ ...emptyForm });
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la clase');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !validateForm()) return;
    setSaving(true);
    try {
      const res = await apiClient(`/classes/${editingClass.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          teacherId: formData.teacherId,
          monthlyPrice: formData.allowMonthly ? parseFloat(formData.monthlyPrice) || null : null,
          oneTimePrice: formData.allowOneTime ? parseFloat(formData.oneTimePrice) || null : null,
          zoomAccountId: formData.zoomAccountId || null,
          whatsappGroupLink: formData.whatsappGroupLink || null,
          maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
          startDate: formData.startDate || null,
          university: formData.university || null,
          carrera: formData.carrera || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error updating class');
      setShowEditModal(false);
      setEditingClass(null);
      setFormData({ ...emptyForm });
      setPaymentOptionsError(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la clase');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      description: cls.description || '',
      teacherId: cls.teacherId || '',
      monthlyPrice: cls.monthlyPrice?.toString() || '',
      oneTimePrice: cls.oneTimePrice?.toString() || '',
      allowMonthly: cls.monthlyPrice != null && cls.monthlyPrice > 0,
      allowOneTime: cls.oneTimePrice != null && cls.oneTimePrice > 0,
      zoomAccountId: cls.zoomAccountId || '',
      whatsappGroupLink: cls.whatsappGroupLink || '',
      maxStudents: cls.maxStudents?.toString() || '',
      startDate: cls.startDate || '',
      university: cls.university || '',
      carrera: cls.carrera || '',
    });
    setError('');
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setFormData({ ...emptyForm });
    setError('');
    setShowCreateModal(true);
  };

  const dashboardBase = role === 'ACADEMY' ? '/dashboard/academy' : '/dashboard/admin';

  if (loading) {
    return <SkeletonClasses />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Asignaturas</h1>
            {role === 'ACADEMY' && academyName && (
              <p className="text-sm text-gray-500 mt-1">{academyName}</p>
            )}
            {role === 'ADMIN' && (
              <p className="text-sm text-gray-500 mt-1">AKADEMO PLATFORM</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Admin: academy filter */}
            {role === 'ADMIN' && academies.length > 0 && (
              <div className="relative">
                <select
                  value={selectedAcademy}
                  onChange={(e) => setSelectedAcademy(e.target.value)}
                  className="appearance-none w-full md:w-64 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las Academias</option>
                  {academies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
            {/* Academy: class filter */}
            {role === 'ACADEMY' && classes.length > 1 && (
              <ClassSearchDropdown
                classes={classes}
                value={selectedClassId}
                onChange={setSelectedClassId}
                allLabel="Todas las asignaturas"
                className="w-56"
              />
            )}
            {role === 'ACADEMY' && (
              <button
                onClick={openCreateModal}
                disabled={teachers.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                title={teachers.length === 0 ? 'Debes tener al menos un profesor para crear asignaturas' : ''}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Asignatura
              </button>
            )}
          </div>
        </div>

        {filteredClasses.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay asignaturas registradas</h3>
            <p className="text-gray-600 mb-4">
              {role === 'ADMIN'
                ? selectedAcademy === 'all'
                  ? 'No hay clases en la plataforma aún.'
                  : 'No hay clases en esta academia.'
                : 'Crea tu primera asignatura y asigna un profesor.'}
            </p>
            {role === 'ACADEMY' && teachers.length > 0 && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Primera Asignatura
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 pb-8">
            {filteredClasses.map((cls) => (
              <Link
                key={cls.id}
                href={`${dashboardBase}/class/${cls.slug || cls.id}`}
                className="block bg-white rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:shadow-xl transition-all p-6 group cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                        {cls.name}
                      </h3>
                      {(cls.university || cls.carrera) && (
                        <span className="text-sm text-gray-400 font-normal">
                          {[cls.university, cls.carrera].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      {/* WhatsApp link */}
                      {cls.whatsappGroupLink && (
                        <a
                          href={cls.whatsappGroupLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Grupo WhatsApp"
                        >
                          <svg
                            className="w-5 h-5 text-green-500 hover:text-green-600 transition-colors"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </a>
                      )}
                    </div>

                    {cls.description ? (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic mb-4">Sin descripción</p>
                    )}

                    {/* Teacher */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span className="font-medium">Profesor:</span>
                      <span>
                        {cls.teacherFirstName && cls.teacherLastName
                          ? `${cls.teacherFirstName} ${cls.teacherLastName}${role === 'ADMIN' && cls.academyName ? ` (${cls.academyName})` : ''}`
                          : cls.teacherName
                            ? `${cls.teacherName}${role === 'ADMIN' && cls.academyName ? ` (${cls.academyName})` : ''}`
                            : 'Sin asignar'}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      {/* Start date - both roles */}
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {cls.startDate
                          ? new Date(cls.startDate + 'T00:00:00').toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : new Date(cls.createdAt || Date.now()).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                      </span>
                      {/* Student count - both roles */}
                      {cls.studentCount !== undefined && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                          <span className="font-semibold text-gray-700">{cls.studentCount}</span> Estudiante
                          {cls.studentCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side (academy: edit + zoom badge) */}
                  {role === 'ACADEMY' && (
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEditModal(cls);
                        }}
                        className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Editar asignatura"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      {cls.zoomAccountName ? (
                        <span className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                          <svg
                            className="w-[18px] h-[18px] text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-sm font-medium text-green-700">{cls.zoomAccountName}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                          <svg
                            className="w-[18px] h-[18px] text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span className="text-sm font-medium text-gray-500">Sin Zoom</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Academy: Create Modal */}
      {role === 'ACADEMY' && showCreateModal && (
        <ClassFormModal
          mode="create"
          formData={formData}
          setFormData={setFormData}
          teachers={teachers}
          zoomAccounts={zoomAccounts}
          classes={classes}
          allowMultipleTeachers={allowMultipleTeachers}
          editingClass={null}
          saving={saving}
          error={error}
          paymentOptionsError={paymentOptionsError}
          isDemo={isDemo}
          onSubmit={handleCreateClass}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Academy: Edit Modal */}
      {role === 'ACADEMY' && showEditModal && editingClass && (
        <ClassFormModal
          mode="edit"
          formData={formData}
          setFormData={setFormData}
          teachers={teachers}
          zoomAccounts={zoomAccounts}
          classes={classes}
          allowMultipleTeachers={allowMultipleTeachers}
          editingClass={editingClass}
          saving={saving}
          error={error}
          paymentOptionsError={paymentOptionsError}
          isDemo={isDemo}
          onSubmit={handleEditClass}
          onClose={() => {
            setShowEditModal(false);
            setEditingClass(null);
          }}
        />
      )}
    </>
  );
}
