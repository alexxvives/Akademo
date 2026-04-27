import type { FormEvent } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Teacher, TeacherClass } from './types';

interface TeacherActionsDeps {
  setDeleting: (id: string | null) => void;
  setEditingTeacher: (t: Teacher | null) => void;
  setEditFormData: (d: { fullName: string; email: string; classIds: string[] }) => void;
  setShowEditModal: (v: boolean) => void;
  setUpdating: (v: boolean) => void;
  setShowCreateModal: (v: boolean) => void;
  setCreating: (v: boolean) => void;
  formData: { email: string; fullName: string; classId: string };
  setFormData: (d: { email: string; fullName: string; classId: string }) => void;
  setCopiedId: (id: string | null) => void;
  loadTeachers: () => Promise<void>;
  editingTeacher: Teacher | null;
  editFormData: { fullName: string; email: string; classIds: string[] };
}

export function useTeacherActions(deps: TeacherActionsDeps) {
  const {
    setDeleting, setEditingTeacher, setEditFormData, setShowEditModal,
    setUpdating, setShowCreateModal, setCreating, formData, setFormData,
    setCopiedId, loadTeachers, editingTeacher, editFormData,
  } = deps;

  const handleDeleteTeacher = async (teacherId: string, teacherName: string, teacherClasses: TeacherClass[] = []) => {
    const classWarning = teacherClasses.length > 0
      ? `\n\nEste profesor está asignado a ${teacherClasses.length} asignatura${teacherClasses.length > 1 ? 's' : ''}: ${teacherClasses.map(c => c.name).join(', ')}.\nLas asignaturas quedarán sin profesor asignado.`
      : '';
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${teacherName}?${classWarning}`)) return;
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
    const currentClassIds = teacher.classes.map(c => c.id).filter((id): id is string => !!id);
    setEditFormData({ fullName: teacher.name, email: teacher.email, classIds: currentClassIds });
    setShowEditModal(true);
  };

  const handleUpdateTeacher = async (e: FormEvent) => {
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

  const handleCreateTeacher = async (e: FormEvent) => {
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

  return {
    handleDeleteTeacher,
    openEditModal,
    handleUpdateTeacher,
    handleCreateTeacher,
    copyJoinLink,
  };
}
