'use client';

import React from 'react';
import type { AssignmentModalsProps } from './types';

export function GradeModal(props: AssignmentModalsProps) {
  const {
    selectedAssignment, selectedSubmission,
    showGradeModal, setShowGradeModal,
    gradeScore, setGradeScore, gradeFeedback, setGradeFeedback,
    handleGradeSubmission,
  } = props;

  if (!showGradeModal || !selectedSubmission || !selectedAssignment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[92dvh] overflow-y-auto">
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
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit"
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              Guardar Calificación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
