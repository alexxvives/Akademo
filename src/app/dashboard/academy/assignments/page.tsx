'use client';

import { useEffect, useState } from 'react';
import { apiClient, apiPost } from '@/lib/api-client';
import { generateDemoAssignments, generateDemoSubmissions, generateDemoClasses, countNewDemoSubmissions, type DemoAssignment, type DemoSubmission } from '@/lib/demo-data';

interface Class { id: string; name: string; }
interface Assignment {
  id: string; title: string; description?: string; dueDate?: string; maxScore: number;
  submissionCount: number; gradedCount: number; attachmentName?: string; createdAt: string;
  className?: string;
  uploadId?: string; // Legacy single file
  attachmentIds?: string; // JSON array of upload IDs
}
interface Submission {
  id: string; studentName: string; studentEmail: string; submissionFileName: string;
  submissionFileSize: number; submittedAt: string; score?: number; feedback?: string;
  gradedAt?: string; downloadedAt?: string; uploadId: string;
}

export default function TeacherAssignments() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(''); // Default to empty (all assignments)
  const [selectedClassForCreate, setSelectedClassForCreate] = useState(''); // Class selected in create modal
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [updating, setUpdating] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [academyName, setAcademyName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]); // Multiple files
  const [uploadProgress, setUploadProgress] = useState(0);
  const [gradeScore, setGradeScore] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [creating, setCreating] = useState(false);
  const [editUploadFile, setEditUploadFile] = useState<File | null>(null);
  const [editUploadFiles, setEditUploadFiles] = useState<File[]>([]); // Multiple files for edit
  const [paymentStatus, setPaymentStatus] = useState<string>(''); // Empty until loaded
  const [userEmail, setUserEmail] = useState<string>('');

  // Helper to check if assignment is past due
  const isPastDue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Helper function to determine due date color
  const getDueDateColor = (dueDate?: string) => {
    if (!dueDate) return 'text-gray-500';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    // If past due: gray immediately
    if (diffDays < 0) return 'text-gray-500';
    // Before due date
    if (diffDays <= 1) return 'text-red-600 font-semibold'; // Today or tomorrow
    if (diffDays <= 5) return 'text-orange-600 font-medium'; // 2-5 days
    return 'text-gray-900'; // 6+ days - black
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { 
    // Only load assignments after we have BOTH user data AND payment status
    if (userEmail && paymentStatus) {
      console.log('🔄 [ACADEMY] Triggering loadAssignments because data is ready');
      loadAssignments(); 
    }
  }, [selectedClassId, userEmail, paymentStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🚀 [ACADEMY] loadData started...');
      
      // Get user email
      const userRes = await apiClient('/auth/me');
      const userResult = await userRes.json();
      const email = userResult.success && userResult.data ? userResult.data.email || '' : '';
      console.log('👤 [ACADEMY] User email:', email);
      setUserEmail(email);
      
      // Check payment status first
      const academyRes = await apiClient('/academies');
      const academyResult = await academyRes.json();
      
      if (academyResult.success && Array.isArray(academyResult.data) && academyResult.data.length > 0) {
        const academy = academyResult.data[0];
        console.log('🏫 [ACADEMY] Academy:', academy.name, 'Payment:', academy.paymentStatus);
        setAcademyName(academy.name || '');
        const status = academy.paymentStatus || 'PAID';
        setPaymentStatus(status);
        
        // If NOT PAID, load demo data
        if (status === 'NOT PAID') {
          console.log('✅ [ACADEMY] Unpaid academy detected, loading demo data...');
          const demoClasses = generateDemoClasses();
          console.log('📦 [ACADEMY] Demo classes loaded:', demoClasses.length);
          setClasses(demoClasses.map(c => ({ id: c.id, name: c.name })));
          setLoading(false);
          return;
        }
      }
      
      // Load real data for paid academy
      const teacherRes = await apiClient('/requests/teacher');
      const teacherResult = await teacherRes.json();
      if (Array.isArray(teacherResult) && teacherResult.length > 0) {
        setAcademyName(teacherResult[0].academyName || '');
      }
      const classRes = await apiClient('/classes');
      const classResult = await classRes.json();
      if (classResult.success && classResult.data) {
        setClasses(classResult.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      // All unpaid academies use demo data
      console.log('🔍 [ACADEMY] loadAssignments - userEmail:', userEmail, 'paymentStatus:', paymentStatus);
      
      // Show demo assignments if NOT PAID
      if (paymentStatus === 'NOT PAID') {
        console.log('✅ [ACADEMY] Loading DEMO assignments...');
        const demoAssignments = generateDemoAssignments();
        console.log('📦 [ACADEMY] Total demo assignments:', demoAssignments.length);
        const filtered = selectedClassId
          ? demoAssignments.filter(a => a.classId === selectedClassId)
          : demoAssignments;
        console.log('✅ [ACADEMY] Filtered assignments:', filtered.length, 'for classId:', selectedClassId || 'all');
        setAssignments(filtered as any);
        return;
      }
      
      // If PAID or real unpaid academy, load real assignments
      const url = selectedClassId 
        ? `/assignments?classId=${selectedClassId}`
        : '/assignments/all';
      const res = await apiClient(url);
      const result = await res.json();
      if (result.success) setAssignments(result.data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  };

  const loadSubmissions = async (assignmentId: string) => {
    try {
      console.log('🔍 [ACADEMY] loadSubmissions called with assignmentId:', assignmentId);
      
      // Show demo submissions if NOT PAID
      if (paymentStatus === 'NOT PAID') {
        console.log('✅ [ACADEMY] Detected demo user, loading demo submissions...');
        const demoSubs = generateDemoSubmissions(assignmentId);
        console.log('📦 [ACADEMY] Generated demo submissions:', demoSubs.length, 'submissions');
        // Map to Submission type with required uploadId field
        const mappedSubs: Submission[] = demoSubs.map(sub => ({
          ...sub,
          uploadId: `demo-upload-${sub.id}`, // Add required uploadId field
          studentId: sub.id, // Use submission ID as student ID for demo
        }));
        console.log('✅ [ACADEMY] Mapped submissions, setting state with', mappedSubs.length, 'submissions');
        setSubmissions(mappedSubs);
        return;
      }
      
      // If PAID or real unpaid academy, load real submissions
      const res = await apiClient(`/assignments/${assignmentId}`);
      const result = await res.json();
      if (result.success) setSubmissions(result.data.submissions || []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string, title: string) => {
    if (!confirm(`¿Estás seguro que deseas eliminar "${title}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForCreate) {
      alert('Por favor, selecciona una asignatura');
      return;
    }
    setCreating(true);
    try {
      let uploadIds: string[] = [];
      
      // Upload all selected files
      if (uploadFiles.length > 0) {
        for (let i = 0; i < uploadFiles.length; i++) {
          setUploadProgress(Math.round((i / uploadFiles.length) * 80));
          const formData = new FormData();
          formData.append('file', uploadFiles[i]);
          formData.append('type', 'assignment');
          const uploadRes = await apiClient('/storage/upload', {
            method: 'POST', body: formData,
          });
          const uploadResult = await uploadRes.json();
          if (uploadResult.success) {
            uploadIds.push(uploadResult.data.uploadId);
          }
        }
        setUploadProgress(100);
      }
      
      const res = await apiPost('/assignments', {
        classId: selectedClassForCreate, 
        title: newTitle, 
        description: newDescription,
        dueDate: newDueDate || null, 
        maxScore: 100, 
        uploadIds,
      });
      const result = await res.json();
      if (result.success) {
        setShowCreateModal(false);
        resetForm();
        loadAssignments();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert('Error al crear ejercicio');
    } finally {
      setCreating(false);
    }
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
        setGradeScore(0);
        setGradeFeedback('');
      } else {
        alert('Error: ' + result.error);
      }
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
          a.href = url;
          a.download = `${sub.studentName}_${sub.fileName}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
        loadSubmissions(selectedAssignment.id);
        alert(`${result.data.submissions.length} archivos descargados`);
      } else {
        alert('No hay entregas para descargar');
      }
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
      a.href = url;
      a.download = sub.submissionFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to dowFiles([]); setUploadnload file:', error);
      alert('Error al descargar archivo');
    }
  };

  const openAssignmentFiles = async (assignment: Assignment) => {
    // Parse attachmentIds (GROUP_CONCAT returns comma-separated string)
    let uploadIds: string[] = [];
    if (assignment.attachmentIds && assignment.attachmentIds.trim()) {
      uploadIds = assignment.attachmentIds.split(',').filter(id => id.trim());
    } else if (assignment.uploadId) {
      uploadIds = [assignment.uploadId]; // Legacy single file
    }

    if (uploadIds.length === 0) {
      alert('No hay archivos disponibles');
      return;
    }

    try {
      // Fetch Upload records to get storagePath for each uploadId
      for (const uploadId of uploadIds) {
        const uploadRes = await apiClient(`/storage/upload/${uploadId}`);
        const uploadResult = await uploadRes.json();
        if (uploadResult.success && uploadResult.data) {
          const storagePath = uploadResult.data.storagePath;
          // Use /api/documents route like lesson documents do
          const url = `/api/documents/${storagePath}`;
          window.open(url, '_blank');
        } else {
          console.error('Failed to fetch upload:', uploadId);
        }
        // Small delay between opens to avoid popup blocking
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Failed to open files:', error);
      alert('Error al abrir archivos');
    }
  };

  const resetForm = () => {
    setNewTitle(''); setNewDescription(''); setNewDueDate('');
    setUploadFile(null); setUploadProgress(0);
    setSelectedClassForCreate('');
  };

  const openEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setEditTitle(assignment.title);
    setEditDescription(assignment.description || '');
    setEditDueDate(assignment.dueDate ? assignment.dueDate.split('T')[0] : '');
    setEditUploadFile(null);
    setShowEditModal(true);
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
        const uploadRes = await apiClient('/storage/upload', {
          method: 'POST', body: formData,
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) {
          uploadId = uploadResult.data.uploadId;
        } else {
          alert('Error al subir archivo');
          setUpdating(false);
          return;
        }
      }
      
      const res = await apiClient(`/assignments/${selectedAssignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          dueDate: editDueDate || null,
          ...(uploadId !== undefined && { uploadId }),
        }),
      });
      
      const result = await res.json();
      if (result.success) {
        await loadAssignments();
        setShowEditModal(false);
      } else {
        alert('Error al actualizar ejercicio');
      }
    } catch (error) {
      console.error('Failed to update assignment:', error);
      alert('Error al actualizar ejercicio');
    } finally {
      setUpdating(false);
    }
  };

  const openSubmissions = async (assignment: Assignment) => {
    console.log('🔓 [ACADEMY] Opening submissions modal for assignment:', assignment.id, assignment.title);
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="h-10 w-64 bg-gray-200 rounded-lg"></div>
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="h-32 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Ejercicios</h1>
            {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}
                className="appearance-none w-full sm:w-48 pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                <option value="">Todas las asignaturas</option>
                {classes.map((cls) => (<option key={cls.id} value={cls.id}>{cls.name}</option>))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button onClick={() => {
              setSelectedClassForCreate(selectedClassId);
              setShowCreateModal(true);
            }}
              disabled={paymentStatus === 'NOT PAID' && userEmail.toLowerCase().includes('demo')}
              className={`px-6 py-2 rounded-lg transition-colors ${
                paymentStatus === 'NOT PAID' && userEmail.toLowerCase().includes('demo')
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
              title={paymentStatus === 'NOT PAID' && userEmail.toLowerCase().includes('demo') ? 'No disponible en modo demostración' : 'Crear nuevo ejercicio'}
            >
              + Crear Ejercicio
            </button>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay ejercicios</h2>
            <p className="text-gray-500">Crea tu primer ejercicio para esta asignatura</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[750px] overflow-y-auto">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-gray-600">
                  Haz clic en cualquier fila para editar.
                </span>
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignatura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ejercicios</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha límite</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entregas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calificadas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr 
                    key={assignment.id} 
                    onClick={() => openEditAssignment(assignment)}
                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!(paymentStatus === 'NOT PAID' && userEmail.toLowerCase().includes('demo'))) {
                              handleDeleteAssignment(assignment.id, assignment.title);
                            }
                          }}
                          disabled={deletingAssignmentId === assignment.id || (paymentStatus === 'NOT PAID' && userEmail.toLowerCase().includes('demo'))}
                          className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 flex-shrink-0 disabled:cursor-not-allowed"
                          title={paymentStatus === 'NOT PAID' && userEmail.toLowerCase().includes('demo') ? 'No disponible en modo demostración' : 'Eliminar ejercicio'}
                        >
                          {deletingAssignmentId === assignment.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                          {assignment.description && <div className="text-sm text-gray-500 truncate max-w-md">{assignment.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.className || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        let fileCount = 0;
                        if (assignment.attachmentIds && assignment.attachmentIds.trim()) {
                          fileCount = assignment.attachmentIds.split(',').filter(id => id.trim()).length;
                        } else if (assignment.uploadId) {
                          fileCount = 1;
                        }
                        return fileCount > 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAssignmentFiles(assignment);
                            }}
                            className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 transition-colors group"
                          >
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
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDueDateColor(assignment.dueDate)}`}>
                      {assignment.dueDate ? (
                        <>
                          {new Date(assignment.dueDate).toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                          <span className="text-xs ml-1">
                            {new Date(assignment.dueDate).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </>
                      ) : 'Sin fecha'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="inline-flex items-center gap-2">
                        <span>{assignment.submissionCount}</span>
                        {(() => {
                          // Show +X for new submissions in unpaid mode
                          if (paymentStatus === 'NOT PAID') {
                            const newCount = countNewDemoSubmissions(assignment.id);
                            if (newCount > 0) {
                              return (
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-green-800 bg-green-200 rounded">
                                  +{newCount}
                                </span>
                              );
                            }
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{assignment.gradedCount} / {assignment.submissionCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openSubmissions(assignment);
                        }}
                        className="text-brand-600 hover:text-brand-900"
                      >
                        Ver entregas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-semibold mb-6">Crear Ejercicio</h2>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignatura</label>
                <div className="relative">
                  <select
                    value={selectedClassForCreate}
                    onChange={(e) => setSelectedClassForCreate(e.target.value)}
                    required
                    className="w-full h-[38px] px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 appearance-none bg-white cursor-pointer"
                  >
                    <option value=""></option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora límite</label>
                  <input 
                    type="datetime-local" 
                    value={newDueDate} 
                    onChange={(e) => setNewDueDate(e.target.value)}
                    min={(() => {
                      const now = new Date();
                      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                      return now.toISOString().slice(0, 16);
                    })()}
                    className={`w-full h-[38px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 ${!newDueDate ? 'text-transparent' : ''}`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Archivos adjuntos (PDFs)</label>
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf"
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                  className="w-full h-[38px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 file:mr-4 file:py-0.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                {uploadFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <div className="flex gap-4 justify-end pt-4">
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                  {creating ? 'Creando...' : 'Crear Ejercicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">Entregas</h2>
                <p className="text-sm text-gray-500 mt-1">{submissions.length} entregas para "{selectedAssignment.title}"</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleBulkDownload(true)}
                  className="px-4 py-2 border border-gray-900 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
                  Descargar nuevas
                </button>
                <button onClick={() => handleBulkDownload(false)}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                  Descargar todas
                </button>
                <button onClick={() => setShowSubmissionsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cerrar
                </button>
              </div>
            </div>
            {submissions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No hay entregas aún</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Archivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Versión</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className={`hover:bg-gray-50 ${!(sub as any).downloadedAt ? 'bg-green-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sub.studentName}</div>
                        <div className="text-sm text-gray-500">{sub.studentEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => downloadSingleSubmission(sub)}
                          className="inline-flex items-center justify-center w-8 h-10 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                        >
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(sub as any).version || 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sub.submittedAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sub.gradedAt ? (
                          <div>
                            <div className="text-sm font-medium">{sub.score} / {selectedAssignment.maxScore}</div>
                            {sub.feedback && <div className="text-xs text-gray-500 truncate max-w-xs">{sub.feedback}</div>}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sin calificar</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button onClick={() => openGradeModal(sub)} className="text-brand-600 hover:text-brand-900">
                          {sub.gradedAt ? 'Editar nota' : 'Calificar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && selectedSubmission && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-semibold mb-4">Calificar Entrega</h2>
            <p className="text-sm text-gray-600 mb-6">{selectedSubmission.studentName}</p>
            <form onSubmit={handleGradeSubmission} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puntuación (de {selectedAssignment.maxScore})
                </label>
                <input type="number" value={gradeScore} onChange={(e) => setGradeScore(Number(e.target.value))}
                  min="0" max={selectedAssignment.maxScore} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
                <textarea value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} rows={4}
                  placeholder="Feedback para el estudiante..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex gap-4 justify-end pt-4">
                <button type="button" onClick={() => { setShowGradeModal(false); setGradeScore(0); setGradeFeedback(''); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                  Guardar Calificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Editar Ejercicio</h2>
            </div>
            <form onSubmit={handleUpdateAssignment} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required
                  className="w-full h-[38px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de entrega</label>
                <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actualizar archivo PDF (opcional)</label>
                {selectedAssignment.attachmentName && (
                  <div className="mb-2 text-sm text-gray-600">
                    Archivo actual: {selectedAssignment.attachmentName}
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setEditUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                {editUploadFile && (
                  <div className="mt-2 text-sm text-green-600">
                    Nuevo archivo seleccionado: {editUploadFile.name}
                  </div>
                )}
              </div>
              <div className="flex gap-4 justify-end pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} disabled={updating}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={updating}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
                  {updating ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
