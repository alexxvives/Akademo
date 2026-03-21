import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Class, ClassFormData } from './types';
import { emptyForm } from './types';

interface UseClassesCrudParams {
  formData: ClassFormData;
  setFormData: Dispatch<SetStateAction<ClassFormData>>;
  editingClass: Class | null;
  setEditingClass: Dispatch<SetStateAction<Class | null>>;
  setShowCreateModal: Dispatch<SetStateAction<boolean>>;
  setShowEditModal: Dispatch<SetStateAction<boolean>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string>>;
  setPaymentOptionsError: Dispatch<SetStateAction<boolean>>;
  isDemo: boolean;
  loadData: () => Promise<void>;
}

export function useClassesCrud({
  formData, setFormData, editingClass, setEditingClass,
  setShowCreateModal, setShowEditModal, setSaving,
  setError, setPaymentOptionsError, isDemo, loadData,
}: UseClassesCrudParams) {

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

  const handleCreateClass = async (e: FormEvent) => {
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

  const handleEditClass = async (e: FormEvent) => {
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
      price: cls.oneTimePrice?.toString() || cls.monthlyPrice?.toString() || '',
      numCobros: (cls.monthlyPrice && cls.oneTimePrice && cls.monthlyPrice > 0)
        ? Math.round(cls.oneTimePrice / cls.monthlyPrice).toString()
        : (cls.monthlyPrice && !cls.oneTimePrice ? '1' : ''),
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

  const handleDeleteClass = async (cls: Class) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar "${cls.name}"?\n\n⚠️ IMPORTANTE: Los videos y grabaciones de streams serán eliminados permanentemente de la plataforma y no podrán recuperarse.\n\nTambién se eliminarán todas las lecciones, documentos, calificaciones y matrículas asociadas.\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      const res = await apiClient(`/classes/${cls.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.error || 'Error al eliminar la asignatura');
      }
    } catch (err) {
      console.error('Error deleting class:', err);
      alert('Error al eliminar la asignatura');
    }
  };

  return {
    handleCreateClass,
    handleEditClass,
    openEditModal,
    openCreateModal,
    handleDeleteClass,
  };
}
