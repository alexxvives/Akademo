import { apiClient } from '@/lib/api-client';
import { generateDemoSubmissions } from '@/lib/demo-data';
import type { AssignmentsDataReturn } from './useAssignmentsData';
import type { Assignment, Submission } from './assignments-types';

export function useSubmissionActions(data: AssignmentsDataReturn) {
  const loadSubmissions = async (assignmentId: string) => {
    try {
      if (data.paymentStatus === 'NOT PAID') {
        const demoSubs = generateDemoSubmissions(assignmentId);
        data.setSubmissions(demoSubs.map(sub => ({ ...sub, uploadId: `demo-upload-${sub.id}` })));
        return;
      }
      const res = await apiClient(`/assignments/${assignmentId}`);
      const result = await res.json();
      if (result.success) data.setSubmissions(result.data.submissions || []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.selectedSubmission) return;
    try {
      const res = await apiClient(`/assignments/submissions/${data.selectedSubmission.id}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: data.gradeScore, feedback: data.gradeFeedback }),
      });
      const result = await res.json();
      if (result.success) {
        data.setShowGradeModal(false);
        if (data.selectedAssignment) loadSubmissions(data.selectedAssignment.id);
        data.setGradeScore(0); data.setGradeFeedback('');
      } else alert('Error: ' + result.error);
    } catch (error) {
      console.error('Failed to grade:', error);
      alert('Error al calificar');
    }
  };

  const handleBulkDownload = async (onlyNew: boolean) => {
    if (!data.selectedAssignment) return;
    try {
      const res = await apiClient(`/assignments/${data.selectedAssignment.id}/submissions/download?onlyNew=${onlyNew}`);
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
        loadSubmissions(data.selectedAssignment.id);
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

  const openSubmissions = async (assignment: Assignment) => {
    data.setSelectedAssignment(assignment);
    await loadSubmissions(assignment.id);
    data.setShowSubmissionsModal(true);
  };

  const openGradeModal = (submission: Submission) => {
    data.setSelectedSubmission(submission);
    data.setGradeScore(submission.score || 0);
    data.setGradeFeedback(submission.feedback || '');
    data.setShowGradeModal(true);
  };

  return {
    loadSubmissions, handleGradeSubmission, handleBulkDownload,
    downloadSingleSubmission, openSubmissions, openGradeModal,
  };
}
