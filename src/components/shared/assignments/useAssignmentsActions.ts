import { apiClient, apiPost, openDocument } from '@/lib/api-client';
import { createEmptyQuestion } from '../QuizQuestionBuilder';
import type { AssignmentsDataReturn } from './useAssignmentsData';
import type { Assignment } from './assignments-types';

export function useAssignmentsActions(data: AssignmentsDataReturn) {
  const handleDeleteAssignment = async (assignmentId: string, title: string) => {
    if (!confirm(`¿Estás seguro que deseas eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    data.setDeletingAssignmentId(assignmentId);
    try {
      const res = await apiClient(`/assignments/${assignmentId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) data.setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      else alert(`Error: ${result.error}`);
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      alert('Error al eliminar ejercicio');
    } finally { data.setDeletingAssignmentId(null); }
  };

  const handleSolutionUpload = async (file: File, assignmentId: string) => {
    data.setUploadingSolutionId(assignmentId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'assignment');
      const uploadRes = await apiClient('/storage/upload', { method: 'POST', body: formData });
      const uploadResult = await uploadRes.json();
      if (!uploadResult.success) { alert('Error al subir archivo'); return; }
      const res = await apiClient(`/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solutionUploadId: uploadResult.data.uploadId }),
      });
      const result = await res.json();
      if (result.success) {
        data.setAssignments(prev => prev.map(a =>
          a.id === assignmentId ? { ...a, solutionUploadId: uploadResult.data.uploadId } : a
        ));
      } else alert(`Error: ${result.error}`);
    } catch (error) {
      console.error('Failed to upload solution:', error);
      alert('Error al subir solucionario');
    } finally { data.setUploadingSolutionId(null); }
  };

  const handleRemoveSolution = async (assignmentId: string) => {
    if (!confirm('¿Eliminar el solucionario de este ejercicio?')) return;
    try {
      const res = await apiClient(`/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solutionUploadId: null }),
      });
      const result = await res.json();
      if (result.success) {
        data.setAssignments(prev => prev.map(a =>
          a.id === assignmentId ? { ...a, solutionUploadId: undefined } : a
        ));
      }
    } catch (error) { console.error('Failed to remove solution:', error); }
  };

  const handleRemoveExerciseFiles = async (assignmentId: string) => {
    if (!confirm('¿Eliminar todos los archivos de este ejercicio?')) return;
    try {
      const res = await apiClient(`/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachmentIds: '' }),
      });
      const result = await res.json();
      if (result.success) {
        data.setAssignments(prev => prev.map(a =>
          a.id === assignmentId ? { ...a, attachmentIds: '', uploadId: undefined } : a
        ));
      }
    } catch (error) { console.error('Failed to remove exercise files:', error); }
  };

  const openAssignmentFiles = async (assignment: Assignment) => {
    let uploadIds: string[] = [];
    if (assignment.attachmentIds && assignment.attachmentIds.trim()) {
      uploadIds = assignment.attachmentIds.split(',').filter(id => id.trim());
    } else if (assignment.uploadId) {
      uploadIds = [assignment.uploadId];
    }
    if (uploadIds.length === 0) { alert('No hay archivos disponibles'); return; }
    if ((data.isAcademy || data.isTeacher) && data.paymentStatus === 'NOT PAID') {
      window.open('/demo/Documento.pdf', '_blank'); return;
    }
    try {
      for (const uploadId of uploadIds) {
        const uploadRes = await apiClient(`/storage/upload/${uploadId}`);
        const uploadResult = await uploadRes.json();
        if (uploadResult.success && uploadResult.data) {
          try { await openDocument(uploadResult.data.storagePath); } catch { alert('Error al abrir el archivo'); }
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Failed to open files:', error);
      alert('Error al abrir archivos');
    }
  };

  const openSolutionFile = async (solutionUploadId: string) => {
    if ((data.isAcademy || data.isTeacher) && data.paymentStatus === 'NOT PAID') {
      window.open('/demo/Documento.pdf', '_blank'); return;
    }
    try {
      const uploadRes = await apiClient(`/storage/upload/${solutionUploadId}`);
      const uploadResult = await uploadRes.json();
      if (uploadResult.success && uploadResult.data) {
        try { await openDocument(uploadResult.data.storagePath); } catch { alert('Error al abrir el archivo'); }
      } else {
        alert('Error: No se pudo encontrar el archivo del solucionario');
      }
    } catch (error) {
      console.error('Failed to open solution file:', error);
      alert('Error al abrir solucionario');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.selectedClassForCreate) { alert('Por favor, selecciona una asignatura'); return; }
    if (data.assignmentType === 'quiz') {
      for (const q of data.quizQuestions) {
        if (!q.questionText.trim()) { alert('Todas las preguntas deben tener texto'); return; }
        if (q.options.some(o => !o.text.trim())) { alert('Todas las opciones deben tener texto'); return; }
        if (!q.correctOptionId) { alert('Selecciona la respuesta correcta para cada pregunta'); return; }
      }
    }
    data.setCreating(true);
    try {
      const uploadIds: string[] = [];
      if (data.assignmentType === 'file' && data.uploadFiles.length > 0) {
        for (let i = 0; i < data.uploadFiles.length; i++) {
          data.setUploadProgress(Math.round((i / data.uploadFiles.length) * 80));
          const formData = new FormData();
          formData.append('file', data.uploadFiles[i]);
          formData.append('type', 'assignment');
          const uploadRes = await apiClient('/storage/upload', { method: 'POST', body: formData });
          const uploadResult = await uploadRes.json();
          if (uploadResult.success) uploadIds.push(uploadResult.data.uploadId);
        }
        data.setUploadProgress(100);
      }
      const res = await apiPost('/assignments', {
        classId: data.selectedClassForCreate, title: data.newTitle, description: data.newDescription,
        dueDate: data.newDueDate || undefined, maxScore: 100,
        type: data.assignmentType,
        ...(data.assignmentType === 'file' ? { uploadIds } : { questions: data.quizQuestions }),
      });
      const result = await res.json();
      if (result.success) { data.setShowCreateModal(false); resetForm(); data.loadAcademyAssignments(); }
      else alert('Error: ' + result.error);
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert('Error al crear ejercicio');
    } finally { data.setCreating(false); }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.selectedAssignment) return;
    data.setUpdating(true);
    try {
      const uploadIds: string[] = [];
      for (const file of data.editUploadFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'assignment');
        const uploadRes = await apiClient('/storage/upload', { method: 'POST', body: formData });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) uploadIds.push(uploadResult.data.uploadId);
        else { alert('Error al subir archivo'); data.setUpdating(false); return; }
      }
      const res = await apiClient(`/assignments/${data.selectedAssignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.editTitle, description: data.editDescription,
          dueDate: data.editDueDate || undefined,
          ...(uploadIds.length > 0 && { uploadIds }),
        }),
      });
      const result = await res.json();
      if (result.success) { await data.loadAcademyAssignments(); data.setShowEditModal(false); }
      else alert('Error al actualizar ejercicio');
    } catch (error) {
      console.error('Failed to update assignment:', error);
      alert('Error al actualizar ejercicio');
    } finally { data.setUpdating(false); }
  };

  const resetForm = () => {
    data.setNewTitle(''); data.setNewDescription(''); data.setNewDueDate('');
    data.setUploadFiles([]); data.setUploadProgress(0); data.setSelectedClassForCreate('');
    data.setAssignmentType('file'); data.setQuizQuestions([createEmptyQuestion()]);
  };

  const openEditAssignment = (assignment: Assignment) => {
    data.setSelectedAssignment(assignment);
    data.setEditTitle(assignment.title);
    data.setEditDescription(assignment.description || '');
    data.setEditDueDate(assignment.dueDate ? assignment.dueDate.split('T')[0] : '');
    data.setEditUploadFiles([]);
    data.setShowEditModal(true);
  };

  return {
    handleDeleteAssignment, handleSolutionUpload, handleRemoveSolution,
    handleRemoveExerciseFiles, openAssignmentFiles, openSolutionFile,
    handleCreateAssignment, handleUpdateAssignment, resetForm, openEditAssignment,
  };
}
