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
}

export default function StudentAssignments() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(''); // Default to empty (all classes)
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => { loadAssignments(); }, [selectedClassId]); // Load even when empty

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await apiClient('/enrollments');
      const result = await res.json();
      if (result.success && result.data) {
        const enrolledClasses = result.data
          .filter((e: any) => e.status === 'APPROVED')
          .map((e: any) => ({ id: e.classId, name: e.className }));
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedAssignment) return;

    setUploading(true);
    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('type', 'assignment_submission');

      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/storage/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const uploadResult = await uploadRes.json();
      if (!uploadResult.success) {
        throw new Error('Error al subir archivo');
      }

      // Submit assignment
      const res = await apiPost(`/assignments/${selectedAssignment.id}/submit`, {
        uploadId: uploadResult.data.uploadId,
      });

      const result = await res.json();
      if (result.success) {
        setShowUploadModal(false);
        setUploadFile(null);
        loadAssignments();
        alert('Ejercicio entregado correctamente');
      } else {
        throw new Error(result.error || 'Error al entregar ejercicio');
      }
    } catch (error: any) {
      console.error('Failed to submit assignment:', error);
      alert(error.message || 'Error al entregar ejercicio');
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
      // Open all files in new tabs (using Next.js proxy route like lesson documents)
      for (const uploadId of uploadIds) {
        const url = `/api/storage/serve/${uploadId}`;
        window.open(url, '_blank');
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Ejercicios</h1>
            <p className="text-sm text-gray-500 mt-1">Completa y entrega tus ejercicios</p>
          </div>
          <div className="relative">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="appearance-none w-64 pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
          <nav className="-mb-px flex space-x-8">
            <button
              className="border-b-2 border-brand-600 py-4 px-1 text-sm font-medium text-brand-600"
            >
              Pendientes ({pendingAssignments.length})
            </button>
            <button
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Completados ({completedAssignments.length})
            </button>
          </nav>
        </div>

        {/* Pending assignments - TABLE FORMAT */}
        {pendingAssignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Todo completado!</h2>
            <p className="text-gray-500">No tienes ejercicios pendientes por entregar</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignatura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ejercicios</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha límite</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                      {assignment.description && (
                        <div className="text-sm text-gray-500 truncate max-w-md">{assignment.description}</div>
                      )}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.dueDate ? (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(assignment.dueDate).toLocaleDateString('es-ES')}
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
        )}

        {/* Completed assignments - TABLE FORMAT */}
        {completedAssignments.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ejercicios completados</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignatura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ejercicios</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entregado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Puntuación</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Entregado
                          </span>
                        </div>
                        {assignment.description && (
                          <div className="text-sm text-gray-500 truncate max-w-md">{assignment.description}</div>
                        )}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleDateString('es-ES') : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {assignment.gradedAt ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Calificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pendiente
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
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-semibold mb-2">Entregar Ejercicio</h2>
            <p className="text-gray-600 mb-6">{selectedAssignment.title}</p>

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center ${
                  dragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300'
                }`}
              >
                <input
                  type="file"
                  id="fileInput"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {uploadFile ? (
                  <div>
                    <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900">{uploadFile.name}</p>
                    <p className="text-sm text-gray-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button
                      type="button"
                      onClick={() => setUploadFile(null)}
                      className="mt-4 text-sm text-red-600 hover:text-red-800"
                    >
                      Eliminar archivo
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Arrastra tu archivo aquí
                    </p>
                    <p className="text-sm text-gray-500 mb-4">o</p>
                    <label
                      htmlFor="fileInput"
                      className="inline-block px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 cursor-pointer"
                    >
                      Seleccionar archivo
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Entregando...' : 'Entregar Ejercicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
