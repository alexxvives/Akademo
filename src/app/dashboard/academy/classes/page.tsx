'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { generateDemoClasses, generateDemoTeachers, generateDemoZoomAccounts } from '@/lib/demo-data';
import { SkeletonClasses } from '@/components/ui/SkeletonLoader';

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
  teacherName: string | null;
  teacherEmail: string | null;
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
}

export default function AcademyClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [zoomAccounts, setZoomAccounts] = useState<ZoomAccount[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');
  const [allowMultipleTeachers, setAllowMultipleTeachers] = useState<boolean>(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({ 
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
    startDate: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [paymentOptionsError, setPaymentOptionsError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [classesRes, teachersRes, academiesRes, zoomRes] = await Promise.all([
        apiClient('/academies/classes'),
        apiClient('/academies/teachers'),
        apiClient('/academies'),
        apiClient('/zoom-accounts')
      ]);
      
      // Load academy info first to check payment status
      if (academiesRes.ok) {
        const academiesJson = await academiesRes.json();
        if (academiesJson.success && Array.isArray(academiesJson.data) && academiesJson.data.length > 0) {
          const academy = academiesJson.data[0];
          setAcademyName(academy.name);
          const status = academy.paymentStatus || 'NOT PAID';
          setPaymentStatus(status);
          setAllowMultipleTeachers(academy.allowMultipleTeachers === 1);
          setFeedbackEnabled(academy.feedbackEnabled !== 0);
          
          // If NOT PAID, show demo data
          if (status === 'NOT PAID') {
            const demoClasses = generateDemoClasses();
            const demoTeachers = generateDemoTeachers();
            
            setClasses(demoClasses.map(c => ({
              id: c.id,
              name: c.name,
              slug: c.name.toLowerCase().replace(/\s+/g, '-'),
              description: c.description,
              teacherName: c.teacherName,
              teacherEmail: demoTeachers.find(t => t.id === c.teacherId)?.email || null,
              teacherId: c.teacherId,
              teacherFirstName: demoTeachers.find(t => t.id === c.teacherId)?.firstName,
              teacherLastName: demoTeachers.find(t => t.id === c.teacherId)?.lastName,
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
            })));
            
            // Load demo zoom accounts so the edit modal can show them
            setZoomAccounts(generateDemoZoomAccounts());
            
            setTeachers(demoTeachers.map(t => ({
              id: t.id,
              userId: t.id,
              firstName: t.firstName,
              lastName: t.lastName,
              email: t.email,
            })));
            
            setLoading(false);
            return;
          }
        }
      }
      
      // Load real data if PAID
      if (classesRes.ok) {
        const json = await classesRes.json();
        // API returns { success: true, data: [...] }
        const data = json.success && json.data ? json.data : json;
        setClasses(Array.isArray(data) ? data : []);
      }
      
      if (teachersRes.ok) {
        const json = await teachersRes.json();
        // API returns { success: true, data: [...] }
        const teacherData = json.success && json.data ? json.data : json;
        setTeachers(Array.isArray(teacherData) ? teacherData.map((t: TeacherApiItem) => ({
          id: t.id,
          userId: t.id, // The teacher user id
          firstName: t.name?.split(' ')[0] || '',
          lastName: t.name?.split(' ').slice(1).join(' ') || '',
          email: t.email || ''
        })) : []);
      }
      
      if (zoomRes.ok) {
        const json = await zoomRes.json();
        if (json.success && json.data) {
          setZoomAccounts(json.data);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPaymentOptionsError(false);
    
    // Block creation for demo academy (NOT PAID status)
    if (paymentStatus === 'NOT PAID') {
      setError('Activa tu academia para crear clases reales');
      return;
    }
    
    // Validation: at least one payment option must be selected
    if (!formData.allowMonthly && !formData.allowOneTime) {
      setPaymentOptionsError(true);
      setError('Debes seleccionar al menos una opción de pago');
      return;
    }
    
    // Validation: if payment option is selected, price must be filled in
    if (formData.allowMonthly && (!formData.monthlyPrice || parseFloat(formData.monthlyPrice) <= 0)) {
      setPaymentOptionsError(true);
      setError('Debes ingresar el precio mensual');
      return;
    }
    
    if (formData.allowOneTime && (!formData.oneTimePrice || parseFloat(formData.oneTimePrice) <= 0)) {
      setPaymentOptionsError(true);
      setError('Debes ingresar el precio del pago único');
      return;
    }
    
    // Validation: start date is required
    if (!formData.startDate) {
      setError('Debes ingresar la fecha de inicio');
      return;
    }
    
    setSaving(true);

    try {
      // Get academy ID first
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
          academyId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error creating class');
      }

      setShowCreateModal(false);
      setFormData({ 
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
        startDate: ''
      });
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la clase');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    setError('');
    
    // Block editing for demo academy (NOT PAID status)
    if (paymentStatus === 'NOT PAID') {
      setError('Activa tu academia para editar clases reales');
      return;
    }
    
    
    // Validate payment options
    if (!formData.allowMonthly && !formData.allowOneTime) {
      setPaymentOptionsError(true);
      setError('Debes seleccionar al menos una opción de pago');
      return;
    }
    
    // Validation: if payment option is selected, price must be filled in
    if (formData.allowMonthly && (!formData.monthlyPrice || parseFloat(formData.monthlyPrice) <= 0)) {
      setPaymentOptionsError(true);
      setError('Debes ingresar el precio mensual');
      return;
    }
    
    if (formData.allowOneTime && (!formData.oneTimePrice || parseFloat(formData.oneTimePrice) <= 0)) {
      setPaymentOptionsError(true);
      setError('Debes ingresar el precio del pago único');
      return;
    }
    
    // Validation: start date is required
    if (!formData.startDate) {
      setError('Debes ingresar la fecha de inicio');
      return;
    }
    
    setPaymentOptionsError(false);
    
    setSaving(true);

    try {
      const body = JSON.stringify({
        name: formData.name,
        description: formData.description,
        teacherId: formData.teacherId,
        monthlyPrice: formData.allowMonthly ? parseFloat(formData.monthlyPrice) || null : null,
        oneTimePrice: formData.allowOneTime ? parseFloat(formData.oneTimePrice) || null : null,
        zoomAccountId: formData.zoomAccountId || null,
        whatsappGroupLink: formData.whatsappGroupLink || null,
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
        startDate: formData.startDate || null,
      });
      
      const res = await apiClient(`/classes/${editingClass.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error updating class');
      }

      setShowEditModal(false);
      setEditingClass(null);
      setFormData({
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
        startDate: ''
      });
      setPaymentOptionsError(false);  // Reset validation error
      await loadData();  // Wait for data to refresh before allowing next edit
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la clase');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (cls: Class) => {
    setEditingClass(cls);
    const monthlyPriceValue = cls.monthlyPrice;
    const oneTimePriceValue = cls.oneTimePrice;
    
    setFormData({
      name: cls.name,
      description: cls.description || '',
      teacherId: cls.teacherId || '',
      monthlyPrice: monthlyPriceValue?.toString() || '',
      oneTimePrice: oneTimePriceValue?.toString() || '',
      // Determine active payment options based on whether prices exist
      allowMonthly: monthlyPriceValue != null && monthlyPriceValue > 0,
      allowOneTime: oneTimePriceValue != null && oneTimePriceValue > 0,
      zoomAccountId: cls.zoomAccountId || '',
      whatsappGroupLink: cls.whatsappGroupLink || '',
      maxStudents: cls.maxStudents?.toString() || '',
      startDate: cls.startDate || ''
    });
    setError('');
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setFormData({ 
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
      startDate: ''
    });
    setError('');
    setShowCreateModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Asignaturas</h1>
            {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
          </div>
          <button
            onClick={openCreateModal}
            disabled={teachers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            title={teachers.length === 0 ? 'Debes tener al menos un profesor para crear clases' : ''}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Clase
          </button>
        </div>



        {loading ? (
          <SkeletonClasses />
        ) : classes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay clases registradas</h3>
            <p className="text-gray-600 mb-4">Crea tu primera clase y asigna un profesor.</p>
            {teachers.length > 0 && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Primera Clase
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 pb-8">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/dashboard/academy/class/${cls.slug || cls.id}`}
                className="block bg-white rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:shadow-xl transition-all p-6 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                        {cls.name}
                      </h3>
                      {feedbackEnabled && cls.avgRating != null && cls.avgRating > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          <svg className="w-5 h-5 text-amber-500 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-bold text-gray-900">{cls.avgRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    {cls.description ? (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic mb-4">Sin descripción</p>
                    )}

                    {/* Profesor at top of stats */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <span className="font-medium">Profesor:</span>
                      <span>
                        {cls.teacherFirstName && cls.teacherLastName 
                          ? `${cls.teacherFirstName} ${cls.teacherLastName}` 
                          : 'Sin asignar'
                        }
                      </span>
                    </div>

                    {/* Stats - Date + Zoom badge */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {cls.startDate 
                          ? new Date(cls.startDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                          : new Date(cls.createdAt || Date.now()).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                        }
                      </span>
                      {cls.zoomAccountName ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full">
                          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs font-medium text-green-700">{cls.zoomAccountName}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-full">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-xs font-medium text-gray-500">Sin Zoom</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openEditModal(cls);
                    }}
                    className="ml-4 p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Editar clase"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Clase</h2>
            
            <form onSubmit={handleCreateClass} className="space-y-4">
              {/* Row 1: Name and Teacher */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la clase *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profesor asignado (opcional)
                  </label>
                  <div className="relative">
                    <select
                      value={formData.teacherId}
                      onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                      className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="">Sin profesor asignado (asignar después)</option>
                      {teachers
                        .filter(teacher => {
                          // If allowMultipleTeachers is false, filter out already assigned teachers
                          if (!allowMultipleTeachers) {
                            return !classes.some(cls => cls.teacherId === teacher.userId);
                          }
                          return true;
                        })
                        .map((teacher) => (
                          <option key={teacher.userId} value={teacher.userId}>
                            {teacher.firstName} {teacher.lastName} ({teacher.email})
                          </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo de estudiantes (opcional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                    placeholder="Ej: 30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Dejar vacío para sin límite</p>
                </div>
              </div>

              {/* Row 2: Description - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Pricing Options - Redesigned */}
              <div className="space-y-4 p-4 rounded-xl transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 group relative">
                    <label className="block text-sm font-medium text-gray-900">
                      Opciones de pago *
                    </label>
                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <div className="absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <p className="font-medium mb-1">💡 Consejo:</p>
                      <p>Si seleccionas ambas opciones, los estudiantes podrán elegir entre pago mensual o pago único al inscribirse.</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full transition-all ${
                    paymentOptionsError 
                      ? 'bg-red-100 text-red-700 border-2 border-red-400 font-medium' 
                      : 'text-gray-500 bg-gray-100'
                  }`}>
                    Selecciona al menos una
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Monthly Price Card */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allowMonthly: !formData.allowMonthly })}
                    className={`relative p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                      formData.allowMonthly
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          formData.allowMonthly ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {formData.allowMonthly && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm font-semibold ${formData.allowMonthly ? 'text-blue-900' : 'text-gray-700'}`}>
                          Pago Mensual
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monthlyPrice}
                        onChange={(e) => {
                          e.stopPropagation();
                          setFormData({ ...formData, monthlyPrice: e.target.value, allowMonthly: true });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm font-medium transition-all ${
                          formData.allowMonthly
                            ? 'border-blue-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                        placeholder="10.00"
                        disabled={!formData.allowMonthly}
                      />
                    </div>
                    <p className={`text-xs mt-2 ${formData.allowMonthly ? 'text-blue-700' : 'text-gray-500'}`}>
                      Cobro recurrente mensual
                    </p>
                  </button>

                  {/* One-Time Price Card */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allowOneTime: !formData.allowOneTime })}
                    className={`relative p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                      formData.allowOneTime
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          formData.allowOneTime ? 'border-green-500 bg-green-500' : 'border-gray-300'
                        }`}>
                          {formData.allowOneTime && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm font-semibold ${formData.allowOneTime ? 'text-green-900' : 'text-gray-700'}`}>
                          Pago Único
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.oneTimePrice}
                        onChange={(e) => {
                          e.stopPropagation();
                          setFormData({ ...formData, oneTimePrice: e.target.value, allowOneTime: true });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm font-medium transition-all ${
                          formData.allowOneTime
                            ? 'border-green-300 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                        placeholder="100.00"
                        disabled={!formData.allowOneTime}
                      />
                    </div>
                    <p className={`text-xs mt-2 ${formData.allowOneTime ? 'text-green-700' : 'text-gray-500'}`}>
                      Pago único, acceso vitalicio
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuenta de Zoom (opcional)
                </label>
                <div className="relative">
                  <select
                    value={formData.zoomAccountId}
                    onChange={(e) => setFormData({ ...formData, zoomAccountId: e.target.value })}
                    className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin cuenta de Zoom</option>
                    {zoomAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.accountName}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {zoomAccounts.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay cuentas de Zoom conectadas. <a href="/dashboard/academy/profile" className="text-blue-600 hover:underline">Conectar cuenta</a>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enlace de grupo de WhatsApp (opcional)
                </label>
                <input
                  type="url"
                  value={formData.whatsappGroupLink}
                  onChange={(e) => setFormData({ ...formData, whatsappGroupLink: e.target.value })}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                >
                  {saving ? 'Creando...' : 'Crear Clase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && editingClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Editar Clase</h2>
            
            <form onSubmit={handleEditClass} className="space-y-4">
              {/* Row 1: Name and Teacher */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la clase *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profesor asignado (opcional)
                  </label>
                  <div className="relative">
                    <select
                      value={formData.teacherId}
                      onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                      className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="">Sin profesor asignado (asignar después)</option>
                      {teachers
                        .filter(teacher => {
                          // If allowMultipleTeachers is false, filter out already assigned teachers (except current)
                          if (!allowMultipleTeachers && editingClass) {
                            return teacher.userId === editingClass.teacherId || !classes.some(cls => cls.teacherId === teacher.userId);
                          }
                          return true;
                        })
                        .map((teacher) => (
                          <option key={teacher.userId} value={teacher.userId}>
                            {teacher.firstName} {teacher.lastName} ({teacher.email})
                          </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Description - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              {/* Pricing Options - Redesigned */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 group relative">
                    <label className="block text-sm font-medium text-gray-900">
                      Opciones de pago *
                    </label>
                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <div className="absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <p className="font-medium mb-1">💡 Consejo:</p>
                      <p>Si seleccionas ambas opciones, los estudiantes podrán elegir entre pago mensual o pago único al inscribirse.</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full transition-all ${
                    paymentOptionsError 
                      ? 'bg-red-100 text-red-700 border-2 border-red-400 font-medium' 
                      : 'text-gray-500 bg-gray-100'
                  }`}>
                    Selecciona al menos una
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Monthly Price Card */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allowMonthly: !formData.allowMonthly })}
                    className={`relative p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                      formData.allowMonthly
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          formData.allowMonthly ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {formData.allowMonthly && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm font-semibold ${formData.allowMonthly ? 'text-blue-900' : 'text-gray-700'}`}>
                          Pago Mensual
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monthlyPrice}
                        onChange={(e) => {
                          e.stopPropagation();
                          setFormData({ ...formData, monthlyPrice: e.target.value, allowMonthly: true });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm font-medium transition-all ${
                          formData.allowMonthly
                            ? 'border-blue-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                        placeholder="10.00"
                        disabled={!formData.allowMonthly}
                      />
                    </div>
                    <p className={`text-xs mt-2 ${formData.allowMonthly ? 'text-blue-700' : 'text-gray-500'}`}>
                      Cobro recurrente mensual
                    </p>
                  </button>

                  {/* One-Time Price Card */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allowOneTime: !formData.allowOneTime })}
                    className={`relative p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                      formData.allowOneTime
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          formData.allowOneTime ? 'border-green-500 bg-green-500' : 'border-gray-300'
                        }`}>
                          {formData.allowOneTime && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm font-semibold ${formData.allowOneTime ? 'text-green-900' : 'text-gray-700'}`}>
                          Pago Único
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.oneTimePrice}
                        onChange={(e) => {
                          e.stopPropagation();
                          setFormData({ ...formData, oneTimePrice: e.target.value, allowOneTime: true });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm font-medium transition-all ${
                          formData.allowOneTime
                            ? 'border-green-300 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                        placeholder="100.00"
                        disabled={!formData.allowOneTime}
                      />
                    </div>
                    <p className={`text-xs mt-2 ${formData.allowOneTime ? 'text-green-700' : 'text-gray-500'}`}>
                      Pago único, acceso vitalicio
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuenta de Zoom (opcional)
                </label>
                <div className="relative">
                  <select
                    value={formData.zoomAccountId}
                    onChange={(e) => setFormData({ ...formData, zoomAccountId: e.target.value })}
                    className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin cuenta de Zoom</option>
                    {zoomAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.accountName}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {zoomAccounts.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay cuentas de Zoom conectadas. <a href="/dashboard/academy/profile" className="text-blue-600 hover:underline">Conectar cuenta</a>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enlace de grupo de WhatsApp (opcional)
                </label>
                <input
                  type="url"
                  value={formData.whatsappGroupLink}
                  onChange={(e) => setFormData({ ...formData, whatsappGroupLink: e.target.value })}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo de estudiantes (opcional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                    placeholder="Ej: 30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Dejar vacío para sin límite</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingClass(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
