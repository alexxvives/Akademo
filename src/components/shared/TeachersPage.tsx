'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { generateDemoTeachers, generateDemoClasses } from '@/lib/demo-data';
import { SkeletonList } from '@/components/ui/SkeletonLoader';

interface TeacherClass {
  id?: string;
  name: string;
  studentCount?: number;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  academyName?: string;
  classCount: number;
  studentCount: number;
  classes: TeacherClass[];
  createdAt: string;
}

interface ClassSummary {
  id: string;
  name: string;
}

interface Academy {
  id: string;
  name: string;
}

interface TeachersPageProps {
  role: 'ACADEMY' | 'ADMIN';
}

export function TeachersPage({ role }: TeachersPageProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT PAID');
  const [academyName, setAcademyName] = useState<string>('');

  // Admin-only
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<string>('ALL');

  // Academy CRUD state
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ email: '', fullName: '', classId: '' });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editFormData, setEditFormData] = useState({ fullName: '', email: '', classId: '' });
  const [updating, setUpdating] = useState(false);

  const isDemo = role === 'ACADEMY' && paymentStatus === 'NOT PAID';

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
          const status = academy.paymentStatus || 'NOT PAID';
          setPaymentStatus(status);

          if (status === 'NOT PAID') {
            const demoTeachers = generateDemoTeachers();
            const demoClasses = generateDemoClasses();
            setTeachers(
              demoTeachers.map((t) => {
                const teacherClasses = demoClasses
                  .filter((c) => c.teacherId === t.id)
                  .map((c) => ({ id: c.id, name: c.name, studentCount: c.studentCount }));
                return {
                  id: t.id,
                  name: `${t.firstName} ${t.lastName}`,
                  email: t.email,
                  classCount: teacherClasses.length,
                  studentCount: teacherClasses.reduce((sum, c) => sum + c.studentCount, 0),
                  classes: teacherClasses,
                  createdAt: new Date().toISOString(),
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
        // ADMIN
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
            (academiesResult.data || []).map((a: { id: string; name: string }) => ({
              id: a.id,
              name: a.name,
            }))
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

  // --- Academy CRUD handlers ---
  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${teacherName}?`)) return;
    setDeleting(teacherId);
    try {
      const res = await apiClient(`/users/teacher/${teacherId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadTeachers();
      } else {
        const error = await res.json();
        alert(error.error || 'Error al eliminar profesor');
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Error al eliminar profesor');
    } finally {
      setDeleting(null);
    }
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditFormData({ fullName: teacher.name, email: teacher.email, classId: '' });
    setShowEditModal(true);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setUpdating(true);
    try {
      const res = await apiClient(`/users/teacher/${editingTeacher.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const result = await res.json();
      if (result.success) {
        setShowEditModal(false);
        setEditingTeacher(null);
        await loadTeachers();
      } else {
        alert(result.error || 'Error al actualizar profesor');
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert('Error al actualizar profesor');
    } finally {
      setUpdating(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.fullName) {
      alert('Email y nombre completo son requeridos');
      return;
    }
    setCreating(true);
    try {
      const requestBody: { email: string; fullName: string; password: string; classId?: string } = {
        email: formData.email,
        fullName: formData.fullName,
        password: generateRandomPassword(),
      };
      if (formData.classId) requestBody.classId = formData.classId;

      const res = await apiClient('/academies/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const result = await res.json();
      if (result.success) {
        setShowCreateModal(false);
        setFormData({ email: '', fullName: '', classId: '' });
        loadTeachers();
        alert(
          `Profesor creado exitosamente. Se ha enviado un email a ${formData.email} con las credenciales de acceso.`
        );
      } else {
        alert(result.error || 'Error al crear profesor');
      }
    } catch (error) {
      console.error('Error creating teacher:', error);
      alert('Error al crear profesor');
    } finally {
      setCreating(false);
    }
  };

  const copyJoinLink = (teacherId: string) => {
    const link = `${window.location.origin}/join/${teacherId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(teacherId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtering (admin only)
  const filteredTeachers =
    role === 'ADMIN' && selectedAcademy !== 'ALL'
      ? teachers.filter((t) => {
          const academy = academies.find((a) => a.id === selectedAcademy);
          return t.academyName === academy?.name;
        })
      : teachers;

  if (loading) return <SkeletonList rows={10} />;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Profesores</h1>
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
                  className="appearance-none w-full md:w-64 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="ALL">Todas las Academias</option>
                  {academies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
            {/* Academy: create button */}
            {role === 'ACADEMY' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Profesor
              </button>
            )}
          </div>
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay profesores</h3>
            <p className="text-gray-500">
              {role === 'ADMIN'
                ? 'Los profesores aparecerán aquí cuando se registren'
                : 'Los profesores aparecerán aquí cuando se unan a la academia'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <div className="px-3 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs text-gray-600">
                {role === 'ACADEMY'
                  ? 'Haz clic en cualquier fila para editar.'
                  : 'Haz clic en la flecha para ver las asignaturas del profesor.'}
              </span>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profesor
                  </th>
                  {role === 'ADMIN' && (
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Academia
                    </th>
                  )}
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asignaturas
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiantes
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {role === 'ACADEMY' ? 'Unido' : 'Registrado'}
                  </th>
                  {role === 'ACADEMY' && (
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Link de Inscripción
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTeachers.map((teacher) => {
                  const hasClasses = teacher.classes && teacher.classes.length > 0;
                  const isExpanded = expandedTeachers.has(teacher.id);
                  return (
                    <React.Fragment key={teacher.id}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => hasClasses && toggleExpand(teacher.id)}
                      >
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {hasClasses ? (
                              <svg
                                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            ) : (
                              <div className="w-4 h-4 flex-shrink-0" />
                            )}
                            {/* Academy: delete button */}
                            {role === 'ACADEMY' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTeacher(teacher.id, teacher.name);
                                }}
                                disabled={deleting === teacher.id || isDemo}
                                className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                title="Eliminar profesor"
                              >
                                {deleting === teacher.id ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                )}
                              </button>
                            )}
                            {/* Admin: avatar */}
                            {role === 'ADMIN' && (
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-600 font-medium">
                                  {teacher.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div
                              onClick={(e) => {
                                if (role === 'ACADEMY' && !isDemo) {
                                  e.stopPropagation();
                                  openEditModal(teacher);
                                }
                              }}
                            >
                              <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                              <div className="text-sm text-gray-500">{teacher.email}</div>
                            </div>
                          </div>
                        </td>
                        {role === 'ADMIN' && (
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{teacher.academyName || '-'}</span>
                          </td>
                        )}
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{teacher.classCount || 0}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{teacher.studentCount || 0}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {new Date(teacher.createdAt).toLocaleDateString('es')}
                          </span>
                        </td>
                        {role === 'ACADEMY' && (
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyJoinLink(teacher.id);
                              }}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                copiedId === teacher.id
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                              title={`Link para unirse a las asignaturas de ${teacher.name}`}
                            >
                              {copiedId === teacher.id ? (
                                <>
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  Copiado!
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Copiar Link
                                </>
                              )}
                            </button>
                          </td>
                        )}
                      </tr>
                      {/* Expandable class breakdown sub-rows */}
                      {hasClasses &&
                        isExpanded &&
                        teacher.classes.map((cls, idx) => (
                          <tr key={`${teacher.id}-cls-${idx}`} className="bg-gray-50/70">
                            <td
                              className="px-3 sm:px-6 py-3"
                              colSpan={role === 'ADMIN' ? 3 : 2}
                            >
                              <div className={`flex items-center gap-3 ${role === 'ADMIN' ? 'pl-14' : 'pl-12'}`}>
                                <span className="text-xs text-gray-500">↳</span>
                                <span className="text-xs font-medium text-indigo-600">{cls.name}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3">
                              {cls.studentCount !== undefined && (
                                <span className="text-xs text-gray-700">
                                  {cls.studentCount} estudiantes
                                </span>
                              )}
                            </td>
                            <td
                              className="px-3 sm:px-6 py-3"
                              colSpan={role === 'ACADEMY' ? 2 : 1}
                            ></td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Teacher Modal (Academy only) */}
      {role === 'ACADEMY' && showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Crear Nuevo Profesor</h2>
            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej: David Garcia"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Se enviará un email con las credenciales de acceso</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignatura (Opcional)</label>
                <div className="relative">
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="">Sin asignar</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
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
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ email: '', fullName: '', classId: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={creating || isDemo}
                  title={isDemo ? 'Función no disponible en modo demo' : ''}
                >
                  {creating ? 'Creando...' : isDemo ? 'No disponible (Demo)' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal (Academy only) */}
      {role === 'ACADEMY' && showEditModal && editingTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Editar Profesor</h2>
            <form onSubmit={handleUpdateTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignatura (Opcional)</label>
                <div className="relative">
                  <select
                    value={editFormData.classId}
                    onChange={(e) => setEditFormData({ ...editFormData, classId: e.target.value })}
                    className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="">Sin asignar</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
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
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTeacher(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={updating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={updating}
                >
                  {updating ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
