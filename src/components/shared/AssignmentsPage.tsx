'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient, apiPost } from '@/lib/api-client';
import { generateDemoAssignments, generateDemoSubmissions, generateDemoClasses, countNewDemoSubmissions } from '@/lib/demo-data';
import { AssignmentModals } from './AssignmentModals';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';

interface Class { id: string; name: string; academyId?: string; academyName?: string; }
interface Assignment {
  id: string; title: string; description?: string; dueDate?: string; maxScore: number;
  submissionCount: number; gradedCount: number; attachmentName?: string; className?: string;
  academyName?: string; createdAt: string; classId?: string;
  uploadId?: string; attachmentIds?: string;
  solutionUploadId?: string;
}
interface Submission {
  id: string; studentName: string; studentEmail: string; submissionFileName: string;
  submissionFileSize: number; submittedAt: string; score?: number; feedback?: string;
  gradedAt?: string; downloadedAt?: string; uploadId: string; version?: number;
}
interface Academy { id: string; name: string; }

interface AssignmentsPageProps {
  role: 'ACADEMY' | 'ADMIN';
}

export function AssignmentsPage({ role }: AssignmentsPageProps) {
  const isAcademy = role === 'ACADEMY';
  const isAdmin = role === 'ADMIN';

  // Shared state
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);

  // Academy-only state
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedClassForCreate, setSelectedClassForCreate] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editUploadFile, setEditUploadFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [gradeScore, setGradeScore] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [creating, setCreating] = useState(false);
  const [requireGrading, setRequireGrading] = useState(true);
  const [uploadingSolutionId, setUploadingSolutionId] = useState<string | null>(null);
  const solutionFileRef = useRef<HTMLInputElement>(null);
  const solutionAssignmentRef = useRef<string | null>(null);

  // Admin-only state
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

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

  // â”€â”€â”€ Academy data loading â”€â”€â”€
  const loadAcademyAssignments = useCallback(async () => {
    try {
      if (paymentStatus === 'NOT PAID') {
        const demoAssignments = generateDemoAssignments();
        const filtered = selectedClassId
          ? demoAssignments.filter(a => a.classId === selectedClassId)
          : demoAssignments;
        setAssignments(filtered.map((a) => ({
          id: a.id, title: a.title, description: a.description, dueDate: a.dueDate,
          maxScore: a.maxScore, submissionCount: a.submissionCount, gradedCount: a.gradedCount,
          attachmentName: a.attachmentName, createdAt: a.createdAt, className: a.className,
          attachmentIds: a.attachmentIds,
        })));
        return;
      }
      const url = selectedClassId ? `/assignments?classId=${selectedClassId}` : '/assignments/all';
      const res = await apiClient(url);
      const result = await res.json();
      if (result.success) setAssignments(result.data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  }, [paymentStatus, selectedClassId]);

  useEffect(() => {
    if (isAcademy && userEmail && paymentStatus) {
      loadAcademyAssignments();
    }
  }, [isAcademy, loadAcademyAssignments, userEmail, paymentStatus]);

  const loadAcademyData = async () => {
    try {
      setLoading(true);
      const userRes = await apiClient('/auth/me');
      const userResult = await userRes.json();
      setUserEmail(userResult.success && userResult.data ? userResult.data.email || '' : '');

      const academyRes = await apiClient('/academies');
      const academyResult = await academyRes.json();
      if (academyResult.success && Array.isArray(academyResult.data) && academyResult.data.length > 0) {
        const academy = academyResult.data[0];
        setAcademyName(academy.name || '');
        const status = academy.paymentStatus || 'PAID';
        setPaymentStatus(status);
        setRequireGrading(academy.requireGrading !== 0);
        if (status === 'NOT PAID') {
          const demoClasses = generateDemoClasses();
          setClasses(demoClasses.map(c => ({ id: c.id, name: c.name })));
          setLoading(false);
          return;
        }
      }
      const teacherRes = await apiClient('/requests/teacher');
      const teacherResult = await teacherRes.json();
      if (Array.isArray(teacherResult) && teacherResult.length > 0) {
        setAcademyName(teacherResult[0].academyName || '');
      }
      const classRes = await apiClient('/classes');
      const classResult = await classRes.json();
      if (classResult.success && classResult.data) setClasses(classResult.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // â”€â”€â”€ Admin data loading â”€â”€â”€
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const res = await apiClient('/academies');
      const result = await res.json();
      if (result.success) setAcademies(result.data || []);
    } catch (error) {
      console.error('Failed to load academies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminClasses = async () => {
    if (!selectedAcademy) { setClasses([]); return; }
    try {
      const res = await apiClient(`/academies/${selectedAcademy}/classes`);
      const result = await res.json();
      if (result.success) setClasses(result.data || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadAdminAssignments = async () => {
    try {
      let url = '/assignments/all';
      if (selectedClass) {
        url = `/assignments?classId=${selectedClass}`;
      } else if (selectedAcademy) {
        const res = await apiClient(`/academies/${selectedAcademy}/classes`);
        const classesResult = await res.json();
        if (classesResult.success && classesResult.data) {
          const classIds = classesResult.data.map((c: Class) => c.id);
          if (classIds.length > 0) {
            const promises = classIds.map((cid: string) =>
              apiClient(`/assignments?classId=${cid}`).then(r => r.json())
            );
            const results = await Promise.all(promises);
            setAssignments(results.flatMap(r => r.success ? r.data : []));
            return;
          }
        }
        setAssignments([]);
        return;
      }
      const res = await apiClient(url);
      const result = await res.json();
      if (result.success) setAssignments(result.data || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  };

  // â”€â”€â”€ Effects â”€â”€â”€
  useEffect(() => {
    if (isAcademy) loadAcademyData();
    else loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin) loadAdminClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAcademy]);

  useEffect(() => {
    if (isAdmin) loadAdminAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAcademy, selectedClass]);

  // â”€â”€â”€ Shared handlers â”€â”€â”€
  const handleDeleteAssignment = async (assignmentId: string, title: string) => {
    if (!confirm(`¿Estás seguro que deseas eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    setDeletingAssignmentId(assignmentId);
    try {
      const res = await apiClient(`/assignments/${assignmentId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      alert('Error al eliminar ejercicio');
    } finally {
      setDeletingAssignmentId(null);
    }
  };

  const handleSolutionUpload = async (file: File, assignmentId: string) => {
    setUploadingSolutionId(assignmentId);
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
        setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, solutionUploadId: uploadResult.data.uploadId } : a));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to upload solution:', error);
      alert('Error al subir solucionario');
    } finally {
      setUploadingSolutionId(null);
    }
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
        setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, solutionUploadId: undefined } : a));
      }
    } catch (error) {
      console.error('Failed to remove solution:', error);
    }
  };

  const openAssignmentFiles = async (assignment: Assignment) => {
    let uploadIds: string[] = [];
    if (assignment.attachmentIds && assignment.attachmentIds.trim()) {
      uploadIds = assignment.attachmentIds.split(',').filter(id => id.trim());
    } else if (assignment.uploadId) {
      uploadIds = [assignment.uploadId];
    }
    if (uploadIds.length === 0) { alert('No hay archivos disponibles'); return; }

    // Demo mode (academy only)
    if (isAcademy && paymentStatus === 'NOT PAID') {
      window.open('/demo/Documento.pdf', '_blank');
      return;
    }

    try {
      for (const uploadId of uploadIds) {
        const uploadRes = await apiClient(`/storage/upload/${uploadId}`);
        const uploadResult = await uploadRes.json();
        if (uploadResult.success && uploadResult.data) {
          const url = `/api/documents/${uploadResult.data.storagePath}`;
          window.open(url, '_blank');
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Failed to open files:', error);
      alert('Error al abrir archivos');
    }
  };

  // â”€â”€â”€ Academy-only handlers â”€â”€â”€
  const loadSubmissions = async (assignmentId: string) => {
    try {
      if (paymentStatus === 'NOT PAID') {
        const demoSubs = generateDemoSubmissions(assignmentId);
        setSubmissions(demoSubs.map(sub => ({ ...sub, uploadId: `demo-upload-${sub.id}` })));
        return;
      }
      const res = await apiClient(`/assignments/${assignmentId}`);
      const result = await res.json();
      if (result.success) setSubmissions(result.data.submissions || []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForCreate) { alert('Por favor, selecciona una asignatura'); return; }
    setCreating(true);
    try {
      const uploadIds: string[] = [];
      if (uploadFiles.length > 0) {
        for (let i = 0; i < uploadFiles.length; i++) {
          setUploadProgress(Math.round((i / uploadFiles.length) * 80));
          const formData = new FormData();
          formData.append('file', uploadFiles[i]);
          formData.append('type', 'assignment');
          const uploadRes = await apiClient('/storage/upload', { method: 'POST', body: formData });
          const uploadResult = await uploadRes.json();
          if (uploadResult.success) uploadIds.push(uploadResult.data.uploadId);
        }
        setUploadProgress(100);
      }
      const res = await apiPost('/assignments', {
        classId: selectedClassForCreate, title: newTitle, description: newDescription,
        dueDate: newDueDate || null, maxScore: 100, uploadIds,
      });
      const result = await res.json();
      if (result.success) { setShowCreateModal(false); resetForm(); loadAcademyAssignments(); }
      else alert('Error: ' + result.error);
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert('Error al crear ejercicio');
    } finally { setCreating(false); }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setUpdating(true);
    try {
      let uploadId = undefined;
      if (editUploadFile) {
        const formData = new FormData();
        formData.append('file', editUploadFile);
        formData.append('type', 'assignment');
        const uploadRes = await apiClient('/storage/upload', { method: 'POST', body: formData });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) { uploadId = uploadResult.data.uploadId; }
        else { alert('Error al subir archivo'); setUpdating(false); return; }
      }
      const res = await apiClient(`/assignments/${selectedAssignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle, description: editDescription, dueDate: editDueDate || null,
          ...(uploadId !== undefined && { uploadId }),
        }),
      });
      const result = await res.json();
      if (result.success) { await loadAcademyAssignments(); setShowEditModal(false); }
      else alert('Error al actualizar ejercicio');
    } catch (error) {
      console.error('Failed to update assignment:', error);
      alert('Error al actualizar ejercicio');
    } finally { setUpdating(false); }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments/submissions/${selectedSubmission.id}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ score: gradeScore, feedback: gradeFeedback }),
      });
      const result = await res.json();
      if (result.success) {
        setShowGradeModal(false);
        if (selectedAssignment) loadSubmissions(selectedAssignment.id);
        setGradeScore(0); setGradeFeedback('');
      } else alert('Error: ' + result.error);
    } catch (error) {
      console.error('Failed to grade:', error);
      alert('Error al calificar');
    }
  };

  const handleBulkDownload = async (onlyNew: boolean) => {
    if (!selectedAssignment) return;
    try {
      const res = await apiClient(`/assignments/${selectedAssignment.id}/submissions/download?onlyNew=${onlyNew}`);
      const result = await res.json();
      if (result.success && result.data.submissions.length > 0) {
        for (const sub of result.data.submissions) {
          const fileRes = await apiClient(`/storage/serve/${sub.storagePath}`);
          const blob = await fileRes.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `${sub.studentName}_${sub.fileName}`;
          document.body.appendChild(a); a.click();
          window.URL.revokeObjectURL(url); document.body.removeChild(a);
        }
        loadSubmissions(selectedAssignment.id);
        alert(`${result.data.submissions.length} archivos descargados`);
      } else alert('No hay entregas para descargar');
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Error al descargar');
    }
  };

  const downloadSingleSubmission = async (sub: Submission) => {
    try {
      const res = await apiClient(`/storage/serve/${sub.uploadId}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = sub.submissionFileName;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Error al descargar archivo');
    }
  };

  const resetForm = () => {
    setNewTitle(''); setNewDescription(''); setNewDueDate('');
    setUploadFiles([]); setUploadProgress(0); setSelectedClassForCreate('');
  };

  const openEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setEditTitle(assignment.title);
    setEditDescription(assignment.description || '');
    setEditDueDate(assignment.dueDate ? assignment.dueDate.split('T')[0] : '');
    setEditUploadFile(null);
    setShowEditModal(true);
  };

  const openSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    await loadSubmissions(assignment.id);
    setShowSubmissionsModal(true);
  };

  const openGradeModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeScore(submission.score || 0);
    setGradeFeedback(submission.feedback || '');
    setShowGradeModal(true);
  };

  // Admin filtered classes
  const filteredClasses = isAdmin && selectedAcademy
    ? classes.filter(c => c.academyId === selectedAcademy)
    : classes;

  // â”€â”€â”€ Rendering â”€â”€â”€
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-9 w-36 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        {/* Assignment cards skeleton */}
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-48 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-100 rounded"></div>
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
            <div className="h-4 w-2/3 bg-gray-100 rounded mb-4"></div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // File count helper
  const getFileCount = (a: Assignment) => {
    if (a.attachmentIds && a.attachmentIds.trim()) return a.attachmentIds.split(',').filter(id => id.trim()).length;
    if (a.uploadId) return 1;
    return 0;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">Ejercicios</h1>
              {isAcademy && (
                <button onClick={() => { setSelectedClassForCreate(selectedClassId); setShowCreateModal(true); }}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Crear Ejercicio
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {isAcademy ? (academyName || '') : 'Vista general de todos los ejercicios'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Admin: academy filter */}
            {isAdmin && (
              <div className="relative">
                <select value={selectedAcademy}
                  onChange={(e) => { setSelectedAcademy(e.target.value); setSelectedClass(''); }}
                  className="appearance-none w-full sm:w-48 pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                  <option value="">Todas las academias</option>
                  {academies.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Class filter (academy always, admin only when academy selected) */}
            {(isAcademy || (isAdmin && selectedAcademy)) && (
              <ClassSearchDropdown
                classes={isAdmin ? filteredClasses : classes}
                value={isAcademy ? selectedClassId : selectedClass}
                onChange={(v) => isAcademy ? setSelectedClassId(v) : setSelectedClass(v)}
                allLabel="Todas las asignaturas"
                allValue=""
                className="w-full sm:w-48"
              />
            )}
          </div>
        </div>

        {/* Empty state */}
        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay ejercicios</h2>
            <p className="text-gray-500">
              {isAcademy
                ? 'Crea tu primer ejercicio para esta asignatura'
                : selectedAcademy
                  ? 'No hay ejercicios para los filtros seleccionados'
                  : 'Selecciona una academia para ver los ejercicios'}
            </p>
          </div>
        ) : (
          <>
          {/* Hidden file input for solution upload */}
          <input
            type="file"
            ref={solutionFileRef}
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && solutionAssignmentRef.current) {
                handleSolutionUpload(file, solutionAssignmentRef.current);
              }
              e.target.value = '';
            }}
          />
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {isAcademy && (
              <div className="overflow-x-auto max-h-[750px] overflow-y-auto">
                {renderTable()}
              </div>
            )}
            {isAdmin && renderTable()}
          </div>
          </>
        )}
      </div>

      {/* Academy-only modals */}
      {isAcademy && (
        <AssignmentModals
          classes={classes}
          paymentStatus={paymentStatus}
          selectedAssignment={selectedAssignment}
          showCreateModal={showCreateModal} setShowCreateModal={setShowCreateModal}
          selectedClassForCreate={selectedClassForCreate} setSelectedClassForCreate={setSelectedClassForCreate}
          newTitle={newTitle} setNewTitle={setNewTitle}
          newDescription={newDescription} setNewDescription={setNewDescription}
          newDueDate={newDueDate} setNewDueDate={setNewDueDate}
          uploadFiles={uploadFiles} setUploadFiles={setUploadFiles}
          uploadProgress={uploadProgress} creating={creating}
          handleCreateAssignment={handleCreateAssignment} resetForm={resetForm}
          showEditModal={showEditModal} setShowEditModal={setShowEditModal}
          editTitle={editTitle} setEditTitle={setEditTitle}
          editDescription={editDescription} setEditDescription={setEditDescription}
          editDueDate={editDueDate} setEditDueDate={setEditDueDate}
          editUploadFile={editUploadFile} setEditUploadFile={setEditUploadFile}
          updating={updating} handleUpdateAssignment={handleUpdateAssignment}
          showSubmissionsModal={showSubmissionsModal} setShowSubmissionsModal={setShowSubmissionsModal}
          submissions={submissions} handleBulkDownload={handleBulkDownload}
          downloadSingleSubmission={downloadSingleSubmission} openGradeModal={openGradeModal}
          showGradeModal={showGradeModal} setShowGradeModal={setShowGradeModal}
          selectedSubmission={selectedSubmission}
          gradeScore={gradeScore} setGradeScore={setGradeScore}
          gradeFeedback={gradeFeedback} setGradeFeedback={setGradeFeedback}
          handleGradeSubmission={handleGradeSubmission}
          requireGrading={requireGrading}
        />
      )}
    </>
  );

  function renderTable() {
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className={`bg-gray-50 ${isAcademy ? 'sticky top-0 z-10' : ''}`}>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
            {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academia</th>}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignatura</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ejercicios</th>
            {requireGrading && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha límite</th>}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregas</th>
            {requireGrading && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificadas</th>}
            {isAcademy && <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Solucionario</th>}
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {assignments.map((assignment) => (
            <tr key={assignment.id}
              className="hover:bg-gray-50 transition-colors group">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900 truncate max-w-[14rem]">{assignment.title}</div>
              </td>
              {isAdmin && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {assignment.academyName || 'N/A'}
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.className || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {(() => {
                  const fileCount = getFileCount(assignment);
                  return fileCount > 0 ? (
                    <button onClick={(e) => { e.stopPropagation(); openAssignmentFiles(assignment); }}
                      className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 transition-colors group">
                      <div className="w-8 h-10 flex items-center justify-center bg-red-50 rounded border border-red-200 group-hover:bg-red-100 transition-colors">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium">{fileCount} archivo{fileCount > 1 ? 's' : ''}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Sin archivo</span>
                  );
                })()}
              </td>
              {requireGrading && (
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDueDateColor(assignment.dueDate)}`}>
                {assignment.dueDate ? (
                  <>
                    {new Date(assignment.dueDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                    <span className="text-xs ml-1">
                      {new Date(assignment.dueDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                ) : 'Sin fecha'}
              </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="inline-flex items-center gap-2">
                  <span>{assignment.submissionCount}</span>
                  {isAcademy && paymentStatus === 'NOT PAID' && (() => {
                    const newCount = countNewDemoSubmissions(assignment.id);
                    return newCount > 0 ? (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-green-800 bg-green-200 rounded">
                        +{newCount}
                      </span>
                    ) : null;
                  })()}
                </div>
              </td>
              {requireGrading && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.gradedCount} / {assignment.submissionCount}</td>}
              {isAcademy && (
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                  {assignment.solutionUploadId ? (
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => window.open(`/api/storage/serve/${assignment.solutionUploadId}`, '_blank')}
                        className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        title="Ver solucionario">
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemoveSolution(assignment.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                        title="Eliminar solucionario">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { solutionAssignmentRef.current = assignment.id; solutionFileRef.current?.click(); }}
                      disabled={uploadingSolutionId === assignment.id}
                      className="inline-flex items-center gap-1 px-2 py-1 text-gray-500 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:text-brand-600 transition-colors text-xs font-medium disabled:opacity-50"
                      title="Subir solucionario">
                      {uploadingSolutionId === assignment.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      )}
                      Subir
                    </button>
                  )}
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => openSubmissions(assignment)}
                    className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Ver entregas">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </button>
                  {isAcademy && (
                    <>
                      <button onClick={() => openEditAssignment(assignment)}
                        className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar ejercicio">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (!(isAcademy && paymentStatus === 'NOT PAID' && userEmail.toLowerCase().includes('demo'))) {
                            handleDeleteAssignment(assignment.id, assignment.title);
                          }
                        }}
                        disabled={deletingAssignmentId === assignment.id || (isAcademy && paymentStatus === 'NOT PAID' && userEmail.toLowerCase().includes('demo'))}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isAcademy && paymentStatus === 'NOT PAID' && userEmail.toLowerCase().includes('demo') ? 'No disponible en modo demostración' : 'Eliminar ejercicio'}>
                        {deletingAssignmentId === assignment.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}