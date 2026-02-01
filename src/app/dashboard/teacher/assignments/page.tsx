'use client';

import { useEffect, useState } from 'react';
import { apiClient, apiPost } from '@/lib/api-client';

interface Class { id: string; name: string; }
interface Assignment {
  id: string; title: string; description?: string; dueDate?: string; maxScore: number;
  submissionCount: number; gradedCount: number; attachmentName?: string; createdAt: string;
}
interface Submission {
  id: string; studentName: string; studentEmail: string; submissionFileName: string;
  submissionFileSize: number; submittedAt: string; score?: number; feedback?: string;
  gradedAt?: string; downloadedAt?: string; uploadId: string;
}

export default function TeacherAssignments() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [academyName, setAcademyName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [gradeScore, setGradeScore] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (selectedClassId) loadAssignments(); }, [selectedClassId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const academyRes = await apiClient('/requests/teacher');
      const academyResult = await academyRes.json();
      if (Array.isArray(academyResult) && academyResult.length > 0) {
        setAcademyName(academyResult[0].academyName || '');
      }
      const classRes = await apiClient('/classes');
      const classResult = await classRes.json();
      if (classResult.success && classResult.data) {
        setClasses(classResult.data);
        if (classResult.data.length > 0) setSelectedClassId(classResult.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    if (!selectedClassId) return;
    try {
      const res = await apiClient(`/assignments?classId=${selectedClassId}`);
      const result = await res.json();
      if (result.success) setAssignments(result.data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  };

  const loadSubmissions = async (assignmentId: string) => {
    try {
      const res = await apiClient(`/assignments/${assignmentId}`);
      const result = await res.json();
      if (result.success) setSubmissions(result.data.submissions || []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      let uploadId = null;
      if (uploadFile) {
        setUploadProgress(10);
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('type', 'assignment');
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/storage/upload`, {
          method: 'POST', body: formData, credentials: 'include',
        });
        setUploadProgress(80);
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) uploadId = uploadResult.data.uploadId;
        setUploadProgress(100);
      }
      const res = await apiPost('/assignments', {
        classId: selectedClassId, title: newTitle, description: newDescription,
        dueDate: newDueDate || null, maxScore: 100, uploadId,
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
      console.error('Failed to download file:', error);
      alert('Error al descargar archivo');
    }
  };

  const resetForm = () => {
    setNewTitle(''); setNewDescription(''); setNewDueDate('');
    setUploadFile(null); setUploadProgress(0);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Ejercicios</h1>
            {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}
                className="appearance-none w-64 pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                <option value="">Seleccionar asignatura</option>
                {classes.map((cls) => (<option key={cls.id} value={cls.id}>{cls.name}</option>))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button onClick={() => setShowCreateModal(true)} disabled={!selectedClassId}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
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
                    onClick={() => openSubmissions(assignment)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                      {assignment.description && <div className="text-sm text-gray-500 truncate max-w-md">{assignment.description}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('es-ES') : 'Sin fecha'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{assignment.submissionCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{assignment.gradedCount} / {assignment.submissionCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className="text-brand-600 hover:text-brand-900">
                        Ver entregas →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
                  <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Archivo adjunto (opcional)</label>
                <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
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
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold">{selectedAssignment.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{submissions.length} entregas</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sub.studentName}</div>
                        <div className="text-sm text-gray-500">{sub.studentEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => downloadSingleSubmission(sub)}
                          className="text-sm text-brand-600 hover:text-brand-900 underline">
                          {sub.submissionFileName}
                        </button>
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
    </>
  );
}
