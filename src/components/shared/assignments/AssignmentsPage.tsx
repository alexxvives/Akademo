'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAssignmentsData } from './useAssignmentsData';
import { useAssignmentsActions } from './useAssignmentsActions';
import { useSubmissionActions } from './useSubmissionActions';
import { AssignmentsLoadingSkeleton } from './AssignmentsLoadingSkeleton';
import { AssignmentsTable } from './AssignmentsTable';
import { QuizQuestionsViewerModal } from './QuizQuestionsViewerModal';
import { AssignmentModals } from '../AssignmentModals';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import type { Assignment } from './assignments-types';
import type { AssignmentsPageProps } from './assignments-types';

export function AssignmentsPage({ role }: AssignmentsPageProps) {
  const data = useAssignmentsData(role);
  const actions = useAssignmentsActions(data);
  const subActions = useSubmissionActions(data);
  const [viewingQuiz, setViewingQuiz] = useState<Assignment | null>(null);
  const [activeTab, setActiveTab] = useState<'file' | 'quiz'>('file');
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();

  // Read tab from URL params on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'quiz' || tabParam === 'file') setActiveTab(tabParam);
  }, [searchParams]);

  if (data.loading) return <AssignmentsLoadingSkeleton />;

  const lowerSearch = searchQuery.trim().toLowerCase();
  const filteredAssignments = data.visibleAssignments.filter(a => {
    if (data.topicIdFilter && a.topicId !== data.topicIdFilter) return false;
    if (lowerSearch && !a.title.toLowerCase().includes(lowerSearch)) return false;
    return true;
  });

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    const classComp = (a.className || '').localeCompare(b.className || '', 'es');
    if (classComp !== 0) return classComp;
    return (a.topicName || '').localeCompare(b.topicName || '', 'es');
  });

  const triggerSolutionUpload = (assignmentId: string) => {
    data.solutionAssignmentRef.current = assignmentId;
    data.solutionFileRef.current?.click();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">Ejercicios</h1>
              {data.canManage && (
                <button onClick={() => { data.setSelectedClassForCreate(data.isAdmin ? data.selectedClass : data.selectedClassId); data.setShowCreateModal(true); }}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Crear Ejercicio
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {(data.isAcademy || data.isTeacher) ? (data.academyName || '') : 'Vista general de todos los ejercicios'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ejercicio..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {(data.isAcademy || data.isTeacher || (data.isAdmin && data.selectedAcademy)) && (
              <ClassSearchDropdown
                classes={data.filteredClasses}
                value={(data.isAcademy || data.isTeacher) ? data.selectedClassId : data.selectedClass}
                onChange={(v) => (data.isAcademy || data.isTeacher) ? data.handleClassChange(v) : data.setSelectedClass(v)}
                allLabel="Todas las asignaturas"
                allValue=""
                className="w-full sm:w-56"
              />
            )}
            {data.isAdmin && (
              <AcademySearchDropdown
                academies={data.academies}
                value={data.selectedAcademy}
                onChange={(value) => { data.setSelectedAcademy(value); data.setSelectedClass(''); }}
                allLabel="Todas las academias"
                allValue=""
                className="w-full sm:w-56"
              />
            )}
          </div>
        </div>

        {/* Tabs — always visible */}
        <div className="flex justify-center">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setActiveTab('file')} className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Ejercicios ({sortedAssignments.filter(a => a.type !== 'quiz').length})
            </button>
            <button onClick={() => setActiveTab('quiz')} className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'quiz' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Cuestionarios ({sortedAssignments.filter(a => a.type === 'quiz').length})
            </button>
          </div>
        </div>

        {/* Empty state or table */}
        {sortedAssignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay ejercicios</h2>
            <p className="text-gray-500">
              {(data.isAcademy || data.isTeacher)
                ? 'Crea tu primer ejercicio para esta asignatura'
                : data.selectedAcademy
                  ? 'No hay ejercicios para los filtros seleccionados'
                  : 'Selecciona una academia para ver los ejercicios'}
            </p>
          </div>
        ) : (
          <>
            <input
              type="file"
              ref={data.solutionFileRef}
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && data.solutionAssignmentRef.current) {
                  actions.handleSolutionUpload(file, data.solutionAssignmentRef.current);
                }
                e.target.value = '';
              }}
            />
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
                <AssignmentsTable
                  assignments={sortedAssignments}
                  isAdmin={data.isAdmin}
                  isAcademy={data.isAcademy}
                  isTeacher={data.isTeacher}
                  canManage={data.canManage}
                  requireGrading={data.requireGrading}
                  glowId={data.glowId}
                  highlightRef={data.highlightRef}
                  paymentStatus={data.paymentStatus}
                  userEmail={data.userEmail}
                  deletingAssignmentId={data.deletingAssignmentId}
                  uploadingSolutionId={data.uploadingSolutionId}
                  onOpenFiles={actions.openAssignmentFiles}
                  onRemoveFiles={actions.handleRemoveExerciseFiles}
                  onOpenSolution={actions.openSolutionFile}
                  onRemoveSolution={actions.handleRemoveSolution}
                  onTriggerSolutionUpload={triggerSolutionUpload}
                  onEdit={actions.openEditAssignment}
                  onViewSubmissions={subActions.openSubmissions}
                  onDelete={actions.handleDeleteAssignment}
                  onViewQuizQuestions={(a) => setViewingQuiz(a)}
                  activeTab={activeTab}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {data.canManage && (
        <AssignmentModals
          classes={data.classes}
          paymentStatus={data.paymentStatus}
          selectedAssignment={data.selectedAssignment}
          showCreateModal={data.showCreateModal} setShowCreateModal={data.setShowCreateModal}
          selectedClassForCreate={data.selectedClassForCreate} setSelectedClassForCreate={data.setSelectedClassForCreate}
          selectedLessonForCreate={data.selectedLessonForCreate} setSelectedLessonForCreate={data.setSelectedLessonForCreate}
          selectedTopicForCreate={data.selectedTopicForCreate} setSelectedTopicForCreate={data.setSelectedTopicForCreate}
          newTitle={data.newTitle} setNewTitle={data.setNewTitle}
          newDescription={data.newDescription} setNewDescription={data.setNewDescription}
          newDueDate={data.newDueDate} setNewDueDate={data.setNewDueDate}
          uploadFiles={data.uploadFiles} setUploadFiles={data.setUploadFiles}
          uploadProgress={data.uploadProgress} creating={data.creating}
          handleCreateAssignment={actions.handleCreateAssignment} resetForm={actions.resetForm}
          assignmentType={data.assignmentType} setAssignmentType={data.setAssignmentType}
          quizQuestions={data.quizQuestions} setQuizQuestions={data.setQuizQuestions}
          feedbackMode={data.feedbackMode} setFeedbackMode={data.setFeedbackMode}
          editFeedbackMode={data.editFeedbackMode} setEditFeedbackMode={data.setEditFeedbackMode}
          showEditModal={data.showEditModal} setShowEditModal={data.setShowEditModal}
          editClassId={data.editClassId} setEditClassId={data.setEditClassId}
          editTopicId={data.editTopicId} setEditTopicId={data.setEditTopicId}
          editLessonId={data.editLessonId} setEditLessonId={data.setEditLessonId}
          editTitle={data.editTitle} setEditTitle={data.setEditTitle}
          editDescription={data.editDescription} setEditDescription={data.setEditDescription}
          editDueDate={data.editDueDate} setEditDueDate={data.setEditDueDate}
          editUploadFiles={data.editUploadFiles} setEditUploadFiles={data.setEditUploadFiles}
          editQuizQuestions={data.editQuizQuestions} setEditQuizQuestions={data.setEditQuizQuestions}
          updating={data.updating} handleUpdateAssignment={actions.handleUpdateAssignment}
          showSubmissionsModal={data.showSubmissionsModal} setShowSubmissionsModal={data.setShowSubmissionsModal}
          submissions={data.submissions} handleBulkDownload={subActions.handleBulkDownload}
          downloadSingleSubmission={subActions.downloadSingleSubmission} openGradeModal={subActions.openGradeModal}
          showGradeModal={data.showGradeModal} setShowGradeModal={data.setShowGradeModal}
          selectedSubmission={data.selectedSubmission}
          gradeScore={data.gradeScore} setGradeScore={data.setGradeScore}
          gradeFeedback={data.gradeFeedback} setGradeFeedback={data.setGradeFeedback}
          handleGradeSubmission={subActions.handleGradeSubmission}
          requireGrading={data.requireGrading}
        />
      )}

      {viewingQuiz && (
        <QuizQuestionsViewerModal
          assignmentId={viewingQuiz.id}
          title={viewingQuiz.title}
          onClose={() => setViewingQuiz(null)}
        />
      )}
    </>
  );
}
