'use client';

import { useEffect, useState } from 'react';
import { apiClient, apiPost } from '@/lib/api-client';

interface Class { id: string; name: string; }
interface Assignment {
  id: string; title: string; description?: string; dueDate?: string; maxScore: number;
  attachmentName?: string; submissionId?: string; submittedAt?: string;
  score?: number; feedback?: string; gradedAt?: string; createdAt: string;
  className?: string; classId?: string; 
  uploadId?: string; // Legacy single file
  attachmentIds?: string; // JSON array of upload IDs
  submissionUploadId?: string; // Student's submitted file uploadId
  submissionStoragePath?: string; // Student's submitted file storage path
}

export default function StudentAssignments() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(''); // Default to empty (all classes)
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'pendientes' | 'completados'>('pendientes');

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
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-gray-500'; // Past due - gray
    if (diffDays <= 1) return 'text-red-600 font-semibold'; // Today or tomorrow
    if (diffDays <= 5) return 'text-orange-600 font-medium'; // 2-5 days
    return 'text-gray-900'; // 6+ days - black
  };

  useEffect(() => { loadClasses(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAssignments(); }, [selectedClassId]); // Load even when empty

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await apiClient('/enrollments');
      const result = await res.json();
      if (result.success && result.data) {
        const enrolledClasses = result.data
          .filter((e: { status: string; classId: string; className: string }) => e.status === 'APPROVED')
          .map((e: { status: string; classId: string; className: string }) => ({ id: e.classId, name: e.className }));
        setClasses(enrolledClasses);
        // Don't set default - show all assignments
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      // If no class selected, fetch all assignments
      const url = selectedClassId 
        ? `/assignments?classId=${selectedClassId}` 
        : '/assignments'; // Fetch all
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
      // Upload all files
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

      // Submit assignment with all upload IDs
      const res = await apiPost(`/assignments/${selectedAssignment.id}/submit`, {
        uploadIds, // Send array instead of single uploadId
      });

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

  const openUploadModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowUploadModal(true);
  };
  const downloadAssignmentFile = async (assignment: Assignment) => {
    // Parse attachmentIds (GROUP_CONCAT returns comma-separated string)
    let uploadIds: string[] = [];
    if (assignment.attachmentIds && assignment.attachmentIds.trim()) {
      // GROUP_CONCAT format: "id1,id2,id3" (not JSON)
      uploadIds = assignment.attachmentIds.split(',').filter(id => id.trim());
    }
    if (uploadIds.length === 0 && assignment.uploadId) {
      uploadIds = [assignment.uploadId]; // Legacy single file
    }

    if (uploadIds.length === 0) {
      alert('No hay archivos disponibles');
      return;
    }

    try {
      // Fetch Upload records to get storagePath (like lesson documents)
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
  const pendingAssignments = assignments.filter(a => !a.submittedAt);
  const completedAssignments = assignments.filter(a => a.submittedAt);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="h-10 w-64 bg-gray-200 rounded-lg ml-auto"></div>
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
            <p className="text-sm text-gray-500 mt-1">Completa y entrega tus ejercicios</p>
          </div>
          <div className="relative w-full md:w-auto">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="appearance-none w-full md:w-64 pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Todas las asignaturas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8">
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'pendientes'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pendientes ({pendingAssignments.length})
            </button>
            <button
              onClick={() => setActiveTab('completados')}
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'completados'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completados ({completedAssignments.length})
            </button>
          </nav>
        </div>

        {/* Pending assignments - TABLE FORMAT */}
        {activeTab === 'pendientes' && (
          pendingAssignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-12 text-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 sm:w-10 sm:h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Todo completado!</h2>
              <p className="text-gray-500">No tienes ejercicios pendientes por entregar</p>
            </div>
          ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignatura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ejercicios</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrega</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha límite</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingAssignments.map((assignment) => (
                  <tr 
                    key={assignment.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                          {assignment.description && (
                            <div className="text-sm text-gray-500 truncate max-w-md">{assignment.description}</div>
                          )}
                        </div>
                        {assignment.submittedAt && !isPastDue(assignment.dueDate) && !assignment.gradedAt && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openUploadModal(assignment);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 border border-brand-300 rounded-lg hover:bg-brand-50 transition-colors whitespace-nowrap"
                            title="Reenviar ejercicio"
                          >
                            Reenviar
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.className || '—'}
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
                            onClick={() => downloadAssignmentFile(assignment)}
                            className="flex items-center gap-2 text-sm text-gray-900 hover:text-gray-700 transition-colors group"
                          >
                            <div className="w-8 h-10 flex items-center justify-center bg-red-50 rounded border border-red-200 group-hover:bg-red-100 transition-colors">
                              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-xs">{fileCount} archivo{fileCount > 1 ? 's' : ''}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Sin archivo</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assignment.submittedAt && assignment.submissionStoragePath ? (
                        <a
                          href={`/api/documents/assignment/${assignment.submissionStoragePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-gray-900 hover:text-gray-700 transition-colors group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="w-8 h-10 flex items-center justify-center bg-green-50 rounded border border-green-200 group-hover:bg-green-100 transition-colors">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-xs">1 archivo</span>
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">Sin entregar</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDueDateColor(assignment.dueDate)}`}>
                      {assignment.dueDate ? (
                        <div className="flex items-center">
                          {new Date(assignment.dueDate).toLocaleDateString('es-ES')}
                          <span className="text-xs ml-1">
                            {new Date(assignment.dueDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : 'Sin fecha'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => openUploadModal(assignment)}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Entregar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        )}

        {/* Completed assignments - TABLE FORMAT */}
        {activeTab === 'completados' && (
          completedAssignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-12 text-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 sm:w-10 sm:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Ningún ejercicio completado</h2>
              <p className="text-gray-500">Los ejercicios que entregues aparecerán aquí</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignatura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ejercicios</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrega</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entregado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Puntuación</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                            {assignment.description && (
                              <div className="text-sm text-gray-500 truncate max-w-md">{assignment.description}</div>
                            )}
                          </div>
                          {!isPastDue(assignment.dueDate) && !assignment.gradedAt && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openUploadModal(assignment);
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 border border-brand-300 rounded-lg hover:bg-brand-50 transition-colors whitespace-nowrap"
                              title="Reenviar ejercicio"
                            >
                              Reenviar
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.className || '—'}
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
                              onClick={() => downloadAssignmentFile(assignment)}
                              className="flex items-center gap-2 text-sm text-gray-900 hover:text-gray-700 transition-colors group"
                            >
                              <div className="w-8 h-10 flex items-center justify-center bg-red-50 rounded border border-red-200 group-hover:bg-red-100 transition-colors">
                                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-xs">{fileCount} archivo{fileCount > 1 ? 's' : ''}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Sin archivo</span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assignment.submittedAt && assignment.submissionStoragePath ? (
                          <a
                            href={`/api/documents/assignment/${assignment.submissionStoragePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-gray-900 hover:text-gray-700 transition-colors group"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="w-8 h-10 flex items-center justify-center bg-green-50 rounded border border-green-200 group-hover:bg-green-100 transition-colors">
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-xs">1 archivo</span>
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.submittedAt ? (
                          <div>
                            {new Date(assignment.submittedAt).toLocaleDateString('es-ES')}
                            <span className="text-xs ml-1">
                              {new Date(assignment.submittedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {assignment.gradedAt ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Calificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Corrección pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {assignment.gradedAt ? (
                          <div>
                            <div className="text-lg font-bold text-brand-600">
                              {assignment.score}/{assignment.maxScore}
                            </div>
                            {assignment.feedback && (
                              <div className="text-xs text-gray-500 mt-1 max-w-xs text-right">
                                {assignment.feedback}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-semibold mb-2">
              {selectedAssignment.submittedAt ? 'Reenviar Ejercicio' : 'Entregar Ejercicio'}
            </h2>
            <p className="text-gray-600 mb-2">{selectedAssignment.title}</p>
            {selectedAssignment.submittedAt && (
              <p className="text-sm text-amber-600 mb-4">
                ⚠️ Esto reemplazará tu entrega anterior. El profesor verá todas las versiones.
              </p>
            )}

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center ${
                  dragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300'
                }`}
              >
                <input
                  type="file"
                  id="fileInput"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      const newFiles = Array.from(e.target.files);
                      setUploadFiles(prev => [...prev, ...newFiles]);
                    }
                  }}
                  className="hidden"
                />
                {uploadFiles.length > 0 ? (
                  <div className="space-y-3">
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <label
                      htmlFor="fileInput"
                      className="inline-block w-full text-center px-4 py-2 border-2 border-dashed border-brand-300 text-brand-600 rounded-lg hover:border-brand-500 hover:bg-brand-50 cursor-pointer transition-colors"
                    >
                      + Agregar más archivos
                    </label>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Arrastra tus archivos aquí
                    </p>
                    <p className="text-sm text-gray-500 mb-4">o</p>
                    <label
                      htmlFor="fileInput"
                      className="inline-block px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 cursor-pointer"
                    >
                      Seleccionar archivos
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFiles([]);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploadFiles.length === 0 || uploading}
                  className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Entregando...' : `Entregar ${uploadFiles.length > 0 ? `(${uploadFiles.length} archivo${uploadFiles.length > 1 ? 's' : ''})` : 'Ejercicio'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
