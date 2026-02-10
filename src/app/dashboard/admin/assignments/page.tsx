'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface Academy { id: string; name: string; }
interface Class { id: string; name: string; academyId: string; academyName?: string; }
interface Assignment {
  id: string; title: string; description?: string; dueDate?: string; maxScore: number;
  submissionCount: number; gradedCount: number; className?: string; academyName?: string;
  createdAt: string; classId: string;
  uploadId?: string; // Legacy single file
  attachmentIds?: string; // Comma-separated upload IDs from GROUP_CONCAT
}

export default function AdminAssignments() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);

  // Helper to check if assignment is past due
  const _isPastDue = (dueDate?: string) => {
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

  useEffect(() => { loadData(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadClasses(); }, [selectedAcademy]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAssignments(); }, [selectedAcademy, selectedClass]);

  const loadData = async () => {
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

  const loadClasses = async () => {
    if (!selectedAcademy) {
      setClasses([]);
      return;
    }
    
    try {
      const res = await apiClient(`/academies/${selectedAcademy}/classes`);
      const result = await res.json();
      if (result.success) {
        setClasses(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      let url = '/assignments/all';
      
      if (selectedClass) {
        url = `/assignments?classId=${selectedClass}`;
      } else if (selectedAcademy) {
        // Get all assignments for classes in this academy
        const res = await apiClient(`/academies/${selectedAcademy}/classes`);
        const classesResult = await res.json();
        if (classesResult.success && classesResult.data) {
          const classIds = classesResult.data.map((c: Class) => c.id);
          
          if (classIds.length > 0) {
            // Fetch assignments for all these classes
            const assignmentPromises = classIds.map((cid: string) => 
              apiClient(`/assignments?classId=${cid}`).then(r => r.json())
            );
            const results = await Promise.all(assignmentPromises);
            const allAssignments = results.flatMap(r => r.success ? r.data : []);
            setAssignments(allAssignments);
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

  const filteredClasses = selectedAcademy
    ? classes.filter(c => c.academyId === selectedAcademy)
    : classes;

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Ejercicios</h1>
          <p className="text-sm text-gray-500 mt-1">Vista general de todos los ejercicios</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <select
              value={selectedAcademy}
              onChange={(e) => {
                setSelectedAcademy(e.target.value);
                setSelectedClass('');
              }}
              className="appearance-none w-full sm:w-48 pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Todas las academias</option>
              {academies.map((academy) => (
                <option key={academy.id} value={academy.id}>{academy.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {selectedAcademy && (
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="appearance-none w-full sm:w-48 pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">Todas las asignaturas</option>
                {filteredClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
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
          <p className="text-gray-500">
            {selectedAcademy 
              ? 'No hay ejercicios para los filtros seleccionados' 
              : 'Selecciona una academia para ver los ejercicios'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Academia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignatura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ejercicios</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha límite</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entregas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calificadas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <tr 
                  key={assignment.id} 
                  className="group hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAssignment(assignment.id, assignment.title);
                        }}
                        disabled={deletingAssignmentId === assignment.id}
                        className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 flex-shrink-0"
                        title="Eliminar ejercicio"
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
                        {assignment.description && (
                          <div className="text-sm text-gray-500 truncate max-w-md">{assignment.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assignment.academyName || 'N/A'}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assignment.submissionCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assignment.gradedCount} / {assignment.submissionCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
