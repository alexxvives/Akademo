'use client';

import { useEffect, useState, useRef } from 'react';
import { apiClient, apiPost, openDocument } from '@/lib/api-client';
import { generateDemoClasses, generateDemoStudentAssignments } from '@/lib/demo-data';
import type { Class, Assignment } from './types';

export function useAssignments() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownFiles, setDropdownFiles] = useState<{ uploadId: string; name: string; storagePath: string }[]>([]);
  const [loadingDropdown, setLoadingDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    if (openDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const isPastDue = (dueDate?: string) => dueDate ? new Date(dueDate) < new Date() : false;

  const getDueDateColor = (dueDate?: string) => {
    if (!dueDate) return 'text-gray-500';
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'text-gray-500';
    if (diffDays <= 1) return 'text-red-600 font-semibold';
    if (diffDays <= 5) return 'text-orange-600 font-medium';
    return 'text-gray-900';
  };

  useEffect(() => { loadClasses(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAssignments(); }, [selectedClassId]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const academyRes = await apiClient('/academies');
      const academyResult = await academyRes.json();
      let currentPaymentStatus = 'PAID';
      if (academyResult.success && Array.isArray(academyResult.data) && academyResult.data.length > 0) {
        currentPaymentStatus = academyResult.data[0].paymentStatus || 'PAID';
        setPaymentStatus(currentPaymentStatus);
      }
      if (currentPaymentStatus === 'NOT PAID') {
        const demoClasses = generateDemoClasses();
        setClasses(demoClasses.map(c => ({ id: c.id, name: c.name })));
        const demoAssignments = generateDemoStudentAssignments();
        setAssignments(demoAssignments as Assignment[]);
        return;
      }
      const res = await apiClient('/enrollments');
      const result = await res.json();
      type Enrollment = { status: string; classId: string; className: string; university?: string | null; carrera?: string | null };
      if (result.success && result.data) {
        const enrolledClasses = result.data
          .filter((e: Enrollment) => e.status === 'APPROVED')
          .map((e: Enrollment) => ({ id: e.classId, name: e.className, university: e.university, carrera: e.carrera }));
        setClasses(enrolledClasses);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      if (paymentStatus === 'NOT PAID') {
        const demoAssignments = generateDemoStudentAssignments();
        const filtered = selectedClassId
          ? demoAssignments.filter(a => a.classId === selectedClassId)
          : demoAssignments;
        setAssignments(filtered as Assignment[]);
        return;
      }
      const url = selectedClassId
        ? `/assignments?classId=${selectedClassId}`
        : '/assignments';
      const res = await apiClient(url);
      const result = await res.json();
      if (result.success) setAssignments(result.data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setUploadFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0 || !selectedAssignment) return;
    setUploading(true);
    try {
      const uploadIds: string[] = [];
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'assignment_submission');
        const uploadRes = await apiClient('/storage/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadResult = await uploadRes.json();
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Error al subir archivo');
        }
        uploadIds.push(uploadResult.data.uploadId);
      }
      const res = await apiPost(`/assignments/${selectedAssignment.id}/submit`, { uploadIds });
      const result = await res.json();
      if (result.success) {
        setShowUploadModal(false);
        setUploadFiles([]);
        loadAssignments();
      } else {
        throw new Error(result.error || 'Error al entregar ejercicio');
      }
    } catch (error: unknown) {
      console.error('Failed to submit assignment:', error);
      alert(error instanceof Error ? error.message : 'Error al entregar ejercicio');
    } finally {
      setUploading(false);
    }
  };

  const openUploadModal = (assignment: Assignment) => { setSelectedAssignment(assignment); setShowUploadModal(true); };
  const closeDropdown = () => setOpenDropdown(null);

  const handleEjerciciosClick = async (assignment: Assignment, e: React.MouseEvent) => {
    e.stopPropagation();
    let uploadIds: string[] = [];
    if (assignment.attachmentIds && assignment.attachmentIds.trim()) {
      uploadIds = assignment.attachmentIds.split(',').filter((id: string) => id.trim());
    }
    if (uploadIds.length === 0 && assignment.uploadId) {
      uploadIds = [assignment.uploadId];
    }
    if (uploadIds.length === 0) return;
    if (openDropdown === assignment.id) {
      setOpenDropdown(null);
      setDropdownFiles([]);
      return;
    }
    if (uploadIds.length === 1) {
      try {
        const res = await apiClient(`/storage/upload/${uploadIds[0]}`);
        const result = await res.json();
        if (result.success && result.data) {
          try { await openDocument(result.data.storagePath); } catch { console.error('Failed to open file'); }
        }
      } catch (error) {
        console.error('Failed to open file:', error);
      }
      return;
    }
    setLoadingDropdown(true);
    setOpenDropdown(assignment.id);
    setDropdownFiles([]);
    try {
      const files: { uploadId: string; name: string; storagePath: string }[] = [];
      for (const uploadId of uploadIds) {
        const res = await apiClient(`/storage/upload/${uploadId}`);
        const result = await res.json();
        if (result.success && result.data) {
          files.push({ uploadId, name: result.data.fileName, storagePath: result.data.storagePath });
        }
      }
      setDropdownFiles(files);
    } catch (error) {
      console.error('Failed to load file list:', error);
      setOpenDropdown(null);
    } finally {
      setLoadingDropdown(false);
    }
  };

  const handleDeleteSubmission = async (assignmentId: string) => {
    if (!confirm('¿Quieres eliminar tu entrega? Podrás volver a entregar después.')) return;
    try {
      const res = await apiClient(`/assignments/${assignmentId}/submit`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        loadAssignments();
      } else {
        alert(result.error || 'Error al eliminar la entrega');
      }
    } catch (error) {
      console.error('Failed to delete submission:', error);
      alert('Error al eliminar la entrega');
    }
  };

  return {
    classes, selectedClassId, setSelectedClassId,
    assignments, loading,
    showUploadModal, setShowUploadModal,
    selectedAssignment, setSelectedAssignment,
    uploadFiles, setUploadFiles,
    uploading, dragActive,
    showQuizModal, setShowQuizModal,
    openDropdown, dropdownFiles, loadingDropdown, dropdownRef,
    closeDropdown,
    isPastDue, getDueDateColor,
    handleDrag, handleDrop,
    handleSubmitAssignment, openUploadModal,
    handleEjerciciosClick, handleDeleteSubmission,
    loadAssignments,
  };
}
