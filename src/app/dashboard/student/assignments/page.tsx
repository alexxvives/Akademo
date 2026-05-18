'use client';

import { useState } from 'react';
import { SkeletonAssignments } from '@/components/ui/SkeletonLoader';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import QuizTakingModal from '@/components/shared/QuizTakingModal';
import { apiPost } from '@/lib/api-client';
import { useAssignments } from './useAssignments';
import { AssignmentRow } from './AssignmentRow';
import { UploadModal } from './UploadModal';

export default function StudentAssignments() {
  const {
    classes, selectedClassId, setSelectedClassId,
    assignments, loading, academyName,
    showUploadModal, setShowUploadModal,
    selectedAssignment, setSelectedAssignment,
    uploadFiles, setUploadFiles,
    uploading, dragActive,
    showQuizModal, setShowQuizModal,
    showRatingModal, ratingAssignmentId, closeRatingModal, handleSubmitRating,
    openDropdown, dropdownFiles, loadingDropdown, dropdownRef,
    closeDropdown,
    isPastDue, getDueDateColor,
    handleDrag, handleDrop,
    handleSubmitAssignment, openUploadModal,
    handleEjerciciosClick, handleDeleteSubmission,
    loadAssignments,
  } = useAssignments();

  const [activeTab, setActiveTab] = useState<'ejercicios' | 'cuestionarios'>('ejercicios');
  const fileAssignments = assignments.filter(a => (a.type || 'file') !== 'quiz');
  const quizAssignments = assignments.filter(a => a.type === 'quiz');

  if (loading) return <SkeletonAssignments />;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Ejercicios</h1>
            {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
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

        {/* Tabs */}
        <div className="flex justify-center">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('ejercicios')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'ejercicios' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >{`Ejercicios${fileAssignments.length > 0 ? ` (${fileAssignments.length})` : ''}`}</button>
            <button
              onClick={() => setActiveTab('cuestionarios')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'cuestionarios' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >{`Cuestionarios${quizAssignments.length > 0 ? ` (${quizAssignments.length})` : ''}`}</button>
          </div>
        </div>

        {activeTab === 'ejercicios' ? (
          fileAssignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-12 text-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  {fileAssignments.map((assignment) => (
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
          )
        ) : (
          quizAssignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-12 text-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay cuestionarios</h2>
              <p className="text-gray-500">Los cuestionarios asignados aparecerán aquí</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignatura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha límite</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quizAssignments.map((assignment) => {
                    const attempted = !!assignment.quizAttemptId;
                    const pct = assignment.maxScore > 0 ? ((assignment.quizScore ?? 0) / assignment.maxScore) * 100 : 0;
                    const scoreColor = pct <= 50 ? 'text-red-600' : pct <= 69 ? 'text-orange-500' : pct <= 90 ? 'text-green-500' : 'text-green-700';
                    return (
                      <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attempted ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completado</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pendiente</span>
                          )}
                        </td>
                        <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{assignment.title}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.className || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attempted ? (
                            <span className={`text-sm font-medium ${scoreColor}`}>{assignment.quizScore ?? 0}/{assignment.maxScore}</span>
                          ) : <span className="text-sm text-gray-400">—</span>}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDueDateColor(assignment.dueDate)}`}>
                          {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => { setSelectedAssignment(assignment); setShowQuizModal(true); }}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
                          >
                            {attempted ? 'Repetir' : 'Realizar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
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
          feedbackMode={(selectedAssignment.feedbackMode as 'at_end' | 'after_each') || 'at_end'}
          onClose={() => { setShowQuizModal(false); setSelectedAssignment(null); }}
          onCompleted={() => loadAssignments()}
        />
      )}

      {showRatingModal && ratingAssignmentId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">¡Ejercicio entregado!</h3>
            <p className="text-sm text-gray-500 mb-4">¿Cómo valorarías este ejercicio?</p>
            <RatingStars assignmentId={ratingAssignmentId} onDone={closeRatingModal} />
            <button onClick={closeRatingModal} className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Omitir
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function RatingStars({ assignmentId, onDone }: { assignmentId: string; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  if (submitted) {
    return <p className="text-sm text-green-600 font-medium py-2">¡Gracias por tu valoración!</p>;
  }
  return (
    <div className="flex justify-center gap-2">
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={async () => {
            setRating(star);
            setSubmitted(true);
            try {
              await apiPost(`/assignments/${assignmentId}/rate`, { rating: star });
            } catch { /* silent */ }
            setTimeout(onDone, 800);
          }}
          className={`text-3xl transition-transform hover:scale-110 ${
            star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-200'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
