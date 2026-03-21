'use client';

import { SkeletonAssignments } from '@/components/ui/SkeletonLoader';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import QuizTakingModal from '@/components/shared/QuizTakingModal';
import { useAssignments } from './useAssignments';
import { AssignmentRow } from './AssignmentRow';
import { UploadModal } from './UploadModal';

export default function StudentAssignments() {
  const {
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
  } = useAssignments();

  if (loading) return <SkeletonAssignments />;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Ejercicios</h1>
            <p className="text-sm text-gray-500 mt-1">Completa y entrega tus ejercicios</p>
          </div>
          <ClassSearchDropdown
            classes={classes}
            value={selectedClassId}
            onChange={setSelectedClassId}
            allLabel="Todas las asignaturas"
            allValue=""
            className="w-full sm:w-56"
          />
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-12 text-center">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 sm:w-10 sm:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay ejercicios</h2>
            <p className="text-gray-500">Los ejercicios asignados aparecerán aquí</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignatura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ejercicios</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrega</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha límite</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Calificación</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <AssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    openDropdown={openDropdown}
                    dropdownRef={dropdownRef}
                    dropdownFiles={dropdownFiles}
                    loadingDropdown={loadingDropdown}
                    onEjerciciosClick={handleEjerciciosClick}
                    onDeleteSubmission={handleDeleteSubmission}
                    onUpload={openUploadModal}
                    onQuiz={(a) => { setSelectedAssignment(a); setShowQuizModal(true); }}
                    onCloseDropdown={closeDropdown}
                    isPastDue={isPastDue}
                    getDueDateColor={getDueDateColor}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showUploadModal && selectedAssignment && (
        <UploadModal
          assignment={selectedAssignment}
          uploadFiles={uploadFiles}
          setUploadFiles={setUploadFiles}
          uploading={uploading}
          dragActive={dragActive}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onSubmit={handleSubmitAssignment}
          onClose={() => { setShowUploadModal(false); setUploadFiles([]); }}
        />
      )}

      {showQuizModal && selectedAssignment && selectedAssignment.type === 'quiz' && (
        <QuizTakingModal
          assignmentId={selectedAssignment.id}
          assignmentTitle={selectedAssignment.title}
          maxScore={selectedAssignment.maxScore}
          alreadyAttempted={!!selectedAssignment.quizAttemptId}
          onClose={() => { setShowQuizModal(false); setSelectedAssignment(null); }}
          onCompleted={() => loadAssignments()}
        />
      )}
    </>
  );
}
