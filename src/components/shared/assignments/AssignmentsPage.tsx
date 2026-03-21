'use client';

import { useAssignmentsData } from './useAssignmentsData';
import { useAssignmentsActions } from './useAssignmentsActions';
import { useSubmissionActions } from './useSubmissionActions';
import { AssignmentsLoadingSkeleton } from './AssignmentsLoadingSkeleton';
import { AssignmentsTable } from './AssignmentsTable';
import { AssignmentModals } from '../AssignmentModals';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import type { AssignmentsPageProps } from './assignments-types';

export function AssignmentsPage({ role }: AssignmentsPageProps) {
  const data = useAssignmentsData(role);
  const actions = useAssignmentsActions(data);
  const subActions = useSubmissionActions(data);

  if (data.loading) return <AssignmentsLoadingSkeleton />;

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
            {data.isAdmin && (
              <AcademySearchDropdown
                academies={data.academies}
                value={data.selectedAcademy}
                onChange={(value) => { data.setSelectedAcademy(value); data.setSelectedClass(''); }}
                allLabel="Todas las academias"
                className="w-full sm:w-48"
              />
            )}
            {(data.isAcademy || data.isTeacher || (data.isAdmin && data.selectedAcademy)) && (
              <ClassSearchDropdown
                classes={data.filteredClasses}
                value={(data.isAcademy || data.isTeacher) ? data.selectedClassId : data.selectedClass}
                onChange={(v) => (data.isAcademy || data.isTeacher) ? data.setSelectedClassId(v) : data.setSelectedClass(v)}
                allLabel="Todas las asignaturas"
                allValue=""
                className="w-full sm:w-56"
              />
            )}
          </div>
        </div>

        {/* Empty state */}
        {data.visibleAssignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  assignments={data.visibleAssignments}
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
          newTitle={data.newTitle} setNewTitle={data.setNewTitle}
          newDescription={data.newDescription} setNewDescription={data.setNewDescription}
          newDueDate={data.newDueDate} setNewDueDate={data.setNewDueDate}
          uploadFiles={data.uploadFiles} setUploadFiles={data.setUploadFiles}
          uploadProgress={data.uploadProgress} creating={data.creating}
          handleCreateAssignment={actions.handleCreateAssignment} resetForm={actions.resetForm}
          assignmentType={data.assignmentType} setAssignmentType={data.setAssignmentType}
          quizQuestions={data.quizQuestions} setQuizQuestions={data.setQuizQuestions}
          showEditModal={data.showEditModal} setShowEditModal={data.setShowEditModal}
          editTitle={data.editTitle} setEditTitle={data.setEditTitle}
          editDescription={data.editDescription} setEditDescription={data.setEditDescription}
          editDueDate={data.editDueDate} setEditDueDate={data.setEditDueDate}
          editUploadFiles={data.editUploadFiles} setEditUploadFiles={data.setEditUploadFiles}
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
    </>
  );
}
